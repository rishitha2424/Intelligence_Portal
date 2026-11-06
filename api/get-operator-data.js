import fs from 'fs';
import path from 'path';
import { query } from './_lib/db.js';

let cachedJsonData = null;

function getMasterJsonData() {
  if (!cachedJsonData) {
    try {
      const filePath = path.resolve(process.cwd(), 'src', 'data', 'master_telecom.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        cachedJsonData = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load master_telecom.json:', e);
    }
  }
  return cachedJsonData;
}

function findJsonCountry(countryName) {
  const master = getMasterJsonData();
  if (!master || !master.countries) return null;
  const target = (countryName || '').trim().toLowerCase();
  
  for (const [key, cData] of Object.entries(master.countries)) {
    const name = (cData.country || key).trim().toLowerCase();
    const id = (cData.country_id || cData.iso || key).trim().toLowerCase();
    if (name === target || id === target || key.toLowerCase() === target) {
      return cData;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { country, meta } = req.query;

  // 1. Meta request: return total countries & region lists
  if (!country || meta === 'true') {
    if (process.env.DATA_SOURCE === 'postgres') {
      try {
        const result = await query(
          `SELECT country_id, country_name, region, gdp_per_capita 
           FROM countries 
           ORDER BY country_name ASC`
        );

        if (result.rows && result.rows.length > 0) {
          const countriesList = result.rows;
          const regions = [...new Set(countriesList.map(c => c.region).filter(Boolean))];
          return res.status(200).json({
            total_countries: countriesList.length,
            regions,
            countries: countriesList
          });
        }
      } catch (err) {
        console.warn('DB query failed for meta, falling back to JSON:', err.message);
      }
    }

    // Fallback meta from JSON
    const master = getMasterJsonData();
    if (master && master.countries) {
      const countriesList = Object.entries(master.countries).map(([key, c]) => ({
        country_id: c.country || key,
        country_name: c.country || key,
        region: c.region,
        gdp_per_capita: c.gdp_per_capita_usd
      }));
      const regions = [...new Set(countriesList.map(c => c.region).filter(Boolean))];
      return res.status(200).json({
        total_countries: countriesList.length,
        regions,
        countries: countriesList
      });
    }

    return res.status(500).json({ error: 'Failed to retrieve metadata' });
  }

  // 2. Fetch data for a specific country
  const jsonCountry = findJsonCountry(country);

  if (process.env.DATA_SOURCE === 'postgres') {
    try {
      const countryResult = await query(
        `SELECT * FROM countries 
         WHERE LOWER(country_name) = LOWER($1) OR LOWER(country_id) = LOWER($1)`,
        [country]
      );

      if (countryResult.rows && countryResult.rows.length > 0) {
        const countryRow = countryResult.rows[0];

        // Fetch operators for this country
        const operatorsResult = await query(
          `SELECT * FROM operators 
           WHERE LOWER(country_id) = LOWER($1) 
           ORDER BY operator_name ASC`,
          [countryRow.country_id]
        );

        const operators = operatorsResult.rows;
        const operatorIds = operators.map(op => op.operator_id);

        // Fetch financial data
        let financials = [];
        if (operatorIds.length > 0) {
          const financialsResult = await query(
            `SELECT * FROM operator_financials_5y 
             WHERE operator_id = ANY($1::int[]) 
             ORDER BY year DESC`,
            [operatorIds]
          );
          financials = financialsResult.rows;
        }

        // Merge DB rows with JSON rich metrics (stats, radar, waterfall, etc.)
        const mergedCountry = {
          ...(jsonCountry || {}),
          ...countryRow,
          country: countryRow.country_name || countryRow.country_id
        };

        const mergedOperators = operators.map(op => {
          if (op.impact_analysis && typeof op.impact_analysis === 'object') {
            return { ...op.impact_analysis, ...op, operator: op.operator_name || op.operator };
          }
          return { ...op, operator: op.operator_name || op.operator };
        });

        return res.status(200).json({
          country: mergedCountry,
          operators: mergedOperators.length > 0 ? mergedOperators : (jsonCountry ? jsonCountry.operators : []),
          financials: financials
        });
      }
    } catch (err) {
      console.warn(`DB fetch failed for country '${country}', attempting JSON fallback:`, err.message);
    }
  }

  // Fallback to JSON if DB returned no rows or failed
  if (jsonCountry) {
    return res.status(200).json({
      country: jsonCountry,
      operators: jsonCountry.operators || [],
      financials: []
    });
  }

  return res.status(404).json({ error: `Country '${country}' not found` });
}

