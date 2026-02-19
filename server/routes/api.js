const express = require('express');
const router = express.Router();

const projects = require('./projects');
const areas = require('./areas');
const coes = require('./coes');
const technologies = require('./technologies');
const areaTechnologies = require('./area-technologies');
const sessions = require('./sessions');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/projects', projects);
router.use('/areas', areas);
router.use('/coes', coes);
router.use('/technologies', technologies);
router.use('/area-technologies', areaTechnologies);
router.use('/sessions', sessions);

module.exports = router;
