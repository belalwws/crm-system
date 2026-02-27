# Enterprise CRM System

A full-stack, multi-tenant CRM platform built with **Next.js 16**, **Express.js**, and **PostgreSQL**. Includes an AI assistant, sales pipeline, automation workflows, Stripe billing, real-time notifications, and a React Native mobile app.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Mobile App](#mobile-app)
- [Security](#security)
- [Billing Plans](#billing-plans)
- [Running Tests](#running-tests)

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + Clerk |
| Real-time | Socket.io |
| Job Queue | BullMQ + Redis |
| Email | Resend |
| Payments | Stripe |
| AI | NVIDIA NIM API |
| File Upload | Multer |
| Logging | Winston |
| Validation | Zod + express-validator |
| Security | Helmet, CSRF, Rate Limiting, DOMPurify |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| Auth | Clerk |
| State | Zustand |
| Charts | Recharts |
| Drag & Drop | dnd-kit (Kanban board) |
| i18n | next-intl |
| Theme | next-themes (Dark / Light) |
| Real-time | Socket.io client |

### Mobile
| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| State | Zustand |
| Navigation | Expo Router |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| DB | PostgreSQL 16 Alpine |
| Cache / Queue | Redis |

---

## Architecture

```
+---------------------------------------------------------+
|                        Clients                          |
|   Next.js Web App (port 3000)  |  Expo Mobile App      |
+------------------------+--------------------------------+
                         | HTTP / WebSocket
+------------------------v--------------------------------+
|             Express.js REST API (port 5000)             |
|    Auth  |  RBAC  |  Rate Limit  |  CSRF  |  Validate   |
+--------+------------------------------------------+----+
         |                                          |
+--------v---------+                   +------------v-----+
|   PostgreSQL      |                   |  Redis + BullMQ  |
|   (Prisma ORM)    |                   |   (Job Queues)   |
+------------------+                   +------------------+
```

**Multi-tenant**: Every record is scoped to the authenticated user via `ownerId`. Users only ever see their own data  enforced at the database query level.

---

## Features

### Authentication & Authorization
- Email/password registration with email verification link
- Clerk SSO integration (Google, GitHub, etc.)
- JWT access tokens + rotating refresh tokens (stored hashed in DB)
- Account lockout after repeated failed login attempts
- Password reset via email
- Role-based access control  **ADMIN**, **MANAGER**, **USER**
- Middleware-level permission enforcement on every protected route

### Customer Management
- Full CRUD with soft delete and restore
- Statuses: `LEAD`, `ACTIVE`, `INACTIVE`
- Lead sources: Website, Referral, Social Media, Cold Call, Email Campaign, Trade Show, Partner
- Tags, industry, website, address, phone fields
- Duplicate detection and merge
- Multiple contacts per customer (company  contacts model)
- Custom fields per entity
- Saved views with filters, sorting, and column visibility
- Bulk operations (update status, delete, export, reassign)

### Sales Pipeline (Deals)
- Kanban drag-and-drop board powered by dnd-kit
- 6 pipeline stages: `LEAD  QUALIFIED  PROPOSAL  NEGOTIATION  CLOSED WON  CLOSED LOST`
- Deal value, probability, expected close date, lost reason
- Per-deal timeline, notes, tasks, emails, documents, meetings
- Revenue forecasting reports

### Tasks
- Types: Call, Email, Meeting, Follow-up, WhatsApp, Other
- Priorities: Low, Medium, High, Urgent
- Statuses: Pending, In Progress, Completed, Cancelled
- Assign to any user; link to a customer or deal
- Due-date reminders and overdue notifications

### Contacts
- Separate contact records linked to customer companies
- Job title, department, LinkedIn, primary-contact flag
- Soft delete with restore

### Products & Quotes
- Product catalog with SKU, unit price, currency, category
- Quote builder with line items (quantity, unit price, per-line discount)
- Quote-level discount (percentage or fixed) and tax calculation
- Statuses: Draft, Sent, Accepted, Rejected, Expired
- Auto-generated sequential quote numbers
- Link quotes to deals

### Email System
- Send emails from within deals or customer profiles
- Reusable email templates with categories
- Email log with statuses: Sent, Failed, Bounced, Opened, Replied
- Open/reply timestamp tracking
- Per-user default CC, reply-to, and email signature settings

### Meetings & Calendar
- Schedule meetings linked to customers and deals
- Location, description, start/end time, before-meeting reminder
- Outcome recording after the meeting
- Calendar view in the dashboard

### Notes
- Notes on customers, deals, and tasks
- Pin notes to the top
- @mentions support

### Timeline
- Unified activity timeline per customer and deal
- Event types: Note, Call, Email Sent/Received, Meeting, WhatsApp, Stage Change, Status Change, Task Created/Completed, File Uploaded, Deal Won/Lost, Mention, System

### Documents
- File upload (Multer) attached to customers and deals
- Name, type, size, category stored; soft delete

### Notifications
- In-app notifications with real-time delivery via Socket.io
- Types: Task Due, Task Assigned, Task Overdue, Deal Won/Lost, Deal Stage Changed, New Customer, Duplicate Detected, Workflow Triggered, Reminder, System
- Mobile push notifications via Expo push tokens
- Per-user preferences for email and push channels

### AI Assistant
- Conversational AI powered by NVIDIA NIM API
- Persistent chat sessions with full history
- Pinnable sessions
- AI can execute CRM actions: create customer, update deal, create task, etc.
- Action type + result stored per message for full traceability
- Daily AI request quota by subscription plan

### Workflow Automation
- Trigger-based rules (no code)
- Triggers: Deal Stage Changed, Deal Created/Updated, Task Overdue, Customer Status Changed/Created
- JSON-based conditions (field / operator / value)
- Actions: Create Task, Send Email, Change Stage, etc.
- Execution logs (success/failed) with details
- Enable/disable without deleting

### Assignment Rules
- Auto-assign new customers to team members
- Methods: round-robin or load-balanced
- Condition-based matching (source, region, etc.)

### Webhooks
- Register HTTP endpoints for event-driven integrations
- Supported events: `deal.created`, `deal.won`, `customer.created`, etc.
- HMAC secret for payload signature verification
- Delivery logs with HTTP status, response, fail counter

### Teams
- Create teams and invite members
- Team roles: Owner, Admin, Member

### Custom Fields
- Define extra fields on Customers, Deals, Tasks, or Contacts
- Types: Text, Number, Date, Boolean, Select, Multi-Select, URL, Email, Phone
- Required flag, default value, display order
- Values stored and loaded alongside each entity

### Reports & Analytics
- Dashboard KPIs: new customers, open deals, total revenue, win rate
- Deal pipeline funnel chart
- Revenue over time (Recharts area/bar)
- Sales performance by stage and lead source
- Task completion statistics
- All data exportable

### Search
- Global search across customers, deals, tasks, contacts, notes, documents
- Results classified by entity type

### Export & Import
- Export to CSV or Excel per entity
- Bulk import via CSV with row-level validation and error report

### Bulk Operations
- Select multiple records: update status, delete, restore, reassign, export

### Audit Logs
- Immutable log of every CREATE, UPDATE, DELETE, RESTORE, MERGE, STAGE_CHANGE
- Stores JSON diff of old and new values, IP address, user-agent
- Filterable by entity, user, action, and date range
- Admin-only access

### Billing (Stripe)
- 4 plan tiers: Free, Starter, Professional, Enterprise
- Stripe Checkout + Customer Portal
- Subscription states: Trialing, Active, Past Due, Canceled, Unpaid, Paused
- Usage quotas enforced per endpoint in middleware
- Stripe webhook handling (checkout.completed, subscription updated, invoice events)

### Admin Panel
- User management: list, activate/deactivate, change role
- Platform-wide statistics and usage overview
- System settings: company name, default currency, timezone, max allowed users
- Broadcast push notifications (target by plan, user, or device platform)

### UI/UX
- Light and dark mode (next-themes)
- Fully responsive layout
- Drag-and-drop Kanban for the deals pipeline
- Saved views for quick filtering per entity
- Onboarding flow for new users
- Skeleton loading states and error boundaries
- Display density setting (comfortable / compact)
- Public pages: landing, pricing, features, blog, docs, changelog

### Internationalization
- next-intl with locale routing
- Language switchable at runtime

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Clerk account
- Stripe account
- Resend account (email)
- NVIDIA API key (AI features)

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd crm

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd mobile && npm install && cd ..
```

### 2. Configure Environment Variables

See the [Environment Variables](#environment-variables) section below.

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5432 |

### 4. Development Mode (without Docker)

```bash
# Terminal 1  Backend
cd backend
npx prisma migrate dev
npm run dev

# Terminal 2  Frontend
cd frontend
npm run dev

# Terminal 3  Mobile
cd mobile
npx expo start
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://crm:changeme@localhost:5432/crm

# JWT
JWT_SECRET=your_jwt_secret_at_least_32_chars

# Clerk
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# AI
NVIDIA_API_KEY=nvapi-...

# Redis
REDIS_URL=redis://localhost:6379

# App
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Project Structure

```
crm/
 backend/
    prisma/
       schema.prisma        # 30+ models
       migrations/
    src/
        server.ts
        controllers/         # One controller per domain
        routes/              # One route file per domain
        middleware/          # auth, rbac, subscription, sanitize, validate
        lib/                 # mailer, socket, queue, logger, stripe, etc.
        types/
 frontend/
    src/
        app/
           dashboard/
              customers/
              deals/           # Kanban pipeline
              tasks/
              contacts/
              products/
              quotes/
              emails/
              documents/
              meetings/
              calendar/
              reports/
              analytics/
              ai/              # AI chat
              workflows/
              webhooks/
              teams/
              custom-fields/
              audit-logs/
              billing/
              notifications/
              settings/
           sign-in/
           sign-up/
           (public landing pages)
        components/
        lib/
        i18n/
 mobile/
    app/                     # Expo Router screens
        contacts.tsx
        deals.tsx
        emails.tsx
        meetings.tsx
        notifications.tsx
        products.tsx
        quotes.tsx
        reports.tsx
        search.tsx
        settings.tsx
        teams.tsx
        ai-chat.tsx
 docker-compose.yml
```

---

## API Overview

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

| Domain | Base Path | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, logout, refresh, verify-email, forgot/reset-password |
| Customers | `/api/customers` | CRUD, merge, bulk, export, import |
| Deals | `/api/deals` | CRUD, stage updates, bulk, export |
| Tasks | `/api/tasks` | CRUD, bulk, complete |
| Contacts | `/api/contacts` | CRUD per customer |
| Products | `/api/products` | catalog CRUD |
| Quotes | `/api/quotes` | CRUD, send, accept, reject |
| Emails | `/api/emails` | send, templates, logs |
| Documents | `/api/documents` | upload, list, delete |
| Meetings | `/api/meetings` | CRUD, calendar feed |
| Notes | `/api/notes` | CRUD, pin |
| Timeline | `/api/timeline` | per-entity events |
| Activities | `/api/activities` | feed |
| Notifications | `/api/notifications` | list, mark-read, preferences |
| AI | `/api/ai` | chat, sessions, action execution |
| Workflows | `/api/workflows` | rules CRUD, execution logs |
| Webhooks | `/api/webhooks` | CRUD, delivery logs |
| Teams | `/api/teams` | CRUD, members |
| Custom Fields | `/api/custom-fields` | schema CRUD, values |
| Reports | `/api/reports` | dashboard, pipeline, revenue, tasks |
| Search | `/api/search` | global full-text search |
| Export | `/api/export` | CSV/Excel |
| Bulk | `/api/bulk` | multi-record operations |
| Audit Logs | `/api/audit-logs` | immutable history |
| Billing | `/api/billing` | Stripe checkout, portal, usage, webhook |
| Admin | `/api/admin` | users, settings, system stats |
| Platform Admin | `/api/platform-admin` | cross-tenant management, push broadcast |
| Profile | `/api/profile` | update, avatar, preferences |
| Push Tokens | `/api/push-tokens` | register/revoke (mobile) |

---

## Mobile App

The Expo app connects to the same backend. Available screens:

- Dashboard KPIs
- Customers & Contacts
- Deals pipeline
- Tasks with quick-complete
- Email composer
- Meeting scheduler
- AI chat assistant
- Notifications inbox
- Quotes & Products
- Team management
- Reports
- Global search
- Profile & Settings

---

## Security

| Mechanism | Implementation |
|---|---|
| Password hashing | bcryptjs |
| Session tokens | JWT access + hashed refresh tokens in DB |
| Account lockout | N failed logins  locked until timestamp |
| CSRF protection | Double-submit cookie pattern (`csrf-csrf`) |
| Rate limiting | `express-rate-limit` per IP |
| Input sanitization | DOMPurify on all user content |
| SQL injection | Prisma parameterized queries |
| HTTP headers | Helmet |
| CORS | Configured origin whitelist |
| Webhook integrity | HMAC SHA-256 payload signature |
| Audit trail | Immutable log for all data mutations |
| RBAC | Role checks enforced in middleware |

---

## Billing Plans

| Feature | Free | Starter | Professional | Enterprise |
|---|---|---|---|---|
| Customers | 50 | 500 | Unlimited | Unlimited |
| Deals | 10 | 100 | Unlimited | Unlimited |
| Team members | 1 | 3 | 10 | Unlimited |
| AI requests / day | 10 | 50 | 200 | Unlimited |
| Storage | 100 MB | 1 GB | 10 GB | Unlimited |
| Workflow rules |  | 5 | 25 | Unlimited |
| Webhooks |  |  | Yes | Yes |
| Audit logs |  |  | Yes | Yes |
| Custom fields |  | 5 | 20 | Unlimited |
| Priority support |  |  |  | Yes |

---

## Running Tests

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage
```

---

## License

MIT
