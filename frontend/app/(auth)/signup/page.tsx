import { GoogleAuthForm } from '@/components/auth/google-auth-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - RecapVideo.AI',
  description: 'Create your RecapVideo.AI account with Google',
};

export default function SignupPage() {
  return <GoogleAuthForm />;
}
