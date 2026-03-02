#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const clientRoot = path.join(repoRoot, 'client');
const clientSourceRoot = path.join(clientRoot, 'src');
const appPath = path.join(clientSourceRoot, 'App.jsx');
const serverRoot = path.join(repoRoot, 'server', 'src');
const serverAppPath = path.join(serverRoot, 'app.ts');

const LINK_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const STATIC_ASSET_EXTENSIONS = /\.(svg|png|jpg|jpeg|gif|webp|ico|pdf|txt|xml)$/i;

const normalizePath = (value) => {
    if (!value) return '/';
    const withoutQuery = value.split('?')[0].split('#')[0];
    if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
        return withoutQuery.slice(0, -1);
    }
    return withoutQuery;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const routePathToRegex = (routePath) => {
    if (routePath === '*') return null;
    const normalized = normalizePath(routePath);
    const regexString = `^${escapeRegex(normalized)
        .replace(/\\\/:([A-Za-z0-9_]+)/g, '/[^/]+')
        .replace(/\\\*/g, '.*')}$`;
    return new RegExp(regexString);
};

const listFiles = (directory) => {
    const files = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFiles(fullPath));
            continue;
        }
        if (LINK_FILE_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
};

const runInternalRouteCheck = () => {
    const routeSource = fs.readFileSync(appPath, 'utf8');
    const routeRegex = /<Route\b[^>]*\bpath\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/g;

    const declaredRoutes = [];
    for (const match of routeSource.matchAll(routeRegex)) {
        const value = match[1] || match[2] || match[3];
        if (!value) continue;
        declaredRoutes.push(normalizePath(value));
    }

    const staticRoutes = new Set(declaredRoutes.filter((route) => !route.includes(':') && !route.includes('*')));
    const dynamicRouteRegexes = declaredRoutes
        .map(routePathToRegex)
        .filter((value) => value instanceof RegExp);

    const matchesDeclaredRoute = (candidate) => {
        const normalized = normalizePath(candidate);
        if (normalized === '*') return true;
        if (staticRoutes.has(normalized)) return true;
        if (dynamicRouteRegexes.some((regex) => regex.test(normalized))) return true;

        if (normalized.includes(':param')) {
            const prefix = normalized.split('/:param')[0];
            const hasPrefixRoute = declaredRoutes.some((route) => route.startsWith(`${prefix}/`) || route === prefix);
            if (hasPrefixRoute) return true;
        }

        return false;
    };

    const linkRegexes = [
        /\b(?:to|href)\s*=\s*["'](\/[^"'`#]*)["']/g,
        /\b(?:to|href)\s*=\s*\{\s*`(\/[^`]*)`\s*\}/g,
    ];

    const unresolved = [];
    const files = listFiles(clientSourceRoot);

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const linkRegex of linkRegexes) {
            for (const match of content.matchAll(linkRegex)) {
                let rawPath = match[1];
                if (!rawPath || rawPath.startsWith('//')) continue;

                if (rawPath.includes('${')) {
                    rawPath = rawPath.replace(/\$\{[^}]+\}/g, ':param');
                }

                const normalized = normalizePath(rawPath);

                if (normalized === '/' || normalized === '') continue;
                if (normalized.startsWith('/api/')) continue;
                if (normalized.startsWith('/#')) continue;
                if (STATIC_ASSET_EXTENSIONS.test(normalized)) continue;

                if (!matchesDeclaredRoute(normalized)) {
                    const index = match.index ?? 0;
                    const line = content.slice(0, index).split('\n').length;
                    unresolved.push({ filePath, line, path: normalized });
                }
            }
        }
    }

    return {
        checkedFiles: files.length,
        unresolved,
    };
};

const findMatchingParenEnd = (source, openParenIndex) => {
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let i = openParenIndex; i < source.length; i += 1) {
        const char = source[i];

        if (quote) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }

        if (char === '(') depth += 1;
        if (char === ')') {
            depth -= 1;
            if (depth === 0) return i;
        }
    }

    return -1;
};

const splitTopLevel = (input, separator = ',') => {
    const parts = [];
    let buffer = '';
    let quote = null;
    let escaped = false;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];

        if (quote) {
            buffer += char;
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === quote) quote = null;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            buffer += char;
            continue;
        }

        if (char === '(') parenDepth += 1;
        if (char === ')') parenDepth -= 1;
        if (char === '{') braceDepth += 1;
        if (char === '}') braceDepth -= 1;
        if (char === '[') bracketDepth += 1;
        if (char === ']') bracketDepth -= 1;

        if (
            char === separator
            && parenDepth === 0
            && braceDepth === 0
            && bracketDepth === 0
        ) {
            parts.push(buffer.trim());
            buffer = '';
            continue;
        }

        buffer += char;
    }

    if (buffer.trim()) parts.push(buffer.trim());
    return parts;
};

const resolveImportPath = (fromFilePath, importPath) => {
    const withoutJs = importPath.replace(/\.js$/, '.ts');
    const absolute = path.resolve(path.dirname(fromFilePath), withoutJs);

    if (fs.existsSync(absolute)) return absolute;

    if (fs.existsSync(`${absolute}.ts`)) return `${absolute}.ts`;
    if (fs.existsSync(path.join(absolute, 'index.ts'))) return path.join(absolute, 'index.ts');

    return absolute;
};

const parseAppImports = (source) => {
    const importRegex = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
    const importMap = new Map();

    for (const match of source.matchAll(importRegex)) {
        const names = match[1].split(',').map((name) => name.trim()).filter(Boolean);
        const importPath = match[2];
        names.forEach((name) => {
            const [importedName, alias] = name.split(/\s+as\s+/).map((item) => item.trim());
            importMap.set(alias || importedName, importPath);
        });
    }

    return importMap;
};

const parseMountedRoutes = (appSource) => {
    const mounts = [];
    let searchStart = 0;

    while (true) {
        const useIndex = appSource.indexOf('app.use(', searchStart);
        if (useIndex === -1) break;

        const openParenIndex = appSource.indexOf('(', useIndex);
        const closeParenIndex = findMatchingParenEnd(appSource, openParenIndex);
        if (closeParenIndex === -1) break;

        const argsSource = appSource.slice(openParenIndex + 1, closeParenIndex);
        const args = splitTopLevel(argsSource);
        const baseArg = args[0] || '';
        const baseMatch = baseArg.match(/^['"]([^'"]+)['"]$/);

        if (baseMatch) {
            const basePath = normalizePath(baseMatch[1]);
            const lastArg = args[args.length - 1] || '';
            const routeVarMatch = lastArg.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/);
            if (routeVarMatch) {
                mounts.push({
                    basePath,
                    routeVar: routeVarMatch[1],
                });
            }
        }

        searchStart = closeParenIndex + 1;
    }

    return mounts;
};

const resolveRouteFileFromModuleIndex = (indexFilePath, routeVar) => {
    const indexSource = fs.readFileSync(indexFilePath, 'utf8');

    const defaultExportRegex = /export\s+\{\s*default\s+as\s+([A-Za-z0-9_$]+)\s*\}\s+from\s+['"]([^'"]+\.routes)\.js['"]/g;
    for (const match of indexSource.matchAll(defaultExportRegex)) {
        if (match[1] === routeVar) {
            return resolveImportPath(indexFilePath, `${match[2]}.js`);
        }
    }

    const namedExportRegex = /export\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+\.routes)\.js['"]/g;
    for (const match of indexSource.matchAll(namedExportRegex)) {
        const exportNames = splitTopLevel(match[1]).map((item) => item.split(/\s+as\s+/).pop()?.trim());
        if (exportNames.includes(routeVar)) {
            return resolveImportPath(indexFilePath, `${match[2]}.js`);
        }
    }

    return null;
};

const extractServerEndpoints = () => {
    const appSource = fs.readFileSync(serverAppPath, 'utf8');
    const imports = parseAppImports(appSource);
    const mounts = parseMountedRoutes(appSource);

    const endpoints = [];
    const seen = new Set();

    for (const mount of mounts) {
        const importPath = imports.get(mount.routeVar);
        if (!importPath) continue;

        const importFilePath = resolveImportPath(serverAppPath, importPath);
        if (!fs.existsSync(importFilePath)) continue;

        let routeFilePath = importFilePath;
        if (path.basename(importFilePath) === 'index.ts') {
            routeFilePath = resolveRouteFileFromModuleIndex(importFilePath, mount.routeVar);
            if (!routeFilePath || !fs.existsSync(routeFilePath)) continue;
        }

        const routeSource = fs.readFileSync(routeFilePath, 'utf8');
        const routeRegex = /router\.(get|post|patch|put|delete)\(\s*['"]([^'"]+)['"]/g;

        for (const routeMatch of routeSource.matchAll(routeRegex)) {
            const method = routeMatch[1].toUpperCase();
            const routePath = normalizePath(routeMatch[2]);
            const fullPath = normalizePath(`${mount.basePath}${routePath === '/' ? '' : routePath}`);
            const key = `${method} ${fullPath}`;
            if (seen.has(key)) continue;
            seen.add(key);
            endpoints.push({ method, path: fullPath });
        }
    }

    return endpoints;
};

const convertClientEndpointToPath = (endpointRaw) => {
    const withParams = endpointRaw.replace(/\$\{[^}]+\}/g, ':param');
    const normalized = normalizePath(withParams);
    return normalized;
};

const extractClientApiCalls = () => {
    const files = listFiles(clientSourceRoot);
    const apiCalls = [];

    for (const filePath of files) {
        const source = fs.readFileSync(filePath, 'utf8');
        const apiCallRegex = /api\.(get|post|patch|put|delete)\(\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")/g;

        for (const match of source.matchAll(apiCallRegex)) {
            const method = match[1].toUpperCase();
            const raw = match[2] || match[3] || match[4] || '';
            if (!raw.startsWith('/api/')) continue;

            const pathOnly = convertClientEndpointToPath(raw);
            const index = match.index ?? 0;
            const line = source.slice(0, index).split('\n').length;

            apiCalls.push({ method, path: pathOnly, filePath, line });
        }
    }

    return apiCalls;
};

const endpointPatternToRegex = (patternPath) => {
    const normalized = normalizePath(patternPath);
    const regexString = `^${escapeRegex(normalized)
        .replace(/:([A-Za-z0-9_]+)/g, '[^/]+')
        .replace(/:param/g, '[^/]+')}$`;
    return new RegExp(regexString);
};

const runApiContractCheck = () => {
    const serverEndpoints = extractServerEndpoints();
    const clientApiCalls = extractClientApiCalls();

    const serverPatternsByMethod = new Map();

    serverEndpoints.forEach((endpoint) => {
        const existing = serverPatternsByMethod.get(endpoint.method) || [];
        existing.push(endpointPatternToRegex(endpoint.path));
        serverPatternsByMethod.set(endpoint.method, existing);
    });

    const unmatched = [];

    clientApiCalls.forEach((call) => {
        const candidates = [
            ...(serverPatternsByMethod.get(call.method) || []),
            ...(serverPatternsByMethod.get('ALL') || []),
        ];

        const matched = candidates.some((regex) => regex.test(call.path));
        if (!matched) {
            unmatched.push(call);
        }
    });

    return {
        serverEndpointCount: serverEndpoints.length,
        clientCallCount: clientApiCalls.length,
        unmatched,
    };
};

const routeCheck = runInternalRouteCheck();
if (routeCheck.unresolved.length > 0) {
    console.error(`[ROUTES][FAIL] Found ${routeCheck.unresolved.length} unresolved internal link(s).`);
    routeCheck.unresolved.forEach((item) => {
        const relative = path.relative(repoRoot, item.filePath);
        console.error(` - ${relative}:${item.line} -> ${item.path}`);
    });
    process.exit(1);
}
console.log(`[ROUTES][OK] Checked ${routeCheck.checkedFiles} files. All internal links resolve to declared routes.`);

const apiCheck = runApiContractCheck();
if (apiCheck.unmatched.length > 0) {
    console.error(`[API-CONTRACT][FAIL] Found ${apiCheck.unmatched.length} client API call(s) with no matching server route.`);
    apiCheck.unmatched.forEach((item) => {
        const relative = path.relative(repoRoot, item.filePath);
        console.error(` - ${relative}:${item.line} -> ${item.method} ${item.path}`);
    });
    process.exit(1);
}
console.log(`[API-CONTRACT][OK] ${apiCheck.clientCallCount} client API calls match ${apiCheck.serverEndpointCount} declared server endpoints.`);
