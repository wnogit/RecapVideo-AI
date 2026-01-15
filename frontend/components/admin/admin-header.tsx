"use client"

import { Bell, Search, Menu, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth-store"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminSidebar } from "./admin-sidebar"
import Link from "next/link"
import { useEffect, useState } from "react"

export function AdminHeader() {
  const { user, logout } = useAuthStore()
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setPendingOrdersCount(data.pending_orders || 0)
        }
      } catch (error) {
        console.error('Failed to fetch pending orders:', error)
      }
    }

    fetchPendingOrders()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users, videos, orders..."
            className="pl-8 w-full"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Back to User Dashboard Button */}
        <Button asChild variant="outline" size="sm" className="hidden sm:flex">
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            User Mode
          </Link>
        </Button>

        {/* Notifications - shows pending orders */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/admin/orders?status=pending">
            <Bell className="h-5 w-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
              </span>
            )}
            <span className="sr-only">Pending Orders</span>
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar_url} alt={user?.name} />
                <AvatarFallback>
                  {user?.name ? getInitials(user.name) : "AD"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/settings">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard">Back to App</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
