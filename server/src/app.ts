import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/index.js';
import { apiLimiter, authLimiter, otpLimiter, paymentLimiter } from './middleware/rateLimit.js';
import { securityHeaders, sanitizeRequest } from './middleware/security.js';
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

app.use(securityHeaders);

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
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);
app.use('/api/', apiLimiter);

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

app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/contributors', contributorsRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/missions', missionsRoutes);
app.use('/api/v1/initiators', initiatorsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/conversations', messagesRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/auth/otp', otpLimiter, otpRoutes);
app.use('/api/v1/proposals', proposalsRoutes);
app.use('/api/v1/contracts', contractsRoutes);
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/payments', paymentLimiter, paymentsRoutes);
app.use('/api/v1/withdrawals', paymentLimiter, withdrawalsRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/disputes', disputesRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/admin', authLimiter, adminRoutes);

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
    });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

export default app;
