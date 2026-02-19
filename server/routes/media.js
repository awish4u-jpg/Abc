const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../../database/init');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// POST /api/upload — multipart file upload (tracks in media table)
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Use form field name "file".' });
    }
    const url = `/api/uploads/${req.file.filename}`;
    const { coe_id, area_id, technology_id } = req.body;

    const result = await getDb().run(
      'INSERT INTO media (filename, original_name, mimetype, size, url, coe_id, area_id, technology_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url, coe_id || null, area_id || null, technology_id || null]
    );

    const record = await getDb().get('SELECT * FROM media WHERE id = ?', result.lastID);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// GET /api/media — list all tracked uploads with optional filters
router.get('/media', async (req, res, next) => {
  try {
    const { mimetype, coe_id, area_id } = req.query;
    const conditions = [];
    const params = [];

    if (mimetype) {
      conditions.push('m.mimetype LIKE ?');
      params.push(`${mimetype}%`);
    }
    if (coe_id) {
      conditions.push('m.coe_id = ?');
      params.push(coe_id);
    }
    if (area_id) {
      conditions.push('m.area_id = ?');
      params.push(area_id);
    }

    let query = `SELECT m.*, c.name AS coe_name, a.name AS area_name
      FROM media m
      LEFT JOIN coes c ON c.id = m.coe_id
      LEFT JOIN areas a ON a.id = m.area_id`;
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY m.created_at DESC';

    const media = await getDb().all(query, params);
    res.json(media);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/media/:id — delete a tracked upload
router.delete('/media/:id', async (req, res, next) => {
  try {
    const record = await getDb().get('SELECT * FROM media WHERE id = ?', req.params.id);
    if (!record) return res.status(404).json({ error: 'Media not found' });

    // Remove file from disk
    const filePath = path.join(UPLOADS_DIR, record.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await getDb().run('DELETE FROM media WHERE id = ?', req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/uploads/:filename — serve an uploaded file
router.get('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

module.exports = router;
