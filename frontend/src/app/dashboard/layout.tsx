// Force dynamic rendering for all dashboard pages so Clerk hooks
// are never called during static prerender (build time).
export const dynamic = 'force-dynamic';

import { DashboardLayoutClient } from './dashboard-layout-client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
