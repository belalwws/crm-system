# Enterprise CRM Project Features

## 1. Authentication & Security
- Clerk SSO authentication (email, Google, Microsoft, etc.)
- CSRF protection (frontend/backend)
- RBAC: Admin, Manager, User roles
- Session guards (`isSignedIn`, `isLoaded`) prevent 401s
- Secure password reset, email verification
- Audit logs for all sensitive actions

## 2. Dashboard & Navigation
- Responsive sidebar with 21 tabs
- Dynamic tab visibility by role
- Dashboard stats: deals, customers, tasks, revenue, etc.
- Notification bell, trial banner, modal focus fixes

## 3. Deals & Pipeline
- CRUD for deals, stages, expected close date
- Kanban pipeline view
- Deal aging, risk scoring, revenue forecast
- Bulk import/export

## 4. Customers & Contacts
- CRUD for customers, contacts
- Custom fields (dynamic schema)
- Source tracking, status enums
- Bulk operations

## 5. Tasks & Notes
- Task CRUD, assignment, due dates
- Note CRUD, linking to deals/customers/tasks
- Optional fields: empty string → null

## 6. Meetings & Calendar
- Meeting CRUD, calendar integration
- Date/time picker, recurring events
- Calendar API with auth guards

## 7. Products & Quotes
- Product catalog, pricing
- Quote generation, PDF export
- Quote status tracking

## 8. Documents & Email Templates
- Document upload, storage limits
- Email template editor, variables
- Bulk email send

## 9. Teams & Users
- Team CRUD, user management
- Invite flow, role assignment
- Usage limits by plan

## 10. Reports & Analytics
- Conversion funnel, deal aging, revenue forecast
- Performance metrics, activity heatmap
- Data scoped by user/role

## 11. Workflows & Webhooks
- Workflow automation (triggers, actions)
- Webhook management, logs, test endpoint
- API access for integrations

## 12. Audit Logs
- Full audit trail for all entities
- Admins/managers see all logs, users see own
- Search/filter by entity/action/date

## 13. Billing & Subscription
- Stripe integration, checkout, portal
- Plan grid, upgrade/downgrade
- Usage tracking (customers, deals, users, storage, AI requests)
- Free, Starter, Professional, Enterprise tiers

## 14. AI & Nexus
- AI chat, insights, document analysis
- Usage limits by plan
- Custom AI workflows

## 15. Mobile App
- Expo React Native app
- All core features: deals, customers, tasks, meetings, etc.
- Clerk auth, type-safe API

## 16. Backend Architecture
- Express.js + TypeScript
- Prisma ORM (PostgreSQL/Neon)
- Neon keepalive, retry, pooler
- Zod validation: flexEnum, optionalDateString, optionalId
- Redis (optional, fallback to in-memory)

## 17. Frontend Architecture
- Next.js 16 (App Router)
- React 19, Tailwind v4
- Defensive state: empty/null handling
- Modern UI, accessibility fixes

## 18. DevOps & Hardening
- Docker Compose (frontend, backend, db)
- Health checks, EADDRINUSE retry, SIGUSR2 for nodemon
- Error logging, deduped health check promise
- Full audit/fix of auth guards, role gates, defensive state

---

For each feature, see the relevant controller, page, or API route for implementation details. All fixes and improvements are documented in the latest commit.
