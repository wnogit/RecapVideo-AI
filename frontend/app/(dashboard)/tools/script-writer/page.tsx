'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    PenTool,
    ArrowLeft,
    Copy,
    Download,
    Loader2,
    CheckCircle,
    Crown,
    Languages,
    Palette,
    Type,
    Rocket,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const languages = [
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'en', name: 'English' },
    { code: 'th', name: 'Thai' },
    { code: 'zh', name: 'Chinese' },
];

const scriptTypes = [
    { value: 'recap', name: 'Recap', description: 'Video summary' },
    { value: 'tutorial', name: 'Tutorial', description: 'How-to guide' },
    { value: 'review', name: 'Review', description: 'Product review' },
    { value: 'story', name: 'Story', description: 'Narrative style' },
];

const tones = [
    { value: 'professional', name: 'Professional' },
    { value: 'casual', name: 'Casual' },
    { value: 'dramatic', name: 'Dramatic' },
    { value: 'funny', name: 'Funny' },
];

export default function ScriptWriterPage() {
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState('my');
    const [scriptType, setScriptType] = useState('recap');
    const [tone, setTone] = useState('professional');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!input) {
            toast({
                title: 'Error',
                description: 'Please enter a topic or video URL',
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
            description: 'Script generated successfully!',
        });
        setResult(`# Video Script\n\nThis is a sample generated script for: "${input}"\n\nType: ${scriptType}\nTone: ${tone}\nLanguage: ${language}\n\n---\n\nYour full script content would appear here...`);
        setIsProcessing(false);
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            toast({
                title: 'Copied!',
                description: 'Script copied to clipboard',
            });
        }
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
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                        <PenTool className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Script Writer</h1>
                        <p className="text-muted-foreground">
                            Generate video scripts from topic or URL
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
                        <CardTitle>Generate Script</CardTitle>
                        <CardDescription>
                            Enter a topic or video URL to generate a script
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Topic/URL Input */}
                        <div className="space-y-2">
                            <Label htmlFor="input">Topic or Video URL</Label>
                            <Textarea
                                id="input"
                                placeholder="Enter a topic like 'iPhone 16 Pro Review' or paste a YouTube URL..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a topic, idea, or paste a video URL for context
                            </p>
                        </div>

                        {/* Script Type Selection */}
                        <div className="space-y-3">
                            <Label>Script Type</Label>
                            <RadioGroup
                                value={scriptType}
                                onValueChange={setScriptType}
                                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                            >
                                {scriptTypes.map(type => (
                                    <Label
                                        key={type.value}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${scriptType === type.value
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : 'border-border hover:border-orange-500/50'
                                            }`}
                                    >
                                        <RadioGroupItem value={type.value} className="sr-only" />
                                        <span className="font-medium text-sm">{type.name}</span>
                                        <span className="text-xs text-muted-foreground">{type.description}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Language and Tone */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Output Language</Label>
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
                                <Label>Tone</Label>
                                <Select value={tone} onValueChange={setTone}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tones.map(t => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isProcessing || !input}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <PenTool className="h-4 w-4 mr-2" />
                                    Generate Script
                                </>
                            )}
                        </Button>

                        {/* Result */}
                        {result && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="font-medium text-green-500">Script Ready!</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={handleCopy}>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 border">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {result}
                                    </pre>
                                </div>
                                <Link href="/create">
                                    <Button variant="outline" className="w-full">
                                        <Rocket className="h-4 w-4 mr-2" />
                                        Use in Video Creation
                                    </Button>
                                </Link>
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
                            <Type className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Multiple Script Types</p>
                                <p className="text-xs text-muted-foreground">
                                    Recap, Tutorial, Review, Story
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Languages className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Multi-language</p>
                                <p className="text-xs text-muted-foreground">
                                    Myanmar, English, Thai, Chinese
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Palette className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Tone Customization</p>
                                <p className="text-xs text-muted-foreground">
                                    Professional, Casual, Dramatic, Funny
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
