import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const envPath = path.join(root, '.env');
const envExamplePath = path.join(root, '.env.example');

const parseEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const result = {};
    content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        result[key] = value;
    });
    return result;
};

const envFromExample = parseEnvFile(envExamplePath);
const envFromLocal = parseEnvFile(envPath);

const getEnv = (key) => process.env[key] || envFromLocal[key] || '';

const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
];

const apiUrl = getEnv('VITE_API_URL') || 'http://localhost:5001';

const print = (label, ok, detail) => {
    const marker = ok ? 'OK' : 'FAIL';
    console.log(`[CLIENT][${marker}] ${label}: ${detail}`);
};

const checkEnv = () => {
    let allRequiredConfigured = true;

    requiredKeys.forEach((key) => {
        const ok = Boolean(getEnv(key));
        if (!ok) {
            allRequiredConfigured = false;
        }
        print(`ENV ${key}`, ok, ok ? 'configured' : 'missing');
    });

    // Optional keys listed in .env.example but not hard-required
    Object.keys(envFromExample)
        .filter((key) => key.startsWith('VITE_') && !requiredKeys.includes(key))
        .forEach((key) => {
            const ok = Boolean(getEnv(key));
            print(`ENV ${key}`, true, ok ? 'configured' : 'not set (optional)');
        });

    return allRequiredConfigured;
};

const checkApiHealth = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const res = await fetch(`${apiUrl}/api/health`, { signal: controller.signal });
        const ok = res.ok;
        print('Backend API', ok, ok ? `${apiUrl}/api/health reachable` : `HTTP ${res.status}`);
        return ok;
    } catch (error) {
        print('Backend API', false, error instanceof Error ? error.message : 'connection failed');
        return false;
    } finally {
        clearTimeout(timeout);
    }
};

const main = async () => {
    console.log('[CLIENT] Running system check (pre-dev)...');
    const envOk = checkEnv();
    const apiOk = await checkApiHealth();
    const allOk = envOk && apiOk;
    console.log(
        `[CLIENT] ${allOk ? 'All systems connected and healthy.' : 'System check found issues. Starting frontend anyway.'}`
    );
};

await main();
