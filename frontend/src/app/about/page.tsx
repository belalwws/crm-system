import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArrowRight, Target, Heart, Users, Rocket } from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: Target,
    title: "Simplicity First",
    description:
      "We believe powerful tools don't need to be complicated. Every feature is designed with clarity in mind.",
  },
  {
    icon: Heart,
    title: "Customer Obsessed",
    description:
      "Our customers are at the heart of everything we do. We listen, learn, and continuously improve.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Great things happen when teams work together. We build tools that bring people closer.",
  },
  {
    icon: Rocket,
    title: "Move Fast",
    description:
      "Speed matters in business. We help you close deals faster with streamlined workflows.",
  },
];

const team = [
  {
    name: "Alex Rivera",
    role: "CEO & Co-founder",
    bio: "Former sales lead at Salesforce. Passionate about building tools that actually get used.",
  },
  {
    name: "Maya Patel",
    role: "CTO & Co-founder",
    bio: "Engineering leader with 15+ years building scalable SaaS products.",
  },
  {
    name: "James Wilson",
    role: "Head of Design",
    bio: "Believes great design is invisible. Previously at Figma and Apple.",
  },
  {
    name: "Sofia Kim",
    role: "Head of Customer Success",
    bio: "Dedicated to making every customer successful. Ex-HubSpot.",
  },
];

const milestones = [
  { year: "2021", event: "Nexus founded" },
  { year: "2022", event: "Launched public beta" },
  { year: "2023", event: "Reached 10,000 users" },
  { year: "2024", event: "Series A funding" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
              Building the CRM
              <br />
              <span className="text-neutral-400">we always wanted.</span>
            </h1>
            <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-lg">
              Nexus was born from frustration with bloated, complicated CRMs. We set out to build something different — a tool that teams actually enjoy using.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                We believe every business deserves access to powerful tools that help them build better relationships with their customers. Not just enterprises with big budgets — everyone.
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Our mission is to democratize CRM technology by making it simple, affordable, and accessible to teams of all sizes. No complicated setups, no expensive consultants, no endless training.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800">
                <div className="text-3xl font-medium text-neutral-900 dark:text-white">50K+</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Active teams</div>
              </div>
              <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800">
                <div className="text-3xl font-medium text-neutral-900 dark:text-white">150+</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Countries</div>
              </div>
              <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800">
                <div className="text-3xl font-medium text-neutral-900 dark:text-white">$2B</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Revenue managed</div>
              </div>
              <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800">
                <div className="text-3xl font-medium text-neutral-900 dark:text-white">99.9%</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Our Values
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex gap-4 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Our Journey
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {milestones.map((milestone, i) => (
              <div key={milestone.year} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-medium text-neutral-900 dark:text-white">
                    {milestone.year}
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {milestone.event}
                  </div>
                </div>
                {i < milestones.length - 1 && (
                  <div className="hidden md:block w-16 h-px bg-neutral-200 dark:bg-neutral-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white">
              Meet the Team
            </h2>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">
              The people behind Nexus
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                <h3 className="font-medium text-neutral-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  {member.role}
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto">
                  {member.bio}
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
            Join our team
          </h2>
          <p className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            We're always looking for talented people who are passionate about building great products.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium px-8 py-4 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
            >
              View open positions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
