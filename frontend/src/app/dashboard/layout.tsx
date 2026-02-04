"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Menu,
  X,
  Home,
  HelpCircle,
  TrendingUp,
  Megaphone,
  BarChart3,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Deals", href: "/dashboard/deals", icon: Briefcase },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

const secondaryNav = [
  { name: "Help", href: "#", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">Dashboard</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "" : "group-hover:scale-110"} transition-transform`} />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="!my-4 border-t border-neutral-200 dark:border-neutral-800" />

          {/* Secondary Nav */}
          {secondaryNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Upgrade Card */}
        <div className="p-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-5 text-white">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium mb-1">Upgrade to PRO</p>
              <p className="text-xs text-white/70 mb-4">to get access all Features!</p>
              <button className="w-full py-2.5 bg-white text-violet-600 font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors shadow-lg">
                Get Pro Now!
              </button>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Project Manager
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-neutral-100/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title - Mobile */}
          <div className="lg:hidden">
            <span className="text-neutral-900 dark:text-white font-medium">
              {navigation.find((n) => n.href === pathname)?.name || "Dashboard"}
            </span>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <ToastProvider>
            <div className="max-w-7xl mx-auto">{children}</div>
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
