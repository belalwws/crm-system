"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black dark:bg-white rounded-md" />
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">Nexus</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center pt-24 pb-12 px-6 min-h-screen">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-full px-4 py-1.5 mb-4 shadow-sm border border-neutral-200 dark:border-neutral-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Welcome back</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Sign in to your account
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Continue managing your customer relationships
            </p>
          </div>

          {/* Sign In Component */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-8">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 p-0 w-full",
                  header: "hidden",
                  footer: "border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6",
                  footerAction: "text-sm text-neutral-600 dark:text-neutral-400",
                  formButtonPrimary: "w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200",
                  formFieldInput: "w-full px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent",
                  formFieldLabel: "text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block",
                  dividerLine: "bg-neutral-200 dark:bg-neutral-700",
                  dividerText: "text-neutral-500 dark:text-neutral-400 text-sm bg-white dark:bg-neutral-900 px-3 font-medium",
                  socialButtonsBlockButton: "w-full border border-neutral-300 dark:border-neutral-600 rounded-lg py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 bg-white dark:bg-neutral-900",
                  socialButtonsBlockButtonText: "text-neutral-700 dark:text-neutral-300 text-sm font-semibold",
                  formFieldErrorText: "text-red-500 text-sm mt-1 font-medium",
                  alert: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg p-4 text-sm font-medium",
                  identityPreviewEditButton: "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium",
                  formResendCodeLink: "text-black dark:text-white font-semibold hover:underline",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  shimmer: false,
                },
              }}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              By signing in, you agree to our{" "}
              <Link href="#" className="text-black dark:text-white font-semibold hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-black dark:text-white font-semibold hover:underline">
                Privacy Policy
              </Link>
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Secure SSL
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Encrypted
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
