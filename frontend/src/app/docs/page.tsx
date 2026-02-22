'use client';

import { useState } from 'react';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import {
  BookOpen, Search, ChevronRight, Zap, Users, Briefcase,
  ListTodo, BarChart3, Mail, Shield, Settings, Code,
  ArrowLeft, ExternalLink, FileText, Bot,
} from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    articles: [
      {
        title: 'Quick Start Guide',
        description: 'Set up your Nexus CRM account and get running in minutes.',
        content: `## Quick Start Guide

### 1. Create Your Account
Sign up at [Nexus CRM](/sign-up) using your work email. You'll be automatically set up with a free workspace.

### 2. Add Your First Customer
Navigate to **Dashboard → Customers → Add Customer**. Fill in the name, email, and company details.

### 3. Create a Deal
Go to **Dashboard → Deals → New Deal**. Link it to your customer and set the value and stage.

### 4. Track Tasks
Create tasks from **Dashboard → Tasks** or directly from a customer/deal page for contextual tracking.

### 5. Use AI Assistant
Click the ⚡ button in the bottom-right corner to open the AI assistant. Try commands like:
- "Create a customer named John, email john@company.com"
- "Show my pending tasks"
- "List deals in negotiation stage"`,
      },
      {
        title: 'Dashboard Overview',
        description: 'Understanding your CRM dashboard and key metrics.',
        content: `## Dashboard Overview

Your dashboard provides a real-time snapshot of your CRM performance:

- **Customer Stats** — Total customers, active accounts, and new leads
- **Deal Pipeline** — Revenue by stage, win rate, and forecasted value
- **Task Summary** — Pending tasks, overdue items, and completion rate
- **Activity Feed** — Recent actions across your CRM
- **Monthly Trends** — Revenue and customer growth charts

Use the **AI Insights** panel to get AI-powered recommendations based on your data.`,
      },
    ],
  },
  {
    id: 'customers',
    title: 'Customer Management',
    icon: Users,
    articles: [
      {
        title: 'Managing Customers',
        description: 'Add, edit, and organize your customer database.',
        content: `## Managing Customers

### Adding Customers
Click **Add Customer** and fill in:
- **Name** (required) — Full name or company name
- **Email** (required) — Primary contact email
- **Phone** — Contact number
- **Company** — Organization name
- **Status** — Lead, Active, or Inactive
- **Source** — How the lead was acquired

### Customer Statuses
| Status | Description |
|--------|-------------|
| Lead | New prospect, not yet qualified |
| Active | Engaged customer with ongoing business |
| Inactive | Dormant account, no recent activity |

### Bulk Operations
Select multiple customers to:
- Delete in bulk
- Export to CSV
- Merge duplicate entries`,
      },
      {
        title: 'Customer Timeline',
        description: 'Track all interactions and history for each customer.',
        content: `## Customer Timeline

Each customer page includes a unified timeline showing:
- **Notes** — Internal notes and observations
- **Deals** — Associated opportunities and their stages
- **Tasks** — Assigned follow-ups and action items
- **Emails** — Sent email communications
- **Documents** — Uploaded files and attachments
- **Activities** — System-tracked events

Use the timeline to maintain a complete history of every customer interaction.`,
      },
    ],
  },
  {
    id: 'deals',
    title: 'Deal Pipeline',
    icon: Briefcase,
    articles: [
      {
        title: 'Managing Deals',
        description: 'Create and track opportunities through your sales pipeline.',
        content: `## Managing Deals

### Deal Stages
| Stage | Description |
|-------|-------------|
| Lead | Initial interest identified |
| Qualified | Need confirmed, budget available |
| Proposal | Proposal sent to customer |
| Negotiation | Terms being discussed |
| Closed Won ✅ | Deal successfully closed |
| Closed Lost ❌ | Deal did not close |

### Key Fields
- **Value** — Monetary worth of the deal
- **Probability** — Estimated win percentage (0-100%)
- **Expected Close Date** — Target closing date
- **Customer** — Associated customer account

### Pipeline View
The pipeline dashboard shows deals grouped by stage with drag-and-drop capability for quick stage updates.`,
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Task Management',
    icon: ListTodo,
    articles: [
      {
        title: 'Working with Tasks',
        description: 'Create, assign, and track tasks across your CRM.',
        content: `## Working with Tasks

### Task Types
- **Call** — Phone call follow-ups
- **Email** — Email communications
- **Meeting** — Scheduled meetings
- **Follow-up** — General follow-ups
- **WhatsApp** — Messaging tasks
- **Other** — Custom task types

### Priority Levels
- 🔴 **Urgent** — Requires immediate action
- 🟠 **High** — Important, address soon
- 🟡 **Medium** — Standard priority
- 🟢 **Low** — Address when convenient

### Task Statuses
Track progress with: Pending → In Progress → Completed / Cancelled`,
      },
    ],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    icon: Bot,
    articles: [
      {
        title: 'Using Nexus AI',
        description: 'Leverage AI to automate CRM operations with simple commands.',
        content: `## Using Nexus AI

Nexus AI can execute CRM operations directly from the chat interface.

### Available Commands

**Customer Operations:**
- "Create a customer named Ahmed, email ahmed@company.com"
- "Show me all active customers"
- "Update customer Ahmed's status to Active"

**Deal Operations:**
- "Create a deal worth $50,000 for Ahmed"
- "List deals in negotiation stage"
- "Move the 'Enterprise License' deal to Proposal"

**Task Operations:**
- "Create a high-priority follow-up task for tomorrow"
- "Show my overdue tasks"
- "Mark the 'Call Ahmed' task as completed"

**Analytics:**
- "Show me dashboard statistics"
- "How many deals have I won this month?"

### Chat Sessions
Your conversations are saved automatically. Pin important chats, rename sessions, and continue any conversation where you left off.`,
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: BarChart3,
    articles: [
      {
        title: 'Reports & Analytics',
        description: 'Generate insights from your CRM data.',
        content: `## Reports & Analytics

### Available Reports
- **Conversion Funnel** — Track leads through each pipeline stage
- **Revenue Forecast** — Projected revenue based on deal probability
- **Deal Aging** — Time deals spend in each stage
- **Performance Metrics** — Team and individual performance
- **Activity Heatmap** — Peak activity times and patterns

### AI-Powered Insights
The AI engine analyzes your data to provide:
- Deal outcome predictions
- Customer churn risk assessment
- Task prioritization recommendations
- Sales strategy suggestions`,
      },
    ],
  },
  {
    id: 'emails',
    title: 'Email Integration',
    icon: Mail,
    articles: [
      {
        title: 'Sending Emails',
        description: 'Compose and track emails directly from your CRM.',
        content: `## Email Integration

### Composing Emails
Send emails directly from Nexus CRM using the built-in email composer:
1. Navigate to **Emails** or click **Send Email** from a customer page
2. Select the recipient from your customer database
3. Choose a template or compose from scratch
4. Use **AI Compose** to generate professional email content

### Email Templates
Create reusable templates for common communications:
- Welcome emails
- Follow-up messages
- Proposal outlines
- Meeting confirmations

### Email History
All sent emails are logged and tracked, providing a complete communication history for each customer and deal.`,
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    icon: Shield,
    articles: [
      {
        title: 'Admin Panel',
        description: 'Manage users, roles, and system settings.',
        content: `## Administration

### User Management
Admins can:
- **Invite users** via email
- **Assign roles** (User, Manager, Admin)
- **Activate/Deactivate** accounts
- **View platform stats**

### Roles & Permissions
| Role | Permissions |
|------|------------|
| User | Manage own data, view dashboard |
| Manager | User permissions + view team data |
| Admin | Full access including user management and settings |

### System Settings
Configure:
- Company name and branding
- Default timezone and language
- Email notification preferences
- API access and webhooks`,
      },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Code,
    articles: [
      {
        title: 'REST API Overview',
        description: 'Integrate with Nexus CRM using our REST API.',
        content: `## REST API

### Authentication
All API requests require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

### Base URL
\`\`\`
https://your-domain.com/api
\`\`\`

### Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /customers | List customers |
| POST | /customers | Create customer |
| GET | /deals | List deals |
| POST | /deals | Create deal |
| GET | /tasks | List tasks |
| POST | /tasks | Create task |
| GET | /dashboard/stats | Dashboard statistics |
| POST | /ai/sessions | Create AI chat session |

### Webhooks
Configure webhooks at **Dashboard → Webhooks** to receive real-time notifications for CRM events like customer creation, deal stage changes, and task completion.

### Rate Limits
- General: 100 requests/minute
- Auth endpoints: 10 requests/15 minutes
- AI endpoints: 20 requests/minute`,
      },
    ],
  },
];

export default function DocsPage() {
  const [selectedArticle, setSelectedArticle] = useState<{
    sectionId: string;
    articleIndex: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = searchQuery
    ? sections
        .map((section) => ({
          ...section,
          articles: section.articles.filter(
            (article) =>
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.content.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.articles.length > 0)
    : sections;

  const currentArticle = selectedArticle
    ? sections
        .find((s) => s.id === selectedArticle.sectionId)
        ?.articles[selectedArticle.articleIndex]
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors">
              <BookOpen className="w-6 h-6" />
              <span className="font-bold text-lg">Nexus Docs</span>
            </Link>
            {currentArticle && (
              <div className="flex items-center gap-1 text-neutral-400">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{currentArticle.title}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) setSelectedArticle(null);
                }}
                placeholder="Search docs..."
                className="pl-10 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
              />
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              Dashboard <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentArticle ? (
          /* Article View */
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-violet-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all docs
            </button>
            <article className="prose prose-neutral dark:prose-invert prose-violet max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    currentArticle.content
                      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded text-sm">$1</code>')
                      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                      .replace(/^\| (.+) \|$/gm, (match: string) => {
                        const cells = match.split('|').filter(Boolean).map((c: string) => c.trim());
                        return `<tr>${cells.map((c: string) => `<td class="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm">${c}</td>`).join('')}</tr>`;
                      })
                      .replace(/\n/g, '<br />'),
                    { ALLOWED_TAGS: ['h2', 'h3', 'strong', 'code', 'li', 'tr', 'td', 'br', 'ul', 'ol', 'table', 'thead', 'tbody', 'p', 'a', 'em', 'blockquote', 'pre'], ALLOWED_ATTR: ['class', 'href'] }
                  ),
                }}
              />
            </article>
          </div>
        ) : (
          /* Section Grid */
          <div>
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                Documentation
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
                Everything you need to know about using Nexus CRM — from getting started to advanced features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {section.articles.map((article, index) => (
                      <button
                        key={article.title}
                        onClick={() =>
                          setSelectedArticle({
                            sectionId: section.id,
                            articleIndex: index,
                          })
                        }
                        className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
                      >
                        <FileText className="w-4 h-4 text-neutral-400 group-hover:text-violet-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-neutral-700 dark:text-neutral-200 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                            {article.title}
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {article.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredSections.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
