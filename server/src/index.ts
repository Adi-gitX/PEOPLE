import app from './app.js';
import { env } from './config/index.js';
import { runSystemCheck } from './startup/systemCheck.js';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
    void runSystemCheck({ mode: 'runtime', port: PORT });
});

process.on('SIGTERM', () => {
    process.exit(0);
});

process.on('SIGINT', () => {
    process.exit(0);
});
