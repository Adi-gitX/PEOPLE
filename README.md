<div align="center">

# 🚀 PEOPLE

### *Missions. Not Gigs.*

The curated mission-based collaboration platform that connects **Initiators** (clients) with **Contributors** (top-tier student builders) through algorithmic matching and guaranteed outcomes.

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.22.1-000000?style=flat&logo=express)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7.0-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat&logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

[Live Demo](#) · [Documentation](#documentation) · [Report Bug](https://github.com/yourusername/people/issues) · [Request Feature](https://github.com/yourusername/people/issues)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Why I Built This](#-why-i-built-this)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 About The Project

**PEOPLE** reimagines how talent connects with opportunity. Unlike traditional freelancing platforms plagued by bidding wars and race-to-the-bottom pricing, PEOPLE operates on a revolutionary **Mission Model** where work begins with a *problem*, not a *person*.

### The Problem with Traditional Freelancing

| Issue | Traditional Platforms | PEOPLE Approach |
|-------|----------------------|-----------------|
| **Hiring Model** | Bidding wars & price racing | Algorithmic skill-based matching |
| **Quality Assurance** | Single freelancer, high failure risk | Shadow contributors + Core reviewers |
| **Payment Security** | Upfront or hourly, risky | Milestone-based escrow |
| **Discovery** | Public profiles, popularity-driven | Hidden profiles, merit-based matching |
| **Entry Barrier** | Resume screening | Reasoning-based proof tasks |

---

## 💡 Why I Built This

As a student navigating the tech industry, I noticed a fundamental flaw in how freelance marketplaces operate:

> **"Great builders waste time selling themselves instead of solving problems."**

Traditional platforms force talented developers into:
- **Price competitions** that undervalue quality work
- **Profile optimization** instead of skill development
- **"Race to reply first"** dynamics that favor availability over ability

I envisioned a platform where:
- 🎯 **Work finds the right people** – not the other way around
- 🔒 **Quality is guaranteed** – through redundant team structures
- 💰 **Fair pricing** – based on complexity, not bidding wars
- 📈 **Merit matters** – reputation built through internal work graphs

**PEOPLE** is my answer to building a fairer, more efficient talent marketplace for the next generation of builders.

---

## ✨ Key Features

### For Initiators (Clients)
- **🎯 Mission-Based Posting** – Submit problems, not job descriptions
- **⚡ AI-Powered Matching** – Algorithms find the perfect team for your mission
- **🔐 Secure Escrow** – Funds protected until milestones are delivered
- **🛡️ Zero-Failure Guarantee** – Shadow contributors ensure delivery
- **📊 Real-time Tracking** – Monitor mission progress with milestone updates

### For Contributors (Builders)
- **🏆 Merit-Based Access** – Join through reasoning-based proof tasks
- **🎲 Algorithmic Matching** – Get matched to missions fitting your skills
- **💼 Hidden Profiles** – No popularity contests, just pure skill matching
- **💵 Fair Payments** – Milestone-based payouts, no bidding wars
- **📈 Internal Work Graph** – Build reputation through completed work

### Platform Features
- **💬 Real-Time Messaging** – Communicate with your team
- **🔔 Smart Notifications** – Stay updated on mission progress
- **👛 Built-in Wallet** – Manage earnings and withdrawals
- **⭐ Review System** – Build trust through verified reviews
- **🛡️ Dispute Resolution** – Fair arbitration process
- **📧 Email Notifications** – Stay informed on important updates

---

## 🔄 How It Works

### The Mission Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PEOPLE MISSION FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌─────────────────┐    ┌────────────────────┐     │
│   │  INITIATOR   │    │    ALGORITHM    │    │   CONTRIBUTORS     │     │
│   │ Creates      │───▶│   Matches       │───▶│                    │     │
│   │ Mission      │    │   Skills        │    │  Lead + Shadow     │     │
│   └──────────────┘    └─────────────────┘    │  + Core Reviewer   │     │
│          │                                    └────────────────────┘     │
│          ▼                                             │                 │
│   ┌──────────────┐                            ┌────────▼───────┐        │
│   │   ESCROW     │◀───────────────────────────│  WORK BEGINS   │        │
│   │   FUNDED     │                            └────────────────┘        │
│   └──────────────┘                                     │                 │
│          │                                             ▼                 │
│          │                                    ┌────────────────┐        │
│          │                                    │  MILESTONE     │        │
│          └───────────────────────────────────▶│  DELIVERED     │        │
│                  Release on Approval          └────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Zero-Failure System

Every mission is protected with a triple-layer team structure:

| Role | Responsibility |
|------|----------------|
| **Lead Contributor** | Primary executor of the mission |
| **Shadow Contributor** | Backup who can step in instantly if needed |
| **Core Reviewer** | Quality assurance and code review |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | Modern UI framework with concurrent features |
| **Vite 7** | Lightning-fast build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **Framer Motion** | Smooth animations |
| **React Router 7** | Client-side routing |
| **Firebase SDK** | Authentication & real-time features |

### Backend
| Technology | Purpose |
|------------|---------|
| **Express 4** | Fast, minimalist web framework |
| **TypeScript** | Type-safe development |
| **Firebase Admin** | Firestore database & authentication |
| **Stripe** | Payment processing & escrow |
| **Nodemailer** | Email notifications |
| **Zod** | Runtime schema validation |
| **Google Generative AI** | AI-powered features |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | NoSQL cloud database |
| **Vercel** | Serverless deployment |
| **Cloudinary** | Media storage & optimization |
| **Resend** | Transactional emails |

---

## 🏗 Architecture

```
people/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/          # Authentication forms
│   │   │   ├── dashboard/     # Dashboard-specific components
│   │   │   ├── layout/        # Navbar, Footer, Layouts
│   │   │   ├── notifications/ # Notification system
│   │   │   └── ui/            # Base UI primitives
│   │   ├── pages/             # Route pages (24 total)
│   │   │   ├── dashboard/     # Contributor & Initiator dashboards
│   │   │   ├── missions/      # Mission CRUD pages
│   │   │   ├── admin/         # Admin panel
│   │   │   └── ...
│   │   ├── store/             # Zustand state stores
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # Utilities & helpers
│   └── public/                # Static assets & fonts
│
└── server/                    # Express Backend (TypeScript)
    ├── src/
    │   ├── modules/           # Feature modules (23 total)
    │   │   ├── auth/          # OTP authentication
    │   │   ├── users/         # User management
    │   │   ├── missions/      # Mission CRUD & milestones
    │   │   ├── matching/      # AI matching engine
    │   │   ├── escrow/        # Payment escrow system
    │   │   ├── payments/      # Stripe integration
    │   │   ├── messages/      # Real-time messaging
    │   │   ├── notifications/ # Push & email notifications
    │   │   ├── reviews/       # Rating system
    │   │   ├── proposals/     # Bidding system
    │   │   ├── contracts/     # Formal agreements
    │   │   ├── disputes/      # Arbitration system
    │   │   ├── wallet/        # User wallets
    │   │   ├── withdrawals/   # Payout system
    │   │   └── ...
    │   ├── middleware/        # Auth, validation, rate limiting
    │   ├── services/          # Shared services (email, upload)
    │   └── config/            # Firebase & environment config
    └── email-templates/       # HTML email templates
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Firebase Project** with Firestore enabled
- **Stripe Account** (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/people.git
   cd people
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Configure environment variables**

   **Client** (`client/.env`):
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

   **Server** (`server/.env`):
   ```env
   PORT=5001
   FRONTEND_URL=http://localhost:5173
   
   # Firebase Admin
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_PRIVATE_KEY="your_private_key"
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_xxx
   
   # Email (Gmail SMTP)
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   ```

5. **Start development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

---

## 📸 Screenshots

### Landing Page
> Modern, terminal-inspired hero section with "Missions Not Gigs" messaging

### Contributor Dashboard
> Real-time matching engine visualization with Match Power meter

### Mission Explorer
> Browse available missions with skill-based filtering

### Initiator Dashboard
> Manage active missions, track escrow, and monitor team progress

---

## 🗺 Roadmap

### ✅ Completed (MVP)
- [x] User authentication (Email OTP)
- [x] Contributor & Initiator profiles
- [x] Mission CRUD with milestones
- [x] Application & assignment system
- [x] Escrow payment system
- [x] Reviews & ratings
- [x] Real-time messaging
- [x] Notification system
- [x] Admin dashboard
- [x] Email notifications

### 🔨 In Progress
- [ ] Enhanced proposal system
- [ ] Contract signing workflow
- [ ] Bank withdrawal integration
- [ ] Profile verification badges

### 📋 Planned
- [ ] AI matching algorithm
- [ ] Video calls integration
- [ ] Portfolio showcase
- [ ] Skill assessments
- [ ] Teams & agencies
- [ ] Mobile app (React Native)
- [ ] Subscription tiers
- [ ] Referral program

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Guidelines
- Follow existing code patterns
- Use TypeScript for new server files
- Write component tests for critical features
- Follow the "Workway" design aesthetic (dark theme, sharp edges, data density)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📬 Contact

**Aditya Kammati**

- GitHub: [@Adi-gitX](https://github.com/Adi-gitX)
- Project Link: [https://github.com/Adi-gitX/PEOPLE](https://github.com/Adi-gitX/PEOPLE)

---

<div align="center">

### Built with ❤️ for the next generation of builders

**[⬆ Back to Top](#-people)**

</div>
