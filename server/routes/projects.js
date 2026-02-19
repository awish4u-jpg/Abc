const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/projects — list all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await getDb().all(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — get a single project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await getDb().get(
      'SELECT * FROM projects WHERE id = ?',
      req.params.id
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create a project
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'INSERT INTO projects (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    );
    const project = await getDb().get(
      'SELECT * FROM projects WHERE id = ?',
      result.lastID
    );
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — update a project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'UPDATE projects SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), description || null, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = await getDb().get(
      'SELECT * FROM projects WHERE id = ?',
      req.params.id
    );
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — delete a project
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run(
      'DELETE FROM projects WHERE id = ?',
      req.params.id
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/presentation — full presentation structure
router.get('/:id/presentation', async (req, res, next) => {
  try {
    const db = getDb();
    const project = await db.get(
      'SELECT * FROM projects WHERE id = ?',
      req.params.id
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const areas = await db.all(
      'SELECT * FROM areas WHERE project_id = ? ORDER BY sort_order, name',
      project.id
    );

    const coes = await db.all(
      'SELECT * FROM coes WHERE project_id = ?',
      project.id
    );

    // For each area, fetch its technologies with COE info
    for (const area of areas) {
      area.technologies = await db.all(
        `SELECT at.id AS area_technology_id, at.is_selected, at.notes,
                t.id AS technology_id, t.name, t.description, t.vendor,
                t.coe_id, c.name AS coe_name
         FROM area_technologies at
         JOIN technologies t ON t.id = at.technology_id
         LEFT JOIN coes c ON c.id = t.coe_id
         WHERE at.area_id = ?
         ORDER BY c.name, t.name`,
        area.id
      );
    }

    // Group COEs with their technologies for a quick lookup
    const coesWithTech = [];
    for (const coe of coes) {
      const technologies = await db.all(
        'SELECT * FROM technologies WHERE coe_id = ? ORDER BY name',
        coe.id
      );
      coesWithTech.push({ ...coe, technologies });
    }

    res.json({
      project,
      areas,
      coes: coesWithTech,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
