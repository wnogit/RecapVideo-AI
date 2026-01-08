import { VerifyEmailContent } from './verify-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email - RecapVideo.AI',
  description: 'Verify your email address to activate your RecapVideo.AI account',
};

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
