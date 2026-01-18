import { EmailAuthForm } from '@/components/auth/email-auth-form';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up - RecapVideo.AI',
  description: 'Create your RecapVideo.AI account',
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmailAuthForm initialMode="signup" />
    </Suspense>
  );
}
