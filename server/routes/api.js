const express = require('express');
const multer = require('multer');
const router = express.Router();

const projects = require('./projects');
const areas = require('./areas');
const coes = require('./coes');
const technologies = require('./technologies');
const areaTechnologies = require('./area-technologies');
const sessions = require('./sessions');
const media = require('./media');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/projects', projects);
router.use('/areas', areas);
router.use('/coes', coes);
router.use('/technologies', technologies);
router.use('/area-technologies', areaTechnologies);
router.use('/sessions', sessions);
router.use('/', media);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('is not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
