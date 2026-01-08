"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { AdminSidebar, AdminHeader } from "@/components/admin"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth()
      setAuthChecked(true)
    }
    verifyAuth()
  }, [checkAuth])

  useEffect(() => {
    // Only redirect after auth check is complete
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/admin")
      } else if (user && !user.is_admin) {
        router.push("/dashboard")
      }
    }
  }, [authChecked, isLoading, isAuthenticated, user, router])

  // Show loading while auth is being verified
  if (!authChecked || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.is_admin) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
