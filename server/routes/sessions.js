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

  // Fetch areas with their technologies for area breakdown
  const areas = await db.all(
    'SELECT * FROM areas WHERE project_id = ? ORDER BY sort_order, id',
    session.project_id
  );

  const areasWithTechs = [];
  for (const area of areas) {
    const techs = await db.all(
      `SELECT at.*, t.name AS technology_name, t.vendor, t.description AS tech_description,
              c.name AS coe_name
       FROM area_technologies at
       JOIN technologies t ON t.id = at.technology_id
       LEFT JOIN coes c ON c.id = t.coe_id
       WHERE at.area_id = ?
       ORDER BY at.is_selected DESC, t.name`,
      area.id
    );
    areasWithTechs.push({ ...area, technologies: techs });
  }

  const summary = { add: 0, remove: 0, swap: 0 };
  for (const d of decisions) {
    summary[d.action] = (summary[d.action] || 0) + 1;
  }

  const areasReviewed = areas.filter((a) => a.reviewed).length;
  const totalSelected = areasWithTechs.reduce(
    (acc, a) => acc + a.technologies.filter((t) => t.is_selected).length,
    0
  );

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
      areas_reviewed: areasReviewed,
      total_areas: areas.length,
      technologies_selected: totalSelected,
      ...summary,
    },
    areas: areasWithTechs.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      reviewed: a.reviewed,
      technologies: a.technologies.map((t) => ({
        id: t.id,
        technology_name: t.technology_name,
        vendor: t.vendor,
        coe_name: t.coe_name,
        is_selected: t.is_selected,
        notes: t.notes,
      })),
    })),
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

// ========================================================================
// GET /api/sessions/:id/report/pdf — Branded Layer 1 PDF Report
// ========================================================================

// Brand colours
const CREAM = [245, 240, 235];     // #F5F0EB
const GOLD = [197, 165, 114];      // #C5A572
const DARK = [26, 26, 26];         // #1A1A1A
const MID_GREY = [102, 102, 102];  // #666666
const LIGHT_GREY = [153, 153, 153]; // #999999
const ROW_ALT = [249, 246, 242];   // #F9F6F2
const WHITE = [255, 255, 255];

const PAGE_W = 595.28; // A4 width
const PAGE_H = 841.89; // A4 height
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

function rgb(c) { return c.map((v) => v / 255); }

// Draw page chrome: cream bg, gold top bar, footer with gold rule + "Layer 1" + page number
function drawPageChrome(doc, pageNum) {
  // Cream background
  doc.save();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(rgb(CREAM));
  doc.restore();

  // Gold top bar (4pt)
  doc.save();
  doc.rect(0, 0, PAGE_W, 4).fill(rgb(GOLD));
  doc.restore();

  // Footer: gold rule at y=800, text at y=808
  const footerY = PAGE_H - 42;
  doc.save();
  doc.moveTo(MARGIN, footerY).lineTo(PAGE_W - MARGIN, footerY)
    .strokeColor(rgb(GOLD)).lineWidth(0.5).stroke();
  doc.restore();

  doc.save();
  doc.font('Times-Bold').fontSize(8).fillColor(rgb(GOLD));
  doc.text('Layer 1', MARGIN, footerY + 8, { width: CONTENT_W / 2, align: 'left' });
  doc.restore();

  doc.save();
  doc.font('Helvetica').fontSize(8).fillColor(rgb(LIGHT_GREY));
  doc.text(`${pageNum}`, PAGE_W / 2, footerY + 8, { width: CONTENT_W / 2, align: 'right' });
  doc.restore();
}

router.get('/:id/report/pdf', async (req, res, next) => {
  try {
    const report = await buildReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Session not found' });

    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      autoFirstPage: false,
      bufferPages: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="layer1-report-${report.session.id}.pdf"`
    );
    doc.pipe(res);

    const dateStr = new Date(report.session.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // =====================================================================
    // COVER PAGE
    // =====================================================================
    doc.addPage();

    // Cream bg + gold top bar
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(rgb(CREAM));
    doc.rect(0, 0, PAGE_W, 4).fill(rgb(GOLD));

    // Centered content
    const coverCenterY = PAGE_H * 0.35;

    // "Layer 1." logo
    doc.font('Times-Bold').fontSize(42).fillColor(rgb(DARK));
    doc.text('Layer 1', 0, coverCenterY, { align: 'center', continued: true });
    doc.fillColor(rgb(GOLD)).text('.');

    // Gold rule under logo
    const ruleY = coverCenterY + 58;
    doc.moveTo(PAGE_W / 2 - 30, ruleY).lineTo(PAGE_W / 2 + 30, ruleY)
      .strokeColor(rgb(GOLD)).lineWidth(1.5).stroke();

    // "TECHNOLOGY SELECTION REPORT"
    doc.font('Helvetica').fontSize(10).fillColor(rgb(LIGHT_GREY));
    doc.text('TECHNOLOGY SELECTION REPORT', 0, ruleY + 20, {
      align: 'center',
      characterSpacing: 3,
    });

    // Project name
    doc.font('Times-Bold').fontSize(22).fillColor(rgb(DARK));
    doc.text(report.session.project_name, 0, ruleY + 55, { align: 'center' });

    // Date
    doc.font('Helvetica').fontSize(10).fillColor(rgb(MID_GREY));
    doc.text(dateStr, 0, ruleY + 88, { align: 'center' });

    // Session name
    doc.font('Helvetica').fontSize(9).fillColor(rgb(LIGHT_GREY));
    doc.text(report.session.name, 0, ruleY + 108, { align: 'center' });

    // =====================================================================
    // EXECUTIVE SUMMARY PAGE
    // =====================================================================
    doc.addPage();
    let y = 20;

    // Section title
    doc.font('Times-Bold').fontSize(20).fillColor(rgb(DARK));
    doc.text('Executive Summary', MARGIN, y);
    y += 30;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + 60, y)
      .strokeColor(rgb(GOLD)).lineWidth(2).stroke();
    y += 25;

    // Metric cards row
    const metrics = [
      { label: 'Areas Reviewed', value: `${report.summary.areas_reviewed}/${report.summary.total_areas}` },
      { label: 'Technologies Selected', value: `${report.summary.technologies_selected}` },
      { label: 'Total Changes', value: `${report.summary.total_decisions}` },
    ];

    const cardW = (CONTENT_W - 20) / 3;
    const cardH = 80;

    metrics.forEach((m, i) => {
      const cx = MARGIN + i * (cardW + 10);

      // Card bg
      doc.rect(cx, y, cardW, cardH).fill(rgb(WHITE));
      // Gold top accent (3pt)
      doc.rect(cx, y, cardW, 3).fill(rgb(GOLD));

      // Value (large gold)
      doc.font('Helvetica-Bold').fontSize(28).fillColor(rgb(GOLD));
      doc.text(m.value, cx + 12, y + 18, { width: cardW - 24 });

      // Label
      doc.font('Helvetica').fontSize(9).fillColor(rgb(MID_GREY));
      doc.text(m.label.toUpperCase(), cx + 12, y + 52, { width: cardW - 24, characterSpacing: 1 });
    });

    y += cardH + 25;

    // Breakdown bar: Add / Remove / Swap
    const breakdownItems = [
      { label: 'Added', value: report.summary.add },
      { label: 'Removed', value: report.summary.remove },
      { label: 'Swapped', value: report.summary.swap },
    ];

    doc.font('Helvetica-Bold').fontSize(10).fillColor(rgb(DARK));
    doc.text('Decision Breakdown', MARGIN, y);
    y += 18;

    breakdownItems.forEach((item) => {
      doc.font('Helvetica').fontSize(10).fillColor(rgb(MID_GREY));
      doc.text(`${item.label}: `, MARGIN + 10, y, { continued: true });
      doc.font('Helvetica-Bold').fillColor(rgb(DARK)).text(`${item.value}`);
      y += 16;
    });

    // =====================================================================
    // AREA BREAKDOWN PAGES
    // =====================================================================
    for (const area of report.areas) {
      doc.addPage();
      y = 20;

      // Gold left bar + area name
      doc.rect(MARGIN, y, 4, 24).fill(rgb(GOLD));

      doc.font('Times-Bold').fontSize(18).fillColor(rgb(DARK));
      doc.text(area.name, MARGIN + 14, y + 2);
      y += 30;

      if (area.description) {
        doc.font('Helvetica').fontSize(10).fillColor(rgb(MID_GREY));
        doc.text(area.description, MARGIN + 14, y, { width: CONTENT_W - 14 });
        y += doc.heightOfString(area.description, { width: CONTENT_W - 14, fontSize: 10 }) + 10;
      }

      // Review status badge
      doc.font('Helvetica').fontSize(8).fillColor(area.reviewed ? rgb(GOLD) : rgb(LIGHT_GREY));
      doc.text(area.reviewed ? 'REVIEWED' : 'PENDING REVIEW', MARGIN + 14, y, { characterSpacing: 1.5 });
      y += 20;

      // Technology table
      if (area.technologies.length > 0) {
        const colWidths = {
          tech: CONTENT_W * 0.28,
          vendor: CONTENT_W * 0.18,
          coe: CONTENT_W * 0.18,
          status: CONTENT_W * 0.12,
          notes: CONTENT_W * 0.24,
        };
        const rowH = 24;
        const headerH = 28;

        // Table header (gold bg)
        doc.rect(MARGIN, y, CONTENT_W, headerH).fill(rgb(GOLD));
        doc.font('Helvetica-Bold').fontSize(8).fillColor(rgb(WHITE));
        const hY = y + 9;
        let colX = MARGIN + 8;
        doc.text('TECHNOLOGY', colX, hY, { width: colWidths.tech - 8 });
        colX += colWidths.tech;
        doc.text('VENDOR', colX, hY, { width: colWidths.vendor - 8 });
        colX += colWidths.vendor;
        doc.text('COE', colX, hY, { width: colWidths.coe - 8 });
        colX += colWidths.coe;
        doc.text('STATUS', colX, hY, { width: colWidths.status - 8 });
        colX += colWidths.status;
        doc.text('NOTES', colX, hY, { width: colWidths.notes - 8 });

        y += headerH;

        // Table rows
        area.technologies.forEach((tech, idx) => {
          // Check if we need a new page
          if (y + rowH > PAGE_H - 60) {
            doc.addPage();
            y = 20;
          }

          // Alternating row background
          const bgColor = idx % 2 === 0 ? ROW_ALT : WHITE;
          doc.rect(MARGIN, y, CONTENT_W, rowH).fill(rgb(bgColor));

          doc.font('Helvetica').fontSize(8).fillColor(rgb(DARK));
          const rY = y + 8;
          colX = MARGIN + 8;

          // Technology name (bold if selected)
          doc.font(tech.is_selected ? 'Helvetica-Bold' : 'Helvetica');
          doc.text(tech.technology_name || '—', colX, rY, { width: colWidths.tech - 12, lineBreak: false });
          colX += colWidths.tech;

          doc.font('Helvetica').fillColor(rgb(MID_GREY));
          doc.text(tech.vendor || '—', colX, rY, { width: colWidths.vendor - 12, lineBreak: false });
          colX += colWidths.vendor;

          doc.text(tech.coe_name || '—', colX, rY, { width: colWidths.coe - 12, lineBreak: false });
          colX += colWidths.coe;

          // Status with colour
          doc.font('Helvetica-Bold').fontSize(8);
          doc.fillColor(tech.is_selected ? rgb(GOLD) : rgb(LIGHT_GREY));
          doc.text(tech.is_selected ? 'Selected' : 'Available', colX, rY, { width: colWidths.status - 12, lineBreak: false });
          colX += colWidths.status;

          doc.font('Helvetica').fontSize(7).fillColor(rgb(MID_GREY));
          const noteText = tech.notes ? (tech.notes.length > 40 ? tech.notes.substring(0, 40) + '...' : tech.notes) : '—';
          doc.text(noteText, colX, rY + 1, { width: colWidths.notes - 12, lineBreak: false });

          y += rowH;
        });
      } else {
        doc.font('Helvetica').fontSize(10).fillColor(rgb(LIGHT_GREY));
        doc.text('No technologies assigned to this area.', MARGIN + 14, y);
        y += 20;
      }
    }

    // =====================================================================
    // CHANGE LOG PAGE
    // =====================================================================
    if (report.decisions.length > 0) {
      doc.addPage();
      y = 20;

      doc.font('Times-Bold').fontSize(20).fillColor(rgb(DARK));
      doc.text('Change Log', MARGIN, y);
      y += 30;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + 60, y)
        .strokeColor(rgb(GOLD)).lineWidth(2).stroke();
      y += 20;

      // Change log table
      const clColWidths = {
        date: CONTENT_W * 0.18,
        action: CONTENT_W * 0.12,
        tech: CONTENT_W * 0.22,
        area: CONTENT_W * 0.20,
        details: CONTENT_W * 0.28,
      };
      const clRowH = 24;

      // Header
      doc.rect(MARGIN, y, CONTENT_W, 28).fill(rgb(GOLD));
      doc.font('Helvetica-Bold').fontSize(8).fillColor(rgb(WHITE));
      const clHY = y + 9;
      let clX = MARGIN + 8;
      doc.text('DATE', clX, clHY, { width: clColWidths.date - 8 });
      clX += clColWidths.date;
      doc.text('ACTION', clX, clHY, { width: clColWidths.action - 8 });
      clX += clColWidths.action;
      doc.text('TECHNOLOGY', clX, clHY, { width: clColWidths.tech - 8 });
      clX += clColWidths.tech;
      doc.text('AREA', clX, clHY, { width: clColWidths.area - 8 });
      clX += clColWidths.area;
      doc.text('DETAILS', clX, clHY, { width: clColWidths.details - 8 });

      y += 28;

      report.decisions.forEach((d, idx) => {
        if (y + clRowH > PAGE_H - 60) {
          doc.addPage();
          y = 20;
        }

        const bgColor = idx % 2 === 0 ? ROW_ALT : WHITE;
        doc.rect(MARGIN, y, CONTENT_W, clRowH).fill(rgb(bgColor));

        const rY = y + 8;
        clX = MARGIN + 8;

        doc.font('Helvetica').fontSize(7).fillColor(rgb(MID_GREY));
        const dDate = new Date(d.created_at).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        doc.text(dDate, clX, rY, { width: clColWidths.date - 12, lineBreak: false });
        clX += clColWidths.date;

        // Action badge colour
        const actionColors = { add: [56, 142, 60], remove: [198, 40, 40], swap: [21, 101, 192] };
        doc.font('Helvetica-Bold').fontSize(7)
          .fillColor(rgb(actionColors[d.action] || DARK));
        doc.text(d.action.toUpperCase(), clX, rY, { width: clColWidths.action - 12, lineBreak: false });
        clX += clColWidths.action;

        doc.font('Helvetica').fontSize(8).fillColor(rgb(DARK));
        doc.text(d.technology_name || '—', clX, rY, { width: clColWidths.tech - 12, lineBreak: false });
        clX += clColWidths.tech;

        doc.fillColor(rgb(MID_GREY));
        doc.text(d.area_name || '—', clX, rY, { width: clColWidths.area - 12, lineBreak: false });
        clX += clColWidths.area;

        doc.font('Helvetica').fontSize(7).fillColor(rgb(MID_GREY));
        const detailText = d.details ? (d.details.length > 45 ? d.details.substring(0, 45) + '...' : d.details) : '—';
        doc.text(detailText, clX, rY + 1, { width: clColWidths.details - 12, lineBreak: false });

        y += clRowH;
      });
    }

    // =====================================================================
    // APPLY PAGE CHROME TO ALL PAGES
    // =====================================================================
    const pageCount = doc.bufferedPageRange().count;
    // Start from page 1 (skip cover page index 0 for page numbers, but apply chrome)
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      if (i > 0) {
        // Content pages get full chrome
        drawPageChrome(doc, i);
      }
      // Cover page already has its own bg + gold bar, no footer needed
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
