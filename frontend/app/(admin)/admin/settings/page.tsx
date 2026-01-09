'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Globe, Bell, Database, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Check, X, RefreshCw, TestTube, Shield, Wifi, WifiOff, AlertTriangle, Send, Bot, Webhook } from 'lucide-react';
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
import { adminApiKeysApi, siteSettingsApi, siteSettingsPublicApi, telegramApi, type APIKey, type APIKeyTypeInfo, type AllowedIP, type TelegramStatus } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// API Key type display config
const API_KEY_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  gemini: { icon: '🤖', color: 'bg-blue-100 text-blue-700' },
  transcript_api: { icon: '📝', color: 'bg-purple-100 text-purple-700' },
  r2_access_key: { icon: '☁️', color: 'bg-orange-100 text-orange-700' },
  r2_secret_key: { icon: '🔐', color: 'bg-orange-100 text-orange-700' },
  resend: { icon: '📧', color: 'bg-green-100 text-green-700' },
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
  
  // Site Settings state
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [myIP, setMyIP] = useState<string>('');
  const [newIPAddress, setNewIPAddress] = useState('');
  const [newIPLabel, setNewIPLabel] = useState('');
  const [isAddingIP, setIsAddingIP] = useState(false);
  
  // Telegram state
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramAdminChatId, setTelegramAdminChatId] = useState('');
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);

  // Fetch API keys and site settings on mount
  useEffect(() => {
    fetchApiKeys();
    fetchSiteSettings();
    fetchMyIP();
    fetchTelegramStatus();
  }, []);

  const fetchSiteSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await siteSettingsApi.getAll();
      setSiteSettings(res.data?.settings || {});
    } catch (error) {
      console.error('Error fetching site settings:', error);
      toast({ title: 'Failed to load site settings', variant: 'destructive' });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchMyIP = async () => {
    try {
      const res = await siteSettingsPublicApi.getMyIP();
      setMyIP(res.data?.ip || '');
    } catch (error) {
      console.error('Error fetching IP:', error);
    }
  };

  const getSettingValue = (key: string, defaultValue: string = ''): string => {
    return siteSettings[key]?.value ?? defaultValue;
  };

  const getSettingBool = (key: string, defaultValue: boolean = false): boolean => {
    const value = siteSettings[key]?.value;
    if (value === undefined) return defaultValue;
    return value === 'true';
  };

  const getSettingJson = (key: string, defaultValue: any[] = []): any[] => {
    return siteSettings[key]?.value_json ?? defaultValue;
  };

  const updateSetting = async (key: string, value?: string, value_json?: any) => {
    try {
      await siteSettingsApi.updateSingle(key, { key, value, value_json });
      // Update local state
      setSiteSettings(prev => ({
        ...prev,
        [key]: { ...prev[key], value, value_json }
      }));
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({ title: 'Failed to update setting', variant: 'destructive' });
      return false;
    }
  };

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    const success = await updateSetting(key, (!currentValue).toString());
    if (success) {
      toast({ title: 'Setting updated' });
    }
  };

  const handleAddAllowedIP = async () => {
    if (!newIPAddress.trim()) {
      toast({ title: 'Please enter an IP address', variant: 'destructive' });
      return;
    }
    setIsAddingIP(true);
    try {
      await siteSettingsApi.addAllowedIP(newIPAddress.trim(), newIPLabel.trim() || undefined);
      toast({ title: 'IP address added' });
      setNewIPAddress('');
      setNewIPLabel('');
      fetchSiteSettings();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to add IP', variant: 'destructive' });
    } finally {
      setIsAddingIP(false);
    }
  };

  const handleRemoveAllowedIP = async (ip: string) => {
    try {
      await siteSettingsApi.removeAllowedIP(ip);
      toast({ title: 'IP address removed' });
      fetchSiteSettings();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to remove IP', variant: 'destructive' });
    }
  };

  const handleAddMyIP = () => {
    setNewIPAddress(myIP);
    setNewIPLabel('My Current IP');
  };
  
  // Telegram functions
  const fetchTelegramStatus = async () => {
    setIsLoadingTelegram(true);
    try {
      const res = await telegramApi.getStatus();
      setTelegramStatus(res.data);
      setTelegramAdminChatId(res.data?.admin_chat_id || '');
      setIsTelegramEnabled(res.data?.enabled || false);
    } catch (error) {
      console.error('Error fetching Telegram status:', error);
    } finally {
      setIsLoadingTelegram(false);
    }
  };
  
  const handleSaveTelegramConfig = async () => {
    setIsSavingTelegram(true);
    try {
      await telegramApi.updateConfig({
        bot_token: telegramBotToken || undefined,
        admin_chat_id: telegramAdminChatId,
        enabled: isTelegramEnabled,
      });
      toast({ title: 'Telegram settings saved' });
      setTelegramBotToken(''); // Clear token field after save
      fetchTelegramStatus();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to save Telegram settings', variant: 'destructive' });
    } finally {
      setIsSavingTelegram(false);
    }
  };
  
  const handleTestTelegramConnection = async () => {
    setIsTestingTelegram(true);
    try {
      const res = await telegramApi.testConnection();
      toast({ 
        title: 'Connection successful', 
        description: res.data?.message || `Connected as @${res.data?.bot_username}` 
      });
      fetchTelegramStatus();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Connection failed', variant: 'destructive' });
    } finally {
      setIsTestingTelegram(false);
    }
  };
  
  const handleSendTestMessage = async () => {
    try {
      await telegramApi.sendTestMessage();
      toast({ title: 'Test message sent!' });
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to send test message', variant: 'destructive' });
    }
  };
  
  const handleSetupWebhook = async () => {
    setIsSettingWebhook(true);
    try {
      // Use the production API URL for webhook
      const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.recapvideo.ai'}/api/v1/telegram/webhook`;
      await telegramApi.setWebhook(webhookUrl);
      toast({ title: 'Webhook configured successfully' });
      fetchTelegramStatus();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to set webhook', variant: 'destructive' });
    } finally {
      setIsSettingWebhook(false);
    }
  };
  
  const handleRemoveWebhook = async () => {
    try {
      await telegramApi.deleteWebhook();
      toast({ title: 'Webhook removed' });
      fetchTelegramStatus();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to remove webhook', variant: 'destructive' });
    }
  };

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
          <div className="space-y-6">
            {/* Maintenance Mode Card */}
            <Card className={getSettingBool('maintenance_mode') ? 'border-orange-500 border-2' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Maintenance Mode
                  {getSettingBool('maintenance_mode') && (
                    <Badge variant="destructive" className="ml-2">ACTIVE</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  When enabled, only allowed IPs can access the site. Others see a maintenance page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Main Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSettingBool('maintenance_mode') ? (
                          <WifiOff className="h-6 w-6 text-orange-500" />
                        ) : (
                          <Wifi className="h-6 w-6 text-green-500" />
                        )}
                        <div>
                          <Label className="text-base">Enable Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            {getSettingBool('maintenance_mode') 
                              ? 'Site is currently in maintenance mode' 
                              : 'Site is accessible to all users'}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={getSettingBool('maintenance_mode')}
                        onCheckedChange={(checked) => handleToggleSetting('maintenance_mode', !checked)}
                      />
                    </div>

                    {/* Allowed IPs Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Allowed IP Addresses</h3>
                        {myIP && (
                          <Badge variant="outline" className="font-mono">
                            Your IP: {myIP}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Add IP Form */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="IP Address (e.g., 192.168.1.1)"
                          value={newIPAddress}
                          onChange={(e) => setNewIPAddress(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Label (optional)"
                          value={newIPLabel}
                          onChange={(e) => setNewIPLabel(e.target.value)}
                          className="w-40"
                        />
                        <Button 
                          onClick={handleAddAllowedIP}
                          disabled={isAddingIP || !newIPAddress.trim()}
                        >
                          {isAddingIP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                        {myIP && (
                          <Button variant="outline" onClick={handleAddMyIP}>
                            Add My IP
                          </Button>
                        )}
                      </div>

                      {/* IP List */}
                      <div className="border rounded-lg">
                        {getSettingJson('maintenance_allowed_ips', []).length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                            <p>No allowed IPs configured.</p>
                            <p className="text-xs">If you enable maintenance mode, you won't be able to access the site!</p>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getSettingJson('maintenance_allowed_ips', []).map((item: any, index: number) => {
                                const ip = typeof item === 'string' ? item : item.ip;
                                const label = typeof item === 'string' ? '' : item.label;
                                const isMyIP = ip === myIP;
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-mono">
                                      {ip}
                                      {isMyIP && (
                                        <Badge variant="secondary" className="ml-2">You</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>{label || '-'}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleRemoveAllowedIP(ip)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>

                    {/* Maintenance Message */}
                    <div className="space-y-2">
                      <Label>Maintenance Message</Label>
                      <Textarea
                        value={getSettingValue('maintenance_message', 'We are working on something amazing!')}
                        onChange={(e) => {
                          setSiteSettings(prev => ({
                            ...prev,
                            maintenance_message: { ...prev.maintenance_message, value: e.target.value }
                          }));
                        }}
                        onBlur={(e) => updateSetting('maintenance_message', e.target.value)}
                        placeholder="Message to show on maintenance page"
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Feature Toggles Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Feature Settings
                </CardTitle>
                <CardDescription>
                  Control site features and user access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Registration</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow new users to sign up
                        </p>
                      </div>
                      <Switch 
                        checked={getSettingBool('allow_registration', true)}
                        onCheckedChange={(checked) => handleToggleSetting('allow_registration', !checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Verification</Label>
                        <p className="text-sm text-muted-foreground">
                          Require email verification for new accounts
                        </p>
                      </div>
                      <Switch 
                        checked={getSettingBool('require_email_verification', true)}
                        onCheckedChange={(checked) => handleToggleSetting('require_email_verification', !checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Google Login</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow users to sign in with Google
                        </p>
                      </div>
                      <Switch 
                        checked={getSettingBool('allow_google_login', true)}
                        onCheckedChange={(checked) => handleToggleSetting('allow_google_login', !checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure email notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify admin when new users register
                    </p>
                  </div>
                  <Switch 
                    checked={getSettingBool('notify_new_user', true)}
                    onCheckedChange={(checked) => handleToggleSetting('notify_new_user', !checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Order</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify admin when new orders are placed
                    </p>
                  </div>
                  <Switch 
                    checked={getSettingBool('notify_new_order', true)}
                    onCheckedChange={(checked) => handleToggleSetting('notify_new_order', !checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Video Completed</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify users when video processing is complete
                    </p>
                  </div>
                  <Switch 
                    checked={getSettingBool('notify_video_complete', true)}
                    onCheckedChange={(checked) => handleToggleSetting('notify_video_complete', !checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Telegram Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Telegram Bot Configuration
                </CardTitle>
                <CardDescription>
                  Configure Telegram bot for order notifications with approve/reject buttons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingTelegram ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Bot Status */}
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Bot Status</h4>
                        <Button variant="outline" size="sm" onClick={fetchTelegramStatus}>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Connection:</span>
                          {telegramStatus?.bot_token_configured ? (
                            <Badge className="bg-green-100 text-green-700">Connected</Badge>
                          ) : (
                            <Badge variant="outline">Not Connected</Badge>
                          )}
                        </div>
                        {telegramStatus?.bot_info && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Bot:</span>
                            <span className="text-sm font-medium">
                              @{telegramStatus.bot_info.username}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Webhook:</span>
                          {telegramStatus?.webhook_info?.configured ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="outline">Not Set</Badge>
                          )}
                        </div>
                        {telegramStatus?.webhook_info?.last_error && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">{telegramStatus.webhook_info.last_error}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Telegram Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send order notifications via Telegram bot
                        </p>
                      </div>
                      <Switch 
                        checked={isTelegramEnabled}
                        onCheckedChange={setIsTelegramEnabled}
                      />
                    </div>

                    {/* Bot Token */}
                    <div className="space-y-2">
                      <Label>Bot Token</Label>
                      <Input 
                        type="password"
                        placeholder="Enter your Telegram bot token from @BotFather"
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Create a bot with @BotFather on Telegram to get your bot token
                      </p>
                    </div>

                    {/* Admin Chat ID */}
                    <div className="space-y-2">
                      <Label>Admin Chat ID</Label>
                      <Input 
                        placeholder="Enter your Telegram chat ID (e.g., 123456789)"
                        value={telegramAdminChatId}
                        onChange={(e) => setTelegramAdminChatId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        To get your chat ID, message @userinfobot on Telegram
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={handleSaveTelegramConfig}
                        disabled={isSavingTelegram}
                      >
                        {isSavingTelegram && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                      
                      {telegramStatus?.bot_token_configured && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={handleTestTelegramConnection}
                            disabled={isTestingTelegram}
                          >
                            {isTestingTelegram && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <TestTube className="h-4 w-4 mr-2" />
                            Test Connection
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={handleSendTestMessage}
                            disabled={!telegramAdminChatId}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Test Message
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Webhook Setup */}
                    {telegramStatus?.bot_token_configured && (
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <Webhook className="h-5 w-5" />
                          <h4 className="font-medium">Webhook Configuration</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Webhook is required for receiving button callbacks (Approve/Reject orders).
                        </p>
                        {telegramStatus?.webhook_info?.configured ? (
                          <div className="space-y-3">
                            <div className="text-sm">
                              <span className="text-muted-foreground">URL: </span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {telegramStatus.webhook_info.url}
                              </code>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={handleRemoveWebhook}
                            >
                              Remove Webhook
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={handleSetupWebhook}
                            disabled={isSettingWebhook}
                          >
                            {isSettingWebhook && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Webhook className="h-4 w-4 mr-2" />
                            Setup Webhook Automatically
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
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
