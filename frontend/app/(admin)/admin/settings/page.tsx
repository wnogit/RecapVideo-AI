"use client"

import { useState } from "react"
import { Save, Key, Globe, CreditCard, Bell, Database } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your platform settings and integrations.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:inline-flex">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic configuration for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input id="siteName" defaultValue="RecapVideo AI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input id="siteUrl" defaultValue="https://recapvideo.ai" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Site Description</Label>
                <Textarea
                  id="description"
                  defaultValue="Transform YouTube videos into engaging recap content with AI"
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to sign up
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Put the site in maintenance mode
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Configure third-party API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="geminiKey">Google Gemini API Key</Label>
                  <Input
                    id="geminiKey"
                    type="password"
                    placeholder="Enter your Gemini API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for script generation and AI processing
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r2AccessKey">Cloudflare R2 Access Key</Label>
                  <Input
                    id="r2AccessKey"
                    type="password"
                    placeholder="Enter your R2 access key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r2SecretKey">Cloudflare R2 Secret Key</Label>
                  <Input
                    id="r2SecretKey"
                    type="password"
                    placeholder="Enter your R2 secret key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r2Bucket">R2 Bucket Name</Label>
                  <Input
                    id="r2Bucket"
                    placeholder="your-bucket-name"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="resendKey">Resend API Key</Label>
                  <Input
                    id="resendKey"
                    type="password"
                    placeholder="Enter your Resend API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for sending emails (verification, notifications)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegramToken">Telegram Bot Token</Label>
                  <Input
                    id="telegramToken"
                    type="password"
                    placeholder="Enter your Telegram bot token"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment methods and credit packages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Payment Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bank Transfer</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept bank transfer payments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>KBZPay</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept KBZPay mobile payments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Wave Pay</Label>
                      <p className="text-sm text-muted-foreground">
                        Accept Wave Pay mobile payments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Credit Pricing</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Basic Package</Label>
                    <div className="flex gap-2">
                      <Input type="number" defaultValue="100" placeholder="Credits" />
                      <Input type="number" defaultValue="9.99" placeholder="Price" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Package</Label>
                    <div className="flex gap-2">
                      <Input type="number" defaultValue="500" placeholder="Credits" />
                      <Input type="number" defaultValue="39.99" placeholder="Price" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Premium Package</Label>
                    <div className="flex gap-2">
                      <Input type="number" defaultValue="1000" placeholder="Credits" />
                      <Input type="number" defaultValue="79.99" placeholder="Price" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email and push notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify admin when new users register
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Order</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify admin when new orders are placed
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Video Completed</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify users when video processing is complete
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Video Failed</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify users when video processing fails
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Telegram Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Telegram Bot</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via Telegram
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Chat ID</Label>
                    <Input placeholder="Enter Telegram chat ID for admin notifications" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Settings
              </CardTitle>
              <CardDescription>
                Configure file storage and cleanup settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Provider</Label>
                  <Select defaultValue="r2">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="r2">Cloudflare R2</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="local">Local Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Video Retention (days)</Label>
                  <Input type="number" defaultValue="30" />
                  <p className="text-xs text-muted-foreground">
                    Number of days to keep processed videos before cleanup
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Cache Retention (days)</Label>
                  <Input type="number" defaultValue="7" />
                  <p className="text-xs text-muted-foreground">
                    Number of days to keep cached transcripts and translations
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Auto Cleanup</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Auto Cleanup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically delete old files based on retention settings
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
