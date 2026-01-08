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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/15 blur-[120px]" />
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
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
