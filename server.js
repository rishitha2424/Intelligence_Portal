import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually without dotenv dependency
function loadEnvFile() {
  const envPaths = [
    path.resolve(__dirname, '.env.local'),
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...vals] = trimmed.split('=');
            const k = key.trim();
            const v = vals.join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}
loadEnvFile();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const distDir = path.resolve(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '80', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(async (req, res) => {
  // Enable basic CORS for API calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // 1. API Route handling
  if (pathname.startsWith('/api/')) {
    try {
      const moduleRel = pathname.replace(/^\//, ''); // e.g. api/customer-health
      const candidatePaths = [
        path.resolve(__dirname, moduleRel + '.js'),
        path.resolve(process.cwd(), moduleRel + '.js')
      ];
      const modulePath = candidatePaths.find(p => fs.existsSync(p));

      if (!modulePath) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: `API route not found: ${pathname}` }));
      }

      const handleRequest = async (bodyData) => {
        if (bodyData) {
          try { req.body = JSON.parse(bodyData); } catch (e) { req.body = bodyData; }
        }
        
        const query = {};
        for (const [k, v] of urlObj.searchParams.entries()) {
          query[k] = v;
        }
        req.query = query;

        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        try {
          const moduleUrl = pathToFileURL(modulePath).href + '?t=' + Date.now();
          const { default: handler } = await import(moduleUrl);
          await handler(req, res);
        } catch (err) {
          console.error(`[server.js] Error in ${pathname}:`, err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
        }
      };

      if (req.method === 'GET' || req.method === 'HEAD') {
        return await handleRequest();
      } else {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => handleRequest(body));
        return;
      }
    } catch (err) {
      console.error('[server.js] API Dispatch Error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 2. Direct data folder serving (data-source, data-cache, public/data)
  if (pathname.startsWith('/data-source/') || pathname.startsWith('/data-cache/') || pathname.startsWith('/data/')) {
    const rel = pathname.replace(/^\//, '');
    const dataCandidates = [
      path.resolve(__dirname, rel),
      path.resolve(__dirname, 'public', rel),
      path.resolve(distDir, rel)
    ];
    for (const cand of dataCandidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        const ext = path.extname(cand).toLowerCase();
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        return fs.createReadStream(cand).pipe(res);
      }
    }
  }

  // 3. Static files from dist/
  let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    return fs.createReadStream(filePath).pipe(res);
  }

  // 4. SPA Fallback: Serve dist/index.html
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(indexPath).pipe(res);
  }

  // Fallback if not built yet
  res.statusCode = 404;
  res.end('Not found. Please run "npm run build" first to generate the production dist/ bundle.');
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(` Mobileum Telecom Intelligence Platform`);
  console.log(` Running on: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(` Environment: DATA_SOURCE=${process.env.DATA_SOURCE || 'json'}`);
  console.log(` Serving static bundle from: ${distDir}`);
  console.log(`====================================================`);
});
