# PEOPLE Platform - Future Scope & Production Roadmap

This document outlines the current state of the application, identifies gaps, and provides a comprehensive step-by-step plan to transform it into a production-ready platform.

---

## Executive Summary

The PEOPLE platform is a talent-matching service connecting **Initiators** (clients who post missions) with **Contributors** (freelancers/builders who complete them). The current implementation covers foundational authentication, basic mission management, and user profiles. This roadmap details remaining work across **8 phases**.

---

## Current State Analysis

### ✅ Completed Features

#### Frontend (Client)
| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | ✅ Done | Hero, features, CTA |
| Auth (Login/Signup) | ✅ Done | Firebase email/password, Google OAuth |
| Contributor Dashboard | ✅ Done | Matching engine UI, "Looking for Work" toggle |
| Initiator Dashboard | ✅ Done | Mission stats, mission list |
| Profile Settings | ✅ Done | Edit name, bio, links, skills |
| Mission Explore Page | ✅ Done | Grid view, search, filters, mock fallback |
| Mission Details Page | ✅ Done | Full details, apply modal |
| New Mission Page | ✅ Done | Form with skills, budget, timeline |
| Network Page | ✅ Done | Contributor discovery grid, mock fallback |
| Integrations Page | ✅ Done | Static list of tools |
| Contact Page | ✅ Done | Simulated form submission |

#### Backend (Server)
| Module | Endpoints | Status |
|--------|-----------|--------|
| Users | Register, Get/Update Me, Get by ID | ✅ Done |
| Contributors | Get All, Get/Update Profile, Skills CRUD, Availability | ✅ Done |
| Missions | CRUD, Publish, Milestones, Applications, Status Updates | ✅ Done |
| Skills | Get Skills List | ✅ Done |

#### Infrastructure
- Firebase Authentication (Client SDK)
- Firebase Admin SDK (Server-side token validation)
- Firestore (Database)
- Express.js API with Zod validation
- Zustand state management
- React Router with role-based guards

---

## ❌ Missing Features (Production Gaps)

### Critical (Must Have)
1. **Payments & Escrow** - No Stripe integration
2. **Real-time Notifications** - No push/bell notifications
3. **Messaging System** - No initiator-contributor chat
4. **Admin Panel** - No admin dashboard for moderation
5. **Email Transactional** - Contact form doesn't send emails
6. **Search & Filtering** - Backend doesn't support full-text search
7. **File Uploads** - No Cloudinary integration for avatars/attachments

### Important (Should Have)
8. **Reviews & Ratings** - No reputation system
9. **Contracts & Agreements** - No digital signatures
10. **Reporting & Analytics** - No dashboard analytics
11. **SEO & Meta Tags** - No dynamic head management
12. **Error Tracking** - No Sentry/LogRocket integration

### Nice to Have
13. **AI Matching** - Algorithm is simulated, not real
14. **Mobile App** - Web-only currently
15. **Multi-language** - English only

---

## Phase-by-Phase Implementation Plan

### Phase 1: Core Business Logic Completion
**Timeline**: 1-2 weeks | **Priority**: Critical

#### 1.1 Initiator Module Backend
- [ ] Create `server/src/modules/initiators/` directory
- [ ] Implement `initiators.routes.ts`
  - `GET /api/v1/initiators/me` - Get initiator profile
  - `PATCH /api/v1/initiators/me` - Update company info
  - `GET /api/v1/initiators/:id` - Public profile
- [ ] Implement `initiators.service.ts` with Firestore operations
- [ ] Add initiator profile fields to Firestore types

#### 1.2 Mission Workflow Completion
- [ ] Add mission status transitions: `draft` → `open` → `in_progress` → `completed` → `closed`
- [ ] Implement `POST /api/v1/missions/:id/assign` - Assign contributor
- [ ] Implement `POST /api/v1/missions/:id/complete` - Mark as complete
- [ ] Add milestone progress tracking with percentage

#### 1.3 Application Management Frontend
- [ ] Create `InitiatorDashboard/ApplicationsTab.jsx`
  - List of pending applications per mission
  - Accept/Reject buttons with confirmation
- [ ] Create `ContributorDashboard/MyApplicationsTab.jsx`
  - List of submitted applications with status

---

### Phase 2: Payments & Escrow System
**Timeline**: 2-3 weeks | **Priority**: Critical

#### 2.1 Stripe Integration (Backend)
- [ ] Install Stripe SDK: `npm i stripe`
- [ ] Create `server/src/modules/payments/`
  - `payments.routes.ts`
  - `payments.service.ts`
  - `payments.controller.ts`
- [ ] Implement endpoints:
  - `POST /api/v1/payments/checkout` - Create Stripe Checkout session
  - `POST /api/v1/payments/webhook` - Handle Stripe webhooks
  - `GET /api/v1/payments/balance` - Get user balance
  - `POST /api/v1/payments/release` - Release escrow funds

#### 2.2 Escrow Logic
- [ ] Add `escrowStatus` field to missions: `pending`, `held`, `released`, `refunded`
- [ ] Create escrow hold on mission acceptance
- [ ] Create escrow release on mission completion approval
- [ ] Implement dispute flow with admin intervention

#### 2.3 Payments Frontend
- [ ] Create `PaymentPage.jsx` with Stripe Elements
- [ ] Add payment status to `MissionDetailsPage`
- [ ] Create `WalletPage.jsx` for contributor earnings
  - Balance display
  - Withdrawal to bank (Stripe Connect)
  - Transaction history

---

### Phase 3: Messaging & Notifications
**Timeline**: 2 weeks | **Priority**: Critical

#### 3.1 Notifications Backend
- [ ] Create `server/src/modules/notifications/`
- [ ] Implement endpoints:
  - `GET /api/v1/notifications` - Get user notifications
  - `PATCH /api/v1/notifications/:id/read` - Mark as read
  - `DELETE /api/v1/notifications/:id` - Dismiss
- [ ] Create notification triggers for:
  - New application received
  - Application accepted/rejected
  - Mission status changes
  - New message received
  - Payment received

#### 3.2 Notifications Frontend
- [ ] Create `NotificationsDropdown.jsx` in Navbar
- [ ] Add badge with unread count
- [ ] Create `NotificationsPage.jsx` for full history
- [ ] Implement real-time updates with Firestore listeners

#### 3.3 Messaging System
- [ ] Create `server/src/modules/messages/`
  - `messages.routes.ts`
  - `messages.service.ts`
- [ ] Implement endpoints:
  - `GET /api/v1/conversations` - List conversations
  - `GET /api/v1/conversations/:id/messages` - Get messages
  - `POST /api/v1/conversations/:id/messages` - Send message
- [ ] Create `MessagesPage.jsx` with:
  - Conversation list sidebar
  - Message thread view
  - Real-time updates via Firestore

---

### Phase 4: Reviews & Reputation
**Timeline**: 1-2 weeks | **Priority**: Important

#### 4.1 Reviews Backend
- [ ] Create `server/src/modules/reviews/`
- [ ] Implement endpoints:
  - `POST /api/v1/missions/:id/review` - Submit review (both parties)
  - `GET /api/v1/users/:id/reviews` - Get user reviews
- [ ] Add review schema: `rating`, `comment`, `reviewerId`, `revieweeId`, `missionId`
- [ ] Calculate and store average ratings on user profiles

#### 4.2 Reviews Frontend
- [ ] Create `ReviewModal.jsx` (triggered on mission completion)
- [ ] Add `ReviewsSection` to contributor/initiator profiles
- [ ] Display star ratings on `NetworkPage` cards
- [ ] Add trust score calculation based on reviews

---

### Phase 5: Admin Panel
**Timeline**: 2 weeks | **Priority**: Critical

#### 5.1 Admin Backend
- [ ] Create admin middleware: `requireAdmin`
- [ ] Create `server/src/modules/admin/`
- [ ] Implement endpoints:
  - `GET /api/v1/admin/users` - List all users with filters
  - `PATCH /api/v1/admin/users/:id/verify` - Verify user
  - `PATCH /api/v1/admin/users/:id/suspend` - Suspend user
  - `GET /api/v1/admin/missions` - List all missions
  - `GET /api/v1/admin/disputes` - List payment disputes
  - `PATCH /api/v1/admin/disputes/:id/resolve` - Resolve dispute
  - `GET /api/v1/admin/stats` - Platform statistics

#### 5.2 Admin Frontend
- [ ] Create `client/src/pages/admin/` directory
- [ ] Implement pages:
  - `AdminDashboard.jsx` - Overview stats (users, missions, revenue)
  - `AdminUsersPage.jsx` - User management table
  - `AdminMissionsPage.jsx` - Mission moderation
  - `AdminDisputesPage.jsx` - Dispute resolution
- [ ] Add admin routes with `AdminGuard`

---

### Phase 6: File Uploads & Media
**Timeline**: 1 week | **Priority**: Important

#### 6.1 Cloudinary Integration (Backend)
- [ ] Install Cloudinary SDK: `npm i cloudinary`
- [ ] Create `server/src/services/cloudinary.ts`
- [ ] Implement endpoints:
  - `POST /api/v1/uploads/avatar` - Upload profile picture
  - `POST /api/v1/uploads/attachment` - Upload mission attachments
  - `DELETE /api/v1/uploads/:publicId` - Delete file

#### 6.2 File Upload Frontend
- [ ] Create `ImageUploader.jsx` component
- [ ] Add avatar upload to `ProfileSettings`
- [ ] Add file attachments to `NewMissionPage`
- [ ] Display attachments in `MissionDetailsPage`

---

### Phase 7: Email & Transactional
**Timeline**: 1 week | **Priority**: Important

#### 7.1 Resend Integration
- [ ] Install Resend: `npm i resend`
- [ ] Create `server/src/services/email.ts`
- [ ] Create email templates:
  - `welcome.html` - Welcome email on signup
  - `application-received.html` - Notify initiator
  - `application-accepted.html` - Notify contributor
  - `payment-received.html` - Payment confirmation
  - `password-reset.html` - Password reset
- [ ] Integrate with notification triggers

#### 7.2 Contact Form
- [ ] Update `ContactPage.jsx` to call real API
- [ ] Create `POST /api/v1/contact` endpoint
- [ ] Send email to admin inbox

---

### Phase 8: Production Deployment
**Timeline**: 1-2 weeks | **Priority**: Critical

#### 8.1 Environment & Security
- [ ] Audit all environment variables
- [ ] Set up production Firebase project
- [ ] Configure CORS for production domain
- [ ] Add rate limiting to API
- [ ] Implement CSRF protection
- [ ] Add Helmet.js security headers

#### 8.2 Performance
- [ ] Enable Vite code splitting
- [ ] Add lazy loading for routes
- [ ] Implement image optimization
- [ ] Add service worker for offline support
- [ ] Set up CDN for static assets

#### 8.3 Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Add LogRocket for session replay
- [ ] Configure server logging (Winston/Pino)
- [ ] Set up uptime monitoring (Betteruptime/Pingdom)

#### 8.4 Deployment
- [ ] Deploy backend to Railway/Render/Fly.io
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Set up CI/CD with GitHub Actions
- [ ] Configure custom domain and SSL
- [ ] Set up staging environment

#### 8.5 Documentation
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Write user guide
- [ ] Create contributor onboarding docs
- [ ] Document deployment process

---

## New Pages to Create

| Page | Route | Priority | Description |
|------|-------|----------|-------------|
| My Applications | `/applications` | High | Contributor's submitted applications |
| Mission Applications | `/missions/:id/applications` | High | Initiator's received applications |
| Messages | `/messages` | High | Conversation threads |
| Wallet | `/wallet` | High | Earnings & withdrawals |
| Payment Checkout | `/checkout/:missionId` | High | Stripe payment flow |
| Notifications | `/notifications` | Medium | Full notification history |
| Reviews | `/reviews` | Medium | User reviews page |
| Admin Dashboard | `/admin` | High | Admin overview |
| Admin Users | `/admin/users` | High | User management |
| Admin Missions | `/admin/missions` | High | Mission moderation |
| Admin Disputes | `/admin/disputes` | High | Dispute resolution |
| Terms of Service | `/terms` | Medium | Legal page |
| Privacy Policy | `/privacy` | Medium | Legal page |
| FAQ | `/faq` | Low | Help center |

---

## Database Collections to Add

```
Firestore Structure:
├── users/
├── contributorProfiles/
├── initiatorProfiles/        ← NEW
├── missions/
├── applications/
├── milestones/
├── conversations/            ← NEW
│   └── messages/             ← Subcollection
├── notifications/            ← NEW
├── reviews/                  ← NEW
├── payments/                 ← NEW
│   └── transactions/         ← Subcollection
└── disputes/                 ← NEW
```

---

## Priority Matrix

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 1: Core Business Logic | Medium | High | 🔴 Do First |
| Phase 2: Payments | High | Critical | 🔴 Do First |
| Phase 3: Messaging & Notifications | High | High | 🔴 Do First |
| Phase 4: Reviews & Reputation | Medium | Medium | 🟡 Do Second |
| Phase 5: Admin Panel | High | High | 🟡 Do Second |
| Phase 6: File Uploads | Low | Medium | 🟢 Do Third |
| Phase 7: Email | Low | Medium | 🟢 Do Third |
| Phase 8: Deployment | Medium | Critical | 🔴 Do Last |

---

## Estimated Total Timeline

| Scenario | Timeline |
|----------|----------|
| Full-time (40 hrs/week) | 8-10 weeks |
| Part-time (20 hrs/week) | 16-20 weeks |
| With team (2-3 devs) | 4-6 weeks |

---

## Quick Wins (Can Do Today)

1. **Fix Contact Form** - Connect to Resend API (30 min)
2. **Add Loading States** - Improve perceived performance (1 hr)
3. **Add 404 Page Design** - Replace basic 404 with styled page (30 min)
4. **Add Favicon & Meta Tags** - SEO basics (30 min)
5. **Implement Logout Everywhere** - Add logout to navbar mobile menu (15 min)

---

## Tech Debt to Address

- [ ] Remove all `console.log` statements from production code
- [ ] Add proper TypeScript types to frontend (convert to TSX)
- [ ] Extract hardcoded strings to constants/config
- [ ] Add unit tests for critical services
- [ ] Add E2E tests for auth and mission flows
- [ ] Optimize bundle size (currently 618KB, target <300KB)

---

*Last Updated: January 2, 2026*
*Document Version: 1.0*
