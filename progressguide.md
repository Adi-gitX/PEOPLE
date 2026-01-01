# PEOPLE Platform - Complete Implementation Progress Guide

> **Expert-Level Step-by-Step Roadmap to Production**  
> **Stack:** Firebase + Cloudinary + Vercel  
> **Estimated Timeline:** 10-12 weeks  
> **Last Updated:** January 2026

---

## 🛠️ Your Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Auth** | Firebase Auth | User authentication (Email + OAuth) |
| **Database** | Firestore | NoSQL document database |
| **Storage** | Cloudinary | Image/file uploads |
| **AI** | Gemini API | AI features |
| **Backend** | Express.js on Vercel | API routes & business logic |
| **Frontend** | React + Vite | Already built UI |
| **Deployment** | Vercel | Both client and server |

---

## 📊 Progress Tracker

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | Project Setup & Environment | ⬜ Not Started | 0% |
| 2 | Firebase Configuration | ⬜ Not Started | 0% |
| 3 | Firestore Database Design | ⬜ Not Started | 0% |
| 4 | Authentication System | ⬜ Not Started | 0% |
| 5 | Core API - Users & Profiles | ⬜ Not Started | 0% |
| 6 | Core API - Missions | ⬜ Not Started | 0% |
| 7 | Matching Algorithm | ⬜ Not Started | 0% |
| 8 | Payment & Escrow (Stripe) | ⬜ Not Started | 0% |
| 9 | Real-Time Features | ⬜ Not Started | 0% |
| 10 | Frontend Integration | ⬜ Not Started | 0% |
| 11 | Testing & Deployment | ⬜ Not Started | 0% |

---

## Phase 1: Project Setup & Environment
**Duration:** 1-2 days

### 1.1 Server Structure Setup
- [ ] Restructure server directory for Vercel
- [ ] Initialize TypeScript
- [ ] Install dependencies

```bash
cd server
rm -rf node_modules package-lock.json

# Reinitialize
npm init -y
npm install express cors dotenv firebase-admin stripe zod
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon
npx tsc --init
```

### 1.2 Create Server Folder Structure
- [ ] Create organized module structure

```
server/
├── api/                    # Vercel serverless functions
│   └── index.ts           # Main API entry
├── src/
│   ├── config/
│   │   ├── firebase.ts    # Firebase Admin SDK
│   │   └── env.ts         # Environment validation
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── contributors/
│   │   ├── initiators/
│   │   ├── missions/
│   │   ├── matching/
│   │   └── payments/
│   ├── middleware/
│   │   ├── auth.ts        # Verify Firebase tokens
│   │   └── validate.ts    # Zod validation
│   └── utils/
├── vercel.json
├── package.json
└── tsconfig.json
```

### 1.3 Create Environment Files

**Client `.env`:**
```env
# Already provided - create this file
VITE_API_URL=https://your-server.vercel.app
VITE_FIREBASE_API_KEY=AIzaSyAZUBo8e8AuVarqeVg1W4Kn1kXHf1npCZQ
VITE_FIREBASE_AUTH_DOMAIN=madapp-447a2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=madapp-447a2
VITE_FIREBASE_STORAGE_BUCKET=madapp-447a2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=812557218865
VITE_FIREBASE_APP_ID=1:812557218865:web:95c6bd9c34f68a5645d110
VITE_CLOUDINARY_CLOUD_NAME=dwqwmptwf
VITE_CLOUDINARY_API_KEY=796762617911114
VITE_GEMINI_API_KEY=AIzaSyB2k_Z4_8QSa9UacTDntcIm8JH1UNHAU3o
```

**Server `.env`:**
```env
NODE_ENV=development
PORT=5000

# Firebase Admin (get from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=madapp-447a2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@madapp-447a2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 1.4 Vercel Configuration
- [ ] Create vercel.json for API routes

```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.ts" }
  ]
}
```

✅ **Phase 1 Complete When:** Server structure created, env files set up

---

## Phase 2: Firebase Configuration
**Duration:** 1-2 days

### 2.1 Firebase Console Setup
- [ ] Go to Firebase Console
- [ ] Verify project "madapp-447a2" exists
- [ ] Enable Authentication methods (Email/Password, Google, GitHub)
- [ ] Enable Firestore Database
- [ ] Set Firestore Security Rules

### 2.2 Get Firebase Admin Credentials
- [ ] Go to Project Settings > Service Accounts
- [ ] Generate new private key
- [ ] Add to server `.env`

### 2.3 Initialize Firebase Admin SDK
- [ ] Create Firebase admin config

```typescript
// server/src/config/firebase.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };
```

### 2.4 Initialize Firebase Client SDK
- [ ] Create Firebase client config

```typescript
// client/src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
```

✅ **Phase 2 Complete When:** Firebase Admin & Client SDK initialized

---

## Phase 3: Firestore Database Design
**Duration:** 2-3 days

### 3.1 Collection Structure

```
Firestore Collections:
├── users/
│   └── {userId}
│       ├── email, fullName, role, createdAt
│       └── contributorProfile (subcollection) OR initiatorProfile (subcollection)
│
├── contributorProfiles/
│   └── {userId}
│       ├── verificationStatus, isLookingForWork, trustScore, matchPower
│       ├── skills[], bio, github, linkedin
│       └── stats: { completedMissions, totalEarnings }
│
├── initiatorProfiles/
│   └── {userId}
│       ├── companyName, companyUrl, isVerified
│       ├── stripeCustomerId
│       └── stats: { missionsPosted, totalSpent }
│
├── skills/
│   └── {skillId}
│       └── name, category, iconUrl
│
├── missions/
│   └── {missionId}
│       ├── initiatorId, title, description, type, complexity
│       ├── budget: { min, max }, timeline, status
│       ├── milestones (subcollection)
│       ├── applications (subcollection)
│       └── assignments (subcollection)
│
├── notifications/
│   └── {notificationId}
│       └── userId, type, title, message, isRead, createdAt
│
├── conversations/
│   └── {conversationId}
│       ├── participants[], missionId?
│       └── messages (subcollection)
│
├── escrowTransactions/
│   └── {transactionId}
│       └── missionId, milestoneId, type, amount, status
│
└── proofTasks/
    └── {taskId}
        └── title, scenario, difficulty, submissions (subcollection)
```

### 3.2 Create Firestore Security Rules
- [ ] Set up rules in Firebase Console

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /contributorProfiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /initiatorProfiles/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Missions - public read, initiator write
    match /missions/{missionId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.initiatorId;
    }
    
    // Skills - public read, admin write
    match /skills/{skillId} {
      allow read: if true;
      allow write: if false; // Admin only via Admin SDK
    }
    
    // Notifications - user can only access their own
    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3.3 Seed Initial Data
- [ ] Create script to seed skills

```typescript
// server/scripts/seed-skills.ts
const skills = [
  { name: 'React', category: 'frontend' },
  { name: 'Node.js', category: 'backend' },
  { name: 'Python', category: 'language' },
  { name: 'PostgreSQL', category: 'database' },
  { name: 'TypeScript', category: 'language' },
  { name: 'AWS', category: 'devops' },
  { name: 'Figma', category: 'design' },
  { name: 'Solidity', category: 'blockchain' },
  // Add more...
];

async function seedSkills() {
  for (const skill of skills) {
    await db.collection('skills').add(skill);
  }
}
```

✅ **Phase 3 Complete When:** All collections defined, security rules in place

---

## Phase 4: Authentication System
**Duration:** 3-4 days

### 4.1 Install Firebase Client Auth
```bash
cd client
npm install firebase
```

### 4.2 Create Auth Service (Client)
- [ ] Email/Password signup
- [ ] Email/Password login
- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] Logout
- [ ] Password reset

```typescript
// client/src/lib/auth.js
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './firebase';

export const signUp = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

export const signIn = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () => 
  signInWithPopup(auth, new GoogleAuthProvider());

export const signInWithGithub = () => 
  signInWithPopup(auth, new GithubAuthProvider());

export const logout = () => signOut(auth);

export const resetPassword = (email) => 
  sendPasswordResetEmail(auth, email);
```

### 4.3 Auth Middleware (Server)
- [ ] Verify Firebase ID tokens

```typescript
// server/src/middleware/auth.ts
import { auth } from '../config/firebase';
import { Request, Response, NextFunction } from 'express';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 4.4 Update Auth Store
- [ ] Update useAuthStore with Firebase

```typescript
// client/src/store/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      initialize: () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const token = await firebaseUser.getIdToken();
            set({ 
              user: { 
                uid: firebaseUser.uid, 
                email: firebaseUser.email,
                token 
              }, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        });
      },
      
      logout: async () => {
        await auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### 4.5 Update Login/Signup Forms
- [ ] Replace mock auth with Firebase auth calls
- [ ] Add OAuth buttons
- [ ] Handle errors properly

✅ **Phase 4 Complete When:** Can register, login, logout with real Firebase auth

---

## Phase 5: Core API - Users & Profiles
**Duration:** 3-4 days

### 5.1 Create User on Signup
- [ ] Firebase Function or API endpoint to create user document

```typescript
// server/src/modules/users/users.service.ts
import { db } from '../../config/firebase';

export const createUser = async (uid: string, data: {
  email: string;
  fullName: string;
  role: 'contributor' | 'initiator';
}) => {
  const userRef = db.collection('users').doc(uid);
  
  await userRef.set({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // Create role-specific profile
  if (data.role === 'contributor') {
    await db.collection('contributorProfiles').doc(uid).set({
      verificationStatus: 'pending',
      isLookingForWork: false,
      trustScore: 0,
      matchPower: 0,
      skills: [],
      totalMissionsCompleted: 0,
      totalEarnings: 0,
    });
  } else {
    await db.collection('initiatorProfiles').doc(uid).set({
      isVerified: false,
      totalMissionsPosted: 0,
      totalSpent: 0,
    });
  }
  
  return userRef.get();
};
```

### 5.2 API Endpoints
- [ ] GET /api/users/:id
- [ ] PATCH /api/users/:id
- [ ] GET /api/contributors/:id
- [ ] PATCH /api/contributors/:id
- [ ] PATCH /api/contributors/:id/availability
- [ ] POST /api/contributors/:id/skills

### 5.3 Skills Management
- [ ] GET /api/skills
- [ ] Add skills to contributor profile
- [ ] Remove skills from contributor profile

### 5.4 Frontend Integration
- [ ] Fetch real user data in dashboards
- [ ] Update profile edit forms to save to Firestore

✅ **Phase 5 Complete When:** User profiles save/load from Firestore

---

## Phase 6: Core API - Missions
**Duration:** 4-5 days

### 6.1 Mission CRUD
- [ ] CREATE mission (initiator)
- [ ] READ missions (with filters)
- [ ] UPDATE mission
- [ ] DELETE/cancel mission
- [ ] Publish mission

### 6.2 Milestones
- [ ] Add milestones to mission
- [ ] Update milestone status
- [ ] Submit milestone for review
- [ ] Approve/reject milestone

### 6.3 Applications
- [ ] Apply to mission (contributor)
- [ ] View applications (initiator)
- [ ] Accept/reject application

### 6.4 Assignments
- [ ] Assign contributors to mission
- [ ] Handle role transitions

### 6.5 Frontend Integration
- [ ] NewMissionPage saves to Firestore
- [ ] MissionExplorePage fetches from Firestore
- [ ] MissionDetailsPage shows real data
- [ ] Dashboard shows real missions

✅ **Phase 6 Complete When:** Full mission lifecycle works

---

## Phase 7: Matching Algorithm
**Duration:** 2-3 days

### 7.1 Scoring Logic
```typescript
// server/src/modules/matching/scoring.ts
export const calculateMatchScore = (contributor, mission) => {
  let score = 0;
  
  // Skill match (0-40 points)
  const requiredSkills = mission.requiredSkills || [];
  const contributorSkills = contributor.skills || [];
  const matchedSkills = requiredSkills.filter(s => 
    contributorSkills.includes(s)
  );
  score += (matchedSkills.length / requiredSkills.length) * 40;
  
  // Trust score (0-25 points)
  score += (contributor.trustScore / 100) * 25;
  
  // Availability (0-15 points)
  if (contributor.isLookingForWork) score += 15;
  
  // Experience (0-10 points)
  score += Math.min(contributor.totalMissionsCompleted * 2, 10);
  
  // Completion rate (0-10 points)
  if (contributor.totalMissionsCompleted > 0) {
    score += 10; // Simplified
  }
  
  return Math.round(score);
};
```

### 7.2 Match Power Calculation
- [ ] Calculate on profile update
- [ ] Store in contributorProfile

### 7.3 Frontend Updates
- [ ] Show real match scores
- [ ] Update matching engine visualization

✅ **Phase 7 Complete When:** Contributors get match scores

---

## Phase 8: Payment & Escrow (Stripe)
**Duration:** 4-5 days

### 8.1 Stripe Setup
```bash
cd server
npm install stripe
```

### 8.2 Initiator Payments
- [ ] Add payment method (Stripe)
- [ ] Fund mission escrow
- [ ] Payment history

### 8.3 Contributor Payouts
- [ ] Stripe Connect onboarding
- [ ] Receive payments

### 8.4 Escrow Logic
- [ ] Record escrow transactions in Firestore
- [ ] Release on milestone approval
- [ ] Refund on cancellation

✅ **Phase 8 Complete When:** Can fund and pay out missions

---

## Phase 9: Real-Time Features
**Duration:** 2-3 days

### 9.1 Firestore Real-Time Listeners
- [ ] Real-time notifications

```typescript
// client - listen to notifications
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const q = query(
  collection(firestore, 'notifications'),
  where('userId', '==', userId),
  where('isRead', '==', false)
);

onSnapshot(q, (snapshot) => {
  const notifications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  // Update state
});
```

### 9.2 Real-Time Chat
- [ ] Use Firestore subcollections for messages
- [ ] Real-time message updates

### 9.3 Frontend Integration
- [ ] Update NotificationCenter with real-time
- [ ] Add chat components

✅ **Phase 9 Complete When:** Notifications update in real-time

---

## Phase 10: Frontend Integration
**Duration:** 3-4 days

### 10.1 API Client Setup
```typescript
// client/src/lib/api.js
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  get: async (endpoint) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },
  post: async (endpoint, data) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  // patch, delete...
};
```

### 10.2 Connect All Pages
- [ ] ContributorDashboard → real data
- [ ] InitiatorDashboard → real data
- [ ] MissionExplorePage → real data
- [ ] NetworkPage → real data (or remove)
- [ ] All forms submit to API

### 10.3 Loading & Error States
- [ ] Add loading skeletons
- [ ] Error handling
- [ ] Toast notifications

✅ **Phase 10 Complete When:** All pages use real data

---

## Phase 11: Testing & Deployment
**Duration:** 3-4 days

### 11.1 Deploy Server to Vercel
```bash
cd server
vercel
```

### 11.2 Deploy Client to Vercel
```bash
cd client
npm run build
vercel
```

### 11.3 Set Environment Variables
- [ ] Add all env vars in Vercel dashboard

### 11.4 Testing
- [ ] Test all auth flows
- [ ] Test mission lifecycle
- [ ] Test payments (Stripe test mode)

### 11.5 Custom Domain
- [ ] Configure domain in Vercel

✅ **Phase 11 Complete When:** App is live!

---

## 🚀 Quick Commands

```bash
# Development
cd server && npm run dev    # Start backend
cd client && npm run dev    # Start frontend

# Deploy
vercel                      # Deploy to Vercel

# Firebase
firebase deploy --only firestore:rules  # Deploy rules
```

---

## 📅 Suggested Schedule

| Week | Focus |
|------|-------|
| 1 | Phase 1-2 (Setup + Firebase) |
| 2 | Phase 3-4 (Database + Auth) |
| 3 | Phase 5 (Users/Profiles) |
| 4-5 | Phase 6 (Missions) |
| 6 | Phase 7 (Matching) |
| 7-8 | Phase 8 (Payments) |
| 9 | Phase 9 (Real-time) |
| 10 | Phase 10 (Integration) |
| 11-12 | Phase 11 (Deploy + Polish) |

---

*Track your progress by checking off items. Start with Phase 1!*
