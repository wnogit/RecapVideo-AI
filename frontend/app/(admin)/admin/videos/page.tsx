"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Play, Trash2, Download, Eye } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"

interface Video {
  id: string
  title: string
  youtube_url: string
  user_email: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  target_language: string
  voice_name: string
  credits_used: number
  duration?: number
  created_at: string
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true)
      try {
        const statuses: Video["status"][] = [
          "pending",
          "processing",
          "completed",
          "failed",
        ]
        const mockVideos: Video[] = Array.from({ length: 100 }, (_, i) => ({
          id: String(i + 1),
          title: [
            "How to Learn Python in 2024",
            "React Tutorial for Beginners",
            "Docker Crash Course",
            "Next.js 14 Full Guide",
            "TypeScript Best Practices",
          ][i % 5],
          youtube_url: `https://youtube.com/watch?v=video${i + 1}`,
          user_email: `user${(i % 20) + 1}@example.com`,
          status: statuses[i % 4],
          progress: statuses[i % 4] === "completed" ? 100 : Math.floor(Math.random() * 100),
          target_language: ["Burmese", "Thai", "Vietnamese", "Indonesian"][i % 4],
          voice_name: ["en-US-AriaNeural", "en-US-GuyNeural"][i % 2],
          credits_used: Math.floor(Math.random() * 50) + 10,
          duration: Math.floor(Math.random() * 600) + 60,
          created_at: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }))

        let filtered = mockVideos
        if (activeTab !== "all") {
          filtered = mockVideos.filter((v) => v.status === activeTab)
        }

        setVideos(filtered.slice((page - 1) * pageSize, page * pageSize))
        setTotal(filtered.length)
      } catch (error) {
        console.error("Failed to fetch videos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()
  }, [page, pageSize, activeTab])

  const getStatusVariant = (status: Video["status"]) => {
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const columns: Column<Video>[] = [
    {
      key: "title",
      header: "Video",
      cell: (video) => (
        <div className="max-w-xs">
          <p className="font-medium truncate">{video.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {video.youtube_url}
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
      cell: (video) => <Badge variant="outline">{video.target_language}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (video) => (
        <div className="space-y-1">
          <Badge variant={getStatusVariant(video.status) as any}>
            {video.status}
          </Badge>
          {video.status === "processing" && (
            <Progress value={video.progress} className="h-1 w-16" />
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
          {formatDuration(video.duration)}
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
            {video.status === "completed" && (
              <>
                <DropdownMenuItem>
                  <Play className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
        <p className="text-muted-foreground">
          Monitor and manage all video processing jobs.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <DialogDescription>{selectedVideo?.title}</DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedVideo.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusVariant(selectedVideo.status) as any}>
                    {selectedVideo.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Target Language</p>
                  <p className="font-medium">{selectedVideo.target_language}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Voice</p>
                  <p className="font-medium">{selectedVideo.voice_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits Used</p>
                  <p className="font-medium">{selectedVideo.credits_used}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {formatDuration(selectedVideo.duration)}
                  </p>
                </div>
              </div>
              {selectedVideo.status === "processing" && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{selectedVideo.progress}%</span>
                  </div>
                  <Progress value={selectedVideo.progress} />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">YouTube URL</p>
                <a
                  href={selectedVideo.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {selectedVideo.youtube_url}
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
