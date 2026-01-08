import { Suspense } from 'react';
import { VerifyEmailContent } from './verify-content';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Email - RecapVideo.AI',
  description: 'Verify your email address to activate your RecapVideo.AI account',
};

function VerifyLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
