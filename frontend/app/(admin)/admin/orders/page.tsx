"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Check, X, Eye, CreditCard, RefreshCw } from "lucide-react"
import { DataTable, Column } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { adminOrdersApi, AdminOrder } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const statusFilter = activeTab !== "all" ? activeTab : undefined
      const response = await adminOrdersApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
      })
      setOrders(response.data.orders)
      setTotal(response.data.total)
    } catch (error: any) {
      console.error("Failed to fetch orders:", error)
      toast({ title: "Error", description: error.response?.data?.detail || "Failed to fetch orders", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, pageSize, activeTab])

  const getStatusVariant = (status: AdminOrder["status"]) => {
    switch (status) {
      case "completed":
        return "success"
      case "rejected":
      case "cancelled":
        return "destructive"
      case "processing":
        return "default"
      default:
        return "warning"
    }
  }

  const handleApprove = async (order: AdminOrder) => {
    setIsProcessing(true)
    try {
      await adminOrdersApi.approve(order.id)
      toast({ title: "Success", description: "Order approved successfully" })
      fetchOrders()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to approve order:", error)
      toast({ title: "Error", description: error.response?.data?.detail || "Failed to approve order", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (order: AdminOrder) => {
    setIsProcessing(true)
    try {
      await adminOrdersApi.reject(order.id)
      toast({ title: "Success", description: "Order rejected" })
      fetchOrders()
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to reject order:", error)
      toast({ title: "Error", description: error.response?.data?.detail || "Failed to reject order", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const columns: Column<AdminOrder>[] = [
    {
      key: "id",
      header: "Order ID",
      cell: (order) => <span className="font-mono text-xs">#{order.id.slice(0, 8)}</span>,
    },
    {
      key: "user",
      header: "User",
      cell: (order) => (
        <div>
          <p className="font-medium">{order.user_name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">{order.user_email}</p>
        </div>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      cell: (order) => (
        <span className="font-medium">{order.credits_amount.toLocaleString()}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (order) => (
        <div>
          <p className="font-medium">${Number(order.price_usd).toFixed(2)}</p>
          {order.price_mmk && (
            <p className="text-xs text-muted-foreground">
              {Number(order.price_mmk).toLocaleString()} MMK
            </p>
          )}
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (order) => (
        <Badge variant="outline">{order.payment_method}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (order) => (
        <Badge variant={getStatusVariant(order.status) as any}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (order) => (
        <span className="text-muted-foreground">
          {format(new Date(order.created_at), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedOrder(order)
                setIsDialogOpen(true)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {(order.status === "pending" || order.status === "processing") && (
              <>
                <DropdownMenuItem
                  onClick={() => handleApprove(order)}
                  className="text-green-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleReject(order)}
                  className="text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage credit purchase orders and payments.
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            searchPlaceholder="Search orders..."
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Payment Screenshot */}
              <div className="order-2 md:order-1">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Payment Screenshot
                </p>
                {selectedOrder.screenshot_url ? (
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${selectedOrder.screenshot_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${selectedOrder.screenshot_url}`}
                      alt="Payment Screenshot"
                      className="rounded-lg border max-h-[400px] object-contain w-full hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <div className="rounded-lg border bg-muted h-[300px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">No screenshot uploaded</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Order Details */}
              <div className="order-1 md:order-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="font-medium">{selectedOrder.user_name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.user_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credits</p>
                    <p className="font-medium">{selectedOrder.credits_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount (USD)</p>
                    <p className="font-medium">${Number(selectedOrder.price_usd).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount (MMK)</p>
                    <p className="font-medium">
                      {selectedOrder.price_mmk 
                        ? `${Number(selectedOrder.price_mmk).toLocaleString()} MMK`
                        : "N/A"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedOrder.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={getStatusVariant(selectedOrder.status) as any}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(selectedOrder.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  {selectedOrder.completed_at && (
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">
                        {format(new Date(selectedOrder.completed_at), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedOrder && (selectedOrder.status === "pending" || selectedOrder.status === "processing") && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReject(selectedOrder)}
                  disabled={isProcessing}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedOrder)}
                  disabled={isProcessing}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {selectedOrder && selectedOrder.status !== "pending" && selectedOrder.status !== "processing" && (
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
