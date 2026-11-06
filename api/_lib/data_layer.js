import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

// Resolve project root reliably across Windows and Linux, regardless of process.cwd()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// api/_lib is 2 levels below project root
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const getDataSource = () => (process.env.DATA_SOURCE || 'json').toLowerCase().trim();

// Multiple search locations so it works whether files are in data-source, data-cache, src/data, or public/data
const getSearchDirectories = () => {
    return [
        path.resolve(PROJECT_ROOT, 'data-source'),
        path.resolve(PROJECT_ROOT, 'data-cache'),
        path.resolve(process.cwd(), 'data-source'),
        path.resolve(process.cwd(), 'data-cache'),
        path.resolve(PROJECT_ROOT, 'src', 'data'),
        path.resolve(process.cwd(), 'src', 'data'),
        path.resolve(PROJECT_ROOT, 'public', 'data'),
        path.resolve(process.cwd(), 'public', 'data'),
        path.resolve(PROJECT_ROOT, 'dist', 'data'),
        path.resolve(process.cwd(), 'dist', 'data')
    ];
};

const fileCache = new Map();

const loadJson = (filename) => {
    if (fileCache.has(filename)) {
        return fileCache.get(filename);
    }
    const searchDirs = getSearchDirectories();
    for (const dir of searchDirs) {
        try {
            const p = path.join(dir, filename);
            if (fs.existsSync(p)) {
                const content = fs.readFileSync(p, 'utf-8');
                const parsed = JSON.parse(content);
                fileCache.set(filename, parsed);
                return parsed;
            }
        } catch (e) {
            console.error(`[data_layer] Error reading ${filename} from ${dir}:`, e.message);
        }
    }
    console.warn(`[data_layer] Warning: Could not locate '${filename}' in any data folder`);
    return [];
};

export const fetchCustomerHealth = async () => {
    if (getDataSource() === 'postgres') {
        try {
            const { rows } = await query("SELECT * FROM customer_health");
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.warn("[data_layer] Postgres customer_health query failed, falling back to JSON:", e.message);
        }
    }
    return loadJson('customers.json');
};

export const fetchCustomerHealthBU = async (customerName) => {
    if (getDataSource() === 'postgres') {
        try {
            const { rows } = await query("SELECT * FROM customer_health_bu WHERE TRIM(LOWER(customer_name)) = TRIM(LOWER($1))", [customerName]);
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.warn("[data_layer] Postgres customer_health_bu query failed, falling back to JSON:", e.message);
        }
    }
    const allBus = loadJson('business_units.json');
    return allBus.filter(b => b.customer_name && b.customer_name.toLowerCase().trim() === customerName.toLowerCase().trim());
};

export const fetchCustomerMapping = async (logicalCustomer) => {
    if (getDataSource() === 'postgres') {
        try {
            let q = "SELECT * FROM customer_mapping";
            let params = [];
            if (logicalCustomer) {
                q += " WHERE TRIM(LOWER(logical_customer)) = TRIM(LOWER($1))";
                params.push(logicalCustomer);
            }
            const { rows } = await query(q, params);
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.warn("[data_layer] Postgres customer_mapping query failed, falling back to JSON:", e.message);
        }
    }
    const map = loadJson('customer_mapping.json');
    if (logicalCustomer) return map.filter(m => m.logical_customer && m.logical_customer.toLowerCase().trim() === logicalCustomer.toLowerCase().trim());
    return map;
};

export const fetchSkygeni = async () => {
    if (getDataSource() === 'postgres') {
        try {
            const { rows } = await query("SELECT * FROM skygeni_product_groups");
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.warn("[data_layer] Postgres skygeni query failed, falling back to JSON:", e.message);
        }
    }
    return loadJson('skygeni.json');
};

export const fetchKpiDefs = async () => {
    if (getDataSource() === 'postgres') {
        try {
            const { rows } = await query("SELECT * FROM kpi_definitions");
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.warn("[data_layer] Postgres kpi_definitions query failed, falling back to JSON:", e.message);
        }
    }
    return loadJson('kpi_definitions.json');
};

export const fetchDataStatus = async () => {
    if (getDataSource() === 'postgres') {
        try {
            const { rows } = await query("SELECT * FROM data_status");
            if (rows && rows.length > 0) return rows;
        } catch (e) {
            console.warn("[data_layer] Postgres data_status query failed, falling back to JSON:", e.message);
        }
    }
    return loadJson('data_status.json');
};
