import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Check,
  Users,
  LineChart,
  CheckSquare,
  Zap,
  Shield,
  Star,
  Play,
  Building2,
  Quote,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Clock,
  Mail,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const features = [
  { icon: Users, title: "Customer Management", desc: "Track all your contacts and companies in one place" },
  { icon: LineChart, title: "Deal Pipeline", desc: "Visualize and manage your sales pipeline" },
  { icon: CheckSquare, title: "Task Management", desc: "Never miss a follow-up with smart reminders" },
  { icon: Zap, title: "Automation", desc: "Automate repetitive tasks and workflows" },
  { icon: Shield, title: "Security", desc: "Enterprise-grade security for your data" },
  { icon: Star, title: "Integrations", desc: "Connect with your favorite tools" },
];

const testimonials = [
  {
    quote: "Nexus helped us close 40% more deals in just 3 months. The simplicity is game-changing.",
    author: "Sarah Chen",
    role: "VP of Sales",
    company: "TechCorp",
    image: "/Sarah Chen.png",
  },
  {
    quote: "Finally, a CRM that our team actually wants to use. No training required.",
    author: "Marcus Johnson",
    role: "CEO",
    company: "GrowthLabs",
    image: "/Marcus Johnson.png",
  },
  {
    quote: "We switched from Salesforce and never looked back. Nexus is everything we needed.",
    author: "Elena Rodriguez",
    role: "Sales Director",
    company: "CloudNine",
    image: "/Elena Rodriguez.png",
  },
];

const stats = [
  { value: "50K+", label: "Active Users", icon: Users },
  { value: "$2B+", label: "Revenue Managed", icon: TrendingUp },
  { value: "99.9%", label: "Uptime", icon: Clock },
  { value: "4.9/5", label: "User Rating", icon: Star },
];

const logos = [
  "TechCorp", "StartupXYZ", "CloudNine", "DataFlow", "GrowthLabs", "InnovateCo"
];

const howItWorks = [
  {
    step: "01",
    title: "Import your contacts",
    desc: "Easily import from CSV, spreadsheet, or connect your existing tools.",
  },
  {
    step: "02",
    title: "Set up your pipeline",
    desc: "Customize your deal stages to match your sales process.",
  },
  {
    step: "03",
    title: "Start closing deals",
    desc: "Track progress, set reminders, and watch your revenue grow.",
  },
];

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes! Our Starter plan is free forever for up to 100 contacts. Perfect for individuals and small teams.",
  },
  {
    question: "How long does it take to get started?",
    answer: "You can be up and running in less than 5 minutes. No credit card required, no complicated setup.",
  },
  {
    question: "Can I import data from other CRMs?",
    answer: "Absolutely. We support importing from Salesforce, HubSpot, Pipedrive, and more. Or just upload a CSV.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We use enterprise-grade encryption, regular backups, and are SOC 2 Type II compliant.",
  },
];

const integrations = [
  { name: "Gmail", icon: Mail },
  { name: "Outlook", icon: Mail },
  { name: "Slack", icon: Zap },
  { name: "Zapier", icon: Zap },
  { name: "Stripe", icon: TrendingUp },
  { name: "HubSpot", icon: Users },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Rated 4.9/5 by 2,000+ users</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
                Customer relationships,
                <br />
                <span className="text-neutral-400">simplified.</span>
              </h1>
              
              <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-lg">
                The minimal CRM for modern teams. Track leads, manage deals, and grow your business without the clutter.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <button className="group inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all">
                      Start for free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </SignUpButton>
                  <button className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors group">
                    <div className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center group-hover:border-neutral-500 dark:group-hover:border-neutral-500 transition-colors">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                    Watch demo
                  </button>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </SignedIn>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                <Image
                  src="/flowcv-loved-by-users.png"
                  alt="Loved by users"
                  width={180}
                  height={40}
                  className="h-auto w-auto"
                />
                <span>Join 50,000+ users</span>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 rounded-3xl transform rotate-3" />
              <div className="relative rounded-2xl shadow-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                <Image
                  src="/hero-section-dashboard.png"
                  alt="Nexus CRM Dashboard Preview"
                  width={600}
                  height={450}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-12 px-6 border-y border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-500 mb-8 uppercase tracking-wider">
            Trusted by teams at leading companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {logos.map((logo) => (
              <div
                key={logo}
                className="flex items-center gap-2 text-neutral-400 dark:text-neutral-600"
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Everything you need to sell better
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
              Powerful features to help you manage your entire sales process, from first contact to closed deal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Works with your favorite tools
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              Seamlessly connect with the apps you already use
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <integration.icon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Get started in minutes
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              No complicated setup. No training required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-medium text-neutral-200 dark:text-neutral-800 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 bg-neutral-900 dark:bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-neutral-800 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-medium text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Loved by sales teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-neutral-200 dark:text-neutral-800 mb-4" />
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.author}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white text-sm">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 [&_summary]:list-none"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer">
                  <h3 className="font-medium text-neutral-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-neutral-400 group-open:rotate-45 transition-transform" />
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/contact"
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Have more questions? Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-neutral-900 dark:bg-white rounded-3xl p-8 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white dark:text-neutral-900 mb-6">
              Ready to simplify your sales?
            </h2>
            <p className="text-neutral-400 dark:text-neutral-600 max-w-xl mx-auto mb-10">
              Join thousands of teams already using Nexus to manage their customer relationships. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-medium px-8 py-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                    Get started free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignUpButton>
                <Link
                  href="/pricing"
                  className="text-sm text-neutral-400 dark:text-neutral-600 hover:text-white dark:hover:text-neutral-900 transition-colors"
                >
                  View pricing
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-medium px-8 py-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SignedIn>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Free forever plan
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
