// Force dynamic rendering to avoid build-time Clerk errors
export const dynamic = 'force-dynamic';

import EmailTemplatesClient from './email-templates-client';

export default function EmailTemplatesPage() {
  return <EmailTemplatesClient />;
}
