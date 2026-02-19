const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

const AT_SELECT = `SELECT at.*, t.name AS technology_name, t.description AS technology_description,
  t.vendor, t.coe_id, c.name AS coe_name
  FROM area_technologies at
  JOIN technologies t ON t.id = at.technology_id
  LEFT JOIN coes c ON c.id = t.coe_id`;

// PATCH /api/area-technologies/:id — toggle selection, update notes
router.patch('/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get('SELECT * FROM area_technologies WHERE id = ?', req.params.id);
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

    const row = await db.get(`${AT_SELECT} WHERE at.id = ?`, req.params.id);
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/area-technologies/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run('DELETE FROM area_technologies WHERE id = ?', req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Area-technology assignment not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/area-technologies/:id/swap — swap to a different technology
router.post('/:id/swap', async (req, res, next) => {
  try {
    const db = getDb();
    const existing = await db.get('SELECT * FROM area_technologies WHERE id = ?', req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Area-technology assignment not found' });
    }

    const { new_technology_id } = req.body;
    if (!new_technology_id) {
      return res.status(400).json({ error: 'new_technology_id is required' });
    }

    const newTech = await db.get('SELECT id FROM technologies WHERE id = ?', new_technology_id);
    if (!newTech) {
      return res.status(400).json({ error: 'new_technology_id references a non-existent technology' });
    }

    // Check for duplicate
    const dup = await db.get(
      'SELECT id FROM area_technologies WHERE area_id = ? AND technology_id = ?',
      [existing.area_id, new_technology_id]
    );
    if (dup) {
      return res.status(409).json({ error: 'The new technology is already assigned to this area' });
    }

    await db.run(
      'UPDATE area_technologies SET technology_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [new_technology_id, req.params.id]
    );

    const row = await db.get(`${AT_SELECT} WHERE at.id = ?`, req.params.id);
    res.json(row);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
