'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Music,
    ArrowLeft,
    Download,
    Loader2,
    CheckCircle,
    Crown,
    Headphones,
    Disc,
    Volume2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const formats = [
    { value: 'mp3', name: 'MP3', description: 'Most compatible' },
    { value: 'wav', name: 'WAV', description: 'Lossless quality' },
    { value: 'aac', name: 'AAC', description: 'Apple devices' },
];

const qualities = [
    { value: '128', name: '128 kbps', description: 'Standard' },
    { value: '192', name: '192 kbps', description: 'Good' },
    { value: '320', name: '320 kbps', description: 'Best' },
];

export default function AudioExtractorPage() {
    const [videoUrl, setVideoUrl] = useState('');
    const [format, setFormat] = useState('mp3');
    const [quality, setQuality] = useState('192');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
    const { toast } = useToast();

    const handleExtract = async () => {
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
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast({
            title: 'Success',
            description: 'Audio extracted successfully!',
        });
        setResult({
            url: '#',
            filename: `audio_${Date.now()}.${format}`,
        });
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
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Music className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Audio Extractor</h1>
                        <p className="text-muted-foreground">
                            Extract audio from any video URL
                        </p>
                    </div>
                </div>
                <Badge className="ml-auto bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    2 Credits
                </Badge>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Input Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Extract Audio</CardTitle>
                        <CardDescription>
                            Enter a video URL to extract the audio track
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
                                Supports YouTube, TikTok, Facebook, Instagram videos
                            </p>
                        </div>

                        {/* Format Selection */}
                        <div className="space-y-3">
                            <Label>Output Format</Label>
                            <RadioGroup
                                value={format}
                                onValueChange={setFormat}
                                className="grid grid-cols-3 gap-3"
                            >
                                {formats.map(fmt => (
                                    <Label
                                        key={fmt.value}
                                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${format === fmt.value
                                            ? 'border-green-500 bg-green-500/10'
                                            : 'border-border hover:border-green-500/50'
                                            }`}
                                    >
                                        <RadioGroupItem value={fmt.value} className="sr-only" />
                                        <Disc className={`h-6 w-6 mb-2 ${format === fmt.value ? 'text-green-500' : 'text-muted-foreground'}`} />
                                        <span className="font-medium">{fmt.name}</span>
                                        <span className="text-xs text-muted-foreground">{fmt.description}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Quality Selection */}
                        <div className="space-y-2">
                            <Label>Audio Quality</Label>
                            <Select value={quality} onValueChange={setQuality}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {qualities.map(q => (
                                        <SelectItem key={q.value} value={q.value}>
                                            {q.name} - {q.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Extract Button */}
                        <Button
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                            size="lg"
                            onClick={handleExtract}
                            disabled={isProcessing || !videoUrl}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <Music className="h-4 w-4 mr-2" />
                                    Extract Audio
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
                                            <p className="font-medium text-green-500">Audio Ready!</p>
                                            <p className="text-sm text-muted-foreground">{result.filename}</p>
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
                            <Headphones className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Multiple Platforms</p>
                                <p className="text-xs text-muted-foreground">
                                    YouTube, TikTok, FB, IG
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Disc className="h-5 w-5 text-emerald-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Format Options</p>
                                <p className="text-xs text-muted-foreground">
                                    MP3, WAV, AAC formats
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Volume2 className="h-5 w-5 text-teal-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Quality Selection</p>
                                <p className="text-xs text-muted-foreground">
                                    128k to 320k bitrate
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
