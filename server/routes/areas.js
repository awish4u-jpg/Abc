const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/areas?project_id=N — list areas (optionally filtered by project)
router.get('/', async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let query = 'SELECT * FROM areas';
    const params = [];
    if (project_id) {
      query += ' WHERE project_id = ?';
      params.push(project_id);
    }
    query += ' ORDER BY sort_order, name';
    const areas = await getDb().all(query, params);
    res.json(areas);
  } catch (err) {
    next(err);
  }
});

// GET /api/areas/:id
router.get('/:id', async (req, res, next) => {
  try {
    const area = await getDb().get(
      'SELECT * FROM areas WHERE id = ?',
      req.params.id
    );
    if (!area) return res.status(404).json({ error: 'Area not found' });
    res.json(area);
  } catch (err) {
    next(err);
  }
});

// POST /api/areas
router.post('/', async (req, res, next) => {
  try {
    const { project_id, name, description, sort_order } = req.body;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    // Verify project exists
    const project = await getDb().get(
      'SELECT id FROM projects WHERE id = ?',
      project_id
    );
    if (!project) {
      return res.status(400).json({ error: 'project_id references a non-existent project' });
    }
    const result = await getDb().run(
      'INSERT INTO areas (project_id, name, description, sort_order) VALUES (?, ?, ?, ?)',
      [project_id, name.trim(), description || null, sort_order ?? 0]
    );
    const area = await getDb().get(
      'SELECT * FROM areas WHERE id = ?',
      result.lastID
    );
    res.status(201).json(area);
  } catch (err) {
    next(err);
  }
});

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
    const area = await getDb().get(
      'SELECT * FROM areas WHERE id = ?',
      req.params.id
    );
    res.json(area);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/areas/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run(
      'DELETE FROM areas WHERE id = ?',
      req.params.id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
