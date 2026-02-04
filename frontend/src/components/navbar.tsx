"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-neutral-900 dark:bg-white rounded" />
          <span className="text-lg font-medium text-neutral-900 dark:text-white">Nexus</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium px-4 py-2 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                  Get started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium px-4 py-2 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-2 p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="block w-full text-left px-4 py-3 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium px-4 py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                    Get started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="block w-full text-center text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium px-4 py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
