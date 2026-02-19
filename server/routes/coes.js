const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/coes?project_id=N
router.get('/', async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let query = 'SELECT * FROM coes';
    const params = [];
    if (project_id) {
      query += ' WHERE project_id = ?';
      params.push(project_id);
    }
    query += ' ORDER BY name';
    const coes = await getDb().all(query, params);
    res.json(coes);
  } catch (err) {
    next(err);
  }
});

// GET /api/coes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const coe = await getDb().get(
      'SELECT * FROM coes WHERE id = ?',
      req.params.id
    );
    if (!coe) return res.status(404).json({ error: 'COE not found' });
    res.json(coe);
  } catch (err) {
    next(err);
  }
});

// POST /api/coes
router.post('/', async (req, res, next) => {
  try {
    const { project_id, name, description } = req.body;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const project = await getDb().get(
      'SELECT id FROM projects WHERE id = ?',
      project_id
    );
    if (!project) {
      return res.status(400).json({ error: 'project_id references a non-existent project' });
    }
    const result = await getDb().run(
      'INSERT INTO coes (project_id, name, description) VALUES (?, ?, ?)',
      [project_id, name.trim(), description || null]
    );
    const coe = await getDb().get(
      'SELECT * FROM coes WHERE id = ?',
      result.lastID
    );
    res.status(201).json(coe);
  } catch (err) {
    next(err);
  }
});

// PUT /api/coes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'UPDATE coes SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), description || null, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'COE not found' });
    }
    const coe = await getDb().get(
      'SELECT * FROM coes WHERE id = ?',
      req.params.id
    );
    res.json(coe);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/coes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run(
      'DELETE FROM coes WHERE id = ?',
      req.params.id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'COE not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
