const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// PUT /api/areas/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'UPDATE areas SET name = ?, description = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), description || null, sort_order ?? 0, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }
    const area = await getDb().get('SELECT * FROM areas WHERE id = ?', req.params.id);
    res.json(area);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/areas/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run('DELETE FROM areas WHERE id = ?', req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// PATCH /api/areas/:id/reviewed — toggle reviewed state
router.patch('/:id/reviewed', async (req, res, next) => {
  try {
    const db = getDb();
    const area = await db.get('SELECT * FROM areas WHERE id = ?', req.params.id);
    if (!area) return res.status(404).json({ error: 'Area not found' });

    const newReviewed = area.reviewed ? 0 : 1;
    await db.run(
      'UPDATE areas SET reviewed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newReviewed, req.params.id]
    );
    const updated = await db.get('SELECT * FROM areas WHERE id = ?', req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/areas/:areaId/technologies — list area-technology assignments
router.get('/:areaId/technologies', async (req, res, next) => {
  try {
    const area = await getDb().get('SELECT id FROM areas WHERE id = ?', req.params.areaId);
    if (!area) return res.status(404).json({ error: 'Area not found' });

    const rows = await getDb().all(
      `SELECT at.*, t.name AS technology_name, t.description AS technology_description,
              t.vendor, t.coe_id, c.name AS coe_name
       FROM area_technologies at
       JOIN technologies t ON t.id = at.technology_id
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE at.area_id = ?
       ORDER BY t.name`,
      req.params.areaId
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/areas/:areaId/technologies — assign a technology to an area
router.post('/:areaId/technologies', async (req, res, next) => {
  try {
    const { technology_id, is_selected, notes } = req.body;
    if (!technology_id) {
      return res.status(400).json({ error: 'technology_id is required' });
    }
    const area = await getDb().get('SELECT id FROM areas WHERE id = ?', req.params.areaId);
    if (!area) return res.status(404).json({ error: 'Area not found' });

    const tech = await getDb().get('SELECT id FROM technologies WHERE id = ?', technology_id);
    if (!tech) {
      return res.status(400).json({ error: 'technology_id references a non-existent technology' });
    }

    const result = await getDb().run(
      'INSERT INTO area_technologies (area_id, technology_id, is_selected, notes) VALUES (?, ?, ?, ?)',
      [req.params.areaId, technology_id, is_selected ? 1 : 0, notes || null]
    );
    const row = await getDb().get(
      `SELECT at.*, t.name AS technology_name, t.description AS technology_description,
              t.vendor, t.coe_id, c.name AS coe_name
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

module.exports = router;
