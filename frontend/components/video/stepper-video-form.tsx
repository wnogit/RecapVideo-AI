'use client';

/**
 * Stepper Video Form
 * Multi-step wizard for video creation with live preview
 */
import { useEffect, useState } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { useAuthStore } from '@/stores/auth-store';
import { useVideoStore } from '@/stores/video-store';
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
  }, []);

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
      await createVideo(data);
      reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Video ဖန်တီးရာတွင် အမှားရှိပါသည်');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Step Indicator */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center justify-center">
          {STEPS.map((step, stepIdx) => (
            <li key={step.id} className={cn(
              "relative",
              stepIdx !== STEPS.length - 1 ? "pr-8 sm:pr-20" : ""
            )}>
              {/* Connector Line */}
              {stepIdx !== STEPS.length - 1 && (
                <div className="absolute top-4 left-8 -right-4 sm:left-12 sm:-right-8 h-0.5">
                  <div className={cn(
                    "h-full transition-colors duration-300",
                    step.id < currentStep ? "bg-primary" : "bg-muted"
                  )} />
                </div>
              )}
              
              {/* Step Circle */}
              <button
                onClick={() => {
                  // Only allow going back or to completed steps
                  if (step.id < currentStep) {
                    handleSetStep(step.id as 1 | 2 | 3);
                  }
                }}
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                  step.id < currentStep 
                    ? "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90" 
                    : step.id === currentStep 
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {step.id < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </button>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <span className={cn(
                  "text-sm font-medium block",
                  step.id <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.icon} {step.name}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
          {error}
        </div>
      )}

      {/* Main Content - Desktop: Side by Side, Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form Steps */}
        <Card className="order-2 lg:order-1">
          <CardContent className="p-6">
            {/* Step Content with Animation */}
            <div className="min-h-[400px] relative overflow-hidden">
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
            <div className="flex items-center justify-between pt-6 border-t mt-6">
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
