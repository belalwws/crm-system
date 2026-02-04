import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";

const featuredPost = {
  title: "The Future of CRM: AI-Powered Customer Relationships",
  excerpt: "Discover how artificial intelligence is transforming the way businesses manage customer relationships and what it means for your sales team.",
  author: "Alex Rivera",
  date: "Jan 28, 2026",
  readTime: "8 min read",
  category: "AI & Technology",
  image: "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900",
};

const posts = [
  {
    title: "10 Sales Automation Workflows That Actually Work",
    excerpt: "Streamline your sales process with these proven automation strategies that save time and close more deals.",
    author: "Sarah Chen",
    date: "Jan 25, 2026",
    readTime: "6 min read",
    category: "Sales Tips",
  },
  {
    title: "Building a Customer-Centric Culture",
    excerpt: "How to transform your organization's approach to customer relationships from the ground up.",
    author: "Maya Patel",
    date: "Jan 22, 2026",
    readTime: "5 min read",
    category: "Culture",
  },
  {
    title: "The Complete Guide to Sales Pipeline Management",
    excerpt: "Everything you need to know about creating, managing, and optimizing your sales pipeline for maximum results.",
    author: "James Wilson",
    date: "Jan 18, 2026",
    readTime: "12 min read",
    category: "Guide",
  },
  {
    title: "Remote Sales: Best Practices for 2026",
    excerpt: "How top-performing sales teams are adapting to remote work and maintaining high performance.",
    author: "Sofia Kim",
    date: "Jan 15, 2026",
    readTime: "7 min read",
    category: "Remote Work",
  },
  {
    title: "Data-Driven Sales: Metrics That Matter",
    excerpt: "Cut through the noise and focus on the KPIs that actually drive revenue growth.",
    author: "Marcus Johnson",
    date: "Jan 12, 2026",
    readTime: "9 min read",
    category: "Analytics",
  },
  {
    title: "The Art of the Follow-Up",
    excerpt: "Why most sales are lost in the follow-up and how to master this critical skill.",
    author: "Elena Rodriguez",
    date: "Jan 8, 2026",
    readTime: "5 min read",
    category: "Sales Tips",
  },
];

const categories = [
  "All",
  "Sales Tips",
  "AI & Technology",
  "Culture",
  "Guide",
  "Remote Work",
  "Analytics",
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Insights & Resources
          </h1>
          <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            Expert advice, strategies, and insights to help you build better customer relationships and grow your business.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-12 px-6 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category, i) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  i === 0
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <Link href="#" className="group block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className={`aspect-[16/10] rounded-2xl ${featuredPost.image}`} />
              <div>
                <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-full px-3 py-1 mb-4">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">{featuredPost.category}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-medium text-neutral-900 dark:text-white mb-4 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-medium text-neutral-900 dark:text-white">Latest Articles</h2>
            <Link href="#" className="text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <Link key={i} href="#" className="group block">
                <article className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors h-full flex flex-col">
                  <div className="aspect-[16/9] bg-neutral-100 dark:bg-neutral-800" />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-full px-2.5 py-0.5 mb-3 w-fit">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">{post.category}</span>
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-2 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{post.author}</span>
                      </div>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-white mb-4">
            Stay in the loop
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Get the latest sales tips, product updates, and insights delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-neutral-400 mt-4">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
