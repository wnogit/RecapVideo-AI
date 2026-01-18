'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, Plus, Trash2, Globe, AlertTriangle, Users, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhitelistIP {
    ip: string;
    label: string;
    added_by: string;
    added_at: string;
}

// Helper to get access token from localStorage or cookie
function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

export default function IPSecurityPage() {
    const [whitelist, setWhitelist] = useState<WhitelistIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newIP, setNewIP] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [currentIP, setCurrentIP] = useState('');

    // Fetch whitelist on mount
    useEffect(() => {
        fetchWhitelist();
        fetchCurrentIP();
    }, []);

    const fetchCurrentIP = async () => {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            setCurrentIP(data.ip);
        } catch (e) {
            console.error('Failed to get current IP');
        }
    };

    const fetchWhitelist = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login-whitelist`, {
                headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setWhitelist(data.allowed_ips || []);
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to fetch whitelist', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const addIP = async (ip: string, label: string) => {
        setAdding(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login-whitelist`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${getAccessToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ip, label }),
            });
            if (res.ok) {
                toast({ title: 'Success', description: 'IP added to whitelist' });
                setNewIP('');
                setNewLabel('');
                fetchWhitelist();
            } else {
                const data = await res.json();
                toast({ title: 'Error', description: data.detail || 'Failed to add IP', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to add IP', variant: 'destructive' });
        } finally {
            setAdding(false);
        }
    };

    const removeIP = async (ip: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login-whitelist/${encodeURIComponent(ip)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            if (res.ok) {
                toast({ title: 'Success', description: 'IP removed from whitelist' });
                fetchWhitelist();
            } else {
                toast({ title: 'Error', description: 'Failed to remove IP', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to remove IP', variant: 'destructive' });
        }
    };

    const addMyIP = () => {
        if (currentIP) {
            addIP(currentIP, 'Developer');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Shield className="h-8 w-8" />
                    IP Security
                </h1>
                <p className="text-muted-foreground">
                    Manage IP whitelists and security settings
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="whitelist" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="whitelist" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Login Whitelist
                    </TabsTrigger>
                    <TabsTrigger value="suspicious" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Suspicious IPs
                    </TabsTrigger>
                    <TabsTrigger value="pro" className="gap-2">
                        <Users className="h-4 w-4" />
                        Pro Users
                    </TabsTrigger>
                </TabsList>

                {/* Login Whitelist Tab */}
                <TabsContent value="whitelist" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login IP Whitelist (Developer Access)</CardTitle>
                            <CardDescription>
                                IPs in this list bypass VPN/Datacenter detection for login. Use this for development from VPS or datacenter IPs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add IP Form */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="IP Address (e.g., 192.168.1.1)"
                                    value={newIP}
                                    onChange={(e) => setNewIP(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Label (optional)"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="w-40"
                                />
                                <Button onClick={() => addIP(newIP, newLabel)} disabled={!newIP || adding}>
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                                <Button variant="outline" onClick={addMyIP} disabled={!currentIP || adding}>
                                    Add My IP
                                </Button>
                            </div>

                            {/* Whitelist Table */}
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : whitelist.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No IPs in whitelist
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Added By</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {whitelist.map((item) => (
                                            <TableRow key={item.ip}>
                                                <TableCell className="font-mono">
                                                    {item.ip}
                                                    {item.ip === currentIP && (
                                                        <Badge variant="secondary" className="ml-2">You</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.label || '-'}</TableCell>
                                                <TableCell>{item.added_by || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => removeIP(item.ip)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Suspicious IPs Tab */}
                <TabsContent value="suspicious">
                    <Card>
                        <CardHeader>
                            <CardTitle>Suspicious IPs</CardTitle>
                            <CardDescription>
                                IPs flagged for multi-account abuse or suspicious activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No suspicious IPs detected</p>
                                <p className="text-sm">IPs will appear here when multi-account abuse is detected</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pro Users Tab */}
                <TabsContent value="pro">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pro User VPN Bypass</CardTitle>
                            <CardDescription>
                                Pro users automatically bypass VPN detection when logging in
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-gradient-to-r from-violet-500 to-pink-500">PRO</Badge>
                                    <span className="font-medium">VPN Bypass Enabled</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Users who have purchased credits (Pro tier) can login with VPN without being blocked.
                                    This is controlled per-user, not per-IP, to prevent abuse.
                                </p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                                    <li>New signups still require VPN to be off</li>
                                    <li>Only existing Pro users get bypass</li>
                                    <li>No IP-based whitelisting needed for Pro users</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
