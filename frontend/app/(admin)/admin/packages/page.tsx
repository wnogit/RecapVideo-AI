'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Package, Plus, Pencil, Trash2, Loader2, Star, Check, X, GripVertical } from 'lucide-react';
import { creditPackagesApi, type CreditPackage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PackageFormData {
  name: string;
  description: string;
  credits: number;
  price_usd: number;
  price_mmk: number;
  is_popular: boolean;
  discount_percent: number;
  display_order: number;
  is_active: boolean;
}

const defaultFormData: PackageFormData = {
  name: '',
  description: '',
  credits: 10,
  price_usd: 9.99,
  price_mmk: 30000,
  is_popular: false,
  discount_percent: 0,
  display_order: 0,
  is_active: true,
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData);

  // Fetch packages
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await creditPackagesApi.list(true);
      setPackages(response.data.packages || []);
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      toast({ title: 'Failed to load packages', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open dialog for new package
  const handleAddNew = () => {
    setEditingPackage(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  // Open dialog for editing
  const handleEdit = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      credits: pkg.credits,
      price_usd: pkg.price_usd,
      price_mmk: pkg.price_mmk || 0,
      is_popular: pkg.is_popular,
      discount_percent: pkg.discount_percent,
      display_order: pkg.display_order,
      is_active: pkg.is_active,
    });
    setShowDialog(true);
  };

  // Save package (create or update)
  const handleSave = async () => {
    if (!formData.name || formData.credits <= 0 || formData.price_usd <= 0) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await creditPackagesApi.update(editingPackage.id, {
          name: formData.name,
          description: formData.description || undefined,
          credits: formData.credits,
          price_usd: formData.price_usd,
          price_mmk: formData.price_mmk || undefined,
          is_popular: formData.is_popular,
          discount_percent: formData.discount_percent,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        toast({ title: 'Package updated successfully' });
      } else {
        await creditPackagesApi.create({
          name: formData.name,
          description: formData.description || undefined,
          credits: formData.credits,
          price_usd: formData.price_usd,
          price_mmk: formData.price_mmk || undefined,
          is_popular: formData.is_popular,
          discount_percent: formData.discount_percent,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        toast({ title: 'Package created successfully' });
      }
      setShowDialog(false);
      fetchPackages();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to save package', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete package
  const handleDelete = async (pkg: CreditPackage) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await creditPackagesApi.delete(pkg.id);
      toast({ title: 'Package deleted' });
      fetchPackages();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to delete package', variant: 'destructive' });
    }
  };

  // Toggle active status
  const handleToggle = async (pkg: CreditPackage) => {
    try {
      await creditPackagesApi.toggle(pkg.id);
      toast({ title: `Package ${pkg.is_active ? 'deactivated' : 'activated'}` });
      fetchPackages();
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to toggle package', variant: 'destructive' });
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
          <h1 className="text-3xl font-bold">📦 Credit Packages</h1>
          <p className="text-muted-foreground mt-1">
            Manage credit packages available for purchase
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Packages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Price (MMK)</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No packages yet</p>
                    <Button variant="outline" className="mt-4" onClick={handleAddNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Package
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg, index) => (
                  <TableRow key={pkg.id} className={!pkg.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {pkg.display_order || index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pkg.name}</span>
                        {pkg.is_popular && (
                          <Badge variant="default" className="bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{pkg.credits}</TableCell>
                    <TableCell>${pkg.price_usd.toFixed(2)}</TableCell>
                    <TableCell>
                      {pkg.price_mmk ? `${pkg.price_mmk.toLocaleString()} MMK` : '-'}
                    </TableCell>
                    <TableCell>
                      {pkg.discount_percent > 0 ? (
                        <Badge variant="secondary">{pkg.discount_percent}% OFF</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={pkg.is_active ? 'default' : 'secondary'}
                        className={pkg.is_active ? 'bg-green-500' : ''}
                      >
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(pkg)}
                          title={pkg.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {pkg.is_active ? (
                            <X className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pkg)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pkg)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add New Package'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter, Pro, Business"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the package"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="credits">Credits *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="discount">Discount %</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="price_usd">Price (USD) *</Label>
                <Input
                  id="price_usd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="price_mmk">Price (MMK)</Label>
                <Input
                  id="price_mmk"
                  type="number"
                  min="0"
                  value={formData.price_mmk}
                  onChange={(e) => setFormData({ ...formData, price_mmk: parseInt(e.target.value) || 0 })}
                />
              </div>

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

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label htmlFor="is_popular">Popular</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPackage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
