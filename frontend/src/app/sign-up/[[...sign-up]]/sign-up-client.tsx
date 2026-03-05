"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, Lock, User, Rocket, Check, Star } from "lucide-react";

const benefits = [
  "Free forever plan available",
  "No credit card required",
  "Setup in under 5 minutes",
];

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setLoading(true);
    setError("");

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;
    setOauthLoading(provider === "oauth_google" ? "google" : "github");
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Something went wrong");
      setOauthLoading(null);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image src="/logo.png" alt="Nexus Logo" width={200} height={200} className="rounded-lg shadow-sm group-hover:shadow-md transition-shadow" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex items-center justify-center pt-24 pb-12 px-6 min-h-screen">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Benefits (Desktop) */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-full px-4 py-2 mb-6 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
              <Rocket className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Start your free trial</span>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
              Start managing your customers better today.
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-lg max-w-md">
              Join thousands of teams using Nexus to track leads, close deals, and grow their business.
            </p>
            
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-neutral-700 dark:text-neutral-300">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <Image src="/flowcv-loved-by-users.png" alt="Loved by users" width={400} height={60} className="w-full max-w-[400px]" />
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50 border border-neutral-200/50 dark:border-neutral-800/50">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic mb-4">
                &ldquo;Nexus transformed how we manage our sales process. We closed 40% more deals in the first quarter.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white">Sarah Chen</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">VP of Sales, TechCorp</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="w-full max-w-[420px] mx-auto lg:mx-0">
            {/* Welcome Badge - Mobile */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-full px-4 py-2 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
                <Rocket className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Start free</span>
              </div>
            </div>

            {/* Heading - Mobile */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Create your account
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-neutral-900 dark:text-white font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Desktop Heading */}
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                Create your account
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-neutral-900 dark:text-white font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50 border border-neutral-200/50 dark:border-neutral-800/50 p-8">
              {pendingVerification ? (
                <form onSubmit={handleVerification} className="space-y-5">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                      Check your email
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                      We sent a verification code to <strong>{email}</strong>
                    </p>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="w-full px-4 py-3.5 text-center text-lg tracking-widest rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all"
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify email"}
                  </button>
                </form>
              ) : (
                <>
                  {/* OAuth Buttons */}
                  <div className="space-y-3 mb-6">
                    <button
                      type="button"
                      onClick={() => handleOAuthSignUp("oauth_google")}
                      disabled={oauthLoading !== null}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all font-medium text-neutral-700 dark:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {oauthLoading === "google" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {oauthLoading === "google" ? "Connecting..." : "Continue with Google"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthSignUp("oauth_github")}
                      disabled={oauthLoading !== null}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all font-medium text-neutral-700 dark:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {oauthLoading === "github" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      )}
                      {oauthLoading === "github" ? "Connecting..." : "Continue with GitHub"}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">or sign up with email</span>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          First name
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                          Last name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          required
                          className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Must be at least 8 characters
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/10 dark:shadow-white/10"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-neutral-700 dark:text-neutral-300 font-medium hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-neutral-700 dark:text-neutral-300 font-medium hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-neutral-400 dark:text-neutral-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  256-bit SSL
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  SOC 2 Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
