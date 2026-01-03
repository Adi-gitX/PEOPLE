import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/index.js';

// Import security middleware
import { apiLimiter, authLimiter, otpLimiter, paymentLimiter } from './middleware/rateLimit.js';
import { securityHeaders, sanitizeRequest } from './middleware/security.js';

// Import route modules
import { usersRoutes } from './modules/users/index.js';
import { contributorsRoutes } from './modules/contributors/index.js';
import { skillsRoutes } from './modules/skills/index.js';
import { missionsRoutes } from './modules/missions/index.js';
import { initiatorsRoutes } from './modules/initiators/index.js';
import { notificationsRoutes } from './modules/notifications/index.js';
import { messagesRoutes } from './modules/messages/index.js';
import { reviewsRoutes } from './modules/reviews/index.js';
import { adminRoutes } from './modules/admin/index.js';
import { contactRoutes } from './modules/contact/index.js';
import { paymentsRoutes } from './modules/payments/index.js';
import { otpRoutes } from './modules/auth/index.js';
import { proposalsRoutes } from './modules/proposals/index.js';
import { contractsRoutes } from './modules/contracts/index.js';
import { withdrawalsRoutes } from './modules/withdrawals/index.js';
import { matchingRoutes } from './modules/matching/index.js';
import { disputesRoutes } from './modules/disputes/index.js';
import { invoicesRoutes } from './modules/invoices/index.js';
import { teamsRoutes } from './modules/teams/index.js';
import { portfolioRoutes } from './modules/portfolio/index.js';
import { favoritesRoutes } from './modules/favorites/index.js';

const app: Express = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Security headers
app.use(securityHeaders);

// CORS configuration
const allowedOrigins = [
    env.FRONTEND_URL,
    'https://peoplemissions.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, true); // Allow in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Sanitize all incoming requests
app.use(sanitizeRequest);

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Request logging in development
if (env.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
        next();
    });
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'PEOPLE Platform API is running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        modules: [
            'users', 'contributors', 'missions', 'proposals', 'contracts',
            'payments', 'withdrawals', 'matching', 'disputes', 'invoices',
            'teams', 'portfolio', 'favorites', 'reviews', 'notifications'
        ],
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Core modules
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/contributors', contributorsRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/missions', missionsRoutes);
app.use('/api/v1/initiators', initiatorsRoutes);

// Communication
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/conversations', messagesRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/contact', contactRoutes);

// Authentication (with stricter rate limiting)
app.use('/api/v1/auth/otp', otpLimiter, otpRoutes);

// Business logic
app.use('/api/v1/proposals', proposalsRoutes);
app.use('/api/v1/contracts', contractsRoutes);
app.use('/api/v1/matching', matchingRoutes);

// Financial (with payment rate limiting)
app.use('/api/v1/payments', paymentLimiter, paymentsRoutes);
app.use('/api/v1/withdrawals', paymentLimiter, withdrawalsRoutes);
app.use('/api/v1/invoices', invoicesRoutes);

// New modules
app.use('/api/v1/disputes', disputesRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/favorites', favoritesRoutes);

// Admin (with auth limiting)
app.use('/api/v1/admin', authLimiter, adminRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err.message);
    if (env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

export default app;
