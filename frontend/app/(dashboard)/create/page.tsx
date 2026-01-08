'use client';

/**
 * Video Creation Page - Multi-Step Stepper
 * A dedicated page for creating new videos with a streamlined 3-step process
 */
import { StepperVideoForm } from '@/components/video/stepper-video-form';

export default function CreateVideoPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">🎬 Video အသစ်ဖန်တီးရန်</h1>
        <p className="text-muted-foreground mt-1">
          YouTube Shorts ကို မြန်မာဘာသာ ပြန်ဆို Video အဖြစ် ပြောင်းလဲပါ
        </p>
      </div>

      {/* Stepper Video Form */}
      <StepperVideoForm />
    </div>
  );
}
