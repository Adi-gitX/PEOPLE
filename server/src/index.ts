import app from './app.js';
import { env } from './config/index.js';

const PORT = parseInt(env.PORT, 10);

// Start the server
app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🚀 PEOPLE Platform API Server');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`  Port:        ${PORT}`);
    console.log(`  Frontend:    ${env.FRONTEND_URL}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Endpoints:');
    console.log(`  • Health:    http://localhost:${PORT}/api/health`);
    console.log(`  • API v1:    http://localhost:${PORT}/api/v1/`);
    console.log('');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
