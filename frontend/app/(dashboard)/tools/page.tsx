'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    FileText,
    Music,
    Lock,
    Crown,
    ArrowRight,
    Wand2,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Tool definitions
const tools = [
    {
        id: 'watermark-removal',
        name: 'AI Watermark Removal',
        description: 'Remove TikTok/Facebook watermarks with AI inpainting',
        longDescription: 'Advanced AI technology သုံးပြီး video watermarks ကို ဖယ်ရှားပေးပါသည်။ Blur မဟုတ်ဘဲ AI inpainting ဖြင့် clean background ပြန်ဖန်တီးပေးပါသည်။',
        icon: Sparkles,
        credits: 9,
        status: 'coming_soon' as const,
        gradient: 'from-purple-500 to-pink-500',
        features: [
            'TikTok watermark removal',
            'Facebook watermark removal',
            'AI inpainting technology',
            'Clean background restoration',
        ],
    },
    {
        id: 'subtitle-generator',
        name: 'Subtitle Generator',
        description: 'Generate subtitles from any video/audio with Whisper AI',
        longDescription: 'OpenAI Whisper AI သုံးပြီး video/audio ကို subtitle ထုတ်ပေးပါသည်။ SRT, VTT, ASS formats ထုတ်နိုင်ပါသည်။',
        icon: FileText,
        credits: 3,
        status: 'available' as const,
        gradient: 'from-blue-500 to-cyan-500',
        features: [
            'Multi-language support',
            'Word-level timestamps',
            'SRT/VTT/ASS export',
            'High accuracy with Whisper',
        ],
    },
    {
        id: 'audio-extractor',
        name: 'Audio Extractor',
        description: 'Extract audio from any video URL',
        longDescription: 'YouTube, TikTok, Facebook video မှ audio ကို MP3/WAV format ဖြင့် ထုတ်ပေးပါသည်။',
        icon: Music,
        credits: 2,
        status: 'available' as const,
        gradient: 'from-green-500 to-emerald-500',
        features: [
            'YouTube/TikTok/Facebook support',
            'MP3/WAV formats',
            'Quality selection (128k-320k)',
            'Fast processing',
        ],
    },
];

function ToolCard({ tool }: { tool: typeof tools[0] }) {
    const isComingSoon = tool.status === 'coming_soon';
    const IconComponent = tool.icon;

    return (
        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 ${isComingSoon ? 'opacity-80' : 'hover:-translate-y-1'}`}>
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tool.gradient}`} />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isComingSoon ? (
                            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                Coming Soon
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                            </Badge>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                            <Crown className="h-3 w-3 text-yellow-500" />
                            <span className="font-medium text-yellow-500">{tool.credits} Credits</span>
                        </div>
                    </div>
                </div>

                <CardTitle className="text-lg mt-4">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
            </CardHeader>

            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    {tool.longDescription}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                    {tool.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${tool.gradient}`} />
                            {feature}
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                {isComingSoon ? (
                    <Button
                        variant="outline"
                        className="w-full"
                        disabled
                    >
                        <Lock className="h-4 w-4 mr-2" />
                        Coming Soon
                    </Button>
                ) : (
                    <Link href={`/tools/${tool.id}`}>
                        <Button
                            className={`w-full bg-gradient-to-r ${tool.gradient} hover:opacity-90`}
                        >
                            Use Tool
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}

export default function ToolsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600">
                        <Wand2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">AI Tools</h1>
                        <p className="text-muted-foreground">
                            Powerful AI tools for video processing
                        </p>
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                ))}
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-purple-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-purple-400">More Tools Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            ပိုမို powerful AI tools များ ထပ်ထည့်ပေးမည်ဖြစ်ပါသည်။ Stay tuned!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
