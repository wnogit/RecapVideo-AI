"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Check, X, Eye, CreditCard } from "lucide-react"
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

interface Order {
  id: string
  user_email: string
  package_name: string
  credits: number
  amount: number
  status: "pending" | "approved" | "rejected"
  payment_method: string
  payment_screenshot?: string
  created_at: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        // Simulated orders
        const statuses: Order["status"][] = ["pending", "approved", "rejected"]
        const mockOrders: Order[] = Array.from({ length: 50 }, (_, i) => ({
          id: String(i + 1),
          user_email: `user${i + 1}@example.com`,
          package_name: ["Basic", "Standard", "Premium"][i % 3],
          credits: [100, 500, 1000][i % 3],
          amount: [9.99, 39.99, 79.99][i % 3],
          status: statuses[i % 3],
          payment_method: ["Bank Transfer", "KBZPay", "Wave Pay"][i % 3],
          created_at: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }))

        let filtered = mockOrders
        if (activeTab !== "all") {
          filtered = mockOrders.filter((o) => o.status === activeTab)
        }

        setOrders(filtered.slice((page - 1) * pageSize, page * pageSize))
        setTotal(filtered.length)
      } catch (error) {
        console.error("Failed to fetch orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [page, pageSize, activeTab])

  const getStatusVariant = (status: Order["status"]) => {
    switch (status) {
      case "approved":
        return "success"
      case "rejected":
        return "destructive"
      default:
        return "warning"
    }
  }

  const handleApprove = (order: Order) => {
    console.log("Approving order:", order.id)
    // API call to approve order
  }

  const handleReject = (order: Order) => {
    console.log("Rejecting order:", order.id)
    // API call to reject order
  }

  const columns: Column<Order>[] = [
    {
      key: "id",
      header: "Order ID",
      cell: (order) => <span className="font-mono">#{order.id}</span>,
    },
    {
      key: "user",
      header: "User",
      cell: (order) => (
        <span className="text-muted-foreground">{order.user_email}</span>
      ),
    },
    {
      key: "package",
      header: "Package",
      cell: (order) => (
        <div>
          <p className="font-medium">{order.package_name}</p>
          <p className="text-xs text-muted-foreground">
            {order.credits.toLocaleString()} credits
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (order) => (
        <span className="font-medium">${order.amount.toFixed(2)}</span>
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
          {format(new Date(order.created_at), "MMM d, yyyy")}
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
            {order.status === "pending" && (
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage credit purchase orders and payments.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedOrder.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Package</p>
                  <p className="font-medium">{selectedOrder.package_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits</p>
                  <p className="font-medium">
                    {selectedOrder.credits.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">${selectedOrder.amount.toFixed(2)}</p>
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
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Payment Screenshot
                </p>
                <div className="rounded-lg border bg-muted aspect-video flex items-center justify-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedOrder?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReject(selectedOrder)
                    setIsDialogOpen(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(selectedOrder)
                    setIsDialogOpen(false)
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {selectedOrder?.status !== "pending" && (
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
