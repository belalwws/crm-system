import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sparkles, Bug, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const releases = [
  {
    version: "v2.5.0",
    date: "February 1, 2026",
    type: "feature",
    title: "AI-Powered Insights",
    description: "Introducing smart predictions and recommendations powered by machine learning to help you close more deals.",
    changes: [
      { type: "feature", text: "AI deal scoring and win probability predictions" },
      { type: "feature", text: "Smart task recommendations based on deal stage" },
      { type: "feature", text: "Automated follow-up suggestions" },
      { type: "improvement", text: "Enhanced dashboard loading performance" },
      { type: "fix", text: "Fixed timezone issues in calendar sync" },
    ],
  },
  {
    version: "v2.4.0",
    date: "January 15, 2026",
    type: "feature",
    title: "Advanced Reporting",
    description: "New reporting capabilities with custom dashboards and deeper analytics.",
    changes: [
      { type: "feature", text: "Custom report builder with drag-and-drop" },
      { type: "feature", text: "Scheduled email reports" },
      { type: "feature", text: "Export reports to PDF and Excel" },
      { type: "improvement", text: "Updated UI components for better accessibility" },
      { type: "fix", text: "Resolved data sync issues with Google Calendar" },
    ],
  },
  {
    version: "v2.3.2",
    date: "January 5, 2026",
    type: "fix",
    title: "Bug Fixes & Improvements",
    description: "Minor bug fixes and performance improvements.",
    changes: [
      { type: "fix", text: "Fixed email notification delivery delays" },
      { type: "fix", text: "Resolved mobile app crash on iOS" },
      { type: "improvement", text: "Optimized database queries for faster search" },
      { type: "security", text: "Updated dependencies for security patches" },
    ],
  },
  {
    version: "v2.3.0",
    date: "December 20, 2025",
    type: "feature",
    title: "Mobile App Launch",
    description: "Nexus is now available on iOS and Android. Manage your deals on the go.",
    changes: [
      { type: "feature", text: "Native iOS app with offline support" },
      { type: "feature", text: "Native Android app with push notifications" },
      { type: "feature", text: "Mobile-optimized deal pipeline view" },
      { type: "improvement", text: "Enhanced touch interactions" },
    ],
  },
  {
    version: "v2.2.0",
    date: "December 1, 2025",
    type: "feature",
    title: "Email Integration 2.0",
    description: "Completely rebuilt email integration with better reliability and new features.",
    changes: [
      { type: "feature", text: "Two-way email sync with Gmail and Outlook" },
      { type: "feature", text: "Email templates with variables" },
      { type: "feature", text: "Email tracking and open notifications" },
      { type: "improvement", text: "Faster email processing" },
    ],
  },
  {
    version: "v2.1.0",
    date: "November 15, 2025",
    type: "feature",
    title: "Team Collaboration",
    description: "New features to help teams work together more effectively.",
    changes: [
      { type: "feature", text: "Team activity feed" },
      { type: "feature", text: "Deal comments and @mentions" },
      { type: "feature", text: "Shared email templates" },
      { type: "feature", text: "Team performance dashboard" },
    ],
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Sparkles className="w-4 h-4" />;
    case "fix":
      return <Bug className="w-4 h-4" />;
    case "improvement":
      return <Zap className="w-4 h-4" />;
    case "security":
      return <Shield className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

const getBadgeColor = (type: string) => {
  switch (type) {
    case "feature":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "fix":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "improvement":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "security":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">What&apos;s new</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Changelog
          </h1>
          <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and bug fixes.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-0 md:left-24 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Releases */}
            <div className="space-y-12">
              {releases.map((release, i) => (
                <div key={i} className="relative pl-8 md:pl-32">
                  {/* Version Badge */}
                  <div className="absolute left-0 md:left-24 -translate-x-1/2 w-4 h-4 rounded-full bg-neutral-900 dark:bg-white border-4 border-white dark:border-neutral-950" />
                  
                  {/* Date - Desktop */}
                  <div className="hidden md:block absolute left-0 w-20 text-right">
                    <span className="text-sm text-neutral-400">{release.date}</span>
                  </div>

                  {/* Content */}
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800">
                    {/* Mobile Date */}
                    <span className="md:hidden text-sm text-neutral-400 block mb-2">{release.date}</span>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">
                        {release.version}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(release.type)}`}>
                        {release.type.charAt(0).toUpperCase() + release.type.slice(1)}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-medium text-neutral-900 dark:text-white mb-2">
                      {release.title}
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                      {release.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {release.changes.map((change, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(change.type)}`}>
                            {change.type}
                          </span>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {change.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white mb-4">
            What&apos;s coming next?
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto mb-8">
            Check out our public roadmap to see what we&apos;re working on and vote for features you want.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium px-8 py-4 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
          >
            View Roadmap
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
