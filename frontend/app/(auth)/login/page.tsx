import { EmailAuthForm } from '@/components/auth/email-auth-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - RecapVideo.AI',
  description: 'Sign in to your RecapVideo.AI account',
};

export default function LoginPage() {
  return <EmailAuthForm />;
}
