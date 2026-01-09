'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Globe, Bell, Database, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Check, X, RefreshCw, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { adminApiKeysApi, type APIKey, type APIKeyTypeInfo } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// API Key type display config
const API_KEY_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  gemini: { icon: '🤖', color: 'bg-blue-100 text-blue-700' },
  transcript: { icon: '📝', color: 'bg-purple-100 text-purple-700' },
  r2_access: { icon: '☁️', color: 'bg-orange-100 text-orange-700' },
  r2_secret: { icon: '🔐', color: 'bg-orange-100 text-orange-700' },
  resend: { icon: '📧', color: 'bg-green-100 text-green-700' },
  telegram: { icon: '✈️', color: 'bg-sky-100 text-sky-700' },
};

interface APIKeyFormData {
  key_type: string;
  name: string;
  description: string;
  key_value: string;
  config: string;
  is_active: boolean;
  is_primary: boolean;
}

const defaultFormData: APIKeyFormData = {
  key_type: '',
  name: '',
  description: '',
  key_value: '',
  config: '',
  is_active: true,
  is_primary: false,
};

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  
  // API Keys state
  const [apiKeyTypes, setApiKeyTypes] = useState<APIKeyTypeInfo[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [keyFormData, setKeyFormData] = useState<APIKeyFormData>(defaultFormData);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const [typesRes, keysRes] = await Promise.all([
        adminApiKeysApi.getTypes(),
        adminApiKeysApi.list(),
      ]);
      setApiKeyTypes(typesRes.data || []);
      setApiKeys(keysRes.data?.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({ title: 'Failed to load API keys', variant: 'destructive' });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Open dialog for new key
  const handleAddKey = (keyType?: string) => {
    setEditingKey(null);
    setKeyFormData({
      ...defaultFormData,
      key_type: keyType || '',
      name: keyType ? apiKeyTypes.find(t => t.key_type === keyType)?.name || '' : '',
    });
    setShowKeyDialog(true);
  };

  // Open dialog for editing
  const handleEditKey = (key: APIKey) => {
    setEditingKey(key);
    setKeyFormData({
      key_type: key.key_type,
      name: key.name,
      description: key.description || '',
      key_value: '', // Don't show existing value
      config: key.config || '',
      is_active: key.is_active,
      is_primary: key.is_primary,
    });
    setShowKeyDialog(true);
  };

  // Save key
  const handleSaveKey = async () => {
    if (!keyFormData.key_type || !keyFormData.name || (!editingKey && !keyFormData.key_value)) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmittingKey(true);
    try {
      if (editingKey) {
        await adminApiKeysApi.update(editingKey.id, {
          name: keyFormData.name,
          description: keyFormData.description || undefined,
          key_value: keyFormData.key_value || undefined,
          config: keyFormData.config || undefined,
          is_active: keyFormData.is_active,
          is_primary: keyFormData.is_primary,
        });
        toast({ title: 'API key updated' });
      } else {
        await adminApiKeysApi.create({
          key_type: keyFormData.key_type,
          name: keyFormData.name,
          description: keyFormData.description || undefined,
          key_value: keyFormData.key_value,
          config: keyFormData.config || undefined,
          is_primary: keyFormData.is_primary,
        });
        toast({ title: 'API key added' });
      }
      setShowKeyDialog(false);
      fetchApiKeys();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to save API key', variant: 'destructive' });
    } finally {
      setIsSubmittingKey(false);
    }
  };

  // Delete key
  const handleDeleteKey = async (key: APIKey) => {
    if (!confirm(`Delete API key "${key.name}"? This cannot be undone.`)) return;

    try {
      await adminApiKeysApi.delete(key.id);
      toast({ title: 'API key deleted' });
      fetchApiKeys();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to delete API key', variant: 'destructive' });
    }
  };

  // Reveal key
  const handleRevealKey = async (keyId: string) => {
    if (revealedKeys[keyId]) {
      // Hide it
      setRevealedKeys(prev => {
        const newState = { ...prev };
        delete newState[keyId];
        return newState;
      });
      return;
    }

    try {
      const res = await adminApiKeysApi.reveal(keyId);
      setRevealedKeys(prev => ({ ...prev, [keyId]: res.data.key_value || '' }));
    } catch (error: any) {
      toast({ title: 'Failed to reveal key', variant: 'destructive' });
    }
  };

  // Test key
  const handleTestKey = async (keyId: string) => {
    setTestingKey(keyId);
    try {
      const res = await adminApiKeysApi.test(keyId);
      if (res.data.status === 'success') {
        toast({ title: 'API key is working!', description: res.data.message });
      } else {
        toast({ title: 'API key test failed', description: res.data.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Failed to test API key', variant: 'destructive' });
    } finally {
      setTestingKey(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: 'Settings saved' });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your platform settings and integrations.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:inline-flex">
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api">
          <div className="space-y-6">
            {/* API Key Types Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Status
                </CardTitle>
                <CardDescription>
                  Overview of required API keys and their configuration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {apiKeyTypes.map((keyType) => (
                      <div
                        key={keyType.key_type}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {API_KEY_TYPE_CONFIG[keyType.key_type]?.icon || '🔑'}
                          </span>
                          <div>
                            <p className="font-medium">{keyType.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {keyType.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {keyType.has_key ? (
                            <Badge className={keyType.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                              {keyType.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddKey(keyType.key_type)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All API Keys Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All API Keys</CardTitle>
                  <CardDescription>
                    Manage all configured API keys
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchApiKeys}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button size="sm" onClick={() => handleAddKey()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No API keys configured yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>
                            <Badge className={API_KEY_TYPE_CONFIG[key.key_type]?.color || 'bg-gray-100'}>
                              {API_KEY_TYPE_CONFIG[key.key_type]?.icon} {key.key_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{key.name}</p>
                              {key.description && (
                                <p className="text-xs text-muted-foreground">{key.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {revealedKeys[key.id] || key.masked_value}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRevealKey(key.id)}
                              >
                                {revealedKeys[key.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {key.is_active ? (
                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                              {key.is_primary && (
                                <Badge variant="outline">Primary</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {key.usage_count} uses
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleTestKey(key.id)}
                                disabled={testingKey === key.id}
                              >
                                {testingKey === key.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <TestTube className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditKey(key)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteKey(key)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic configuration for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" defaultValue="RecapVideo AI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input id="siteUrl" defaultValue="https://recapvideo.ai" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Site Description</Label>
                <Textarea
                  id="description"
                  defaultValue="Transform YouTube videos into engaging recap content with AI"
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to sign up
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Put the site in maintenance mode
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email and Telegram notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify admin when new users register
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Order</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify admin when new orders are placed
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Video Completed</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify users when video processing is complete
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Telegram Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Telegram Bot</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via Telegram
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Chat ID</Label>
                    <Input placeholder="Enter Telegram chat ID for admin notifications" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Settings
              </CardTitle>
              <CardDescription>
                Configure file storage and cleanup settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select defaultValue="r2">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="r2">Cloudflare R2</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="local">Local Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Video Retention (days)</Label>
                  <Input type="number" defaultValue="30" />
                  <p className="text-xs text-muted-foreground">
                    Number of days to keep processed videos before cleanup
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Cache Retention (days)</Label>
                  <Input type="number" defaultValue="7" />
                  <p className="text-xs text-muted-foreground">
                    Number of days to keep cached transcripts and translations
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Auto Cleanup</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Auto Cleanup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete old files based on retention settings
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? 'Edit API Key' : 'Add API Key'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingKey && (
              <div className="space-y-2">
                <Label>Key Type *</Label>
                <Select
                  value={keyFormData.key_type}
                  onValueChange={(value) => {
                    const typeInfo = apiKeyTypes.find(t => t.key_type === value);
                    setKeyFormData(prev => ({
                      ...prev,
                      key_type: value,
                      name: typeInfo?.name || prev.name,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select key type" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeyTypes.map((type) => (
                      <SelectItem key={type.key_type} value={type.key_type}>
                        {API_KEY_TYPE_CONFIG[type.key_type]?.icon} {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={keyFormData.name}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Primary Gemini Key"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={keyFormData.description}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{editingKey ? 'New Key Value (leave blank to keep current)' : 'Key Value *'}</Label>
              <Input
                type="password"
                value={keyFormData.key_value}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, key_value: e.target.value }))}
                placeholder="Enter API key value"
              />
            </div>

            <div className="space-y-2">
              <Label>Config (JSON)</Label>
              <Textarea
                value={keyFormData.config}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, config: e.target.value }))}
                placeholder='{"bucket": "my-bucket"}'
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable this key for use</p>
              </div>
              <Switch
                checked={keyFormData.is_active}
                onCheckedChange={(checked) => setKeyFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Primary</Label>
                <p className="text-xs text-muted-foreground">Use as the primary key for this type</p>
              </div>
              <Switch
                checked={keyFormData.is_primary}
                onCheckedChange={(checked) => setKeyFormData(prev => ({ ...prev, is_primary: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveKey} disabled={isSubmittingKey}>
              {isSubmittingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingKey ? 'Update' : 'Add'} Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
