import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Check, X, ArrowRight, HelpCircle } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "Perfect for individuals and small teams getting started.",
    price: { monthly: 0, yearly: 0 },
    features: [
      { text: "Up to 100 contacts", included: true },
      { text: "Basic deal pipeline", included: true },
      { text: "Task management", included: true },
      { text: "Email integration", included: true },
      { text: "Basic analytics", included: true },
      { text: "API access", included: false },
      { text: "Custom fields", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get started free",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing teams that need more power and flexibility.",
    price: { monthly: 29, yearly: 24 },
    features: [
      { text: "Unlimited contacts", included: true },
      { text: "Advanced pipeline", included: true },
      { text: "Task automation", included: true },
      { text: "Email & calendar sync", included: true },
      { text: "Advanced analytics", included: true },
      { text: "API access", included: true },
      { text: "Custom fields", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with advanced security needs.",
    price: { monthly: 99, yearly: 79 },
    features: [
      { text: "Everything in Pro", included: true },
      { text: "SSO & SAML", included: true },
      { text: "Advanced permissions", included: true },
      { text: "Audit logs", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated success manager", included: true },
      { text: "SLA guarantee", included: true },
      { text: "24/7 phone support", included: true },
    ],
    cta: "Contact sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, all paid plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Yes, we offer a 30-day money-back guarantee on all paid plans if you're not satisfied.",
  },
  {
    question: "Do you offer discounts for nonprofits?",
    answer:
      "Yes, we offer a 50% discount for registered nonprofits and educational institutions.",
  },
];

const testimonials = [
  {
    quote:
      "Nexus transformed how we manage our sales process. We closed 40% more deals in the first quarter.",
    author: "Sarah Chen",
    role: "VP of Sales, TechCorp",
  },
  {
    quote:
      "The simplicity of Nexus is its superpower. Our team adopted it instantly without any training.",
    author: "Marcus Johnson",
    role: "Founder, GrowthLabs",
  },
  {
    quote:
      "Finally, a CRM that doesn't require a manual. Clean, fast, and exactly what we needed.",
    author: "Elena Rodriguez",
    role: "Sales Director, CloudNine",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Simple, transparent
            <br />
            <span className="text-neutral-400">pricing.</span>
          </h1>
          <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 ${
                  plan.popular
                    ? "border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950"
                    : "border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-medium text-neutral-900 dark:text-white">
                      ${plan.price.monthly}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">/mo</span>
                  </div>
                  {plan.price.yearly > 0 && (
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                      ${plan.price.yearly}/mo billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-neutral-900 dark:text-white" />
                      ) : (
                        <X className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-neutral-600 dark:text-neutral-300"
                            : "text-neutral-400 dark:text-neutral-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/"
                  className={`block w-full text-center text-sm font-medium px-4 py-3 rounded-full transition-colors ${
                    plan.popular
                      ? "bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Loved by teams worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800"
              >
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-medium text-neutral-900 dark:text-white text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b border-neutral-100 dark:border-neutral-800 pb-6"
              >
                <h3 className="flex items-start gap-3 font-medium text-neutral-900 dark:text-white mb-2">
                  <HelpCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed ml-8">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-neutral-900 dark:text-white">
            Still have questions?
          </h2>
          <p className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            Our team is here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium px-8 py-4 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
