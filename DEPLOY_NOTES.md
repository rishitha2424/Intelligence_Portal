# Deployment Notes - Mobileum Global Telecom Intelligence Platform

**Target Environment:** VM at IP `10.10.51.71` (or local Windows / Linux machine)
**Database Environment:** PostgreSQL (`10.10.51.71:5432/portal`) or JSON file data (`DATA_SOURCE=json`)
**Application Stack:** React + Vite, Node.js Built-in Server / Serverless Functions

## Prerequisites
1. Ensure Node.js (v18+) is installed on the VM / machine.
2. Ensure Python 3.10+ is installed (optional, only if you wish to re-parse raw `.xlsx` files into JSON).
3. If using PostgreSQL, ensure PostgreSQL is running with your database. (If using JSON, no database is required).

## 1. Code Transfer
Clone or copy the updated codebase to the VM. All mapped datasets (`data-source/*.json`, `data-cache/*.json`, `src/data/*.json`) are included directly in the repository, so no manual file moving or conversion is required.

## 2. Environment Configuration
The `.env` file supports both `DATA_SOURCE=json` and `DATA_SOURCE=postgres`.
```env
# Optional external Map API Key
VITE_CARTO_API_KEY=eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfZ2M2b203cTQiLCJqdGkiOiJkYmY0MTAyOCJ9.TuAll7h9zz1ODcIOccFQqA24G2hZHrZowb1ID9

# Data source selection: 'json' (default) or 'postgres'
DATA_SOURCE=json

# If using PostgreSQL:
DATABASE_URL=postgresql://postgres:Mobileum%40123@10.10.51.71:5432/postgres
# DB_SSL=false (automatically disabled for private/local IP 10.x.x.x unless explicitly enabled)
```
*Note: If `DATA_SOURCE=postgres` is set but the database is unavailable or unseeded, the system automatically and gracefully falls back to the JSON files in `data-source`/`data-cache`.*

## 3. Package Installation
Run the following from the project root:
```bash
npm install
```

## 4. Database / Cache Refresh (Optional)
If you update the Excel files in `data-source/` (`health.xlsx`, `mapping.xlsx`, `skygeni.xlsx`) and wish to re-generate the data:
```bash
npm run load:data
```
Verify the data with:
```bash
npm run check:data
```
*Wait for output confirming that 258 SkyGeni accounts and all 37 health customers are mapped successfully.*

## 5. Build and Deploy

### Step 1: Build the UI bundle
```bash
npm run build
```
This generates the optimized, production-ready bundle in `dist/` (and automatically copies static data assets into `dist/data/`).

### Step 2: Run in Production (Linux VM & Windows)
Run the native Node production server:
```bash
npm start
```
By default, this runs on port 80 (or the port defined in `PORT`, e.g. `PORT=3000 npm start`).
It serves:
- The compiled React application from `dist/`
- All `/api/*` endpoints (mapped from `api/*.js`)
- Directly accessible `/data/*`, `/data-source/*`, and `/data-cache/*` files
- SPA client-side routing fallback

### Alternative 1: Vite Preview
```bash
npm run preview -- --host 0.0.0.0 --port 80
```

### Alternative 2: Static-Only Hosting (Nginx / Apache / Serve)
If you host `dist/` using Nginx, Apache, or `serve -s dist -p 80`:
The frontend automatically falls back to client-side data resolution if `/api` is unreachable, ensuring all mapped accounts, health scores, and green **"SOURCED DATA"** badges function seamlessly without requiring a backend proxy!

## 6. Verification
1. Access `http://10.10.51.71` (or your host IP) from your browser.
2. Ensure the Global Map loads and countries are color-coded correctly.
3. Toggle the **"Health Score"** Map Lens and verify it accurately colors the regions.
4. Select **STC** or **Vodafone UK**, and verify that the Account Profile and Support & AMC tabs contain the green **"SOURCED DATA"** badges indicating mapped data is loaded.
5. In the top bar, use the **KAM Filter** or search for an account in the **Account Explorer** to confirm full data mapping.
