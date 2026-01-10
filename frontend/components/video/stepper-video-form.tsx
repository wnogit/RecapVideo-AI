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

    const pollStatus = async () => {
      try {
        const response = await videoApi.get(createdVideo.id);
        const video = response.data;
        setPollingVideo(video);

        // Check if completed or failed
        if (video.status === 'completed' || video.status === 'failed') {
          return; // Stop polling
        }
      } catch (err) {
        console.error('Failed to poll video status:', err);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
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
      {/* Header + Step Indicator - Inline on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        {/* Title */}
        <h1 className="text-xl lg:text-2xl font-bold">🎬 Video အသစ်ဖန်တီးရန်</h1>

        {/* Stepper */}
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {STEPS.map((step, stepIdx) => (
              <li key={step.id} className={cn(
                "relative flex items-center",
                stepIdx !== STEPS.length - 1 ? "pr-6 sm:pr-10" : ""
              )}>
                {/* Connector Line */}
                {stepIdx !== STEPS.length - 1 && (
                  <div className="absolute top-3 left-7 -right-2 sm:left-9 sm:-right-4 h-0.5">
                    <div className={cn(
                      "h-full transition-colors duration-300",
                      step.id < currentStep ? "bg-primary" : "bg-muted"
                    )} />
                  </div>
                )}

                {/* Step Circle */}
                <button
                  onClick={() => {
                    if (step.id < currentStep) {
                      handleSetStep(step.id as 1 | 2 | 3);
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 text-xs",
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                      : step.id === currentStep
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="text-xs font-medium">{step.id}</span>
                  )}
                </button>

                {/* Step Label */}
                <span className={cn(
                  "ml-2 text-sm font-medium hidden sm:block",
                  step.id <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

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
