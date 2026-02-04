"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Rocket, Check, Star } from "lucide-react";

const benefits = [
  "Free forever plan available",
  "No credit card required",
  "Setup in under 5 minutes",
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black dark:bg-white rounded-md" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Nexus</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center pt-24 pb-12 px-6 min-h-screen">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Benefits (Desktop) */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-full px-4 py-1.5 mb-6 shadow-sm border border-gray-200 dark:border-neutral-800">
              <Rocket className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Start your free trial</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Start managing your customers better today.
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-md">
              Join thousands of teams using Nexus to track leads, close deals, and grow their business.
            </p>
            
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                &ldquo;Nexus transformed how we manage our sales process. We closed 40% more deals in the first quarter.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Sarah Chen</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">VP of Sales, TechCorp</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div>
            {/* Welcome Text - Mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 rounded-full px-4 py-1.5 mb-4 shadow-sm border border-gray-200 dark:border-neutral-800">
                <Rocket className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Start free</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create your account
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Start managing your customer relationships
              </p>
            </div>

            {/* Sign Up Component */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-8">
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 p-0 w-full",
                    header: "hidden",
                    footer: "border-t border-gray-200 dark:border-neutral-700 pt-6 mt-6",
                    footerAction: "text-sm text-gray-600 dark:text-gray-400",
                    formButtonPrimary: "w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200",
                    formFieldInput: "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent",
                    formFieldLabel: "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block",
                    dividerLine: "bg-gray-200 dark:bg-neutral-700",
                    dividerText: "text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-neutral-900 px-3 font-medium",
                    socialButtonsBlockButton: "w-full border border-gray-300 dark:border-neutral-600 rounded-lg py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-200 bg-white dark:bg-neutral-900",
                    socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-300 text-sm font-semibold",
                    formFieldErrorText: "text-red-500 text-sm mt-1 font-medium",
                    alert: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg p-4 text-sm font-medium",
                    identityPreviewEditButton: "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium",
                    formResendCodeLink: "text-black dark:text-white font-semibold hover:underline",
                    otpCodeFieldInput: "w-12 h-12 text-center text-xl font-semibold border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white",
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By signing up, you agree to our{" "}
                <Link href="#" className="text-black dark:text-white font-semibold hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-black dark:text-white font-semibold hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Secure SSL
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Encrypted
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  GDPR Compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
