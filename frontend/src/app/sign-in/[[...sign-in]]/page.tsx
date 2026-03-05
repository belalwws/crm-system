// Server component - forces dynamic rendering so Clerk hooks
// are never called during static prerender (build time).
export const dynamic = 'force-dynamic';

import SignInPage from './sign-in-client';

export default function SignInServerPage() {
  return <SignInPage />;
}
