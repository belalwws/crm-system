"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  Calendar,
  Bell,
  FileText,
  Mail,
  Sparkles,
  TrendingUp,
  GitBranch,
  Globe,
  Shield,
  ShieldCheck,
  Contact,
  Package,
  Receipt,
  UsersRound,
  SlidersHorizontal,
  CreditCard,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/search/global-search";
import { AIChatButton } from "@/components/ai/ai-chat";
import ErrorBoundary from "@/components/error-boundary";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { TrialBanner } from "@/components/billing/trial-banner";
import api from "@/lib/api";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Deals", href: "/dashboard/deals", icon: Briefcase },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Contacts", href: "/dashboard/contacts", icon: Contact },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Quotes", href: "/dashboard/quotes", icon: Receipt },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Email Templates", href: "/dashboard/emails/templates", icon: Mail },
  { name: "Nexus AI", href: "/dashboard/ai", icon: Sparkles },
  { name: "Teams", href: "/dashboard/teams", icon: UsersRound },
  { name: "Reports", href: "/dashboard/reports", icon: TrendingUp },
  { name: "Workflows", href: "/dashboard/workflows", icon: GitBranch },
  { name: "Webhooks", href: "/dashboard/webhooks", icon: Globe },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: Shield },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Custom Fields", href: "/dashboard/custom-fields", icon: SlidersHorizontal },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem('crm_onboarding_complete');
      if (!done) setShowOnboarding(true);
    }
  }, []);

  const fetchRole = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      api.setToken(token);
      const res = await api.getProfile() as { success: boolean; data?: { role?: string } };
      if (res.success && res.data?.role) {
        setUserRole(res.data.role);
      }
    } catch {
      // silently fail
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRole();
    }
  }, [fetchRole, isLoaded, isSignedIn]);

  const allNavItems = [
    ...navigation,
    ...(userRole === 'ADMIN' ? [{ name: "Admin Panel", href: "/dashboard/admin", icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 z-50 h-full w-60 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-transform duration-200 flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Nexus Logo" width={28} height={28} className="rounded-md" />
            <span className="font-semibold text-neutral-900 dark:text-white">Nexus CRM</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <item.icon className={`w-4 h-4 ${item.name === 'Nexus AI' ? 'text-violet-500' : item.name === 'Admin Panel' ? 'text-red-500' : ''}`} />
                <span className={
                  item.name === 'Nexus AI' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-semibold' :
                  item.name === 'Admin Panel' ? 'text-red-600 dark:text-red-400 font-semibold' : ''
                }>
                  {item.name}
                </span>
                {item.name === 'Nexus AI' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">
                    AI
                  </span>
                )}
                {item.name === 'Admin Panel' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                    ADM
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user?.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-60">
        {/* Trial Banner */}
        <TrialBanner />

        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Page Title - Mobile */}
          <div className="lg:hidden">
            <span className="font-medium text-neutral-900 dark:text-white">
              {allNavItems.find((n) => n.href === pathname)?.name || "Dashboard"}
            </span>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block flex-1">
            <GlobalSearch />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Link
              href="/"
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Back to Home"
            >
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6" role="main" aria-label="Page content">
          <ToastProvider>
            <ErrorBoundary>
              <div className="max-w-6xl mx-auto">{children}</div>
            </ErrorBoundary>
          </ToastProvider>
        </main>
      </div>

      {/* Floating AI Chat Button */}
      <AIChatButton />

      {/* Onboarding Wizard for new users */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
