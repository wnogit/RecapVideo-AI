'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Play, Pause, Search, Check, Star, Mic } from 'lucide-react';
import { Voice, AVAILABLE_VOICES } from '@/lib/types/video-options';
import { cn } from '@/lib/utils';

interface VoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
}

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'female' | 'male'>('all');
  const [search, setSearch] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVoice = AVAILABLE_VOICES.find(v => v.id === value) || AVAILABLE_VOICES[0];

  // Filter voices
  const filteredVoices = AVAILABLE_VOICES.filter(voice => {
    const matchesFilter = filter === 'all' || voice.gender === filter;
    const matchesSearch = voice.name.toLowerCase().includes(search.toLowerCase()) ||
                          voice.style.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => {
      setPlayingVoiceId(null);
      setProgress(0);
    });
    audioRef.current.addEventListener('timeupdate', () => {
      if (audioRef.current) {
        const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(percent);
      }
    });

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const playVoiceSample = (voice: Voice) => {
    if (!audioRef.current) return;

    if (playingVoiceId === voice.id) {
      // Pause if same voice is playing
      audioRef.current.pause();
      setPlayingVoiceId(null);
      setProgress(0);
    } else {
      // Play new voice
      audioRef.current.src = voice.sampleUrl;
      audioRef.current.play().catch(() => {
        // Handle autoplay restriction
        console.log('Audio playback failed');
      });
      setPlayingVoiceId(voice.id);
    }
  };

  const selectVoice = (voice: Voice) => {
    onChange(voice.id);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">🎤 Voice</label>
      
      {/* Selected Voice Display */}
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-2xl">
            {selectedVoice.gender === 'female' ? '👩' : '👨'}
          </span>
          <div>
            <p className="font-medium">{selectedVoice.name}</p>
            <p className="text-xs text-muted-foreground">{selectedVoice.style}</p>
          </div>
        </div>
        
        {/* Quick Play Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => playVoiceSample(selectedVoice)}
          className="h-8 w-8"
        >
          {playingVoiceId === selectedVoice.id ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Change Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Change
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Select Voice
              </DialogTitle>
            </DialogHeader>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                type="button"
                variant={filter === 'female' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('female')}
              >
                👩 Female
              </Button>
              <Button
                type="button"
                variant={filter === 'male' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('male')}
              >
                👨 Male
              </Button>
              
              <div className="flex-1" />
              
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search voice..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-40"
                />
              </div>
            </div>

            {/* Currently Playing Preview */}
            {playingVoiceId && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    Playing: {AVAILABLE_VOICES.find(v => v.id === playingVoiceId)?.name}
                  </span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Voice Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
                {filteredVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className={cn(
                      "relative p-4 border rounded-lg cursor-pointer transition-all hover:border-primary",
                      value === voice.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => selectVoice(voice)}
                  >
                    {/* Selected Check */}
                    {value === voice.id && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}

                    {/* Popular Badge */}
                    {voice.isPopular && (
                      <div className="absolute top-2 left-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}

                    {/* Voice Info */}
                    <div className="text-center space-y-2">
                      <span className="text-3xl">
                        {voice.gender === 'female' ? '👩' : '👨'}
                      </span>
                      <div>
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">{voice.style}</p>
                      </div>
                    </div>

                    {/* Play Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        playVoiceSample(voice);
                      }}
                    >
                      {playingVoiceId === voice.id ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              {filteredVoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No voices found
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <div className="pt-4 border-t">
              <Button
                type="button"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Selection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress bar when playing */}
      {playingVoiceId === selectedVoice.id && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
