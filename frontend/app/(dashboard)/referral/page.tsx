'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Copy, Users, Coins, Share2, Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReferralStats {
    referral_code: string;
    referral_count: number;
    credits_earned: number;
    referral_link: string;
}

interface DailyFreeStatus {
    can_use: boolean;
    next_reset: string;
    message: string;
}

// Helper to get access token from localStorage
function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

export default function ReferralPage() {
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [dailyFree, setDailyFree] = useState<DailyFreeStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchReferralStats();
        fetchDailyFreeStatus();
    }, []);

    const fetchReferralStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/referral/stats`, {
                headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error('Failed to fetch referral stats');
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyFreeStatus = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/referral/daily-free/status`, {
                headers: { Authorization: `Bearer ${getAccessToken()}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDailyFree(data);
            }
        } catch (e) {
            console.error('Failed to fetch daily free status');
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast({ title: 'Copied!', description: 'Referral link copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
        }
    };

    const shareReferral = async () => {
        if (!stats) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'RecapVideo.AI Referral',
                    text: `Join RecapVideo.AI and get free credits! Use my referral code: ${stats.referral_code}`,
                    url: stats.referral_link,
                });
            } catch (e) {
                // User cancelled or share failed
            }
        } else {
            copyToClipboard(stats.referral_link);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Gift className="h-8 w-8 text-pink-500" />
                    Referral Program
                </h1>
                <p className="text-muted-foreground">
                    သူငယ်ချင်းတွေကို ဖိတ်ပြီး credits ရယူပါ
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ဖိတ်ထားသူများ</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.referral_count || 0}</div>
                        <p className="text-xs text-muted-foreground">သင်ဖိတ်ခဲ့သော user များ</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ရရှိထားသော Credits</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.credits_earned || 0}</div>
                        <p className="text-xs text-muted-foreground">Referral မှ ရရှိသော credits</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">နေ့စဥ် Free Video</CardTitle>
                        <Gift className="h-4 w-4 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dailyFree?.can_use ? (
                                <Badge className="bg-green-500">ရနိုင်</Badge>
                            ) : (
                                <Badge variant="secondary">သုံးပြီးပြီ</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dailyFree?.can_use ? 'ဒီနေ့ 1 video free ထုတ်လို့ရ' : dailyFree?.message}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Referral Code */}
            <Card>
                <CardHeader>
                    <CardTitle>သင့် Referral Code</CardTitle>
                    <CardDescription>
                        ဒီ code ကို သူငယ်ချင်းတွေကို မျှဝေပါ။ သူတို့ signup လုပ်ပြီး video လုပ်တဲ့အခါ သင့်ကို 2 credits ရမယ်။
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Referral Code Display */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-2xl text-center font-bold tracking-widest">
                            {stats?.referral_code || 'Loading...'}
                        </div>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => stats && copyToClipboard(stats.referral_code)}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Referral Link */}
                    <div>
                        <label className="text-sm text-muted-foreground">Referral Link</label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input
                                value={stats?.referral_link || ''}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                onClick={() => stats && copyToClipboard(stats.referral_link)}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                    </div>

                    {/* Share Button */}
                    <Button
                        className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                        size="lg"
                        onClick={shareReferral}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Referral Link
                    </Button>
                </CardContent>
            </Card>

            {/* How it works */}
            <Card>
                <CardHeader>
                    <CardTitle>ဘယ်လိုအလုပ်လုပ်လဲ?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                                1
                            </div>
                            <div>
                                <p className="font-medium">Referral link ကို မျှဝေပါ</p>
                                <p className="text-sm text-muted-foreground">သင့် referral link ကို သူငယ်ချင်းတွေကို ပေးပါ</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                                2
                            </div>
                            <div>
                                <p className="font-medium">သူတို့ Signup လုပ်မယ်</p>
                                <p className="text-sm text-muted-foreground">သင့် link နဲ့ account ဖွင့်ရမယ်</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                                3
                            </div>
                            <div>
                                <p className="font-medium">သင့်ကို 2 Credits ရမယ်</p>
                                <p className="text-sm text-muted-foreground">သူတို့ email verify လုပ်ပြီး video တစ်ခု လုပ်ရင် သင့်ကို credits ရမယ်</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
