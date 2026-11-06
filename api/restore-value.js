import { query } from './_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { countryId, operatorId, section, fieldName, valueToRestore, updatedBy } = req.body;

  if (!countryId || !section || !fieldName || valueToRestore === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const targetOperatorId = operatorId || 'Global';
  const targetUpdatedBy = updatedBy || 'Anonymous';

  if (process.env.DATA_SOURCE !== 'postgres') {
    return res.status(200).json({ success: true, restoredValue: valueToRestore, mock: true });
  }

  try {
    // 1. Fetch current override to use as old_value in history
    const existingResult = await query(
      `SELECT value FROM country_overrides 
       WHERE country_id = $1 AND operator_id = $2 AND section = $3 AND field_name = $4`,
      [countryId, targetOperatorId, section, fieldName]
    );

    const oldValue = existingResult.rows.length > 0 ? existingResult.rows[0].value : null;

    console.log("Attempting to restore value for:", { countryId, operatorId: targetOperatorId, section, fieldName, valueToRestore });

    // 2. Overwrite the country_overrides value with valueToRestore
    await query(
      `INSERT INTO country_overrides (country_id, operator_id, section, field_name, value, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (country_id, operator_id, section, field_name)
       DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [countryId, targetOperatorId, section, fieldName, typeof valueToRestore === 'object' ? JSON.stringify(valueToRestore) : valueToRestore, targetUpdatedBy]
    );

    console.log("Successfully restored value in country_overrides. Now inserting into change_history.");

    // 3. Insert into change_history indicating a restore
    await query(
      `INSERT INTO change_history (country_id, operator_id, section, field_name, old_value, new_value, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [countryId, targetOperatorId, section, fieldName, typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue, typeof valueToRestore === 'object' ? JSON.stringify(valueToRestore) : valueToRestore]
    );

    console.log("Successfully inserted restore event into change_history.");

    return res.status(200).json({ success: true, restoredValue: valueToRestore });
  } catch (err) {
    console.error('Unexpected error in restore-value:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
