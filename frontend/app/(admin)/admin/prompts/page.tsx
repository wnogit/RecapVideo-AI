"use client"

import { useEffect, useState } from "react"
import { Plus, Save, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Prompt {
  id: string
  name: string
  key: string
  content: string
  description: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const categories = [
  { value: "transcript", label: "Transcript" },
  { value: "translation", label: "Translation" },
  { value: "script", label: "Script Generation" },
  { value: "summary", label: "Summary" },
  { value: "other", label: "Other" },
]

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    content: "",
    description: "",
    category: "script",
    is_active: true,
  })

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true)
      try {
        // Simulated prompts
        const mockPrompts: Prompt[] = [
          {
            id: "1",
            name: "Script Generation",
            key: "script_generation",
            content: `You are a professional video script writer. Given a transcript, create an engaging script for a recap video.

Instructions:
- Keep the main points
- Make it conversational
- Add transitions
- Target length: 2-3 minutes

Transcript:
{transcript}

Language: {target_language}`,
            description: "Main prompt for generating video scripts from transcripts",
            category: "script",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Translation Prompt",
            key: "translation",
            content: `Translate the following text to {target_language}. Keep the tone and style consistent.

Text:
{text}`,
            description: "Prompt for translating content to target language",
            category: "translation",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Summary Generation",
            key: "summary",
            content: `Create a brief summary of this video content:

{content}

Summary should be 2-3 sentences.`,
            description: "Prompt for generating video summaries",
            category: "summary",
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]

        setPrompts(mockPrompts)
      } catch (error) {
        console.error("Failed to fetch prompts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrompts()
  }, [])

  const filteredPrompts =
    activeCategory === "all"
      ? prompts
      : prompts.filter((p) => p.category === activeCategory)

  const handleSave = () => {
    console.log("Saving prompt:", formData)
    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      key: prompt.key,
      content: prompt.content,
      description: prompt.description,
      category: prompt.category,
      is_active: prompt.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (promptId: string) => {
    console.log("Deleting prompt:", promptId)
  }

  const resetForm = () => {
    setEditingPrompt(null)
    setFormData({
      name: "",
      key: "",
      content: "",
      description: "",
      category: "script",
      is_active: true,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompts</h1>
          <p className="text-muted-foreground">
            Manage AI prompts for video generation.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? "Edit Prompt" : "Add New Prompt"}
              </DialogTitle>
              <DialogDescription>
                Configure the AI prompt template for video generation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Script Generation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    placeholder="script_generation"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <span className="text-sm">
                      {formData.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this prompt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Prompt Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter your prompt template here. Use {variable} for placeholders."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{transcript}"}, {"{target_language}"},{" "}
                  {"{text}"}, {"{content}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Prompt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid gap-4">
            {filteredPrompts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No prompts found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Prompt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPrompts.map((prompt) => (
                <Card key={prompt.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {prompt.name}
                          <Badge
                            variant={prompt.is_active ? "success" : "secondary"}
                          >
                            {prompt.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{prompt.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prompt)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this prompt? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(prompt.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Key:</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {prompt.key}
                        </code>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline">{prompt.category}</Badge>
                      </div>
                      <pre className="max-h-32 overflow-auto rounded-lg bg-muted p-3 text-xs font-mono">
                        {prompt.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
