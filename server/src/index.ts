import app from './app.js';
import { env } from './config/index.js';
import { runSystemCheck } from './startup/systemCheck.js';
import { supportOutboxWorker } from './modules/support/index.js';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
    supportOutboxWorker.start();
    void runSystemCheck({ mode: 'runtime', port: PORT });
});

process.on('SIGTERM', () => {
    supportOutboxWorker.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    supportOutboxWorker.stop();
    process.exit(0);
});
