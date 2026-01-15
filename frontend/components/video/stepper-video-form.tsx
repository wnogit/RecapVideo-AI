'use client';

/**
 * Stepper Video Form
 * Multi-step wizard for video creation with live preview
 */
import { useEffect, useState, useCallback } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { useAuthStore } from '@/stores/auth-store';
import { useVideoStore, Video, VideoStatus } from '@/stores/video-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Step Components
import { Step1Input } from './steps/step1-input';
import { Step2Styles } from './steps/step2-styles';
import { Step3Branding } from './steps/step3-branding';
import { LivePreviewCanvas } from './live-preview-canvas';
import { ProcessingView } from './processing-view';
import { videoApi } from '@/lib/api';

const CREDITS_PER_VIDEO = 2;

const STEPS = [
  { id: 1, name: 'Input', description: 'URL နှင့် Voice', icon: '🎬' },
  { id: 2, name: 'Styles', description: 'စတိုင် ရွေးချယ်ရန်', icon: '🎨' },
  { id: 3, name: 'Branding', description: 'အမှတ်တံဆိပ်', icon: '✨' },
];

interface StepperVideoFormProps {
  onSuccess?: () => void;
}

export function StepperVideoForm({ onSuccess }: StepperVideoFormProps) {
  const { user } = useAuthStore();
  const { createVideo } = useVideoStore();
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward
  const [createdVideo, setCreatedVideo] = useState<Video | null>(null);
  const [pollingVideo, setPollingVideo] = useState<Video | null>(null);

  const {
    currentStep,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isSubmitting,
    error,
    nextStep,
    prevStep,
    setStep,
    setSubmitting,
    setError,
    getSubmissionData,
    reset,
  } = useVideoCreationStore();

  const hasCredits = (user?.credit_balance || 0) >= CREDITS_PER_VIDEO;

  // Reset form on mount
  useEffect(() => {
    reset();
    setCreatedVideo(null);
    setPollingVideo(null);
  }, []);

  // Poll for video status when video is created
  useEffect(() => {
    if (!createdVideo) return;

    let pollInterval = 3000; // Start with 3 seconds
    let consecutiveErrors = 0;
    const maxErrors = 5;
    let timeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await videoApi.get(createdVideo.id);
        const video = response.data;
        setPollingVideo(video);
        consecutiveErrors = 0; // Reset error count on success
        pollInterval = 3000; // Reset interval on success

        // Check if completed or failed
        if (video.status === 'completed' || video.status === 'failed') {
          return; // Stop polling
        }
        
        // Schedule next poll
        timeoutId = setTimeout(pollStatus, pollInterval);
      } catch (err) {
        console.error('Failed to poll video status:', err);
        consecutiveErrors++;
        
        if (consecutiveErrors >= maxErrors) {
          console.error('Max polling errors reached, stopping polling');
          return;
        }
        
        // Exponential backoff on error (max 30 seconds)
        pollInterval = Math.min(pollInterval * 1.5, 30000);
        timeoutId = setTimeout(pollStatus, pollInterval);
      }
    };

    // Initial poll
    pollStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [createdVideo]);

  // Custom navigation with direction tracking
  const handleNext = () => {
    setDirection(1);
    nextStep();
  };

  const handlePrev = () => {
    setDirection(-1);
    prevStep();
  };

  const handleSetStep = (step: 1 | 2 | 3) => {
    setDirection(step > currentStep ? 1 : -1);
    setStep(step);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!hasCredits) {
      setError('Credits မလုံလောက်ပါ။ ကျေးဇူးပြု၍ Credits ဝယ်ပါ။');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = getSubmissionData();
      const video = await createVideo(data);
      setCreatedVideo(video);
      setPollingVideo(video);
      // Don't reset or call onSuccess - show processing view instead
    } catch (err: any) {
      setError(err.message || 'Video ဖန်တီးရာတွင် အမှားရှိပါသည်');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel video
  const handleCancelVideo = async () => {
    if (!createdVideo) return;

    try {
      await videoApi.delete(createdVideo.id);
      setCreatedVideo(null);
      setPollingVideo(null);
      reset();
    } catch (err) {
      console.error('Failed to cancel video:', err);
    }
  };

  // Handle create another
  const handleCreateAnother = () => {
    setCreatedVideo(null);
    setPollingVideo(null);
    reset();
  };

  // Check if can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid && hasCredits;
      default: return false;
    }
  };

  // Get current video for display
  const displayVideo = pollingVideo || createdVideo;

  // Show Processing View if video is being created/processed
  if (displayVideo && displayVideo.status !== 'completed' && displayVideo.status !== 'failed') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <ProcessingView
          videoId={displayVideo.id}
          thumbnail={displayVideo.source_thumbnail}
          title={displayVideo.source_title || displayVideo.title}
          progress={displayVideo.progress_percent || 0}
          currentStatus={displayVideo.status}
          statusMessage={displayVideo.status_message}
          onCancel={handleCancelVideo}
        />
      </div>
    );
  }

  // Show Completed View
  if (displayVideo && displayVideo.status === 'completed') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <span className="text-4xl">🎉</span>
              <h2 className="text-xl font-bold mt-2">Video ပြီးပါပြီ!</h2>
            </div>

            {displayVideo.video_url && (
              <div className="relative aspect-[9/16] max-h-96 bg-black rounded-lg overflow-hidden mx-auto">
                <video
                  src={displayVideo.video_url}
                  controls
                  className="w-full h-full object-contain"
                  poster={displayVideo.source_thumbnail}
                />
              </div>
            )}

            <div className="space-y-2">
              {displayVideo.video_url && (
                <Button
                  className="w-full"
                  onClick={() => window.open(displayVideo.video_url, '_blank')}
                >
                  ⬇️ Download Video
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={handleCreateAnother}>
                ➕ Video အသစ်ဖန်တီးမည်
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show Failed View
  if (displayVideo && displayVideo.status === 'failed') {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <span className="text-4xl">❌</span>
              <h2 className="text-xl font-bold mt-2 text-destructive">Video ဖန်တီးမှု မအောင်မြင်ပါ</h2>
              <p className="text-sm text-muted-foreground mt-2">
                ဝန်ဆောင်မှုတွင် ပြဿနာတစ်ခုရှိနေပါသည်။ ခေတ္တစောင့်ပြီး ပြန်လည်ကြိုးစားပါ။
              </p>
            </div>

            <Button className="w-full" onClick={handleCreateAnother}>
              🔄 ပြန်ကြိုးစားမည်
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Centered Step Indicator - Pills with arrows */}
      <nav aria-label="Progress" className="mb-6">
        <ol className="flex items-center justify-center gap-2">
          {STEPS.map((step, stepIdx) => (
            <li key={step.id} className="flex items-center">
              {/* Step Pill */}
              <button
                onClick={() => {
                  if (step.id < currentStep) {
                    handleSetStep(step.id as 1 | 2 | 3);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  step.id < currentStep
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : step.id === currentStep
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {/* Step Number or Check */}
                <span className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  step.id < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id === currentStep
                      ? "bg-white/20"
                      : "bg-muted-foreground/20"
                )}>
                  {step.id < currentStep ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    step.id
                  )}
                </span>
                {/* Step Name */}
                <span className="hidden sm:inline">{step.name}</span>
              </button>

              {/* Arrow Separator */}
              {stepIdx !== STEPS.length - 1 && (
                <ChevronRight className={cn(
                  "w-4 h-4 mx-1",
                  step.id < currentStep ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center text-sm">
          {error}
        </div>
      )}

      {/* Main Content - Desktop: Side by Side, Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Form Steps */}
        <Card className="order-2 lg:order-1">
          <CardContent className="p-4 lg:p-5">
            {/* Step Content with Animation */}
            <div className="min-h-[320px] relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {currentStep === 1 && <Step1Input />}
                  {currentStep === 2 && <Step2Styles />}
                  {currentStep === 3 && <Step3Branding hasCredits={hasCredits} creditsRequired={CREDITS_PER_VIDEO} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              {/* Back Button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || isSubmitting}
                  className={cn(currentStep === 1 && "invisible")}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  နောက်သို့
                </Button>
              </motion.div>

              {/* Next / Submit Button */}
              {currentStep < 3 ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="min-w-[120px]"
                  >
                    ရှေ့ဆက်ရန်
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isSubmitting}
                    className="min-w-[160px] bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 relative overflow-hidden group"
                  >
                    {/* Glow sweep effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-white/25 to-violet-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <span className="relative flex items-center">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ဖန်တီးနေသည်...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Video ဖန်တီးမည်
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Live Preview */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          <LivePreviewCanvas />
        </div>
      </div>
    </div>
  );
}
