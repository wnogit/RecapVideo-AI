'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateVideo } from '@/hooks/use-videos';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Link2, Mic, Languages, Film } from 'lucide-react';

const videoSchema = z.object({
  url: z.string().url('Please enter a valid URL').refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    'Please enter a valid YouTube URL'
  ),
  voice: z.string().default('my-MM-NilarNeural'),
  language: z.string().default('my'),
});

type VideoForm = z.infer<typeof videoSchema>;

const voices = [
  { value: 'my-MM-NilarNeural', label: 'Burmese Female (Nilar)', lang: 'my' },
  { value: 'my-MM-ThihaNeural', label: 'Burmese Male (Thiha)', lang: 'my' },
  { value: 'en-US-JennyNeural', label: 'English Female (Jenny)', lang: 'en' },
  { value: 'en-US-GuyNeural', label: 'English Male (Guy)', lang: 'en' },
];

const languages = [
  { value: 'my', label: 'မြန်မာ (Burmese)' },
  { value: 'en', label: 'English' },
  { value: 'th', label: 'ไทย (Thai)' },
  { value: 'zh', label: '中文 (Chinese)' },
];

interface VideoFormProps {
  onSuccess?: () => void;
}

export function VideoForm({ onSuccess }: VideoFormProps) {
  const { create, isLoading, error, clearError } = useCreateVideo();
  const { user } = useAuthStore();
  const [selectedLang, setSelectedLang] = useState('my');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VideoForm>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      voice: 'my-MM-NilarNeural',
      language: 'my',
    },
  });

  const filteredVoices = voices.filter((v) => v.lang === selectedLang);

  const onSubmit = async (data: VideoForm) => {
    try {
      clearError();
      await create({
        url: data.url,
        voice: data.voice,
        language: data.language,
      });
      reset();
      onSuccess?.();
    } catch (err) {
      // Error handled by store
    }
  };

  const hasCredits = (user?.credit_balance || 0) >= 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Create New Video
        </CardTitle>
        <CardDescription>
          Enter a YouTube URL to generate a recap video with Burmese voiceover
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!hasCredits && (
            <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600">
              You need at least 1 credit to create a video.{' '}
              <a href="/buy" className="underline font-medium">
                Buy credits
              </a>
            </div>
          )}

          {/* YouTube URL */}
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-10"
                {...register('url')}
              />
            </div>
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Output Language</Label>
            <Select
              value={selectedLang}
              onValueChange={(value) => {
                setSelectedLang(value);
                setValue('language', value);
                // Reset voice to first matching voice
                const firstVoice = voices.find((v) => v.lang === value);
                if (firstVoice) {
                  setValue('voice', firstVoice.value);
                }
              }}
            >
              <SelectTrigger>
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select
              value={watch('voice')}
              onValueChange={(value) => setValue('voice', value)}
            >
              <SelectTrigger>
                <Mic className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {filteredVoices.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credit Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <span>Cost per video:</span>
            <span className="font-medium">1 Credit</span>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !hasCredits}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Video
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
