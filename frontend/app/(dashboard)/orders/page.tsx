'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, ExternalLink, Image } from 'lucide-react';
import { orderApi, type OrderData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Order status configuration
const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: Package },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// Payment type display names
const PAYMENT_TYPE_NAMES: Record<string, string> = {
  kbzpay: 'KBZ Pay',
  wavepay: 'Wave Pay',
  cbpay: 'CB Pay',
  ayapay: 'AYA Pay',
  okdollar: 'OK$',
  mpitesan: 'M-Pitesan',
  onepay: 'OnePay',
  uabpay: 'UAB Pay',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await orderApi.list(page, 10);
        setOrders(response.data.orders || []);
        setTotalPages(response.data.total_pages || 1);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast({ title: 'Failed to load orders', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  // Cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await orderApi.cancel(orderId);
      toast({ title: 'Order cancelled' });
      // Refresh orders
      const response = await orderApi.list(page, 10);
      setOrders(response.data.orders || []);
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to cancel order', variant: 'destructive' });
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 My Orders</h1>
        <p className="text-muted-foreground mt-1">
          Track your credit purchases and payment status
        </p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t made any credit purchases yet.
            </p>
            <Button onClick={() => window.location.href = '/buy'}>
              Buy Credits
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {order.credits_amount} Credits
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.price_mmk 
                          ? `${Number(order.price_mmk).toLocaleString()} MMK`
                          : `$${Number(order.price_usd).toFixed(2)}`
                        } via {PAYMENT_TYPE_NAMES[order.payment_method] || order.payment_method}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'h:mm a')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {order.screenshot_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowScreenshot(true);
                          }}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Screenshot
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Admin Note */}
                  {order.admin_note && (
                    <div className="border-t bg-muted/50 px-4 py-3">
                      <p className="text-sm">
                        <span className="font-medium">Admin Note:</span>{' '}
                        <span className="text-muted-foreground">{order.admin_note}</span>
                      </p>
                    </div>
                  )}

                  {/* Completed Info */}
                  {order.status === 'completed' && order.completed_at && (
                    <div className="border-t bg-green-50 px-4 py-2">
                      <p className="text-sm text-green-700">
                        ✓ Credits added on {format(new Date(order.completed_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Screenshot Dialog */}
      <Dialog open={showScreenshot} onOpenChange={setShowScreenshot}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {selectedOrder?.screenshot_url && (
            <div className="flex justify-center">
              <img
                src={selectedOrder.screenshot_url}
                alt="Payment Screenshot"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
