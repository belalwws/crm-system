"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Menu,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Deals", href: "/dashboard/deals", icon: Briefcase },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 
          ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-neutral-800 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-neutral-900 font-bold text-sm">N</span>
            </div>
            {!collapsed && <span className="text-lg font-semibold text-white">Nexus</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-white text-neutral-900"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-800">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Back to Home" : undefined}
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Back to Home</span>}
          </Link>
        </div>

        {/* Collapse Button - Desktop Only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-neutral-800 border border-neutral-700 rounded-full items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title - Mobile */}
          <div className="lg:hidden">
            <span className="text-white font-medium">
              {navigation.find((n) => n.href === pathname)?.name || "Dashboard"}
            </span>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block" />

          {/* User Button */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-neutral-700 ring-offset-2 ring-offset-neutral-950",
              },
            }}
          />
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
