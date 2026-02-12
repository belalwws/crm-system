# Pull Request: Full Security & Quality Remediation

## Summary
Comprehensive security hardening, quality improvements, and test coverage expansion to bring Nexus CRM from B- to production-ready (A-) grade.

**Branch:** `hardening/full-remediation` → `main`  
**Commits:** 5  
**Files Changed:** 61  
**Lines:** +2,133 / -145  

---

## 🔒 Security Changes (Critical → Medium)

### Critical Fixes
| Issue | Before | After |
|-------|--------|-------|
| JWT Expiry | 7 days | **30 minutes** + 7-day refresh token rotation |
| Clerk Auto-Create Password | `"CLERK_SSO_" + random` (plaintext) | `bcrypt.hash(sentinel)` |
| Hardcoded Secrets | Clerk key in `app.json`, production URL in CORS | **Removed**, env var placeholders |
| WebSocket Auth | Any user can join any room | **Ownership verification** via Prisma query |
| Email HTML Injection | Raw `message` in HTML template | **`escapeHtml()`** sanitization |

### High Fixes
| Issue | Before | After |
|-------|--------|-------|
| Account Lockout | None | **10 failed attempts → 30-min lock** |
| Password Policy | No validation | **8+ chars, upper+lower+digit+special** |
| Clerk Audience | Not validated | **`authorizedParties`** from env var |
| Reset Password Rate Limit | None | **Rate limited** in Express |
| CSRF | Silent fallback | **Loud warning** in dev when no secret |

### Medium Fixes
| Issue | Before | After |
|-------|--------|-------|
| Subscription Checks | Fail-open (`next()`) on error | **Fail-closed (503)** |
| SVG Uploads | Allowed (XSS vector) | **Blocked** |
| In-Memory Cache | Unbounded growth | **LRU with 1000-entry max** |

---

## 🔄 Auth System Overhaul

New endpoints added:
- `POST /api/auth/refresh` — Token rotation (revoke old, issue new pair)
- `POST /api/auth/logout` — Revoke single session
- `POST /api/auth/logout-all` — Revoke all sessions
- `GET /api/auth/sessions` — List active sessions

New Prisma model: `RefreshToken` (tokenHash, expiresAt, revokedAt, userAgent, ipAddress)  
New User fields: `failedLoginAttempts`, `lockedUntil`

---

## 🎨 Frontend Quality

- **ConfirmDialog**: Replaced all 22 native `confirm()` calls across 17 pages with styled async `ConfirmDialog` + `useConfirmDialog` hook
- **ApiClient Refresh Interceptor**: Automatic 401 retry with token refresh, concurrent deduplication
- **Loading Skeletons**: Added `loading.tsx` for dashboard, customers, deals, tasks
- **Error Boundaries**: Added `error.tsx` for dashboard, customers, deals, tasks
- **Dark Mode Fix**: Hardcoded `bg-neutral-900` → `bg-white dark:bg-neutral-900` in Modal
- **Dead Code Removal**: Removed unused Zustand UIStore toast system

---

## 🧪 Testing

- **8 new test suites** (68 new tests):
  - authController (23 tests — register, login, refresh, logout, sessions, lockout)
  - productController (7 tests)
  - teamController (9 tests)
  - workflowController (8 tests)
  - auditLogController (5 tests)
  - timelineController (5 tests)
  - documentController (6 tests)
  - quoteController (5 tests)
- **17 new Prisma model mocks** in jest.setup.ts
- **Total: 20 suites, 161 tests, all passing**

---

## 🏗️ DevOps

- Removed `--passWithNoTests` from CI (tests now required)
- Added `--forceExit` to prevent Jest hanging
- Added `backend-audit` CI job (npm audit)
- Fixed Docker: `NEXT_PUBLIC_*` vars passed as `ARG` at build time
- Updated docker-compose.yml: build args for frontend

---

## 📋 Remaining Items (Backlog)

These items were identified but not implemented in this PR to keep scope manageable:

### Frontend (Medium Priority)
- [ ] Activate i18n: Replace hardcoded English with `useTranslation()` across all pages
- [ ] Replace ~50 raw `fetch()` calls with ApiClient methods
- [ ] Add React Hook Form + Zod validation to customer/deal/task forms
- [ ] Break down 600+ line pages into smaller components
- [ ] Add React.memo/useMemo/useCallback to heavy list components
- [ ] Migrate to TanStack Query for data fetching

### Mobile (Medium Priority)
- [ ] Offline support with AsyncStorage queue
- [ ] Push notifications (expo-notifications)
- [ ] Remove or implement unused socket.io-client dependency
- [ ] Split 532-line ui.tsx into individual component files
- [ ] Convert inline styles to StyleSheet.create

### Backend (Low Priority)
- [ ] Add integration tests (Prisma + real DB)
- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement request body validation (Zod schemas) on all routes

### DevOps (Low Priority)
- [ ] Add CD pipeline (auto-deploy on main push)
- [ ] Add mobile CI (Expo EAS build check)
- [ ] Add Dependabot configuration

---

## How to Test

```bash
# Backend tests
cd backend && npm test

# TypeScript check
cd backend && npx tsc --noEmit

# Frontend TypeScript check (4 pre-existing errors, none new)
cd frontend && npx tsc --noEmit

# Docker build
docker-compose build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Migration Required

After merging, run:
```bash
cd backend && npx prisma db push
# OR
cd backend && npx prisma migrate dev --name v4_refresh_tokens_lockout
```

This adds the `RefreshToken` model and `failedLoginAttempts`/`lockedUntil` fields to User.
