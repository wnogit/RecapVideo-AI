'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    ArrowLeft,
    Upload,
    Download,
    Loader2,
    CheckCircle,
    Crown,
    Languages,
    Clock,
    FileType,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const languages = [
    { code: 'auto', name: 'Auto Detect' },
    { code: 'en', name: 'English' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'th', name: 'Thai' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
];

const formats = [
    { value: 'srt', name: 'SRT', description: 'SubRip Subtitle' },
    { value: 'vtt', name: 'VTT', description: 'WebVTT' },
    { value: 'ass', name: 'ASS', description: 'Advanced SubStation' },
];

export default function SubtitleGeneratorPage() {
    const [videoUrl, setVideoUrl] = useState('');
    const [language, setLanguage] = useState('auto');
    const [format, setFormat] = useState('srt');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!videoUrl) {
            toast({
                title: 'Error',
                description: 'Please enter a video URL',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        setResult(null);

        // Simulate processing (will be replaced with actual API call)
        await new Promise(resolve => setTimeout(resolve, 3000));

        toast({
            title: 'Success',
            description: 'Subtitles generated successfully!',
        });
        setResult('sample_subtitles.srt');
        setIsProcessing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/tools">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                        <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Subtitle Generator</h1>
                        <p className="text-muted-foreground">
                            Generate subtitles from any video automatically
                        </p>
                    </div>
                </div>
                <Badge className="ml-auto bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    3 Credits
                </Badge>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Generate Subtitles</CardTitle>
                        <CardDescription>
                            Enter a video URL to extract and generate subtitles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Video URL */}
                        <div className="space-y-2">
                            <Label htmlFor="video-url">Video URL</Label>
                            <Input
                                id="video-url"
                                placeholder="https://youtube.com/watch?v=... or TikTok/Facebook URL"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Supports YouTube, TikTok, Facebook videos
                            </p>
                        </div>

                        {/* Language Selection */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Source Language</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map(lang => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Output Format</Label>
                                <Select value={format} onValueChange={setFormat}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formats.map(fmt => (
                                            <SelectItem key={fmt.value} value={fmt.value}>
                                                {fmt.name} ({fmt.description})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isProcessing || !videoUrl}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generate Subtitles
                                </>
                            )}
                        </Button>

                        {/* Result */}
                        {result && (
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="font-medium text-green-500">Subtitles Ready!</p>
                                            <p className="text-sm text-muted-foreground">{result}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Languages className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Multi-language</p>
                                <p className="text-xs text-muted-foreground">
                                    Support for 50+ languages
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-cyan-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Word Timestamps</p>
                                <p className="text-xs text-muted-foreground">
                                    Precise word-level timing
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileType className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Multiple Formats</p>
                                <p className="text-xs text-muted-foreground">
                                    SRT, VTT, ASS export
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
