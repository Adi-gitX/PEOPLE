import { runSystemCheck } from './systemCheck.js';

const ok = await runSystemCheck({ mode: 'preflight' });
process.exit(ok ? 0 : 1);
