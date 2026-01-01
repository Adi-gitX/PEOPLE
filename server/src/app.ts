import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/index.js';

// Import route modules
import { usersRoutes } from './modules/users/index.js';
import { contributorsRoutes } from './modules/contributors/index.js';
import { skillsRoutes } from './modules/skills/index.js';
import { missionsRoutes } from './modules/missions/index.js';

const app: Express = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS configuration
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

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
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// V1 API Routes
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/contributors', contributorsRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/missions', missionsRoutes);

// TODO: Add these routes as they are built
// app.use('/api/v1/initiators', initiatorsRoutes);
// app.use('/api/v1/notifications', notificationsRoutes);
// app.use('/api/v1/payments', paymentsRoutes);

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
    console.error(err.stack);

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

export default app;
