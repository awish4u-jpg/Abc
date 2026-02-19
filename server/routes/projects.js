const express = require('express');
const { getDb } = require('../../database/init');

const router = express.Router();

// GET /api/projects?is_template=0|1
router.get('/', async (req, res, next) => {
  try {
    const { is_template } = req.query;
    let query = 'SELECT * FROM projects';
    const params = [];
    if (is_template !== undefined) {
      query += ' WHERE is_template = ?';
      params.push(is_template === 'true' || is_template === '1' ? 1 : 0);
    }
    query += ' ORDER BY created_at DESC';
    const projects = await getDb().all(query, params);
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
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

// POST /api/projects
router.post('/', async (req, res, next) => {
  try {
    const { name, description, client, type, is_template } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'INSERT INTO projects (name, description, client, type, is_template) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), description || null, client || null, type || null, is_template ? 1 : 0]
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

// PUT /api/projects/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, client, type, is_template } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await getDb().run(
      'UPDATE projects SET name = ?, description = ?, client = ?, type = ?, is_template = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), description || null, client || null, type || null, is_template !== undefined ? (is_template ? 1 : 0) : 0, req.params.id]
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

// DELETE /api/projects/:id
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

// POST /api/projects/:id/clone — deep-copy a project with all children
router.post('/:id/clone', async (req, res, next) => {
  try {
    const db = getDb();
    const source = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!source) return res.status(404).json({ error: 'Project not found' });

    const cloneName = (req.body.name || `${source.name} (Copy)`).trim();
    const isTemplate = req.body.is_template !== undefined ? (req.body.is_template ? 1 : 0) : 0;

    const projResult = await db.run(
      'INSERT INTO projects (name, description, client, type, is_template) VALUES (?, ?, ?, ?, ?)',
      [cloneName, source.description, req.body.client || source.client, req.body.type || source.type, isTemplate]
    );
    const newProjectId = projResult.lastID;

    // Clone COEs and build old->new id map
    const coeMap = {};
    const oldCoes = await db.all('SELECT * FROM coes WHERE project_id = ?', source.id);
    for (const c of oldCoes) {
      const r = await db.run(
        'INSERT INTO coes (project_id, name, description, code) VALUES (?, ?, ?, ?)',
        [newProjectId, c.name, c.description, c.code]
      );
      coeMap[c.id] = r.lastID;
    }

    // Clone technologies
    const techMap = {};
    const oldTechs = await db.all('SELECT * FROM technologies WHERE project_id = ?', source.id);
    for (const t of oldTechs) {
      const r = await db.run(
        'INSERT INTO technologies (project_id, coe_id, name, description, vendor, vision, why_it_works, key_points, certifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newProjectId, t.coe_id ? (coeMap[t.coe_id] || null) : null, t.name, t.description, t.vendor, t.vision, t.why_it_works, t.key_points, t.certifications]
      );
      techMap[t.id] = r.lastID;
    }

    // Clone areas
    const oldAreas = await db.all('SELECT * FROM areas WHERE project_id = ?', source.id);
    for (const a of oldAreas) {
      const r = await db.run(
        'INSERT INTO areas (project_id, name, description, sort_order, reviewed) VALUES (?, ?, ?, ?, 0)',
        [newProjectId, a.name, a.description, a.sort_order]
      );
      const newAreaId = r.lastID;

      // Clone area-technology assignments
      const oldATs = await db.all('SELECT * FROM area_technologies WHERE area_id = ?', a.id);
      for (const at of oldATs) {
        const newTechId = techMap[at.technology_id];
        if (newTechId) {
          await db.run(
            'INSERT INTO area_technologies (area_id, technology_id, is_selected, notes) VALUES (?, ?, ?, ?)',
            [newAreaId, newTechId, at.is_selected, at.notes]
          );
        }
      }
    }

    const project = await db.get('SELECT * FROM projects WHERE id = ?', newProjectId);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id/presentation — full structure with areas, technologies grouped by COE, selection states, notes
router.get('/:id/presentation', async (req, res, next) => {
  try {
    const db = getDb();
    const project = await db.get('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // All areas with their technologies
    const areas = await db.all(
      'SELECT * FROM areas WHERE project_id = ? ORDER BY sort_order, name',
      project.id
    );
    for (const area of areas) {
      const techs = await db.all(
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

      // Group technologies by COE within each area
      const byCoe = {};
      for (const t of techs) {
        const key = t.coe_id || 'uncategorized';
        if (!byCoe[key]) {
          byCoe[key] = {
            coe_id: t.coe_id,
            coe_name: t.coe_name || 'Uncategorized',
            technologies: [],
          };
        }
        byCoe[key].technologies.push({
          area_technology_id: t.area_technology_id,
          technology_id: t.technology_id,
          name: t.name,
          description: t.description,
          vendor: t.vendor,
          is_selected: t.is_selected,
          notes: t.notes,
        });
      }
      area.technology_groups = Object.values(byCoe);
    }

    // All COEs with their technologies
    const coes = await db.all('SELECT * FROM coes WHERE project_id = ? ORDER BY name', project.id);
    for (const coe of coes) {
      coe.technologies = await db.all(
        'SELECT * FROM technologies WHERE coe_id = ? ORDER BY name',
        coe.id
      );
    }

    res.json({ project, areas, coes });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId/areas
router.get('/:projectId/areas', async (req, res, next) => {
  try {
    const project = await getDb().get(
      'SELECT id FROM projects WHERE id = ?',
      req.params.projectId
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const areas = await getDb().all(
      'SELECT * FROM areas WHERE project_id = ? ORDER BY sort_order, name',
      req.params.projectId
    );
    res.json(areas);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/areas
router.post('/:projectId/areas', async (req, res, next) => {
  try {
    const { name, description, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const project = await getDb().get(
      'SELECT id FROM projects WHERE id = ?',
      req.params.projectId
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const result = await getDb().run(
      'INSERT INTO areas (project_id, name, description, sort_order) VALUES (?, ?, ?, ?)',
      [req.params.projectId, name.trim(), description || null, sort_order ?? 0]
    );
    const area = await getDb().get('SELECT * FROM areas WHERE id = ?', result.lastID);
    res.status(201).json(area);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId/sessions
router.get('/:projectId/sessions', async (req, res, next) => {
  try {
    const project = await getDb().get(
      'SELECT id FROM projects WHERE id = ?',
      req.params.projectId
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sessions = await getDb().all(
      'SELECT * FROM sessions WHERE project_id = ? ORDER BY created_at DESC',
      req.params.projectId
    );
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
