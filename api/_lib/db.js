import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

let pool = null;
let currentDbUrl = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;

  // Try reading directly from .env.local, .env, etc.
  const candidates = [
    path.resolve(PROJECT_ROOT, '.env.local'),
    path.resolve(PROJECT_ROOT, '.env'),
    path.resolve(PROJECT_ROOT, 'src', '.env.local'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env')
  ];
  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            const val = v.join('=').trim().replace(/^["']|["']$/g, '');
            if ((key === 'DATABASE_URL' || key === 'POSTGRES_URL') && val) {
              process.env[key] = val;
              return val;
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

export function getPool() {
  const dbUrl = resolveDatabaseUrl();
  
  if (!pool || currentDbUrl !== dbUrl) {
    if (pool) {
      pool.end().catch(() => {});
    }
    if (!dbUrl) {
      console.warn('[db.js] DATABASE_URL or POSTGRES_URL environment variable is not set.');
    }
    
    // Check if SSL should be disabled (localhost, 10.x.x.x, 192.168.x.x, 172.16-31.x.x)
    const isExplicitSsl = process.env.DB_SSL === 'true' || (dbUrl && dbUrl.includes('sslmode=require'));
    const isPrivateOrLocal = dbUrl && (
      dbUrl.includes('localhost') ||
      dbUrl.includes('127.0.0.1') ||
      /10\.\d+\.\d+\.\d+/.test(dbUrl) ||
      /192\.168\.\d+\.\d+/.test(dbUrl) ||
      /172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+/.test(dbUrl)
    );

    const sslConfig = isExplicitSsl
      ? { rejectUnauthorized: false }
      : (isPrivateOrLocal ? false : { rejectUnauthorized: false });

    pool = new Pool({
      connectionString: dbUrl || undefined,
      ssl: sslConfig,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10
    });
    currentDbUrl = dbUrl;
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

