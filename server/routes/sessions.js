const express = require('express');
const PDFDocument = require('pdfkit');
const { getDb } = require('../../database/init');

const router = express.Router();

// POST /api/sessions
router.post('/', async (req, res, next) => {
  try {
    const { project_id, name } = req.body;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const project = await getDb().get('SELECT id FROM projects WHERE id = ?', project_id);
    if (!project) {
      return res.status(400).json({ error: 'project_id references a non-existent project' });
    }
    const result = await getDb().run(
      'INSERT INTO sessions (project_id, name) VALUES (?, ?)',
      [project_id, name.trim()]
    );
    const session = await getDb().get('SELECT * FROM sessions WHERE id = ?', result.lastID);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sessions/:id — update session status
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `status is required and must be one of: ${validStatuses.join(', ')}`,
      });
    }
    const result = await getDb().run(
      'UPDATE sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = await getDb().get('SELECT * FROM sessions WHERE id = ?', req.params.id);
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/decisions — log a decision
router.post('/:id/decisions', async (req, res, next) => {
  try {
    const db = getDb();
    const session = await db.get('SELECT * FROM sessions WHERE id = ?', req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Cannot add decisions to a non-active session' });
    }

    const { area_technology_id, action, details } = req.body;
    const validActions = ['add', 'remove', 'swap'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        error: `action is required and must be one of: ${validActions.join(', ')}`,
      });
    }

    if (area_technology_id) {
      const at = await db.get('SELECT id FROM area_technologies WHERE id = ?', area_technology_id);
      if (!at) {
        return res.status(400).json({ error: 'area_technology_id references a non-existent assignment' });
      }
    }

    const result = await db.run(
      'INSERT INTO decisions (session_id, area_technology_id, action, details) VALUES (?, ?, ?, ?)',
      [req.params.id, area_technology_id || null, action, details || null]
    );
    const decision = await db.get('SELECT * FROM decisions WHERE id = ?', result.lastID);
    res.status(201).json(decision);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/decisions
router.get('/:id/decisions', async (req, res, next) => {
  try {
    const session = await getDb().get('SELECT * FROM sessions WHERE id = ?', req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const decisions = await getDb().all(
      `SELECT d.*,
              at.area_id, at.technology_id, at.is_selected,
              a.name AS area_name,
              t.name AS technology_name, t.vendor,
              c.name AS coe_name
       FROM decisions d
       LEFT JOIN area_technologies at ON at.id = d.area_technology_id
       LEFT JOIN areas a ON a.id = at.area_id
       LEFT JOIN technologies t ON t.id = at.technology_id
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE d.session_id = ?
       ORDER BY d.created_at`,
      req.params.id
    );
    res.json(decisions);
  } catch (err) {
    next(err);
  }
});

// Helper: build report data (shared by JSON and PDF)
async function buildReport(sessionId) {
  const db = getDb();
  const session = await db.get(
    'SELECT s.*, p.name AS project_name FROM sessions s JOIN projects p ON p.id = s.project_id WHERE s.id = ?',
    sessionId
  );
  if (!session) return null;

  const decisions = await db.all(
    `SELECT d.*,
            at.area_id, at.technology_id, at.is_selected, at.notes AS assignment_notes,
            a.name AS area_name,
            t.name AS technology_name, t.vendor,
            c.name AS coe_name
     FROM decisions d
     LEFT JOIN area_technologies at ON at.id = d.area_technology_id
     LEFT JOIN areas a ON a.id = at.area_id
     LEFT JOIN technologies t ON t.id = at.technology_id
     LEFT JOIN coes c ON c.id = t.coe_id
     WHERE d.session_id = ?
     ORDER BY d.created_at`,
    sessionId
  );

  const summary = { add: 0, remove: 0, swap: 0 };
  for (const d of decisions) {
    summary[d.action] = (summary[d.action] || 0) + 1;
  }

  return {
    session: {
      id: session.id,
      name: session.name,
      status: session.status,
      project_id: session.project_id,
      project_name: session.project_name,
      created_at: session.created_at,
    },
    summary: {
      total_decisions: decisions.length,
      ...summary,
    },
    decisions: decisions.map((d) => ({
      id: d.id,
      action: d.action,
      details: d.details,
      area_name: d.area_name,
      technology_name: d.technology_name,
      vendor: d.vendor,
      coe_name: d.coe_name,
      is_selected: d.is_selected,
      created_at: d.created_at,
    })),
  };
}

// GET /api/sessions/:id/report — JSON report
router.get('/:id/report', async (req, res, next) => {
  try {
    const report = await buildReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Session not found' });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/report/pdf — PDF download
router.get('/:id/report/pdf', async (req, res, next) => {
  try {
    const report = await buildReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Session not found' });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="session-${report.session.id}-report.pdf"`
    );
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Session Report', { align: 'center' });
    doc.moveDown();

    // Session info
    doc.fontSize(12);
    doc.text(`Project: ${report.session.project_name}`);
    doc.text(`Session: ${report.session.name}`);
    doc.text(`Status: ${report.session.status}`);
    doc.text(`Created: ${report.session.created_at}`);
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Total decisions: ${report.summary.total_decisions}`);
    doc.text(`  Add: ${report.summary.add}`);
    doc.text(`  Remove: ${report.summary.remove}`);
    doc.text(`  Swap: ${report.summary.swap}`);
    doc.moveDown();

    // Decisions table
    if (report.decisions.length > 0) {
      doc.fontSize(14).text('Decisions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);

      for (const d of report.decisions) {
        const tech = d.technology_name || 'N/A';
        const area = d.area_name || 'N/A';
        const coe = d.coe_name || 'N/A';
        doc.text(
          `[${d.action.toUpperCase()}] ${tech} in ${area} (COE: ${coe})`,
          { continued: false }
        );
        if (d.details) {
          doc.text(`  Details: ${d.details}`, { indent: 20 });
        }
        doc.text(`  Date: ${d.created_at}`, { indent: 20 });
        doc.moveDown(0.3);
      }
    } else {
      doc.fontSize(12).text('No decisions recorded for this session.');
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
