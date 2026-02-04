import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Mail, MapPin, Phone, Clock, ArrowRight } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@nexuscrm.com",
    href: "mailto:hello@nexuscrm.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 123-4567",
    href: "tel:+15551234567",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "123 Market St, San Francisco, CA",
    href: "#",
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon-Fri, 9AM-6PM PST",
    href: "#",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Let's talk.
          </h1>
          <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Have a question or want to learn more? We'd love to hear from you. Our team typically responds within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-8">
              <h2 className="text-xl font-medium text-neutral-900 dark:text-white mb-6">
                Send us a message
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    How can we help?
                  </label>
                  <select className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white">
                    <option>General inquiry</option>
                    <option>Sales question</option>
                    <option>Technical support</option>
                    <option>Partnership</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                    placeholder="Tell us more about your needs..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                >
                  Send message
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-medium text-neutral-900 dark:text-white mb-6">
                  Get in touch
                </h2>
                <div className="space-y-4">
                  {contactInfo.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {item.label}
                        </div>
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {item.value}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Help */}
              <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6">
                <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
                  Need quick help?
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Browse our documentation →
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Check system status →
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Visit our help center →
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl h-64 md:h-80 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-neutral-500 dark:text-neutral-400">
                123 Market Street, San Francisco, CA 94105
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
