import { EmailAuthForm } from '@/components/auth/email-auth-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - RecapVideo.AI',
  description: 'Create your RecapVideo.AI account',
};

export default function SignupPage() {
  return <EmailAuthForm initialMode="signup" />;
}
