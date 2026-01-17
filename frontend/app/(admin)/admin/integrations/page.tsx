'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Check, X, 
  RefreshCw, TestTube, Zap, FileText, Cloud, Mail, Bot,
  Sparkles, ChevronDown, ChevronRight, AlertCircle, CheckCircle2,
  Settings2, Layers
} from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { adminApiKeysApi, type APIKey, type APIKeyTypeInfo } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// Integration categories with their providers
const INTEGRATION_CATEGORIES = {
  script_generation: {
    title: 'Script Generation',
    description: 'AI models for generating video scripts',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    providers: ['deepinfra', 'poe', 'groq', 'gemini', 'openrouter']
  },
  transcript: {
    title: 'Transcript',
    description: 'YouTube transcript extraction',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    providers: ['transcript_api']
  },
  storage: {
    title: 'Storage',
    description: 'Cloud storage for videos and assets',
    icon: Cloud,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    providers: ['r2_access_key', 'r2_secret_key']
  },
  email: {
    title: 'Email',
    description: 'Email delivery service',
    icon: Mail,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    providers: ['resend']
  },
};

// Provider display config
const PROVIDER_CONFIG: Record<string, { 
  name: string; 
  description: string; 
  icon: string;
  docsUrl?: string;
  category: string;
}> = {
  deepinfra: { 
    name: 'DeepInfra (Gemini 2.5 Flash)', 
    description: 'PRIMARY AI - Best for Burmese scripts',
    icon: '🚀',
    docsUrl: 'https://deepinfra.com/dash/api_keys',
    category: 'script_generation'
  },
  poe: { 
    name: 'Poe (Claude FREE)', 
    description: 'Backup AI for script generation via Poe',
    icon: '🎭',
    docsUrl: 'https://poe.com/api_pricing',
    category: 'script_generation'
  },
  groq: { 
    name: 'Groq (Llama 3.3)', 
    description: 'Fast AI fallback - English only',
    icon: '⚡',
    docsUrl: 'https://console.groq.com/',
    category: 'script_generation'
  },
  gemini: { 
    name: 'Google Gemini', 
    description: 'Final fallback - FREE tier',
    icon: '🤖',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    category: 'script_generation'
  },
  openrouter: { 
    name: 'OpenRouter', 
    description: 'Access to multiple AI models',
    icon: '🌐',
    docsUrl: 'https://openrouter.ai/keys',
    category: 'script_generation'
  },
  transcript_api: { 
    name: 'TranscriptAPI.com', 
    description: 'YouTube transcript extraction',
    icon: '📝',
    docsUrl: 'https://www.transcriptapi.com/',
    category: 'transcript'
  },
  r2_access_key: { 
    name: 'Cloudflare R2 Access Key', 
    description: 'R2 storage access key ID',
    icon: '☁️',
    docsUrl: 'https://dash.cloudflare.com/',
    category: 'storage'
  },
  r2_secret_key: { 
    name: 'Cloudflare R2 Secret Key', 
    description: 'R2 storage secret access key',
    icon: '🔐',
    category: 'storage'
  },
  resend: { 
    name: 'Resend', 
    description: 'Email delivery service',
    icon: '📧',
    docsUrl: 'https://resend.com/api-keys',
    category: 'email'
  },
};

// Available AI models for each provider
const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
  deepinfra: [
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B' },
    { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B' },
  ],
  openrouter: [
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Recommended)' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ],
  poe: [
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
};

interface APIKeyFormData {
  key_type: string;
  name: string;
  description: string;
  key_value: string;
  config: string;
  is_active: boolean;
  is_primary: boolean;
  priority: number;
  model: string;
}

const defaultFormData: APIKeyFormData = {
  key_type: '',
  name: '',
  description: '',
  key_value: '',
  config: '',
  is_active: true,
  is_primary: false,
  priority: 100,
  model: '',
};

export default function IntegrationsPage() {
  const [apiKeyTypes, setApiKeyTypes] = useState<APIKeyTypeInfo[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);
  const [keyFormData, setKeyFormData] = useState<APIKeyFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    script_generation: true,
    transcript: true,
    storage: true,
    email: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<APIKey | null>(null);

  const fetchApiKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const [typesRes, keysRes] = await Promise.all([
        adminApiKeysApi.getTypes(),
        adminApiKeysApi.list(),
      ]);
      // getTypes returns array directly, list returns { keys: [] }
      setApiKeyTypes(typesRes.data || []);
      setApiKeys(keysRes.data?.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({ title: 'Failed to load integrations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getKeysByProvider = (provider: string) => {
    return apiKeys.filter(key => key.key_type === provider);
  };

  const getProviderStatus = (provider: string) => {
    const keys = getKeysByProvider(provider);
    if (keys.length === 0) return 'not_configured';
    if (keys.some(k => k.is_active)) return 'active';
    return 'inactive';
  };

  const handleAddKey = (keyType?: string) => {
    setEditingKey(null);
    const provider = keyType ? PROVIDER_CONFIG[keyType] : null;
    const defaultModel = keyType && PROVIDER_MODELS[keyType] ? PROVIDER_MODELS[keyType][0]?.value : '';
    setKeyFormData({
      ...defaultFormData,
      key_type: keyType || '',
      name: provider ? provider.name : '',
      description: provider ? provider.description : '',
      model: defaultModel,
    });
    setShowKeyDialog(true);
  };

  const handleEditKey = async (key: APIKey) => {
    setEditingKey(key);
    
    // Fetch the actual key value if needed
    let keyValue = '';
    try {
      const response = await adminApiKeysApi.reveal(key.id);
      keyValue = response.data?.key_value || '';
    } catch (error) {
      console.error('Error fetching key value:', error);
    }
    
    setKeyFormData({
      key_type: key.key_type,
      name: key.name,
      description: key.description || '',
      key_value: keyValue,
      config: key.config ? JSON.stringify(key.config, null, 2) : '',
      is_active: key.is_active,
      is_primary: key.is_primary,
      priority: key.priority || 100,
      model: key.model || '',
    });
    setShowKeyDialog(true);
  };

  const handleSubmitKey = async () => {
    if (!keyFormData.key_type || !keyFormData.name || !keyFormData.key_value) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let config = null;
      if (keyFormData.config) {
        try {
          config = JSON.parse(keyFormData.config);
        } catch {
          toast({ title: 'Invalid JSON in config field', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        key_type: keyFormData.key_type,
        name: keyFormData.name,
        description: keyFormData.description || undefined,
        key_value: keyFormData.key_value,
        config,
        is_active: keyFormData.is_active,
        is_primary: keyFormData.is_primary,
        priority: keyFormData.priority,
        model: keyFormData.model || undefined,
      };

      if (editingKey) {
        await adminApiKeysApi.update(editingKey.id, payload);
        toast({ title: 'Integration updated successfully' });
      } else {
        await adminApiKeysApi.create(payload);
        toast({ title: 'Integration added successfully' });
      }

      setShowKeyDialog(false);
      fetchApiKeys();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to save integration';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (key: APIKey) => {
    try {
      await adminApiKeysApi.delete(key.id);
      toast({ title: 'Integration deleted successfully' });
      setDeleteConfirm(null);
      fetchApiKeys();
    } catch (error) {
      toast({ title: 'Failed to delete integration', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (key: APIKey) => {
    try {
      await adminApiKeysApi.update(key.id, { is_active: !key.is_active });
      toast({ title: `Integration ${key.is_active ? 'disabled' : 'enabled'}` });
      fetchApiKeys();
    } catch (error) {
      toast({ title: 'Failed to update integration', variant: 'destructive' });
    }
  };

  const handleSetPrimary = async (key: APIKey) => {
    try {
      await adminApiKeysApi.update(key.id, { is_primary: true });
      toast({ title: 'Set as primary successfully' });
      fetchApiKeys();
    } catch (error) {
      toast({ title: 'Failed to set primary', variant: 'destructive' });
    }
  };

  const handleRevealKey = async (keyId: string) => {
    if (revealedKeys[keyId]) {
      setRevealedKeys(prev => {
        const newState = { ...prev };
        delete newState[keyId];
        return newState;
      });
      return;
    }

    try {
      const response = await adminApiKeysApi.reveal(keyId);
      setRevealedKeys(prev => ({
        ...prev,
        [keyId]: response.data?.key_value || '***',
      }));
    } catch (error) {
      toast({ title: 'Failed to reveal key', variant: 'destructive' });
    }
  };

  const handleTestKey = async (key: APIKey) => {
    setTestingKey(key.id);
    try {
      const response = await adminApiKeysApi.test(key.id);
      if (response.data?.status === 'success') {
        toast({ title: 'Connection test successful!' });
      } else {
        toast({ 
          title: 'Connection test failed', 
          description: response.data?.message || 'Unknown error',
          variant: 'destructive' 
        });
      }
    } catch (error: any) {
      toast({ 
        title: 'Connection test failed', 
        description: error.response?.data?.detail || 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setTestingKey(null);
    }
  };

  const renderProviderCard = (provider: string, categoryKey: string) => {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return null;

    const status = getProviderStatus(provider);
    const keys = getKeysByProvider(provider);
    const primaryKey = keys.find(k => k.is_primary && k.is_active);
    const activeKey = primaryKey || keys.find(k => k.is_active);

    return (
      <div 
        key={provider}
        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{config.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{config.name}</h4>
                {status === 'active' && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                {status === 'inactive' && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {status === 'not_configured' && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Configured
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config.docsUrl && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(config.docsUrl, '_blank')}
              >
                Docs
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAddKey(provider)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Existing keys for this provider */}
        {keys.length > 0 && (
          <div className="mt-4 space-y-2">
            {keys.map(key => (
              <div 
                key={key.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{key.name}</span>
                      {key.is_primary && (
                        <Badge variant="outline" className="text-xs">Primary</Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        Priority: {key.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {revealedKeys[key.id] 
                          ? revealedKeys[key.id].substring(0, 20) + '...'
                          : '••••••••••••'}
                      </span>
                      {key.model && (
                        <span>• Model: {key.model.split('/').pop()}</span>
                      )}
                      {key.usage_count > 0 && (
                        <span>• {key.usage_count} uses</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRevealKey(key.id)}
                  >
                    {revealedKeys[key.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTestKey(key)}
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
                  <Switch
                    checked={key.is_active}
                    onCheckedChange={() => handleToggleActive(key)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Manage external service connections and API keys
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchApiKeys}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleAddKey()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(INTEGRATION_CATEGORIES).map(([key, category]) => {
          const CategoryIcon = category.icon;
          const activeCount = category.providers.filter(p => getProviderStatus(p) === 'active').length;
          const totalCount = category.providers.length;
          
          return (
            <Card key={key} className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setExpandedCategories(prev => ({ ...prev, [key]: true }));
                document.getElementById(`category-${key}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <CategoryIcon className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{category.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activeCount}/{totalCount} active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Categories */}
      <div className="space-y-4">
        {Object.entries(INTEGRATION_CATEGORIES).map(([categoryKey, category]) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories[categoryKey];
          
          return (
            <Card key={categoryKey} id={`category-${categoryKey}`}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(categoryKey)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.bgColor}`}>
                          <CategoryIcon className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid gap-4">
                      {category.providers.map(provider => 
                        renderProviderCard(provider, categoryKey)
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? 'Edit Integration' : 'Add Integration'}
            </DialogTitle>
            <DialogDescription>
              {editingKey 
                ? 'Update the integration settings below.'
                : 'Configure a new external service integration.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key_type">Provider *</Label>
              <Select
                value={keyFormData.key_type}
                onValueChange={(value) => {
                  const provider = PROVIDER_CONFIG[value];
                  const defaultModel = PROVIDER_MODELS[value]?.[0]?.value || '';
                  setKeyFormData(prev => ({
                    ...prev,
                    key_type: value,
                    name: provider?.name || prev.name,
                    description: provider?.description || prev.description,
                    model: defaultModel,
                  }));
                }}
                disabled={!!editingKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={keyFormData.name}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Production Key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_value">API Key *</Label>
              <Input
                id="key_value"
                type="password"
                value={keyFormData.key_value}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, key_value: e.target.value }))}
                placeholder="Enter API key"
              />
            </div>

            {/* Priority - Only for AI providers */}
            {['deepinfra', 'openrouter', 'groq', 'gemini', 'poe'].includes(keyFormData.key_type) && (
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority Order
                  <span className="text-xs text-muted-foreground ml-2">
                    (1 = first, lower = higher priority)
                  </span>
                </Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={999}
                  value={keyFormData.priority}
                  onChange={(e) => setKeyFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                  placeholder="100"
                />
              </div>
            )}

            {/* Model Selection - Only for AI providers with models */}
            {PROVIDER_MODELS[keyFormData.key_type] && (
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={keyFormData.model}
                  onValueChange={(value) => setKeyFormData(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_MODELS[keyFormData.key_type].map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={keyFormData.description}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config">Config (JSON)</Label>
              <Textarea
                id="config"
                value={keyFormData.config}
                onChange={(e) => setKeyFormData(prev => ({ ...prev, config: e.target.value }))}
                placeholder='{"custom_option": "value"}'
                rows={2}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={keyFormData.is_active}
                  onCheckedChange={(checked) => setKeyFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_primary"
                  checked={keyFormData.is_primary}
                  onCheckedChange={(checked) => setKeyFormData(prev => ({ ...prev, is_primary: checked }))}
                />
                <Label htmlFor="is_primary">Primary</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitKey} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingKey ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDeleteKey(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
