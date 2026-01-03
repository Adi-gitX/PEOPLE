import app from './app.js';
import { env } from './config/index.js';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT);

process.on('SIGTERM', () => {
    process.exit(0);
});

process.on('SIGINT', () => {
    process.exit(0);
});
