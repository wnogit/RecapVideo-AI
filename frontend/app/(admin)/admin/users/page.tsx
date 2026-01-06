"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, UserPlus, Mail, Shield, Ban } from "lucide-react"
import { DataTable, Column } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"

interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_admin: boolean
  credits_balance: number
  created_at: string
  avatar_url?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    // Simulated data - replace with actual API call
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        // Simulated users
        const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
          id: String(i + 1),
          email: `user${i + 1}@example.com`,
          full_name: `User ${i + 1}`,
          is_active: Math.random() > 0.2,
          is_admin: i < 3,
          credits_balance: Math.floor(Math.random() * 1000),
          created_at: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }))

        setUsers(mockUsers.slice((page - 1) * pageSize, page * pageSize))
        setTotal(mockUsers.length)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [page, pageSize])

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name}</p>
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
        </div>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      cell: (user) => (
        <span className="font-medium">{user.credits_balance.toLocaleString()}</span>
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
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              {user.is_admin ? "Remove Admin" : "Make Admin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
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
            Manage your platform users and their permissions.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. They will receive an email to set their
                password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="admin">Admin Access</Label>
                <Switch id="admin" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="credits">Initial Credits</Label>
                <Input id="credits" type="number" placeholder="100" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchPlaceholder="Search users..."
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </div>
  )
}
