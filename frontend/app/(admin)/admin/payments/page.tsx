'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Wallet, Plus, Pencil, Trash2, Loader2, Check, X, Phone, User, QrCode } from 'lucide-react';
import { paymentMethodsApi, type PaymentMethod, type PaymentType } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Payment type colors
const PAYMENT_TYPE_CONFIG: Record<string, { name: string; color: string; bgColor: string }> = {
  kbzpay: { name: 'KBZ Pay', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  wavepay: { name: 'Wave Pay', color: 'text-green-600', bgColor: 'bg-green-100' },
  cbpay: { name: 'CB Pay', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ayapay: { name: 'AYA Pay', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  okdollar: { name: 'OK$', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  mpitesan: { name: 'M-Pitesan', color: 'text-red-600', bgColor: 'bg-red-100' },
  onepay: { name: 'OnePay', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  uabpay: { name: 'UAB Pay', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
};

const ALL_PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_CONFIG);

interface PaymentFormData {
  phone: string;
  account_name: string;
  payment_types: string[];
  display_order: number;
  is_active: boolean;
}

const defaultFormData: PaymentFormData = {
  phone: '',
  account_name: '',
  payment_types: [],
  display_order: 0,
  is_active: true,
};

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>(defaultFormData);

  // Fetch methods
  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const response = await paymentMethodsApi.list(true);
      setMethods(response.data.payment_methods || []);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({ title: 'Failed to load payment methods', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open dialog for new method
  const handleAddNew = () => {
    setEditingMethod(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  // Open dialog for editing
  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      phone: method.phone,
      account_name: method.account_name,
      payment_types: method.payment_types,
      display_order: method.display_order,
      is_active: method.is_active,
    });
    setShowDialog(true);
  };

  // Save method (create or update)
  const handleSave = async () => {
    if (!formData.phone || !formData.account_name || formData.payment_types.length === 0) {
      toast({ title: 'Please fill in all required fields and select at least one payment type', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMethod) {
        await paymentMethodsApi.update(editingMethod.id, {
          phone: formData.phone,
          account_name: formData.account_name,
          payment_types: formData.payment_types,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        toast({ title: 'Payment method updated' });
      } else {
        await paymentMethodsApi.create({
          phone: formData.phone,
          account_name: formData.account_name,
          payment_types: formData.payment_types,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        toast({ title: 'Payment method created' });
      }
      setShowDialog(false);
      fetchMethods();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to save payment method', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete method
  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete payment account "${method.account_name}"?`)) {
      return;
    }

    try {
      await paymentMethodsApi.delete(method.id);
      toast({ title: 'Payment method deleted' });
      fetchMethods();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to delete payment method', variant: 'destructive' });
    }
  };

  // Toggle payment type selection
  const togglePaymentType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      payment_types: prev.payment_types.includes(typeId)
        ? prev.payment_types.filter(t => t !== typeId)
        : [...prev.payment_types, typeId],
    }));
  };

  // Upload QR code
  const handleUploadQr = async (methodId: string, file: File) => {
    try {
      await paymentMethodsApi.uploadQrCode(methodId, file);
      toast({ title: 'QR code uploaded' });
      fetchMethods();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to upload QR code', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💳 Payment Methods</h1>
          <p className="text-muted-foreground mt-1">
            Manage payment accounts for receiving order payments
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Account
        </Button>
      </div>

      {/* Payment Methods Grid */}
      {methods.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No payment methods yet</p>
            <Button variant="outline" className="mt-4" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Payment Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {methods.map((method) => (
            <Card key={method.id} className={cn(!method.is_active && 'opacity-60')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{method.account_name}</span>
                        <Badge variant={method.is_active ? 'default' : 'secondary'}>
                          {method.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{method.phone}</p>
                      
                      {/* Payment Types */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {method.payment_types.map((type) => {
                          const config = PAYMENT_TYPE_CONFIG[type];
                          return (
                            <Badge
                              key={type}
                              variant="outline"
                              className={cn(config?.bgColor, config?.color, 'text-xs')}
                            >
                              {config?.name || type}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* QR Code indicator */}
                    {method.qr_code_url && (
                      <Badge variant="outline" className="text-xs">
                        <QrCode className="h-3 w-3 mr-1" />
                        QR
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(method)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(method)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code Upload */}
                <div className="mt-4 pt-4 border-t">
                  <input
                    type="file"
                    id={`qr-${method.id}`}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadQr(method.id, file);
                    }}
                  />
                  {method.qr_code_url ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={method.qr_code_url.startsWith('http') ? method.qr_code_url : `/api/v1${method.qr_code_url}`}
                        alt="QR Code"
                        className="h-16 w-16 rounded object-cover"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`qr-${method.id}`)?.click()}
                      >
                        Change QR
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`qr-${method.id}`)?.click()}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Upload QR Code
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Account' : 'Add Payment Account'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., 0977777777"
              />
            </div>

            <div>
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="e.g., Ko Xun"
              />
            </div>

            <div>
              <Label className="mb-3 block">Payment Types * (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PAYMENT_TYPES.map((typeId) => {
                  const config = PAYMENT_TYPE_CONFIG[typeId];
                  const isSelected = formData.payment_types.includes(typeId);
                  
                  return (
                    <button
                      key={typeId}
                      type="button"
                      onClick={() => togglePaymentType(typeId)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border transition-colors text-left',
                        isSelected
                          ? `${config.bgColor} ${config.color} border-current`
                          : 'hover:bg-muted'
                      )}
                    >
                      <div className={cn(
                        'h-5 w-5 rounded border flex items-center justify-center',
                        isSelected ? 'bg-current' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="font-medium">{config.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMethod ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
