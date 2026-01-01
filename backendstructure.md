# PEOPLE Platform - Backend Architecture & Production-Ready Blueprint

> **Expert-Level Backend Design Document**  
> **Version:** 1.0  
> **Target:** Production-Ready, Scalable, Secure

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Recommended Technology Stack](#recommended-technology-stack)
4. [Database Schema Design](#database-schema-design)
5. [API Architecture](#api-architecture)
6. [File Structure Blueprint](#file-structure-blueprint)
7. [Authentication & Authorization](#authentication--authorization)
8. [Core Service Modules](#core-service-modules)
9. [Real-Time Infrastructure](#real-time-infrastructure)
10. [Payment & Escrow System](#payment--escrow-system)
11. [Matching Algorithm Design](#matching-algorithm-design)
12. [Security Best Practices](#security-best-practices)
13. [DevOps & Deployment](#devops--deployment)
14. [Future Scope & Scalability](#future-scope--scalability)
15. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

The PEOPLE platform requires a robust, scalable backend to support its mission-based marketplace model. This document outlines a production-ready architecture that can handle:

- **10,000+ concurrent users**
- **Real-time matching algorithms**
- **Secure escrow payments**
- **Zero-failure mission execution**

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Node.js with TypeScript | Type safety, ecosystem, team familiarity |
| Framework | Express.js → Fastify (recommended) | Performance, schema validation |
| Database | PostgreSQL + Redis | ACID compliance, caching |
| ORM | Prisma | Type-safe, migrations, excellent DX |
| Auth | JWT + OAuth 2.0 | Stateless, industry standard |
| Real-time | Socket.io | WebSocket with fallbacks |
| Payments | Stripe Connect | Marketplace escrow support |
| Deployment | Cloudflare Workers + Railway/Render | Edge-first, cost-effective |

---

## Current State Analysis

### What Exists

```javascript
// server/index.js - CURRENT STATE
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('People Platform API is running');
});

app.get('/api/auth/me', (req, res) => {
    res.json({ id: 1, name: 'Test User', role: 'initiator' });
});

app.listen(5000);
```

### Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No database | Cannot persist any data | 🔴 Critical |
| No real auth | Zero security | 🔴 Critical |
| No API routes | Frontend is static | 🔴 Critical |
| No validation | Injection vulnerabilities | 🔴 Critical |
| No payment system | Cannot monetize | 🔴 Critical |
| No real-time | Poor UX for matching | 🟡 High |
| No file uploads | Cannot submit work | 🟡 High |
| No email system | No transactional emails | 🟠 Medium |

---

## Recommended Technology Stack

### Core Stack

```yaml
Runtime:
  - Node.js 20 LTS (with ES Modules)
  - TypeScript 5.x

Framework:
  - Express.js 5.x (current) → Fastify 4.x (recommended upgrade)
  - Reason: Fastify is 2-3x faster, built-in validation

Database:
  Primary: PostgreSQL 16
    - ACID compliance for financial transactions
    - Advanced querying for matching algorithm
    - Row-level security for multi-tenant data
  
  Cache/Sessions: Redis 7
    - Session storage
    - Rate limiting
    - Real-time pub/sub
    - Queue management

ORM: Prisma
  - Type-safe database client
  - Auto-generated migrations
  - Excellent TypeScript integration

Auth:
  - Passport.js (strategies)
  - JWT (access tokens)
  - Argon2 (password hashing)
  - OAuth 2.0 (GitHub, Google)

Real-time:
  - Socket.io 4.x
  - Redis adapter for horizontal scaling

Payments:
  - Stripe Connect (marketplace mode)
  - Custom escrow logic

File Storage:
  - Cloudflare R2 or AWS S3
  - Signed URLs for secure access

Email:
  - Resend or SendGrid
  - React Email for templates

Job Queue:
  - BullMQ (Redis-based)
  - For async tasks (matching, emails, etc.)

Validation:
  - Zod (schema validation)
  - Helmet (security headers)

Monitoring:
  - Sentry (error tracking)
  - Prometheus + Grafana (metrics)
```

---

## Database Schema Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ CONTRIBUTOR_PROFILES : has
    USERS ||--o{ INITIATOR_PROFILES : has
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ NOTIFICATIONS : receives
    
    INITIATOR_PROFILES ||--o{ MISSIONS : creates
    
    MISSIONS ||--o{ MILESTONES : contains
    MISSIONS ||--o{ MISSION_ASSIGNMENTS : has
    MISSIONS ||--o{ MISSION_APPLICATIONS : receives
    
    CONTRIBUTOR_PROFILES ||--o{ MISSION_ASSIGNMENTS : assigned_to
    CONTRIBUTOR_PROFILES ||--o{ MISSION_APPLICATIONS : submits
    CONTRIBUTOR_PROFILES ||--o{ SKILLS : has
    CONTRIBUTOR_PROFILES ||--o{ PROOF_TASKS : completes
    
    MISSION_ASSIGNMENTS ||--o{ WORK_SUBMISSIONS : delivers
    MISSION_ASSIGNMENTS ||--o{ REVIEWS : receives
    
    MILESTONES ||--o{ ESCROW_TRANSACTIONS : funds
    
    USERS ||--o{ MESSAGES : sends
    CONVERSATIONS ||--o{ MESSAGES : contains
```

### Complete Table Definitions

#### 1. Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    password_hash VARCHAR(255), -- Null for OAuth users
    
    -- OAuth fields
    oauth_provider VARCHAR(50), -- 'github', 'google', null
    oauth_id VARCHAR(255),
    
    -- Profile
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- Role & Status
    primary_role VARCHAR(20) NOT NULL CHECK (primary_role IN ('contributor', 'initiator', 'admin')),
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(primary_role);
```

---

#### 2. Contributor Profiles Table

```sql
CREATE TABLE contributor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Verification Status
    verification_status VARCHAR(30) DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'proof_task_submitted', 'verified', 'rejected')),
    verification_date TIMESTAMPTZ,
    
    -- Availability
    is_looking_for_work BOOLEAN DEFAULT false,
    availability_hours_per_week INTEGER DEFAULT 20,
    timezone VARCHAR(50),
    
    -- Professional Info
    headline VARCHAR(255),
    bio TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    years_experience INTEGER DEFAULT 0,
    
    -- Scores (0-100)
    trust_score INTEGER DEFAULT 0,
    match_power INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Statistics
    total_missions_completed INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    shadow_assignments INTEGER DEFAULT 0,
    
    -- Background Check
    background_check_status VARCHAR(30) DEFAULT 'not_started'
        CHECK (background_check_status IN ('not_started', 'in_progress', 'passed', 'failed')),
    background_check_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributor_looking ON contributor_profiles(is_looking_for_work) WHERE is_looking_for_work = true;
CREATE INDEX idx_contributor_verified ON contributor_profiles(verification_status) WHERE verification_status = 'verified';
```

---

#### 3. Initiator Profiles Table

```sql
CREATE TABLE initiator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Organization Info
    company_name VARCHAR(255),
    company_url TEXT,
    company_size VARCHAR(20) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    industry VARCHAR(100),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    
    -- Statistics
    total_missions_posted INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Payment Info (Stripe)
    stripe_customer_id VARCHAR(255),
    default_payment_method_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 4. Skills Table

```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'language', 'framework', 'tool', 'domain'
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE contributor_skills (
    contributor_id UUID NOT NULL REFERENCES contributor_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) DEFAULT 'intermediate' 
        CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER DEFAULT 1,
    verified BOOLEAN DEFAULT false,
    PRIMARY KEY (contributor_id, skill_id)
);
```

---

#### 5. Missions Table

```sql
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_id UUID NOT NULL REFERENCES initiator_profiles(id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    problem_statement TEXT,
    success_criteria TEXT,
    
    -- Classification
    type VARCHAR(50) NOT NULL CHECK (type IN ('algorithm', 'frontend', 'backend', 'fullstack', 'mobile', 'devops', 'design', 'qa', 'security', 'data', 'other')),
    complexity VARCHAR(20) DEFAULT 'medium' CHECK (complexity IN ('easy', 'medium', 'hard', 'expert')),
    
    -- Budget & Timeline
    budget_min DECIMAL(10,2) NOT NULL,
    budget_max DECIMAL(10,2) NOT NULL,
    estimated_duration_days INTEGER NOT NULL,
    deadline TIMESTAMPTZ,
    
    -- Team Structure
    max_lead_contributors INTEGER DEFAULT 1,
    max_shadow_contributors INTEGER DEFAULT 1,
    requires_core_reviewer BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
        'draft',           -- Initial creation
        'pending_funding', -- Awaiting escrow
        'open',           -- Accepting applications
        'matching',       -- Algorithm finding team
        'in_progress',    -- Work started
        'in_review',      -- Deliverables submitted
        'completed',      -- Successfully done
        'cancelled',      -- Initiator cancelled
        'disputed'        -- Payment dispute
    )),
    
    -- Visibility
    is_public BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_budget CHECK (budget_min <= budget_max)
);

CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_type ON missions(type);
CREATE INDEX idx_missions_public ON missions(is_public, status) WHERE is_public = true;
```

---

#### 6. Mission Required Skills Table

```sql
CREATE TABLE mission_required_skills (
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    importance VARCHAR(20) DEFAULT 'required' CHECK (importance IN ('required', 'preferred', 'nice_to_have')),
    PRIMARY KEY (mission_id, skill_id)
);
```

---

#### 7. Milestones Table

```sql
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    
    -- Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    
    -- Payment
    amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Not started
        'in_progress',  -- Work ongoing
        'submitted',    -- Awaiting review
        'approved',     -- Initiator approved
        'revision',     -- Needs changes
        'paid'          -- Payment released
    )),
    
    -- Dates
    due_date TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_milestone_order UNIQUE (mission_id, order_index)
);
```

---

#### 8. Mission Assignments Table

```sql
CREATE TABLE mission_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
    
    -- Role
    role VARCHAR(30) NOT NULL CHECK (role IN ('lead', 'shadow', 'core_reviewer')),
    
    -- Status
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN (
        'invited',       -- Awaiting acceptance
        'active',        -- Working
        'stepped_up',    -- Shadow became lead
        'completed',     -- Finished
        'withdrawn',     -- Contributor left
        'removed'        -- Initiator removed
    )),
    
    -- Performance
    rating DECIMAL(3,2), -- 0.00 to 5.00
    review_text TEXT,
    
    -- Dates
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT unique_assignment UNIQUE (mission_id, contributor_id)
);

CREATE INDEX idx_assignments_contributor ON mission_assignments(contributor_id);
CREATE INDEX idx_assignments_active ON mission_assignments(status) WHERE status = 'active';
```

---

#### 9. Mission Applications Table

```sql
CREATE TABLE mission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
    
    -- Application Details
    cover_letter TEXT,
    proposed_timeline INTEGER, -- days
    proposed_approach TEXT,
    
    -- Algorithm Score
    match_score DECIMAL(5,2), -- Algorithm-calculated
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',       -- Awaiting review
        'shortlisted',   -- Under consideration
        'accepted',      -- Offered role
        'rejected',      -- Not selected
        'withdrawn'      -- Applicant withdrew
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    
    CONSTRAINT unique_application UNIQUE (mission_id, contributor_id)
);
```

---

#### 10. Escrow Transactions Table

```sql
CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    mission_id UUID NOT NULL REFERENCES missions(id),
    milestone_id UUID REFERENCES milestones(id),
    initiator_id UUID NOT NULL REFERENCES initiator_profiles(id),
    contributor_id UUID REFERENCES contributor_profiles(id),
    
    -- Transaction Details
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'deposit',           -- Initial funding
        'release',           -- Payment to contributor
        'refund',           -- Return to initiator
        'platform_fee',     -- Platform takes cut
        'dispute_hold',     -- Held during dispute
        'dispute_release'   -- Released after resolution
    )),
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Stripe
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded'
    )),
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_escrow_mission ON escrow_transactions(mission_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
```

---

#### 11. Proof Tasks Table

```sql
CREATE TABLE proof_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Task Definition (for library of tasks)
    title VARCHAR(255) NOT NULL,
    scenario TEXT NOT NULL,
    expected_approach TEXT, -- For grading guidance
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    time_limit_minutes INTEGER DEFAULT 45,
    category VARCHAR(50), -- 'backend', 'frontend', 'system_design', etc.
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proof_task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID NOT NULL REFERENCES contributor_profiles(id),
    task_id UUID NOT NULL REFERENCES proof_tasks(id),
    
    -- Submission
    answer TEXT NOT NULL,
    time_taken_seconds INTEGER,
    
    -- Evaluation
    score DECIMAL(5,2), -- 0-100
    feedback TEXT,
    evaluated_by UUID REFERENCES users(id), -- Admin who graded
    
    -- Status
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN (
        'submitted',
        'under_review',
        'passed',
        'failed'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ,
    
    CONSTRAINT unique_submission UNIQUE (contributor_id, task_id)
);
```

---

#### 12. Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Content
    type VARCHAR(50) NOT NULL, -- 'match_found', 'mission_update', 'payment', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'basic' CHECK (priority IN ('basic', 'medium', 'urgent', 'final')),
    
    -- Action
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

---

#### 13. Sessions Table

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token
    refresh_token_hash VARCHAR(255) NOT NULL,
    
    -- Device Info
    user_agent TEXT,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    
    -- Status
    is_valid BOOLEAN DEFAULT true,
    
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_valid ON sessions(is_valid, expires_at) WHERE is_valid = true;
```

---

#### 14. Conversations & Messages Tables

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES missions(id), -- Optional, for mission-specific chats
    
    -- Type
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'mission_team', 'support')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    
    -- Content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at DESC);
```

---

#### 15. Audit Log Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'mission', 'user', 'payment', etc.
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## API Architecture

### RESTful API Design

```yaml
Base URL: /api/v1

Authentication:
  POST   /auth/register           # Create account
  POST   /auth/login              # Login with credentials
  POST   /auth/logout             # Invalidate session
  POST   /auth/refresh            # Refresh access token
  POST   /auth/forgot-password    # Request password reset
  POST   /auth/reset-password     # Reset password
  GET    /auth/me                 # Get current user
  GET    /auth/oauth/:provider    # OAuth redirect
  GET    /auth/oauth/:provider/callback  # OAuth callback

Users:
  GET    /users/:id               # Get user profile
  PATCH  /users/:id               # Update user profile
  DELETE /users/:id               # Delete account

Contributors:
  GET    /contributors            # List contributors (admin/matching)
  GET    /contributors/:id        # Get contributor profile
  PATCH  /contributors/:id        # Update contributor profile
  POST   /contributors/:id/skills # Add skills
  DELETE /contributors/:id/skills/:skillId  # Remove skill
  POST   /contributors/:id/availability     # Update availability

Initiators:
  GET    /initiators/:id          # Get initiator profile
  PATCH  /initiators/:id          # Update initiator profile

Missions:
  GET    /missions                # List missions (with filters)
  POST   /missions                # Create mission
  GET    /missions/:id            # Get mission details
  PATCH  /missions/:id            # Update mission
  DELETE /missions/:id            # Delete/cancel mission
  POST   /missions/:id/publish    # Publish mission
  POST   /missions/:id/fund       # Fund escrow
  GET    /missions/:id/applications    # Get applications
  POST   /missions/:id/applications    # Apply to mission
  GET    /missions/:id/team       # Get assigned team
  POST   /missions/:id/team       # Assign team member
  DELETE /missions/:id/team/:userId    # Remove team member

Milestones:
  GET    /missions/:id/milestones      # List milestones
  POST   /missions/:id/milestones      # Create milestone
  PATCH  /milestones/:id               # Update milestone
  POST   /milestones/:id/submit        # Submit for review
  POST   /milestones/:id/approve       # Approve milestone
  POST   /milestones/:id/request-revision  # Request changes

Payments:
  GET    /payments                     # Transaction history
  POST   /payments/setup-intent        # Create Stripe setup intent
  POST   /payments/fund-escrow         # Fund mission escrow
  POST   /payments/release/:milestoneId    # Release payment
  POST   /payments/refund/:missionId   # Request refund

Notifications:
  GET    /notifications                # Get notifications
  PATCH  /notifications/:id/read       # Mark as read
  POST   /notifications/read-all       # Mark all as read
  DELETE /notifications/:id            # Delete notification

Messages:
  GET    /conversations                # List conversations
  POST   /conversations                # Start conversation
  GET    /conversations/:id            # Get conversation
  GET    /conversations/:id/messages   # Get messages
  POST   /conversations/:id/messages   # Send message

Proof Tasks:
  GET    /proof-tasks/current          # Get assigned task
  POST   /proof-tasks/submit           # Submit answer

Skills:
  GET    /skills                       # List all skills
  GET    /skills/categories            # List categories

Admin:
  GET    /admin/users                  # List all users
  GET    /admin/missions               # All missions
  GET    /admin/analytics              # Platform analytics
  POST   /admin/proof-tasks            # Create proof task
  POST   /admin/proof-tasks/:id/evaluate  # Grade submission
```

---

## File Structure Blueprint

```
server/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── app.ts                      # Express/Fastify app setup
│   ├── server.ts                   # HTTP server initialization
│   │
│   ├── config/
│   │   ├── index.ts                # Config aggregator
│   │   ├── database.ts             # DB connection config
│   │   ├── redis.ts                # Redis connection config
│   │   ├── stripe.ts               # Stripe config
│   │   ├── oauth.ts                # OAuth providers config
│   │   └── constants.ts            # App constants
│   │
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── migrations/         # Migration files
│   │   ├── seed/
│   │   │   ├── index.ts            # Seeder entry
│   │   │   ├── users.ts            # User seeds
│   │   │   ├── skills.ts           # Skills seed
│   │   │   └── missions.ts         # Sample missions
│   │   └── client.ts               # Prisma client instance
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts      # Auth routes
│   │   │   ├── auth.controller.ts  # Route handlers
│   │   │   ├── auth.service.ts     # Business logic
│   │   │   ├── auth.schema.ts      # Zod schemas
│   │   │   ├── auth.middleware.ts  # JWT verification
│   │   │   ├── strategies/         # Passport strategies
│   │   │   │   ├── local.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   ├── github.ts
│   │   │   │   └── google.ts
│   │   │   └── auth.types.ts       # TypeScript types
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.schema.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── contributors/
│   │   │   ├── contributors.routes.ts
│   │   │   ├── contributors.controller.ts
│   │   │   ├── contributors.service.ts
│   │   │   ├── contributors.schema.ts
│   │   │   └── contributors.types.ts
│   │   │
│   │   ├── initiators/
│   │   │   ├── initiators.routes.ts
│   │   │   ├── initiators.controller.ts
│   │   │   ├── initiators.service.ts
│   │   │   └── initiators.types.ts
│   │   │
│   │   ├── missions/
│   │   │   ├── missions.routes.ts
│   │   │   ├── missions.controller.ts
│   │   │   ├── missions.service.ts
│   │   │   ├── missions.schema.ts
│   │   │   └── missions.types.ts
│   │   │
│   │   ├── milestones/
│   │   │   ├── milestones.routes.ts
│   │   │   ├── milestones.controller.ts
│   │   │   └── milestones.service.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.routes.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── escrow.service.ts
│   │   │   └── stripe.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.routes.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── notification.templates.ts
│   │   │
│   │   ├── messages/
│   │   │   ├── messages.routes.ts
│   │   │   ├── messages.controller.ts
│   │   │   └── messages.service.ts
│   │   │
│   │   ├── matching/
│   │   │   ├── matching.service.ts         # Core algorithm
│   │   │   ├── scoring.service.ts          # Score calculation
│   │   │   └── matching.types.ts
│   │   │
│   │   ├── proof-tasks/
│   │   │   ├── proof-tasks.routes.ts
│   │   │   ├── proof-tasks.controller.ts
│   │   │   └── proof-tasks.service.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.ts
│   │       ├── admin.controller.ts
│   │       └── admin.service.ts
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts          # JWT verification
│   │   │   ├── role.middleware.ts          # Role-based access
│   │   │   ├── rate-limit.middleware.ts    # Rate limiting
│   │   │   ├── validation.middleware.ts    # Zod validation
│   │   │   ├── error.middleware.ts         # Error handler
│   │   │   └── logger.middleware.ts        # Request logging
│   │   │
│   │   ├── utils/
│   │   │   ├── password.ts                 # Argon2 hashing
│   │   │   ├── jwt.ts                      # Token generation
│   │   │   ├── slug.ts                     # URL slug generation
│   │   │   ├── pagination.ts               # Pagination helpers
│   │   │   └── errors.ts                   # Custom error classes
│   │   │
│   │   ├── types/
│   │   │   ├── express.d.ts                # Express type extensions
│   │   │   ├── api.types.ts                # API response types
│   │   │   └── common.types.ts             # Shared types
│   │   │
│   │   └── validators/
│   │       └── common.schema.ts            # Shared Zod schemas
│   │
│   ├── jobs/
│   │   ├── queue.ts                        # BullMQ setup
│   │   ├── workers/
│   │   │   ├── email.worker.ts             # Email sending
│   │   │   ├── matching.worker.ts          # Async matching
│   │   │   └── notification.worker.ts      # Push notifications
│   │   └── tasks/
│   │       ├── send-email.ts
│   │       └── process-match.ts
│   │
│   ├── websocket/
│   │   ├── socket.ts                       # Socket.io setup
│   │   ├── handlers/
│   │   │   ├── chat.handler.ts             # Chat events
│   │   │   └── notification.handler.ts     # Real-time notifications
│   │   └── middleware/
│   │       └── socket-auth.ts              # WebSocket auth
│   │
│   └── integrations/
│       ├── stripe/
│       │   ├── webhooks.ts                 # Stripe webhooks
│       │   └── client.ts
│       ├── github/
│       │   └── client.ts                   # GitHub API
│       └── email/
│           ├── client.ts                   # Email provider
│           └── templates/
│               ├── welcome.tsx
│               ├── mission-match.tsx
│               └── payment-received.tsx
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│   ├── generate-types.ts                   # Generate types from Prisma
│   └── migrate.ts                          # Migration runner
│
├── .env.example
├── .env
├── docker-compose.yml                      # Local dev with Postgres + Redis
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
// Access Token (short-lived: 15 min)
interface AccessTokenPayload {
  sub: string;        // User ID
  email: string;
  role: 'contributor' | 'initiator' | 'admin';
  iat: number;
  exp: number;
}

// Refresh Token (long-lived: 7 days)
interface RefreshTokenPayload {
  sub: string;        // User ID
  sessionId: string;  // Session reference
  iat: number;
  exp: number;
}
```

### Role-Based Access Control

```typescript
// roles.ts
export const PERMISSIONS = {
  contributor: [
    'profile:read:own',
    'profile:update:own',
    'missions:read:public',
    'missions:apply',
    'assignments:read:own',
    'assignments:submit',
    'messages:read:own',
    'messages:send',
  ],
  initiator: [
    'profile:read:own',
    'profile:update:own',
    'missions:create',
    'missions:read:own',
    'missions:update:own',
    'missions:delete:own',
    'applications:read',
    'applications:manage',
    'team:manage',
    'payments:manage:own',
    'messages:read:own',
    'messages:send',
  ],
  admin: ['*'], // All permissions
};
```

---

## Core Service Modules

### Matching Algorithm Service

```typescript
// modules/matching/matching.service.ts

interface MatchingCriteria {
  missionId: string;
  requiredSkills: { skillId: string; importance: 'required' | 'preferred' }[];
  complexity: 'easy' | 'medium' | 'hard' | 'expert';
  budgetRange: { min: number; max: number };
  timeline: number; // days
}

interface ContributorScore {
  contributorId: string;
  totalScore: number;
  breakdown: {
    skillMatch: number;      // 0-40 points
    trustScore: number;      // 0-25 points
    availability: number;    // 0-15 points
    experienceMatch: number; // 0-10 points
    historicalFit: number;   // 0-10 points
  };
}

export class MatchingService {
  async findMatches(criteria: MatchingCriteria): Promise<ContributorScore[]> {
    // 1. Filter base candidates
    const candidates = await this.getAvailableContributors();
    
    // 2. Calculate scores
    const scoredCandidates = candidates.map(c => ({
      contributorId: c.id,
      totalScore: this.calculateTotalScore(c, criteria),
      breakdown: this.getScoreBreakdown(c, criteria),
    }));
    
    // 3. Sort and return top matches
    return scoredCandidates
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  private calculateSkillMatch(contributor, skills): number {
    // Weighted skill matching
    let score = 0;
    for (const skill of skills) {
      const contributorSkill = contributor.skills.find(s => s.id === skill.skillId);
      if (contributorSkill) {
        const multiplier = skill.importance === 'required' ? 2 : 1;
        score += this.proficiencyToScore(contributorSkill.proficiency) * multiplier;
      }
    }
    return Math.min(score, 40);
  }
}
```

---

## Real-Time Infrastructure

### Socket.io Setup

```typescript
// websocket/socket.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export function initializeWebSocket(httpServer: http.Server) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Redis adapter for horizontal scaling
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use(socketAuthMiddleware);

  // Event handlers
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    
    // Join personal room
    socket.join(`user:${userId}`);
    
    // Handle events
    socket.on('join:mission', (missionId) => {
      socket.join(`mission:${missionId}`);
    });
    
    socket.on('message:send', async (data) => {
      await handleNewMessage(io, socket, data);
    });
  });

  return io;
}
```

### Real-Time Events

```typescript
// Event types
type WebSocketEvents = {
  // Notifications
  'notification:new': Notification;
  'notification:read': { id: string };

  // Matching
  'matching:started': { missionId: string };
  'matching:progress': { stage: string; detail: string };
  'matching:complete': { missionId: string; match: MatchResult };

  // Missions
  'mission:update': { missionId: string; status: string };
  'milestone:submitted': { milestoneId: string };
  'milestone:approved': { milestoneId: string; amount: number };

  // Chat
  'message:new': Message;
  'message:typing': { conversationId: string; userId: string };
};
```

---

## Payment & Escrow System

### Stripe Connect Flow

```mermaid
sequenceDiagram
    participant I as Initiator
    participant P as Platform
    participant S as Stripe
    participant C as Contributor

    I->>P: Fund Mission Escrow
    P->>S: Create PaymentIntent (platform holds)
    S-->>P: Payment Confirmed
    P->>P: Mark escrow funded
    
    Note over P: Work happens...
    
    I->>P: Approve Milestone
    P->>S: Create Transfer to Contributor
    S->>C: Funds arrive (minus platform fee)
    P->>P: Update escrow records
```

### Escrow Service

```typescript
// modules/payments/escrow.service.ts

export class EscrowService {
  async fundMission(missionId: string, initiatorId: string): Promise<EscrowResult> {
    const mission = await this.missionsService.findOne(missionId);
    
    // Calculate total escrow needed
    const totalAmount = mission.milestones.reduce((sum, m) => sum + m.amount, 0);
    
    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // cents
      currency: 'usd',
      customer: initiator.stripeCustomerId,
      metadata: {
        missionId,
        type: 'escrow_deposit',
      },
    });

    // Record transaction
    await this.createEscrowTransaction({
      missionId,
      initiatorId,
      type: 'deposit',
      amount: totalAmount,
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    };
  }

  async releaseMilestonePayment(milestoneId: string): Promise<void> {
    const milestone = await this.milestonesService.findOne(milestoneId);
    const assignment = await this.getLeadContributor(milestone.missionId);
    
    const platformFee = milestone.amount * 0.10; // 10% platform fee
    const contributorAmount = milestone.amount - platformFee;

    // Create transfer to contributor's connected account
    const transfer = await stripe.transfers.create({
      amount: contributorAmount * 100,
      currency: 'usd',
      destination: assignment.contributor.stripeAccountId,
      metadata: {
        milestoneId,
        missionId: milestone.missionId,
      },
    });

    // Record transactions
    await this.createEscrowTransaction({
      milestoneId,
      contributorId: assignment.contributorId,
      type: 'release',
      amount: contributorAmount,
      stripeTransferId: transfer.id,
      status: 'completed',
    });

    await this.createEscrowTransaction({
      milestoneId,
      type: 'platform_fee',
      amount: platformFee,
      status: 'completed',
    });
  }
}
```

---

## Security Best Practices

### Implementation Checklist

```yaml
Authentication:
  - [x] Use Argon2id for password hashing
  - [x] Short-lived access tokens (15 min)
  - [x] Secure HTTP-only refresh token cookies
  - [x] Token rotation on refresh
  - [x] Session invalidation on logout

Authorization:
  - [x] Role-based access control (RBAC)
  - [x] Resource-level permissions
  - [x] Verify ownership before mutations

Input Validation:
  - [x] Zod schema validation on all inputs
  - [x] SQL injection prevention (Prisma ORM)
  - [x] XSS prevention (sanitize HTML)

Rate Limiting:
  - [x] Global: 100 req/min per IP
  - [x] Auth endpoints: 5 req/min per IP
  - [x] Payment endpoints: 10 req/min per user

Headers:
  - [x] Helmet.js for security headers
  - [x] CORS whitelist
  - [x] HSTS enabled

Data:
  - [x] Encrypt sensitive fields at rest
  - [x] Audit logging for sensitive actions
  - [x] GDPR-compliant data handling

Infrastructure:
  - [x] Environment variables for secrets
  - [x] No secrets in code/logs
  - [x] Database connection encryption (SSL)
```

---

## DevOps & Deployment

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://people:password@postgres:5432/people_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: people
      POSTGRES_PASSWORD: password
      POSTGRES_DB: people_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Deployment Options

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Railway** | Easy, git-push deploy, managed DB | Limited free tier | ~$20/month |
| **Render** | Free tier, easy setup | Cold starts on free | ~$7-25/month |
| **Fly.io** | Edge deployment, good free tier | More complex | ~$0-20/month |
| **Cloudflare Workers** | Edge, serverless | Different runtime | ~$5/month |
| **AWS ECS** | Full control, scalable | Complex setup | ~$50+/month |

### Recommended Stack

```yaml
Production:
  API: Railway or Render (Node.js)
  Database: Railway PostgreSQL or Neon
  Redis: Upstash Redis
  File Storage: Cloudflare R2
  Email: Resend
  Monitoring: Sentry
  CDN/Frontend: Cloudflare Pages
```

---

## Future Scope & Scalability

### Phase 2 Features

```yaml
AI-Powered Matching:
  - Train ML model on historical success data
  - Predict mission success probability
  - Auto-recommend team compositions

Advanced Analytics:
  - Contributor performance dashboards
  - Initiator ROI tracking
  - Platform health metrics

Reputation System:
  - Peer reviews with weighted scoring
  - Work graph visualization
  - Skill endorsements

Mobile Apps:
  - React Native apps for iOS/Android
  - Push notifications
  - Offline-first architecture

Enterprise Features:
  - Team accounts
  - SSO integration
  - Custom SLAs
  - Dedicated account managers
```

### Horizontal Scaling

```mermaid
graph LR
    LB[Load Balancer] --> API1[API Server 1]
    LB --> API2[API Server 2]
    LB --> API3[API Server 3]
    
    API1 --> PG[(PostgreSQL Primary)]
    API2 --> PG
    API3 --> PG
    
    PG --> PGR[(PostgreSQL Replica)]
    
    API1 --> Redis[(Redis Cluster)]
    API2 --> Redis
    API3 --> Redis
    
    Redis --> WS1[WebSocket Server 1]
    Redis --> WS2[WebSocket Server 2]
```

---

## Implementation Roadmap

### Week 1-2: Foundation

- [ ] Set up TypeScript project structure
- [ ] Configure Prisma with PostgreSQL
- [ ] Implement database schema (all tables)
- [ ] Run initial migrations
- [ ] Set up Docker development environment

### Week 3-4: Authentication

- [ ] Implement local auth (register/login)
- [ ] JWT token generation and validation
- [ ] Refresh token rotation
- [ ] GitHub OAuth integration
- [ ] Password reset flow

### Week 5-6: Core Entities

- [ ] User CRUD endpoints
- [ ] Contributor profiles
- [ ] Initiator profiles
- [ ] Skills management
- [ ] Basic mission CRUD

### Week 7-8: Mission System

- [ ] Complete mission lifecycle
- [ ] Milestone management
- [ ] Application system
- [ ] Team assignment
- [ ] Status transitions

### Week 9-10: Payments

- [ ] Stripe Connect integration
- [ ] Escrow funding
- [ ] Milestone payments
- [ ] Platform fee handling
- [ ] Refund logic

### Week 11-12: Real-Time & Polish

- [ ] Socket.io integration
- [ ] Real-time notifications
- [ ] Chat system
- [ ] Matching algorithm v1
- [ ] Email notifications

### Week 13-14: Testing & Launch

- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] E2E tests
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests

# Production
npm run build            # TypeScript compile
npm run start            # Start production server
npm run db:migrate:prod  # Production migrations
```

---

*This backend structure document provides a comprehensive blueprint for building a production-ready PEOPLE platform. Implementation should follow the roadmap while adapting to specific requirements discovered during development.*
