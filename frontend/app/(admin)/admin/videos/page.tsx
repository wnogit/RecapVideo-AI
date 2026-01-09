"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Play, Trash2, Download, Eye, RefreshCcw } from "lucide-react"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { toast } from "sonner"
import { adminVideosApi, AdminVideo } from "@/lib/api"

// Language code to name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  my: "Burmese",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedVideo, setSelectedVideo] = useState<AdminVideo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteVideo, setDeleteVideo] = useState<AdminVideo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchVideos = async () => {
    setIsLoading(true)
    try {
      const statusFilter = activeTab !== "all" ? activeTab : undefined
      const response = await adminVideosApi.list({
        page,
        page_size: pageSize,
        status: statusFilter,
        sort_by: "created_at",
        sort_order: "desc",
      })

      setVideos(response.data.videos)
      setTotal(response.data.total)
    } catch (error: any) {
      console.error("Failed to fetch videos:", error)
      toast.error("Failed to load videos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [page, pageSize, activeTab])

  const handleDelete = async () => {
    if (!deleteVideo) return

    setIsDeleting(true)
    try {
      await adminVideosApi.delete(deleteVideo.id)
      toast.success("Video deleted successfully")
      setDeleteVideo(null)
      fetchVideos()
    } catch (error: any) {
      console.error("Failed to delete video:", error)
      toast.error("Failed to delete video")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success"
      case "processing":
      case "extracting_transcript":
      case "generating_script":
      case "generating_audio":
      case "rendering_video":
      case "uploading":
        return "warning"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case "extracting_transcript":
        return "Transcribing"
      case "generating_script":
        return "Scripting"
      case "generating_audio":
        return "Audio"
      case "rendering_video":
        return "Rendering"
      case "uploading":
        return "Uploading"
      default:
        return status
    }
  }

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getLanguageName = (code: string) => {
    return LANGUAGE_NAMES[code] || code
  }

  const columns: Column<AdminVideo>[] = [
    {
      key: "title",
      header: "Video",
      cell: (video) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{video.title || "Untitled Video"}</p>
          <p className="text-xs text-muted-foreground truncate">
            {video.source_url}
          </p>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (video) => (
        <span className="text-muted-foreground">{video.user_email}</span>
      ),
    },
    {
      key: "language",
      header: "Language",
      cell: (video) => (
        <Badge variant="outline">{getLanguageName(video.output_language)}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (video) => (
        <div className="space-y-1">
          <Badge variant={getStatusVariant(video.status) as any}>
            {getDisplayStatus(video.status)}
          </Badge>
          {video.status !== "completed" && video.status !== "failed" && video.status !== "pending" && (
            <Progress value={video.progress_percent} className="h-1 w-16" />
          )}
        </div>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      cell: (video) => <span>{video.credits_used}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      cell: (video) => (
        <span className="text-muted-foreground">
          {formatDuration(video.duration_seconds)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (video) => (
        <span className="text-muted-foreground">
          {format(new Date(video.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (video) => (
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
                setSelectedVideo(video)
                setIsDialogOpen(true)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {video.status === "completed" && video.video_url && (
              <>
                <DropdownMenuItem onClick={() => window.open(video.video_url!, "_blank")}>
                  <Play className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(video.video_url!, "_blank")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteVideo(video)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
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
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground">
            Monitor and manage all video processing jobs.
          </p>
        </div>
        <Button variant="outline" onClick={fetchVideos} disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All Videos</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={videos}
            isLoading={isLoading}
            searchPlaceholder="Search videos..."
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

      {/* Video Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Video Details</DialogTitle>
            <DialogDescription>{selectedVideo?.title || "Untitled Video"}</DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                {selectedVideo.video_url ? (
                  <video
                    src={selectedVideo.video_url}
                    controls
                    className="w-full h-full rounded-lg"
                  />
                ) : (
                  <Play className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedVideo.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(selectedVideo.status) as any}>
                    {getDisplayStatus(selectedVideo.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Target Language</p>
                  <p className="font-medium">{getLanguageName(selectedVideo.output_language)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Voice</p>
                  <p className="font-medium">{selectedVideo.voice_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits Used</p>
                  <p className="font-medium">{selectedVideo.credits_used}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {formatDuration(selectedVideo.duration_seconds)}
                  </p>
                </div>
              </div>
              {selectedVideo.status !== "completed" && selectedVideo.status !== "failed" && selectedVideo.status !== "pending" && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{selectedVideo.progress_percent}%</span>
                  </div>
                  <Progress value={selectedVideo.progress_percent} />
                </div>
              )}
              {selectedVideo.error_message && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{selectedVideo.error_message}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Source URL</p>
                <a
                  href={selectedVideo.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {selectedVideo.source_url}
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVideo} onOpenChange={(open) => !open && setDeleteVideo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
