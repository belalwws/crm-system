// Server component - forces dynamic rendering so Clerk hooks
// are never called during static prerender (build time).
export const dynamic = 'force-dynamic';

import SignUpPage from './sign-up-client';

export default function SignUpServerPage() {
  return <SignUpPage />;
}
