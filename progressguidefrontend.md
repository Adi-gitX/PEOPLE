# PEOPLE Platform - Frontend Progress Guide

> **Stack:** React 19 + Vite + Tailwind CSS + Zustand + Firebase  
> **Last Updated:** January 2, 2026

---

## 📋 Table of Contents

1. [Current State Overview](#current-state-overview)
2. [Phase 1: Firebase & Auth Integration](#phase-1-firebase--auth-integration)
3. [Phase 2: Protected Routes & Auth Flow](#phase-2-protected-routes--auth-flow)
4. [Phase 3: API Integration - Users & Profiles](#phase-3-api-integration---users--profiles)
5. [Phase 4: Missions Integration](#phase-4-missions-integration)
6. [Phase 5: Contributors & Network](#phase-5-contributors--network)
7. [Phase 6: Real-Time Features](#phase-6-real-time-features)
8. [Phase 7: Polish & Production](#phase-7-polish--production)

---

## Current State Overview

### ✅ What's Already Built (UI Complete)

| Page/Component | File | Status |
|----------------|------|--------|
| Landing Page | `pages/LandingPage.jsx` | ✅ UI Complete |
| Auth Page | `pages/AuthPage.jsx` | ✅ UI Complete |
| Contributor Dashboard | `pages/dashboard/ContributorDashboard.jsx` | ✅ UI Complete |
| Initiator Dashboard | `pages/dashboard/InitiatorDashboard.jsx` | ✅ UI Complete |
| Mission Explore | `pages/missions/MissionExplorePage.jsx` | ✅ UI Complete |
| Mission Details | `pages/missions/MissionDetailsPage.jsx` | ✅ UI Complete |
| New Mission Form | `pages/missions/NewMissionPage.jsx` | ✅ UI Complete |
| Network Page | `pages/NetworkPage.jsx` | ✅ UI Complete |
| Contributor Application | `pages/applications/ContributorApplication.jsx` | ✅ UI Complete |
| Contact Page | `pages/ContactPage.jsx` | ✅ UI Complete |
| Integrations Page | `pages/IntegrationsPage.jsx` | ✅ UI Complete |

### ✅ Libraries Already Created

| File | Purpose |
|------|---------|
| `lib/firebase.js` | Firebase SDK initialization |
| `lib/api.js` | API client with auth headers |
| `lib/auth.js` | Auth service (signup, login, OAuth) |
| `store/useAuthStore.js` | Zustand auth store with Firebase |

### 🔴 What Needs Integration

- All pages use **mock data** - need to connect to real APIs
- Auth forms are **UI only** - need Firebase integration
- Dashboard data is **static** - need API calls
- No **protected routes** - anyone can access dashboards

---

## Phase 1: Firebase & Auth Integration

### 1.1 Install Firebase Dependencies

```bash
cd client
npm install firebase
```

### 1.2 Verify Firebase Config

**File:** `src/lib/firebase.js` ✅ (Already created)

```javascript
import { initializeApp, getApps } from 'firebase/app';
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const firestore = getFirestore(app);
```

### 1.3 Update Auth Store

**File:** `src/store/useAuthStore.js` ✅ (Already updated)

Key features:
- Firebase auth listener with `onAuthStateChanged`
- Auto-sync with backend `/api/v1/users/me`
- Persistent role storage

### 1.4 Initialize Auth on App Mount

**File:** `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './store/useAuthStore';

// Initialize Firebase auth listener
useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Phase 2: Protected Routes & Auth Flow

### 2.1 Create Auth Guard Component

**File:** `src/components/auth/AuthGuard.jsx`

```jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthGuard = ({ children, requireRole = null }) => {
  const { isAuthenticated, isLoading, role } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && role !== requireRole) {
    return <Navigate to={`/dashboard/${role || 'contributor'}`} replace />;
  }

  return children;
};

export const GuestGuard = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={`/dashboard/${role || 'contributor'}`} replace />;
  }

  return children;
};
```

### 2.2 Update App Router

**File:** `src/App.jsx`

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard';

// ... existing imports ...

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<MissionExplorePage />} />
          <Route path="/missions/:id" element={<MissionDetailsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth - Only for guests */}
          <Route path="/login" element={
            <GuestGuard><AuthPage /></GuestGuard>
          } />
          <Route path="/signup" element={
            <GuestGuard><AuthPage /></GuestGuard>
          } />

          {/* Protected - Requires auth */}
          <Route path="/dashboard" element={
            <AuthGuard><Navigate to="/dashboard/contributor" replace /></AuthGuard>
          } />
          <Route path="/dashboard/initiator" element={
            <AuthGuard requireRole="initiator"><InitiatorDashboard /></AuthGuard>
          } />
          <Route path="/dashboard/contributor" element={
            <AuthGuard requireRole="contributor"><ContributorDashboard /></AuthGuard>
          } />
          <Route path="/missions/new" element={
            <AuthGuard requireRole="initiator"><NewMissionPage /></AuthGuard>
          } />
          <Route path="/apply" element={
            <AuthGuard><ContributorApplication /></AuthGuard>
          } />
        </Routes>
      </div>
    </Router>
  );
}
```

### 2.3 Update Login Form

**File:** `src/components/auth/LoginForm.jsx`

```jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, signInWithGoogle } from '../../lib/auth';
import { toast } from 'sonner';
import Button from '../ui/Button';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg"
      />
      
      {/* Password input */}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg"
      />

      <Button type="submit" className="w-full" loading={loading}>
        Sign In
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black text-zinc-500">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        Continue with Google
      </Button>
    </form>
  );
};

export default LoginForm;
```

### 2.4 Update Signup Form

**File:** `src/components/auth/SignupForm.jsx`

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signInWithGoogle } from '../../lib/auth';
import { toast } from 'sonner';
import Button from '../ui/Button';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'contributor', // 'contributor' or 'initiator'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(
        formData.email, 
        formData.password, 
        formData.fullName, 
        formData.role
      );
      toast.success('Account created successfully!');
      navigate(`/dashboard/${formData.role}`);
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role Selection */}
      <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, role: 'contributor' })}
          className={`flex-1 py-2 rounded-md transition ${
            formData.role === 'contributor' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Contributor
        </button>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, role: 'initiator' })}
          className={`flex-1 py-2 rounded-md transition ${
            formData.role === 'initiator' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Initiator
        </button>
      </div>

      <input
        type="text"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        placeholder="Full Name"
        required
        className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg"
      />

      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
        className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg"
      />

      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
        minLength={6}
        className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg"
      />

      <input
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        placeholder="Confirm Password"
        required
        className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg"
      />

      <Button type="submit" className="w-full" loading={loading}>
        Create Account
      </Button>
    </form>
  );
};

export default SignupForm;
```

---

## Phase 3: API Integration - Users & Profiles

### 3.1 Create API Hooks

**File:** `src/hooks/useApi.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Generic hook for API fetching with loading/error states
 */
export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { immediate = true, dependencies = [] } = options;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching skills
 */
export const useSkills = () => {
  return useApi('/api/v1/skills');
};

/**
 * Hook for fetching current user profile
 */
export const useCurrentUser = () => {
  return useApi('/api/v1/users/me');
};

/**
 * Hook for fetching missions
 */
export const useMissions = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `/api/v1/missions${queryParams ? `?${queryParams}` : ''}`;
  return useApi(endpoint);
};

/**
 * Hook for fetching a single mission
 */
export const useMission = (id) => {
  return useApi(`/api/v1/missions/${id}`, { immediate: !!id });
};

/**
 * Hook for fetching contributors
 */
export const useContributors = () => {
  return useApi('/api/v1/contributors');
};
```

### 3.2 Update Contributor Dashboard

**File:** `src/pages/dashboard/ContributorDashboard.jsx`

Add these imports and hooks at the top:

```jsx
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrentUser } from '../../hooks/useApi';
import { api } from '../../lib/api';

const ContributorDashboard = () => {
  const { user, profile } = useAuthStore();
  const { data: userData, loading, refetch } = useCurrentUser();
  
  // Toggle availability
  const handleToggleAvailability = async (isLookingForWork) => {
    try {
      await api.patch('/api/v1/contributors/me/availability', { isLookingForWork });
      refetch(); // Refresh profile data
      toast.success(isLookingForWork ? 'Now looking for work!' : 'Status set to incognito');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Use profile data from API
  const contributorProfile = userData?.profile || profile;
  
  // ... rest of component using contributorProfile for display
};
```

### 3.3 Create Profile Settings Page

**File:** `src/pages/dashboard/ProfileSettings.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { useSkills } from '../../hooks/useApi';
import { toast } from 'sonner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';

const ProfileSettings = () => {
  const { profile, refreshProfile } = useAuthStore();
  const { data: skillsData } = useSkills();
  
  const [formData, setFormData] = useState({
    headline: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    timezone: '',
    availabilityHoursPerWeek: 20,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        headline: profile.headline || '',
        bio: profile.bio || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        timezone: profile.timezone || '',
        availabilityHoursPerWeek: profile.availabilityHoursPerWeek || 20,
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/api/v1/contributors/me', formData);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skillId) => {
    try {
      await api.post('/api/v1/contributors/me/skills', {
        skillId,
        proficiencyLevel: 'intermediate',
        yearsExperience: 1,
      });
      await refreshProfile();
      toast.success('Skill added!');
    } catch (error) {
      toast.error('Failed to add skill');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields for headline, bio, URLs, etc. */}
          {/* ... implement form UI ... */}
          
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </form>

        {/* Skills Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile?.skills?.map((skill) => (
              <span key={skill.skillId} className="px-3 py-1 bg-zinc-800 rounded-full text-sm">
                {skill.skillName}
              </span>
            ))}
          </div>
          
          {/* Available skills to add */}
          <div className="mt-4">
            <p className="text-sm text-zinc-500 mb-2">Add skills:</p>
            <div className="flex flex-wrap gap-2">
              {skillsData?.filter(s => !profile?.skills?.find(ps => ps.skillId === s.id)).slice(0, 10).map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleAddSkill(skill.id)}
                  className="px-3 py-1 border border-white/10 rounded-full text-sm hover:bg-white/5"
                >
                  + {skill.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;
```

---

## Phase 4: Missions Integration

### 4.1 Update Mission Explore Page

**File:** `src/pages/missions/MissionExplorePage.jsx`

Replace mock data with API calls:

```jsx
import { useState, useEffect } from 'react';
import { useMissions, useSkills } from '../../hooks/useApi';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const MissionExplorePage = () => {
  const [filters, setFilters] = useState({
    type: '',
    complexity: '',
    status: 'open',
  });
  
  const { data: missions, loading, error, refetch } = useMissions(filters);
  const { data: skills } = useSkills();

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    refetch();
  }, [filters]);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-4xl font-bold mb-8">Explore Missions</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="fullstack">Full Stack</option>
            <option value="mobile">Mobile</option>
            <option value="design">Design</option>
          </select>

          <select
            value={filters.complexity}
            onChange={(e) => handleFilterChange('complexity', e.target.value)}
            className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg"
          >
            <option value="">All Complexity</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12 text-red-400">
            Failed to load missions. Please try again.
          </div>
        )}

        {/* Empty State */}
        {!loading && missions?.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No missions found. Check back later!
          </div>
        )}

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions?.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};
```

### 4.2 Update New Mission Form

**File:** `src/pages/missions/NewMissionPage.jsx`

Add form submission:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSkills } from '../../hooks/useApi';
import { toast } from 'sonner';

const NewMissionPage = () => {
  const navigate = useNavigate();
  const { data: skills } = useSkills();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemStatement: '',
    successCriteria: '',
    type: 'backend',
    complexity: 'medium',
    budgetMin: 500,
    budgetMax: 2000,
    estimatedDurationDays: 14,
    requiredSkills: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/v1/missions', formData);
      toast.success('Mission created!');
      navigate(`/missions/${response.data.mission.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create mission');
    } finally {
      setLoading(false);
    }
  };

  // ... form UI implementation
};
```

### 4.3 Update Mission Details Page

**File:** `src/pages/missions/MissionDetailsPage.jsx`

```jsx
import { useParams } from 'react-router-dom';
import { useMission } from '../../hooks/useApi';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const MissionDetailsPage = () => {
  const { id } = useParams();
  const { data, loading, error } = useMission(id);
  const { isAuthenticated, role } = useAuthStore();

  const handleApply = async () => {
    try {
      await api.post(`/api/v1/missions/${id}/apply`, {
        coverLetter: 'I am excited to work on this mission...',
      });
      toast.success('Application submitted!');
    } catch (error) {
      toast.error(error.message || 'Failed to apply');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!data) return <NotFound />;

  const { mission, milestones, assignments } = data;

  return (
    // ... render mission details using real data
  );
};
```

---

## Phase 5: Contributors & Network

### 5.1 Update Network Page

**File:** `src/pages/NetworkPage.jsx`

```jsx
import { useContributors } from '../../hooks/useApi';

const NetworkPage = () => {
  const { data: contributors, loading, error } = useContributors();

  // Replace mock PEERS array with contributors from API
  return (
    // ... existing UI but using contributors data
  );
};
```

---

## Phase 6: Real-Time Features

### 6.1 Firestore Real-Time Listeners

**File:** `src/hooks/useRealtimeNotifications.js`

```javascript
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuthStore } from '../store/useAuthStore';

export const useRealtimeNotifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { notifications, unreadCount };
};
```

### 6.2 Update Notification Center

**File:** `src/components/notifications/NotificationCenter.jsx`

```jsx
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { api } from '../../lib/api';

const NotificationCenter = () => {
  const { notifications, unreadCount } = useRealtimeNotifications();

  const markAsRead = async (notificationId) => {
    // Firestore update happens in real-time
    await api.patch(`/api/v1/notifications/${notificationId}`, { isRead: true });
  };

  // ... existing UI using real notifications
};
```

---

## Phase 7: Polish & Production

### 7.1 Add Loading Skeletons

**File:** `src/components/ui/Skeleton.jsx`

```jsx
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
);

export const MissionCardSkeleton = () => (
  <div className="border border-white/10 rounded-lg p-6 space-y-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-20 w-full" />
  </div>
);
```

### 7.2 Add Error Boundaries

**File:** `src/components/ErrorBoundary.jsx`

```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 7.3 Environment-Based Configuration

**File:** `src/lib/config.js`

```javascript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};
```

### 7.4 Add Route for Profile Page

**File:** Update `src/App.jsx`

```jsx
import ProfileSettings from './pages/dashboard/ProfileSettings';

// Add to Routes:
<Route path="/dashboard/settings" element={
  <AuthGuard><ProfileSettings /></AuthGuard>
} />
```

---

## Quick Reference: API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/me` | GET | Current user with profile |
| `/api/v1/users/register` | POST | Register after Firebase signup |
| `/api/v1/skills` | GET | All available skills |
| `/api/v1/contributors` | GET | List verified contributors |
| `/api/v1/contributors/me` | PATCH | Update profile |
| `/api/v1/contributors/me/availability` | PATCH | Toggle work status |
| `/api/v1/contributors/me/skills` | POST | Add skill |
| `/api/v1/missions` | GET | List public missions |
| `/api/v1/missions` | POST | Create mission |
| `/api/v1/missions/:id` | GET | Mission details |
| `/api/v1/missions/:id/apply` | POST | Apply to mission |

---

## Checklist

- [ ] Phase 1: Firebase initialization in main.jsx
- [ ] Phase 2: AuthGuard & GuestGuard components
- [ ] Phase 2: Update App.jsx with protected routes
- [ ] Phase 2: Update LoginForm with Firebase auth
- [ ] Phase 2: Update SignupForm with role selection
- [ ] Phase 3: Create useApi hooks
- [ ] Phase 3: Update ContributorDashboard with API
- [ ] Phase 3: Create ProfileSettings page
- [ ] Phase 4: Update MissionExplorePage with API
- [ ] Phase 4: Update NewMissionPage with submission
- [ ] Phase 4: Update MissionDetailsPage with real data
- [ ] Phase 5: Update NetworkPage with API
- [ ] Phase 6: Real-time notifications
- [ ] Phase 7: Loading skeletons & error boundaries

---

*Follow this guide phase by phase to integrate the frontend with the backend APIs. Each phase builds on the previous one.*
