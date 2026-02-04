import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Users,
  LineChart,
  CheckSquare,
  Zap,
  Shield,
  Globe,
  Mail,
  Calendar,
  FileText,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Keep all your customer data in one place. Track interactions, manage contacts, and never miss a follow-up.",
  },
  {
    icon: LineChart,
    title: "Deal Pipeline",
    description:
      "Visualize your sales pipeline from lead to close. Track deal progress, forecast revenue, and identify bottlenecks.",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description:
      "Stay on top of your to-dos. Assign tasks, set priorities, and track completion to keep deals moving forward.",
  },
  {
    icon: Zap,
    title: "Automation",
    description:
      "Automate repetitive tasks. Set up workflows to trigger actions based on customer behavior and deal stages.",
  },
  {
    icon: Shield,
    title: "Security First",
    description:
      "Enterprise-grade security with end-to-end encryption. Your data is safe and compliant with GDPR & SOC 2.",
  },
  {
    icon: Globe,
    title: "Multi-language",
    description:
      "Work in your preferred language. Support for English, Arabic, French, Spanish, and more coming soon.",
  },
];

const advancedFeatures = [
  {
    icon: Mail,
    title: "Email Integration",
    description:
      "Connect your email to track conversations automatically. Gmail, Outlook, and custom SMTP supported.",
  },
  {
    icon: Calendar,
    title: "Calendar Sync",
    description:
      "Sync meetings and events with Google Calendar or Outlook. Never miss an important call or demo.",
  },
  {
    icon: FileText,
    title: "Document Management",
    description:
      "Store and share proposals, contracts, and files. Version control keeps everyone on the same page.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Deep insights into your sales performance. Custom reports, dashboards, and predictive analytics.",
  },
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "10M+", label: "Deals Tracked" },
  { value: "$2B+", label: "Revenue Managed" },
  { value: "99.9%", label: "Uptime" },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Everything you need to
            <br />
            <span className="text-neutral-400">close more deals.</span>
          </h1>
          <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Powerful features to help you manage customers, track deals, and grow your business. All in a clean, minimal interface.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-medium text-neutral-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Core Features
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              Everything you need to manage your sales process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Advanced Capabilities
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              Power tools for growing teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advancedFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            Join thousands of teams already using Nexus to grow their business.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium px-8 py-4 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
