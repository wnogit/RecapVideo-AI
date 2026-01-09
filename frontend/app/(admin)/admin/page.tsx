"use client"

import { useEffect, useState } from "react"
import { Users, Video, CreditCard, ShoppingCart, TrendingUp, Activity } from "lucide-react"
import { StatsCard } from "@/components/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { adminDashboardApi, DashboardStats, RecentUser, RecentVideo } from "@/lib/api"
import { toast } from "sonner"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all dashboard data in parallel
        const [statsRes, usersRes, videosRes] = await Promise.all([
          adminDashboardApi.getStats(),
          adminDashboardApi.getRecentUsers(5),
          adminDashboardApi.getRecentVideos(5),
        ])

        setStats(statsRes.data)
        setRecentUsers(usersRes.data)
        setRecentVideos(videosRes.data)
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "processing":
        return "warning"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.total_users.toLocaleString() || "0"}
          description="from last month"
          icon={Users}
          trend={stats?.users_growth !== undefined ? { value: Math.abs(stats.users_growth), isPositive: stats.users_growth >= 0 } : undefined}
        />
        <StatsCard
          title="Total Videos"
          value={stats?.total_videos.toLocaleString() || "0"}
          description="from last month"
          icon={Video}
          trend={stats?.videos_growth !== undefined ? { value: Math.abs(stats.videos_growth), isPositive: stats.videos_growth >= 0 } : undefined}
        />
        <StatsCard
          title="Total Orders"
          value={stats?.total_orders.toLocaleString() || "0"}
          description={`${stats?.pending_orders || 0} pending orders`}
          icon={ShoppingCart}
          trend={stats?.orders_growth !== undefined ? { value: Math.abs(stats.orders_growth), isPositive: stats.orders_growth >= 0 } : undefined}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats?.total_revenue.toLocaleString() || "0"}`}
          description="from last month"
          icon={CreditCard}
          trend={stats?.revenue_growth !== undefined ? { value: Math.abs(stats.revenue_growth), isPositive: stats.revenue_growth >= 0 } : undefined}
        />
      </div>

      {/* Activity Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="New Users Today"
          value={stats?.new_users_today || 0}
          icon={TrendingUp}
        />
        <StatsCard
          title="Videos Today"
          value={stats?.videos_today || 0}
          icon={Activity}
        />
        <StatsCard
          title="Pending Orders"
          value={stats?.pending_orders || 0}
          icon={ShoppingCart}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Newly registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="secondary">New</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Videos</CardTitle>
            <CardDescription>Latest video processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Video className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title || "Untitled Video"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {video.user_email}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(video.status) as any}>
                    {video.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
