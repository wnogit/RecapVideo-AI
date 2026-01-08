import { Suspense } from 'react';
import { EmailAuthForm } from '@/components/auth/email-auth-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - RecapVideo.AI',
  description: 'Sign in to your RecapVideo.AI account',
};

function LoginPageContent() {
  return <EmailAuthForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
