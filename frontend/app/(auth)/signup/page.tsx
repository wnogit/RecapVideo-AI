import { redirect } from 'next/navigation';

// Redirect /signup to /login?mode=signup
// The EmailAuthForm component handles the mode parameter
export default function SignupPage() {
  redirect('/login?mode=signup');
}
