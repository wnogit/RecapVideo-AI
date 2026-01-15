'use client';

/**
 * Video Creation Page - Multi-Step Stepper
 * A dedicated page for creating new videos with a streamlined 3-step process
 */
import { StepperVideoForm } from '@/components/video/stepper-video-form';

export default function CreateVideoPage() {
  return (
    <div className="space-y-4">
      {/* Stepper Video Form (header is now inside) */}
      <StepperVideoForm />
    </div>
  );
}
