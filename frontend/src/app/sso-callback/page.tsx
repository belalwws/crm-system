// Server component - forces dynamic rendering so Clerk authentication
// callback is never called during static prerender (build time).
export const dynamic = 'force-dynamic';

import SSOCallbackPage from './sso-callback-client';

export default function SSOCallbackServerPage() {
  return <SSOCallbackPage />;
}
