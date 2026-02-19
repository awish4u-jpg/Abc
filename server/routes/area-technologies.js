const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/area-technologies?area_id=N — list assignments for an area
router.get('/', async (req, res, next) => {
  try {
    const { area_id } = req.query;
    let query = `
      SELECT at.*, t.name AS technology_name, t.vendor, t.coe_id, c.name AS coe_name
      FROM area_technologies at
      JOIN technologies t ON t.id = at.technology_id
      LEFT JOIN coes c ON c.id = t.coe_id`;
    const params = [];
    if (area_id) {
      query += ' WHERE at.area_id = ?';
      params.push(area_id);
    }
    query += ' ORDER BY t.name';
    const rows = await getDb().all(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/area-technologies — assign a technology to an area
router.post('/', async (req, res, next) => {
  try {
    const { area_id, technology_id, is_selected, notes } = req.body;
    if (!area_id || !technology_id) {
      return res.status(400).json({ error: 'area_id and technology_id are required' });
    }
    const area = await getDb().get('SELECT id FROM areas WHERE id = ?', area_id);
    if (!area) {
      return res.status(400).json({ error: 'area_id references a non-existent area' });
    }
    const tech = await getDb().get('SELECT id FROM technologies WHERE id = ?', technology_id);
    if (!tech) {
      return res.status(400).json({ error: 'technology_id references a non-existent technology' });
    }
    const result = await getDb().run(
      'INSERT INTO area_technologies (area_id, technology_id, is_selected, notes) VALUES (?, ?, ?, ?)',
      [area_id, technology_id, is_selected ? 1 : 0, notes || null]
    );
    const row = await getDb().get(
      `SELECT at.*, t.name AS technology_name, t.vendor, t.coe_id, c.name AS coe_name
       FROM area_technologies at
       JOIN technologies t ON t.id = at.technology_id
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE at.id = ?`,
      result.lastID
    );
    res.status(201).json(row);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This technology is already assigned to this area' });
    }
    next(err);
  }
});

// PATCH /api/area-technologies/:id — toggle selection, update notes
router.patch('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get(
      'SELECT * FROM area_technologies WHERE id = ?',
      req.params.id
    );
    if (!existing) {
      return res.status(404).json({ error: 'Area-technology assignment not found' });
    }

    const updates = [];
    const params = [];

    if (req.body.is_selected !== undefined) {
      updates.push('is_selected = ?');
      params.push(req.body.is_selected ? 1 : 0);
    }
    if (req.body.notes !== undefined) {
      updates.push('notes = ?');
      params.push(req.body.notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update. Provide is_selected and/or notes.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await db.run(
      `UPDATE area_technologies SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const row = await db.get(
      `SELECT at.*, t.name AS technology_name, t.vendor, t.coe_id, c.name AS coe_name
       FROM area_technologies at
       JOIN technologies t ON t.id = at.technology_id
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE at.id = ?`,
      req.params.id
    );
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/area-technologies/:id — remove an assignment
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run(
      'DELETE FROM area_technologies WHERE id = ?',
      req.params.id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Area-technology assignment not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
