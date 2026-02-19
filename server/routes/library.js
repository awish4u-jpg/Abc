const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/library — list all library technologies with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { coe_code, category, q } = req.query;
    const conditions = [];
    const params = [];

    if (coe_code) {
      conditions.push('coe_code = ?');
      params.push(coe_code);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (q) {
      conditions.push('(name LIKE ? OR description LIKE ? OR vendor LIKE ?)');
      const pattern = `%${q.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    let query = 'SELECT * FROM library_technologies';
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY coe_code, name';

    const techs = await getDb().all(query, params);
    res.json(techs);
  } catch (err) {
    next(err);
  }
});

// POST /api/library/bulk-import — import multiple library technologies into a project
// (must be before /:id to avoid route conflict)
router.post('/bulk-import', async (req, res, next) => {
  try {
    const db = getDb();
    const { project_id, coe_id, library_ids } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });
    if (!library_ids || !library_ids.length) return res.status(400).json({ error: 'library_ids is required' });
    const project = await db.get('SELECT id FROM projects WHERE id = ?', project_id);
    if (!project) return res.status(400).json({ error: 'project_id references a non-existent project' });

    const imported = [];
    for (const libId of library_ids) {
      const libTech = await db.get('SELECT * FROM library_technologies WHERE id = ?', libId);
      if (!libTech) continue;

      const result = await db.run(
        'INSERT INTO technologies (project_id, coe_id, name, description, vendor, vision, why_it_works, key_points, certifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [project_id, coe_id || null, libTech.name, libTech.description, libTech.vendor, libTech.vision, libTech.why_it_works, libTech.key_points, libTech.certifications]
      );
      const tech = await db.get('SELECT * FROM technologies WHERE id = ?', result.lastID);
      imported.push(tech);
    }

    res.status(201).json(imported);
  } catch (err) {
    next(err);
  }
});

// GET /api/library/:id
router.get('/:id', async (req, res, next) => {
  try {
    const tech = await getDb().get('SELECT * FROM library_technologies WHERE id = ?', req.params.id);
    if (!tech) return res.status(404).json({ error: 'Library technology not found' });
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

// POST /api/library
router.post('/', async (req, res, next) => {
  try {
    const { coe_code, name, description, vendor, vision, why_it_works, key_points, certifications, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'INSERT INTO library_technologies (coe_code, name, description, vendor, vision, why_it_works, key_points, certifications, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [coe_code || null, name.trim(), description || null, vendor || null, vision || null, why_it_works || null, key_points || null, certifications || null, category || null]
    );
    const tech = await getDb().get('SELECT * FROM library_technologies WHERE id = ?', result.lastID);
    res.status(201).json(tech);
  } catch (err) {
    next(err);
  }
});

// PUT /api/library/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { coe_code, name, description, vendor, vision, why_it_works, key_points, certifications, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'UPDATE library_technologies SET coe_code = ?, name = ?, description = ?, vendor = ?, vision = ?, why_it_works = ?, key_points = ?, certifications = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [coe_code || null, name.trim(), description || null, vendor || null, vision || null, why_it_works || null, key_points || null, certifications || null, category || null, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Library technology not found' });
    const tech = await getDb().get('SELECT * FROM library_technologies WHERE id = ?', req.params.id);
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/library/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await getDb().run('DELETE FROM library_technologies WHERE id = ?', req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Library technology not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/library/:id/import — import a library technology into a project (snapshot copy)
router.post('/:id/import', async (req, res, next) => {
  try {
    const db = getDb();
    const libTech = await db.get('SELECT * FROM library_technologies WHERE id = ?', req.params.id);
    if (!libTech) return res.status(404).json({ error: 'Library technology not found' });

    const { project_id, coe_id } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    const project = await db.get('SELECT id FROM projects WHERE id = ?', project_id);
    if (!project) return res.status(400).json({ error: 'Project not found' });

    // Snapshot: copy from library into project technologies
    const result = await db.run(
      'INSERT INTO technologies (project_id, coe_id, name, description, vendor, vision, why_it_works, key_points, certifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [project_id, coe_id || null, libTech.name, libTech.description, libTech.vendor, libTech.vision, libTech.why_it_works, libTech.key_points, libTech.certifications]
    );

    const tech = await db.get(
      `SELECT t.*, c.name AS coe_name FROM technologies t LEFT JOIN coes c ON c.id = t.coe_id WHERE t.id = ?`,
      result.lastID
    );
    res.status(201).json(tech);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
