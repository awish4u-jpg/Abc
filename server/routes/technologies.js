const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/technologies?project_id=N&coe_id=N
router.get('/', async (req, res, next) => {
  try {
    const { project_id, coe_id } = req.query;
    let query = 'SELECT t.*, c.name AS coe_name FROM technologies t LEFT JOIN coes c ON c.id = t.coe_id';
    const conditions = [];
    const params = [];
    if (project_id) {
      conditions.push('t.project_id = ?');
      params.push(project_id);
    }
    if (coe_id) {
      conditions.push('t.coe_id = ?');
      params.push(coe_id);
    }
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY t.name';
    const technologies = await getDb().all(query, params);
    res.json(technologies);
  } catch (err) {
    next(err);
  }
});

// GET /api/technologies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tech = await getDb().get(
      `SELECT t.*, c.name AS coe_name
       FROM technologies t
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE t.id = ?`,
      req.params.id
    );
    if (!tech) return res.status(404).json({ error: 'Technology not found' });
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

// POST /api/technologies
router.post('/', async (req, res, next) => {
  try {
    const { project_id, coe_id, name, description, vendor } = req.body;
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
    if (coe_id) {
      const coe = await getDb().get('SELECT id FROM coes WHERE id = ?', coe_id);
      if (!coe) {
        return res.status(400).json({ error: 'coe_id references a non-existent COE' });
      }
    }
    const result = await getDb().run(
      'INSERT INTO technologies (project_id, coe_id, name, description, vendor) VALUES (?, ?, ?, ?, ?)',
      [project_id, coe_id || null, name.trim(), description || null, vendor || null]
    );
    const tech = await getDb().get(
      `SELECT t.*, c.name AS coe_name
       FROM technologies t
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE t.id = ?`,
      result.lastID
    );
    res.status(201).json(tech);
  } catch (err) {
    next(err);
  }
});

// PUT /api/technologies/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { coe_id, name, description, vendor } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (coe_id) {
      const coe = await getDb().get('SELECT id FROM coes WHERE id = ?', coe_id);
      if (!coe) {
        return res.status(400).json({ error: 'coe_id references a non-existent COE' });
      }
    }
    const result = await getDb().run(
      'UPDATE technologies SET coe_id = ?, name = ?, description = ?, vendor = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [coe_id || null, name.trim(), description || null, vendor || null, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Technology not found' });
    }
    const tech = await getDb().get(
      `SELECT t.*, c.name AS coe_name
       FROM technologies t
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE t.id = ?`,
      req.params.id
    );
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/technologies/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run(
      'DELETE FROM technologies WHERE id = ?',
      req.params.id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Technology not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
