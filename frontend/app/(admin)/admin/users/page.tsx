"use client"

import { useEffect, useState, useCallback } from "react"
import { MoreHorizontal, Shield, Ban, Coins, RefreshCw, Search, Monitor, Smartphone, Tablet, Globe, MapPin, Eye, Calendar, Video, CreditCard, Clock, Mail, Phone } from "lucide-react"
import { DataTable, Column } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface LastDevice {
  device_type?: string
  browser?: string
  os?: string
  ip_address?: string
  city?: string
  country?: string
  last_seen?: string
}

interface User {
  id: string
  email: string
  name: string
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  credit_balance: number
  purchased_credits: number
  tier: 'FREE' | 'PRO'
  is_pro: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
  avatar_url?: string
  phone?: string
  video_count: number
  last_device?: LastDevice
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [filterType, setFilterType] = useState<'all' | 'pro' | 'free' | 'admin'>('all')

  // Dialog states
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false)
  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditsAmount, setCreditsAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      if (search) {
        params.append("search", search)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleToggleActive = async (user: User) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${user.id}/toggle-active`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update user")
      }

      const result = await response.json()
      toast({ title: result.message })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleToggleAdmin = async (user: User) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${user.id}/toggle-admin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to update user")
      }

      const result = await response.json()
      toast({ title: result.message })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: error.message || "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleAddCredits = async () => {
    if (!selectedUser || !creditsAmount) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${selectedUser.id}/add-credits`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseInt(creditsAmount),
            reason: "Admin added credits",
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to add credits")
      }

      const result = await response.json()
      toast({ title: result.message })
      setIsCreditsDialogOpen(false)
      setSelectedUser(null)
      setCreditsAmount("")
      fetchUsers()
    } catch (error: any) {
      toast({
        title: error.message || "Failed to add credits",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const openCreditsDialog = (user: User) => {
    setSelectedUser(user)
    setCreditsAmount("")
    setIsCreditsDialogOpen(true)
  }

  const openUserInfoDialog = (user: User) => {
    setSelectedUser(user)
    setIsUserInfoDialogOpen(true)
  }

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />
      case 'tablet':
        return <Tablet className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <Badge variant={user.is_active ? "success" : "destructive"}>
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
          {user.is_admin && <Badge variant="secondary">Admin</Badge>}
          {user.is_verified && (
            <Badge variant="outline" className="text-green-600">
              Verified
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      cell: (user) => (
        <span className={user.is_pro ? "text-purple-600 font-medium" : "text-muted-foreground"}>
          {user.is_pro ? "Pro" : "Free"}
        </span>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      cell: (user) => (
        <span className="font-medium">{user.credit_balance.toLocaleString()}</span>
      ),
    },
    {
      key: "videos",
      header: "Videos",
      cell: (user) => (
        <span className="text-muted-foreground">{user.video_count}</span>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      cell: (user) => (
        <span className="text-muted-foreground">
          {format(new Date(user.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "last_login",
      header: "Last Login",
      cell: (user) => (
        <span className="text-muted-foreground">
          {user.last_login_at
            ? format(new Date(user.last_login_at), "MMM d, yyyy HH:mm")
            : "Never"
          }
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (user) => (
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
            <DropdownMenuItem onClick={() => openCreditsDialog(user)}>
              <Coins className="mr-2 h-4 w-4" />
              Add Credits
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
              <Shield className="mr-2 h-4 w-4" />
              {user.is_admin ? "Remove Admin" : "Make Admin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openUserInfoDialog(user)}>
              <Eye className="mr-2 h-4 w-4" />
              Full Info
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={user.is_active ? "text-destructive" : "text-green-600"}
              onClick={() => handleToggleActive(user)}
            >
              <Ban className="mr-2 h-4 w-4" />
              {user.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
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
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage your platform users and their permissions. Total: {total} users
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs - Videos page style */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="inline-flex items-center rounded-lg bg-muted p-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilterType('pro')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === 'pro'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Pro
          </button>
          <button
            onClick={() => setFilterType('free')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === 'free'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Free
          </button>
          <button
            onClick={() => setFilterType('admin')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filterType === 'admin'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("")
              setSearchInput("")
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users.filter(user => {
          if (filterType === 'all') return true;
          if (filterType === 'pro') return user.is_pro;
          if (filterType === 'free') return !user.is_pro;
          if (filterType === 'admin') return user.is_admin;
          return true;
        })}
        isLoading={isLoading}
        hideSearch={true}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      {/* Add Credits Dialog */}
      <Dialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add credits to {selectedUser?.name}&apos;s account ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold">
                {selectedUser?.credit_balance.toLocaleString()} credits
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Credits to Add</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCredits} disabled={isProcessing || !creditsAmount}>
              {isProcessing ? "Adding..." : "Add Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Full Info Dialog */}
      <Dialog open={isUserInfoDialogOpen} onOpenChange={setIsUserInfoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Full information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Profile Section */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="text-xl">
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedUser.is_active ? "success" : "destructive"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {selectedUser.is_admin && <Badge variant="secondary">Admin</Badge>}
                    {selectedUser.is_verified && (
                      <Badge variant="outline" className="text-green-600">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="font-medium">{selectedUser.phone || "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Credit Balance
                  </div>
                  <p className="font-medium text-lg">{selectedUser.credit_balance.toLocaleString()} credits</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4" />
                    Videos Created
                  </div>
                  <p className="font-medium text-lg">{selectedUser.video_count}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </div>
                  <p className="font-medium">{format(new Date(selectedUser.created_at), "PPP")}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last Login
                  </div>
                  <p className="font-medium">
                    {selectedUser.last_login_at
                      ? format(new Date(selectedUser.last_login_at), "PPP 'at' p")
                      : "Never"
                    }
                  </p>
                </div>
              </div>

              <Separator />

              {/* Last Device / IP Section */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Last Login Device & IP
                </h4>

                {selectedUser.last_device ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-background">
                        {getDeviceIcon(selectedUser.last_device.device_type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Device Type:</span>
                            <p className="font-medium capitalize">
                              {selectedUser.last_device.device_type || "Desktop"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Browser:</span>
                            <p className="font-medium">
                              {selectedUser.last_device.browser || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Operating System:</span>
                            <p className="font-medium">
                              {selectedUser.last_device.os || "Unknown"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Seen:</span>
                            <p className="font-medium">
                              {selectedUser.last_device.last_seen
                                ? format(new Date(selectedUser.last_device.last_seen), "PPP 'at' p")
                                : "Unknown"
                              }
                            </p>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <Globe className="h-3 w-3" />
                              IP Address
                            </div>
                            <p className="font-mono font-medium text-primary">
                              {selectedUser.last_device.ip_address || "N/A"}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3" />
                              Location
                            </div>
                            <p className="font-medium">
                              {selectedUser.last_device.city
                                ? `${selectedUser.last_device.city}${selectedUser.last_device.country ? `, ${selectedUser.last_device.country}` : ""}`
                                : "Unknown"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-6 text-center text-muted-foreground">
                    <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No device information available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserInfoDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
