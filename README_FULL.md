<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-5.7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker" alt="Docker">
</p>

# 🚀 Nexus CRM - Enterprise Customer Relationship Management

<p align="center">
  <strong>نظام CRM متكامل وحديث لإدارة العملاء والمبيعات والفرق</strong>
</p>

<p align="center">
  A powerful, full-stack, multi-tenant CRM platform built with modern technologies. Features AI-powered assistant, sales pipeline automation, Stripe billing, real-time notifications, and cross-platform mobile app.
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features](#-features)
  - [Authentication & Security](#-authentication--security)
  - [Customer Management](#-customer-management)
  - [Sales Pipeline](#-sales-pipeline-deals)
  - [Tasks & Productivity](#-tasks--productivity)
  - [Communication](#-communication)
  - [AI Assistant](#-ai-assistant-nexus-ai)
  - [Automation](#-automation--workflows)
  - [Analytics & Reports](#-analytics--reports)
  - [Billing & Subscriptions](#-billing--subscriptions)
  - [Mobile App](#-mobile-app)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Nexus CRM** is an enterprise-grade Customer Relationship Management system designed for modern sales teams. Built with scalability, security, and developer experience in mind.

### Key Highlights

| Feature | Description |
|---------|-------------|
| **Multi-tenant Architecture** | Complete data isolation per user/organization |
| **AI-Powered** | Intelligent assistant for data analysis and task automation |
| **Real-time Updates** | WebSocket-based live notifications and data sync |
| **Cross-platform** | Web (Next.js) + Mobile (React Native/Expo) |
| **Enterprise Security** | RBAC, audit logs, CSRF protection, rate limiting |
| **Stripe Integration** | Full billing lifecycle with usage-based quotas |
| **30+ Database Models** | Comprehensive data schema with Prisma ORM |
| **31 API Controllers** | Feature-rich REST API with 100+ endpoints |

---

## 🎯 Live Demo

| Platform | URL |
|----------|-----|
| 🌐 Web App | `https://nexus-crm.demo.com` |
| 📱 Mobile App | Available on Expo Go |
| 📚 API Docs | `https://api.nexus-crm.demo.com/docs` |

**Demo Credentials:**
```
Email: demo@nexus-crm.com
Password: Demo123!
```

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **Express.js** | 4.18 | Web framework |
| **TypeScript** | 5.3 | Type safety |
| **PostgreSQL** | 16 | Primary database |
| **Prisma** | 5.7 | ORM & migrations |
| **Redis** | 7+ | Caching & job queues |
| **BullMQ** | 5.67 | Background job processing |
| **Socket.io** | 4.8 | Real-time communication |
| **Zod** | 4.3 | Schema validation |
| **Winston** | 3.19 | Logging |
| **Helmet** | 8.1 | Security headers |
| **Multer** | 2.0 | File uploads |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1 | React framework (App Router) |
| **React** | 19.2 | UI library |
| **Tailwind CSS** | 4.0 | Styling |
| **Zustand** | 5.0 | State management |
| **Recharts** | 3.7 | Data visualization |
| **dnd-kit** | 6.3 | Drag & drop (Kanban) |
| **next-intl** | 4.8 | Internationalization |
| **next-themes** | 0.4 | Dark/Light mode |
| **Lucide React** | 0.563 | Icons |

### Mobile
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81 | Mobile framework |
| **Expo** | 54.0 | Development platform |
| **Expo Router** | 6.0 | Navigation |
| **Clerk Expo** | 2.5 | Authentication |

### Infrastructure & Services
| Service | Purpose |
|---------|---------|
| **Clerk** | Authentication & SSO |
| **Stripe** | Payments & subscriptions |
| **Resend** | Transactional emails |
| **NVIDIA NIM** | AI/LLM capabilities |
| **Docker** | Containerization |
| **PostgreSQL** | Primary database |
| **Redis** | Cache & queues |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  Next.js Web    │  │  React Native   │  │  Third-party Apps   │   │
│  │  (Port 3000)    │  │  Mobile App     │  │  (Webhooks/API)     │   │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘   │
└───────────┼────────────────────┼─────────────────────┼───────────────┘
            │                    │                     │
            │        HTTP/REST + WebSocket             │
            └────────────────────┼─────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────┐
│                      EXPRESS.js API SERVER (Port 5000)               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Middleware Pipeline                                             │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │ │
│  │  │ CORS │→│Helmet│→│ Rate │→│ CSRF │→│ Auth │→│ RBAC │→Routes  │ │
│  │  └──────┘ └──────┘ │Limit │ └──────┘ │Clerk │ └──────┘         │ │
│  │                    └──────┘          └──────┘                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Controllers │  │    31+      │  │   Zod       │  │  Winston    │ │
│  │   (31)      │  │  Endpoints  │  │ Validation  │  │  Logging    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐
│  PostgreSQL   │     │    Redis      │     │ External APIs │
│   (Prisma)    │     │  BullMQ Jobs  │     │               │
│  30+ Models   │     │    Cache      │     │ ┌───────────┐ │
│               │     │               │     │ │  Stripe   │ │
│ • Users       │     │ • Sessions    │     │ │  Clerk    │ │
│ • Customers   │     │ • Rate Limits │     │ │  Resend   │ │
│ • Deals       │     │ • Job Queues  │     │ │  NVIDIA   │ │
│ • Tasks       │     │               │     │ └───────────┘ │
│ • +27 more    │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Multi-tenant Data Isolation

```typescript
// Every query is automatically scoped to the authenticated user
const customers = await prisma.customer.findMany({
  where: {
    ownerId: currentUser.id,  // Enforced at query level
    deletedAt: null           // Soft delete support
  }
});
```

---

## ✨ Features

### 🔐 Authentication & Security

| Feature | Description |
|---------|-------------|
| **Clerk SSO** | Email, Google, GitHub, Microsoft authentication |
| **JWT Tokens** | Access tokens + rotating refresh tokens (hashed in DB) |
| **Account Lockout** | Auto-lock after N failed login attempts |
| **Email Verification** | Required before full access |
| **Password Reset** | Secure token-based reset flow |
| **RBAC** | 3-tier roles: Admin, Manager, User |
| **CSRF Protection** | Double-submit cookie pattern |
| **Rate Limiting** | Per-IP and per-user limits |
| **Input Sanitization** | DOMPurify on all user content |
| **Audit Logging** | Immutable trail of all data changes |
| **Webhook Security** | HMAC SHA-256 signature verification |

**Role Permissions:**

| Permission | Admin | Manager | User |
|------------|:-----:|:-------:|:----:|
| View own data | ✅ | ✅ | ✅ |
| Manage own data | ✅ | ✅ | ✅ |
| View team data | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Access audit logs | ✅ | ✅ | ❌ |
| System settings | ✅ | ❌ | ❌ |
| Billing management | ✅ | ❌ | ❌ |

---

### 👥 Customer Management

<table>
<tr>
<td width="50%">

**Core Features**
- Full CRUD with soft delete & restore
- Status tracking: Lead, Active, Inactive
- Lead source tracking (8 sources)
- Industry & company information
- Tags and custom categorization
- Website, phone, address fields
- Notes with @mentions support

</td>
<td width="50%">

**Advanced Features**
- Duplicate detection & merge
- Multiple contacts per company
- Custom fields (9 field types)
- Saved views with filters
- Bulk operations (update, delete, reassign)
- CSV/Excel import & export
- Activity timeline per customer

</td>
</tr>
</table>

**Lead Sources:**
```
Website | Referral | Social Media | Cold Call | Email Campaign | Trade Show | Partner | Other
```

**Customer Statuses:**
```
LEAD → ACTIVE → INACTIVE
```

---

### 📊 Sales Pipeline (Deals)

**6-Stage Kanban Pipeline:**

```
┌─────────┐   ┌───────────┐   ┌──────────┐   ┌─────────────┐   ┌───────────┐   ┌────────────┐
│  LEAD   │ → │ QUALIFIED │ → │ PROPOSAL │ → │ NEGOTIATION │ → │ CLOSED WON│   │ CLOSED LOST│
│         │   │           │   │          │   │             │   │    🎉     │   │     ❌     │
└─────────┘   └───────────┘   └──────────┘   └─────────────┘   └───────────┘   └────────────┘
```

| Feature | Description |
|---------|-------------|
| **Kanban Board** | Drag-and-drop powered by dnd-kit |
| **Deal Values** | Track value, currency, probability |
| **Expected Close** | Date forecasting |
| **Lost Reasons** | Track why deals were lost |
| **Timeline** | Per-deal activity history |
| **Linked Entities** | Tasks, notes, emails, documents, meetings |
| **Revenue Forecast** | Weighted pipeline value |
| **Risk Scoring** | Identify at-risk deals |
| **Bulk Operations** | Mass stage updates, exports |

---

### ✅ Tasks & Productivity

**Task Types:**
```
📞 Call | ✉️ Email | 👥 Meeting | 🔄 Follow-up | 💬 WhatsApp | 📋 Other
```

**Priority Levels:**
```
🟢 Low | 🟡 Medium | 🔴 High | 🚨 Urgent
```

**Task Statuses:**
```
⏳ Pending → 🔄 In Progress → ✅ Completed | ❌ Cancelled
```

| Feature | Description |
|---------|-------------|
| Task assignment | Assign to any team member |
| Due dates | With overdue notifications |
| Link to entities | Customer, deal, or standalone |
| Notes on tasks | Add context and updates |
| Quick complete | One-click completion |
| Bulk operations | Mass update status |

---

### 📬 Communication

#### Email System
- Send emails from customer/deal context
- Reusable templates with variables
- Email status tracking: Sent, Failed, Bounced, Opened, Replied
- Open/reply timestamp tracking
- Per-user signature settings
- CC and Reply-to configuration

#### Meetings & Calendar
- Schedule meetings with customers/deals
- Location, description, reminders
- Outcome recording
- Calendar view integration
- Recurring event support

#### Notes
- Attach to customers, deals, tasks
- Pin important notes
- @mentions support
- Full Markdown support

#### Documents
- File upload with size limits
- Categorization
- Soft delete
- Link to customers/deals
- Storage quota enforcement

---

### 🤖 AI Assistant (Nexus AI)

Powered by **NVIDIA NIM API** for enterprise-grade AI capabilities.

| Feature | Description |
|---------|-------------|
| **Conversational AI** | Natural language interface |
| **Persistent Sessions** | Full chat history |
| **Pinnable Chats** | Save important conversations |
| **Action Execution** | AI can perform CRM actions |
| **Usage Quotas** | Plan-based daily limits |

**AI Actions:**
```typescript
// AI can execute these actions directly
- CREATE_CUSTOMER
- UPDATE_DEAL
- CREATE_TASK
- GENERATE_REPORT
- ANALYZE_PIPELINE
- SUGGEST_ACTIONS
```

**Example Prompts:**
```
"Create a new customer named Acme Corp with email contact@acme.com"
"Show me deals closing this month"
"What are my overdue tasks?"
"Generate a sales report for Q1"
```

---

### ⚡ Automation & Workflows

#### Workflow Rules (No-code Automation)

**Triggers:**
| Trigger | Description |
|---------|-------------|
| `DEAL_STAGE_CHANGED` | When deal moves to new stage |
| `DEAL_CREATED` | When new deal is created |
| `DEAL_UPDATED` | When deal is modified |
| `TASK_OVERDUE` | When task passes due date |
| `CUSTOMER_STATUS_CHANGED` | When customer status changes |
| `CUSTOMER_CREATED` | When new customer is added |

**Actions:**
| Action | Description |
|--------|-------------|
| Create Task | Auto-create follow-up tasks |
| Send Email | Trigger email notifications |
| Change Stage | Auto-advance deals |
| Update Field | Modify entity fields |
| Notify User | Send notifications |

**Example Workflow:**
```json
{
  "name": "Follow-up on New Deals",
  "trigger": "DEAL_CREATED",
  "conditions": {
    "value": { "operator": ">=", "value": 10000 }
  },
  "actions": [
    {
      "type": "CREATE_TASK",
      "params": {
        "title": "Schedule discovery call",
        "dueDate": "+2 days",
        "priority": "HIGH"
      }
    }
  ]
}
```

#### Assignment Rules
- Auto-assign new customers to team members
- Methods: Round-robin or Load-balanced
- Condition-based matching (source, region, etc.)

#### Webhooks
- HTTP callbacks for event-driven integrations
- Supported events: `deal.created`, `deal.won`, `customer.created`, etc.
- HMAC signature verification
- Delivery logs and retry logic

---

### 📈 Analytics & Reports

| Report | Description |
|--------|-------------|
| **Dashboard KPIs** | New customers, open deals, revenue, win rate |
| **Pipeline Funnel** | Visual conversion rates by stage |
| **Revenue Forecast** | Weighted by probability and close date |
| **Sales Performance** | By user, team, time period |
| **Activity Heatmap** | Engagement patterns |
| **Task Analytics** | Completion rates, overdue trends |
| **Lead Source ROI** | Which sources convert best |

**Data Visualization:**
- Recharts-powered interactive charts
- Area, bar, line, and pie charts
- Date range filtering
- Export to CSV/Excel

---

### 💳 Billing & Subscriptions

Powered by **Stripe** for secure payment processing.

#### Plan Tiers

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| **Price** | $0 | $19/mo | $49/mo | $99/mo |
| **Customers** | 50 | 500 | Unlimited | Unlimited |
| **Deals** | 10 | 100 | Unlimited | Unlimited |
| **Team Members** | 1 | 3 | 10 | Unlimited |
| **AI Requests/Day** | 10 | 50 | 200 | Unlimited |
| **Storage** | 100 MB | 1 GB | 10 GB | Unlimited |
| **Workflows** | ❌ | 5 | 25 | Unlimited |
| **Webhooks** | ❌ | ❌ | ✅ | ✅ |
| **Audit Logs** | ❌ | ❌ | ✅ | ✅ |
| **Custom Fields** | ❌ | 5 | 20 | Unlimited |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ |

#### Subscription Features
- Stripe Checkout integration
- Customer portal for self-service
- Trial periods
- Usage quota enforcement
- Webhook handling for subscription events
- Proration on plan changes

**Subscription States:**
```
TRIALING → ACTIVE → PAST_DUE → CANCELED
                  → UNPAID
                  → PAUSED
```

---

### 📱 Mobile App

Cross-platform React Native app built with **Expo**.

| Screen | Features |
|--------|----------|
| **Dashboard** | KPIs, recent activity, quick actions |
| **Customers** | List, search, create, edit |
| **Deals** | Pipeline view, stage updates |
| **Tasks** | Due today, quick complete |
| **Contacts** | Per-customer contacts |
| **Meetings** | Schedule, view calendar |
| **Quotes** | Create, send, track |
| **AI Chat** | Full AI assistant |
| **Notifications** | Push notifications inbox |
| **Search** | Global search |
| **Settings** | Profile, preferences |

**Mobile Features:**
- Clerk authentication
- Push notifications (Expo)
- Offline-capable state
- Pull-to-refresh
- Real-time sync
- Dark mode support

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Kanban Pipeline
![Pipeline](docs/screenshots/pipeline.png)

### AI Assistant
![AI Chat](docs/screenshots/ai-chat.png)

### Customer Management
![Customers](docs/screenshots/customers.png)

### Reports
![Reports](docs/screenshots/reports.png)

### Mobile App
![Mobile](docs/screenshots/mobile.png)

</details>

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm/yarn | Latest |
| Docker | 24+ |
| Docker Compose | 2.20+ |

### External Services
- **Clerk** account (authentication)
- **Stripe** account (payments)
- **Resend** account (email)
- **NVIDIA API key** (AI features)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/nexus-crm.git
cd nexus-crm

# 2. Create environment file
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# Database: localhost:5432
```

### Option 2: Local Development

```bash
# 1. Clone and install dependencies
git clone https://github.com/your-org/nexus-crm.git
cd nexus-crm

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install mobile dependencies
cd ../mobile && npm install

# 2. Setup database
cd ../backend
cp .env.example .env
# Edit .env with your PostgreSQL connection

# Run migrations
npx prisma migrate dev
npx prisma generate

# 3. Start backend (Terminal 1)
npm run dev

# 4. Start frontend (Terminal 2)
cd ../frontend
npm run dev

# 5. Start mobile (Terminal 3)
cd ../mobile
npx expo start
```

### Verify Installation

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check frontend
open http://localhost:3000

# Run tests
cd backend && npm test
cd ../frontend && npm test
```

---

## 📚 API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require the header:
```
Authorization: Bearer <clerk_session_token>
```

### Endpoints Overview

| Domain | Base Path | Methods | Description |
|--------|-----------|---------|-------------|
| **Auth** | `/auth` | POST, GET | Register, login, refresh, verify |
| **Customers** | `/customers` | CRUD + bulk | Customer management |
| **Deals** | `/deals` | CRUD + bulk | Sales pipeline |
| **Tasks** | `/tasks` | CRUD | Task management |
| **Contacts** | `/contacts` | CRUD | Contact management |
| **Products** | `/products` | CRUD | Product catalog |
| **Quotes** | `/quotes` | CRUD | Quote builder |
| **Emails** | `/emails` | POST, GET | Email sending & templates |
| **Documents** | `/documents` | CRUD | File management |
| **Meetings** | `/meetings` | CRUD | Meeting scheduler |
| **Notes** | `/notes` | CRUD | Notes system |
| **Timeline** | `/timeline` | GET | Activity timeline |
| **Activities** | `/activities` | GET | Activity feed |
| **Notifications** | `/notifications` | GET, PATCH | Notification center |
| **AI** | `/ai` | POST, GET | AI chat sessions |
| **Workflows** | `/workflows` | CRUD | Automation rules |
| **Webhooks** | `/webhooks` | CRUD | Webhook management |
| **Teams** | `/teams` | CRUD | Team management |
| **Custom Fields** | `/custom-fields` | CRUD | Field definitions |
| **Reports** | `/reports` | GET | Analytics data |
| **Search** | `/search` | GET | Global search |
| **Export** | `/export` | GET | CSV/Excel export |
| **Bulk** | `/bulk` | POST | Bulk operations |
| **Audit Logs** | `/audit-logs` | GET | Audit trail |
| **Billing** | `/billing` | GET, POST | Stripe integration |
| **Admin** | `/admin` | CRUD | User management |
| **Profile** | `/profile` | GET, PATCH | User profile |

### Example Requests

<details>
<summary>Authentication</summary>

```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
</details>

<details>
<summary>Customers</summary>

```bash
# List customers
GET /api/customers?status=LEAD&page=1&limit=20

# Create customer
POST /api/customers
{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "company": "Acme Corporation",
  "status": "LEAD",
  "source": "WEBSITE"
}

# Update customer
PATCH /api/customers/:id
{
  "status": "ACTIVE"
}
```
</details>

<details>
<summary>Deals</summary>

```bash
# List deals
GET /api/deals?stage=PROPOSAL

# Create deal
POST /api/deals
{
  "title": "Enterprise License",
  "customerId": "cuid_xxx",
  "value": 50000,
  "stage": "QUALIFIED",
  "probability": 40,
  "expectedCloseDate": "2026-03-31"
}

# Update stage
PATCH /api/deals/:id
{
  "stage": "NEGOTIATION",
  "probability": 70
}
```
</details>

---

## 📁 Project Structure

```
nexus-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 30+ database models
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── server.ts              # Express app entry
│   │   ├── controllers/           # 31 domain controllers
│   │   │   ├── authController.ts
│   │   │   ├── customerController.ts
│   │   │   ├── dealController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── aiController.ts
│   │   │   ├── billingController.ts
│   │   │   └── ... (25 more)
│   │   ├── routes/                # API route definitions
│   │   ├── middleware/            # Auth, RBAC, validation
│   │   ├── lib/                   # Utilities (mailer, socket, stripe)
│   │   └── types/                 # TypeScript definitions
│   ├── uploads/                   # File storage
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/         # Protected pages
│   │   │   │   ├── customers/
│   │   │   │   ├── deals/         # Kanban pipeline
│   │   │   │   ├── tasks/
│   │   │   │   ├── ai/            # AI chat
│   │   │   │   ├── billing/
│   │   │   │   ├── reports/
│   │   │   │   └── ... (15 more)
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── (public pages)
│   │   ├── components/
│   │   │   ├── ui/                # Reusable UI components
│   │   │   ├── deals/             # Domain components
│   │   │   ├── tasks/
│   │   │   └── ...
│   │   ├── lib/                   # API client, utilities
│   │   └── i18n/                  # Translations
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── mobile/
│   ├── app/                       # Expo Router screens
│   │   ├── (auth)/                # Auth screens
│   │   ├── (tabs)/                # Tab navigation
│   │   ├── index.tsx              # Home
│   │   ├── contacts.tsx
│   │   ├── ai-chat.tsx
│   │   └── ...
│   ├── components/
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── store.ts               # Zustand store
│   │   └── theme.ts
│   └── package.json
│
├── docker-compose.yml
├── package.json                   # Root scripts
└── README.md
```

---

## 🔧 Environment Variables

### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/crm

# JWT
JWT_SECRET=your_32_char_secret_key

# Clerk
CLERK_SECRET_KEY=sk_live_xxx
CLERK_PUBLISHABLE_KEY=pk_live_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# AI
NVIDIA_API_KEY=nvapi-xxx

# Redis (optional)
REDIS_URL=redis://localhost:6379

# App
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# WebSocket
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🔒 Security

| Layer | Implementation |
|-------|----------------|
| **Authentication** | Clerk SSO with JWT |
| **Password Storage** | bcryptjs with salt |
| **Session Management** | JWT access + hashed refresh tokens |
| **Account Protection** | Lockout after failed attempts |
| **CSRF** | Double-submit cookie pattern |
| **Rate Limiting** | express-rate-limit per IP |
| **Input Sanitization** | DOMPurify on all content |
| **SQL Injection** | Prisma parameterized queries |
| **XSS** | Content Security Policy |
| **Headers** | Helmet security headers |
| **CORS** | Whitelist configuration |
| **Webhooks** | HMAC SHA-256 signatures |
| **Audit Trail** | Immutable change log |
| **Data Isolation** | Multi-tenant query scoping |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Frontend tests
cd frontend
npm test
npm run test:coverage

# E2E tests (if configured)
npm run test:e2e
```

### Test Coverage Goals
- Unit tests: 80%+
- Integration tests: Key flows
- E2E tests: Critical paths

---

## 🚢 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URL
- [ ] Set strong JWT secret
- [ ] Configure Clerk production keys
- [ ] Set Stripe live keys
- [ ] Configure production domain in CORS
- [ ] Set up SSL/TLS
- [ ] Configure Redis for production
- [ ] Set up monitoring (logs, metrics)
- [ ] Configure backup strategy

### Recommended Platforms
- **Vercel** - Frontend (Next.js)
- **Railway** - Backend + Database
- **Neon** - PostgreSQL
- **Upstash** - Redis
- **AWS/GCP** - Full infrastructure

---

## 🗺 Roadmap

### Q1 2026
- [x] Core CRM features
- [x] AI Assistant
- [x] Stripe billing
- [x] Mobile app
- [ ] Email sequence automation

### Q2 2026
- [ ] Calendar integrations (Google, Outlook)
- [ ] Advanced reporting builder
- [ ] API rate limiting dashboard
- [ ] White-label support

### Q3 2026
- [ ] Marketing automation
- [ ] Lead scoring ML model
- [ ] Advanced permissions
- [ ] Marketplace integrations

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Belal WS**

- GitHub: [@belalws](https://github.com/belalws)
- LinkedIn: [Belal WS](https://linkedin.com/in/belalws)

---

<p align="center">
  <strong>Built with ❤️ using modern technologies</strong>
</p>

<p align="center">
  <a href="#-nexus-crm---enterprise-customer-relationship-management">Back to Top ↑</a>
</p>
