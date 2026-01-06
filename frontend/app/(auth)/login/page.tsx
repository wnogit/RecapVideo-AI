import { GoogleAuthForm } from '@/components/auth/google-auth-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - RecapVideo.AI',
  description: 'Sign in to your RecapVideo.AI account with Google',
};

export default function LoginPage() {
  return <GoogleAuthForm />;
}
