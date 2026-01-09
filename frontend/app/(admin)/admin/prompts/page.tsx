"use client"

import { useEffect, useState } from "react"
import { Plus, Save, Trash2, RefreshCcw } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"
import { adminPromptsApi, Prompt, PromptCategory } from "@/lib/api"

const defaultCategories = [
  { value: "script", label: "Script Generation" },
  { value: "translation", label: "Translation" },
  { value: "summary", label: "Summary" },
  { value: "tts", label: "TTS" },
  { value: "other", label: "Other" },
]

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<PromptCategory[]>(defaultCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    content: "",
    description: "",
    category: "script",
    is_active: true,
  })

  const fetchPrompts = async () => {
    setIsLoading(true)
    try {
      const [promptsRes, categoriesRes] = await Promise.all([
        adminPromptsApi.list({ page_size: 100 }),
        adminPromptsApi.getCategories(),
      ])

      setPrompts(promptsRes.data.prompts)
      if (categoriesRes.data.length > 0) {
        setCategories(categoriesRes.data)
      }
    } catch (error: any) {
      console.error("Failed to fetch prompts:", error)
      toast({ title: "Error", description: "Failed to load prompts", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  const filteredPrompts =
    activeCategory === "all"
      ? prompts
      : prompts.filter((p) => p.category === activeCategory)

  const handleSave = async () => {
    if (!formData.name || !formData.key || !formData.content) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      if (editingPrompt) {
        // Update existing prompt
        await adminPromptsApi.update(editingPrompt.id, {
          name: formData.name,
          description: formData.description,
          content: formData.content,
          category: formData.category,
          is_active: formData.is_active,
        })
        toast({ title: "Success", description: "Prompt updated successfully" })
      } else {
        // Create new prompt
        await adminPromptsApi.create({
          name: formData.name,
          key: formData.key,
          description: formData.description,
          content: formData.content,
          category: formData.category,
          is_active: formData.is_active,
        })
        toast({ title: "Success", description: "Prompt created successfully" })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchPrompts()
    } catch (error: any) {
      console.error("Failed to save prompt:", error)
      const message = error.response?.data?.detail || "Failed to save prompt"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      name: prompt.name,
      key: prompt.key,
      content: prompt.content,
      description: prompt.description || "",
      category: prompt.category,
      is_active: prompt.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (promptId: string) => {
    setDeletingId(promptId)
    try {
      await adminPromptsApi.delete(promptId)
      toast({ title: "Success", description: "Prompt deleted successfully" })
      fetchPrompts()
    } catch (error: any) {
      console.error("Failed to delete prompt:", error)
      toast({ title: "Error", description: "Failed to delete prompt", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggle = async (prompt: Prompt) => {
    try {
      await adminPromptsApi.toggle(prompt.id)
      toast({ title: "Success", description: `Prompt ${prompt.is_active ? "deactivated" : "activated"}` })
      fetchPrompts()
    } catch (error: any) {
      console.error("Failed to toggle prompt:", error)
      toast({ title: "Error", description: "Failed to toggle prompt status", variant: "destructive" })
    }
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPrompts} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
                    <Label htmlFor="name">Name *</Label>
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
                    <Label htmlFor="key">Key * {editingPrompt && "(read-only)"}</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) =>
                        setFormData({ ...formData, key: e.target.value })
                      }
                      placeholder="script_generation"
                      disabled={!!editingPrompt}
                      className={editingPrompt ? "opacity-50" : ""}
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
                  <Label htmlFor="content">Prompt Content *</Label>
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Prompt
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                            className="cursor-pointer"
                            onClick={() => handleToggle(prompt)}
                          >
                            {prompt.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {prompt.version > 1 && (
                            <Badge variant="outline">v{prompt.version}</Badge>
                          )}
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
                            <Button variant="outline" size="sm" disabled={deletingId === prompt.id}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{prompt.name}&quot;? This
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
                      <pre className="max-h-32 overflow-auto rounded-lg bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
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
