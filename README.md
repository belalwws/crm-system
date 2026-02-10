# Nexus CRM — Enterprise Customer Relationship Management

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A modern, enterprise-grade CRM platform with AI-powered insights, real-time collaboration, and a beautiful dark-mode-first UI.**

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Architecture](#architecture) · [API Reference](#api-reference)

</div>

---

## Features

### Core CRM
- **Customer Management** — Full CRUD, status tracking (Lead / Active / Inactive), tagging, notes, contact history
- **Deal Pipeline** — Kanban board + list view, 6-stage pipeline, value & probability tracking, expected close dates
- **Task Management** — Multi-type tasks (Call, Email, Meeting, Follow-up), priority levels, status board, overdue alerts
- **Quotes & Products** — Create quotes with line items, discount/tax support, PDF-ready, link to deals

### Enterprise Features
- **AI Insights (Nexus AI)** — Powered by NVIDIA NIM (Llama 3.3 70B) for dashboard insights, task prioritization, email composition
- **Real-time Notifications** — Socket.IO push notifications with in-app notification center
- **Email Templates** — Create, edit, and manage reusable email templates
- **Document Management** — Upload and attach files to customers/deals
- **Calendar & Meetings** — Schedule and track meetings linked to customers and deals
- **Activity Timeline** — Full audit trail of all CRM interactions per customer/deal
- **Workflow Automation** — Rule-based triggers with configurable conditions and actions
- **Webhooks** — Event-driven external integrations
- **Audit Logs** — Complete platform-wide action logging
- **Bulk Operations** — Bulk delete, status updates, and stage changes

### Admin & Platform
- **Admin Panel** — User management with role changes, invite system, platform settings
- **Role-Based Access** — Admin / Manager / User roles with granular permissions
- **Analytics Dashboard** — Revenue overview, pipeline stats, customer growth charts
- **Reports** — Conversion funnel, deal aging, revenue forecast, activity heatmap
- **Search** — Global search across customers, deals, and tasks
- **Export** — CSV export for customers, deals, and tasks
- **i18n** — English and Arabic language support with RTL layout
- **Dark / Light Mode** — System-aware theme with manual toggle

### Developer Experience
- **Fully Typed** — End-to-end TypeScript with shared types across frontend and backend
- **29 Prisma Models** — Comprehensive relational data model
- **~130 API Endpoints** — RESTful API with consistent response format
- **Shared UI Components** — StatCard, Pagination, ConfirmDialog, StatusBadges, and 20+ primitives
- **Test Suite** — Jest + React Testing Library for controllers, middleware, and components

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React meta-framework with App Router |
| **React 19** | UI library |
| **TypeScript 5** | Static type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Clerk** | Authentication & user management |
| **Zustand** | Lightweight state management |
| **Lucide React** | Icon library |
| **Recharts** | Chart & data visualization |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 4** | HTTP server & REST API |
| **TypeScript 5** | Static type safety |
| **Prisma 5** | ORM with type-safe queries |
| **PostgreSQL** | Relational database (Neon serverless) |
| **Socket.IO** | Real-time WebSocket communication |
| **Redis (ioredis)** | Caching with in-memory fallback |
| **BullMQ** | Background job queue |
| **Clerk SDK** | JWT verification & user sync |
| **Resend** | Transactional email delivery |
| **Multer** | File upload handling |

---

## Getting Started

### Prerequisites
- **Node.js** v18+ — [Download](https://nodejs.org/)
- **PostgreSQL** database (local or [Neon](https://neon.tech/) serverless)
- **Clerk** account — [clerk.com](https://clerk.com/) (free tier)
- (Optional) **Redis** for caching — falls back to in-memory if unavailable

### 1. Clone & Install

```bash
git clone https://github.com/belalwws/crm-system.git
cd crm-system

# Backend
cd backend
npm install
cp .env.example .env    # Configure your variables

# Frontend
cd ../frontend
npm install --legacy-peer-deps
cp .env.example .env    # Configure your variables
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@host:5432/crm?sslmode=require"
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
FRONTEND_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"          # Optional
RESEND_API_KEY="re_..."                     # Optional, for emails
NVIDIA_API_KEY="nvapi-..."                  # Optional, for AI features
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### 3. Set Up Database

```bash
cd backend
npx prisma db push      # Create tables
npx prisma generate     # Generate client
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev              # http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev              # http://localhost:3000
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Nexus CRM                                 │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────┐           ┌──────────────────────┐
│     Frontend       │           │      Backend         │
│  Next.js 16 (App)  │  ◄─────► │  Express + Node.js   │
│  React 19 + TS     │   REST   │  TypeScript          │
│  Tailwind CSS 4    │   API    │  Clerk JWT verify     │
│  Clerk Auth        │          │  Socket.IO            │
└────────────────────┘           └──────────┬───────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                     ┌──────────────┐ ┌──────────┐ ┌──────────┐
                     │  PostgreSQL  │ │  Redis   │ │ NVIDIA   │
                     │  (Prisma)    │ │  Cache   │ │ NIM API  │
                     └──────────────┘ └──────────┘ └──────────┘
```

### Project Structure

```
crm/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # 29 data models
│   ├── src/
│   │   ├── controllers/           # 27 controllers (~130 endpoints)
│   │   │   ├── authController.ts
│   │   │   ├── customerController.ts
│   │   │   ├── dealController.ts
│   │   │   ├── taskController.ts
│   │   │   ├── dashboardController.ts
│   │   │   ├── aiController.ts
│   │   │   ├── notificationController.ts
│   │   │   ├── documentController.ts
│   │   │   ├── emailController.ts
│   │   │   ├── workflowController.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   └── auth.ts            # Clerk JWT verification
│   │   ├── routes/                # Route definitions
│   │   ├── lib/
│   │   │   ├── prisma.ts          # Prisma client
│   │   │   └── email.ts           # Resend integration
│   │   ├── types/
│   │   └── server.ts              # Entry point + Socket.IO
│   └── uploads/                   # File upload storage
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx       # Main dashboard
│   │   │   │   ├── customers/     # Customer management
│   │   │   │   ├── deals/         # Deal pipeline
│   │   │   │   ├── tasks/         # Task management
│   │   │   │   ├── calendar/      # Meeting calendar
│   │   │   │   ├── documents/     # File management
│   │   │   │   ├── emails/        # Email templates
│   │   │   │   ├── analytics/     # Analytics & reports
│   │   │   │   ├── notifications/ # Notification center
│   │   │   │   ├── settings/      # User preferences
│   │   │   │   └── admin/         # Admin panel
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── components/
│   │   │   ├── ui/                # Shared UI primitives
│   │   │   ├── ai/                # AI insight components
│   │   │   ├── deals/             # Deal-specific components
│   │   │   ├── tasks/             # Task-specific components
│   │   │   ├── activity/          # Activity timeline
│   │   │   ├── documents/         # File upload
│   │   │   ├── email/             # Email compose
│   │   │   ├── notifications/     # Notification dropdown
│   │   │   └── search/            # Global search
│   │   ├── lib/
│   │   │   ├── api.ts             # Typed API client
│   │   │   ├── types.ts           # Shared TypeScript types
│   │   │   ├── hooks.ts           # Custom hooks & formatters
│   │   │   └── stores.ts          # Zustand stores
│   │   └── i18n/                  # Internationalization
│   │       ├── index.ts
│   │       └── messages/
│   │           ├── en.json
│   │           └── ar.json
│   └── public/
│
├── README.md
├── SETUP_GUIDE.md
├── ARCHITECTURE_EXPLAINED.md
├── QUICK_START.md
└── TROUBLESHOOTING.md
```

---

## API Reference

All endpoints are prefixed with `/api` and require a valid Clerk JWT token via `Authorization: Bearer <token>` header.

### Authentication
```
POST   /api/auth/register         Register / sync user from Clerk
GET    /api/auth/me               Get current user profile
```

### Customers
```
GET    /api/customers             List customers (paginated, filterable)
GET    /api/customers/:id         Get customer details
POST   /api/customers             Create customer
PUT    /api/customers/:id         Update customer
DELETE /api/customers/:id         Delete customer
```

### Deals
```
GET    /api/deals                 List deals (paginated, filterable)
GET    /api/deals/:id             Get deal details
POST   /api/deals                 Create deal
PUT    /api/deals/:id             Update deal
DELETE /api/deals/:id             Delete deal
```

### Tasks
```
GET    /api/tasks                 List tasks (paginated, filterable)
POST   /api/tasks                 Create task
PUT    /api/tasks/:id             Update task
DELETE /api/tasks/:id             Delete task
```

### Dashboard & Analytics
```
GET    /api/dashboard/stats       Dashboard statistics & monthly data
GET    /api/dashboard/activities  Recent activities feed
```

### Notifications
```
GET    /api/notifications         List notifications
POST   /api/notifications/mark-all-read    Mark all as read
PATCH  /api/notifications/:id/read         Mark one as read
DELETE /api/notifications/:id              Delete notification
```

### Additional Endpoints
```
/api/documents       Document upload & management
/api/emails          Email template CRUD
/api/meetings        Meeting scheduling
/api/notes           Note management
/api/activities      Activity timeline
/api/admin/*         Admin user & settings management
/api/ai/*            AI insights & chat
/api/search          Global search
/api/export          CSV export
/api/bulk/*          Bulk operations
/api/webhooks        Webhook management
/api/workflows       Workflow automation
/api/reports         Report generation
```

---

## Scripts

### Backend
```bash
npm run dev          # Start with ts-node-dev (hot reload)
npm run build        # Compile TypeScript
npm start            # Run compiled output
npm test             # Run Jest test suite
```

### Frontend
```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm start            # Start production server
npm test             # Run Jest + RTL tests
npm run lint         # ESLint check
```

---

## Deployment

### Backend — Railway / Render / Fly.io
1. Set all environment variables from `.env.example`
2. Build command: `npm run build`
3. Start command: `npm start`
4. Ensure PostgreSQL connection (Neon recommended for serverless)

### Frontend — Vercel
1. Connect GitHub repository
2. Framework preset: **Next.js**
3. Set environment variables
4. Install command: `npm install --legacy-peer-deps`
5. Deploy

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with TypeScript, Next.js, PostgreSQL, and Prisma

</div>
