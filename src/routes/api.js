const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Channel = require('../models/Channel');
const PlaylistItem = require('../models/PlaylistItem');
const Schedule = require('../models/Schedule');
const LiveSession = require('../models/LiveSession');
const { startChannel, stopChannel } = require('../services/streamManager');

const router = express.Router();

// === Upload Setup ===
const uploadDir = path.join(__dirname, '..', 'uploads'); // folder di PROJECT_ROOT/uploads
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// === Upload File API ===
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }
    res.json({
      ok: true,
      file: '/uploads/' + req.file.filename,
      original: req.file.originalname
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === List All Uploaded Files API ===
router.get('/uploads', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.json({ ok: false, error: err.message });
    const list = files.map(f => ({
      name: f,
      url: '/uploads/' + f
    }));
    res.json({ ok: true, files: list });
  });
});

// === Channels CRUD ===
router.get('/channels', async (req, res) => {
  try {
    const data = await Channel.findAll();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/channels', async (req, res) => {
  try {
    const data = await Channel.create(req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.delete('/channels/:id', async (req, res) => {
  try {
    await Channel.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/channels/:id/start', async (req, res) => {
  try {
    await startChannel({ channelId: req.params.id, io: req.app.get('io') });
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});
router.post('/channels/:id/stop', async (req, res) => {
  try {
    await stopChannel({ channelId: req.params.id, io: req.app.get('io') });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Playlist CRUD ===
router.get('/playlist', async (req, res) => {
  try {
    const data = await PlaylistItem.findAll();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/playlist', async (req, res) => {
  try {
    const data = await PlaylistItem.create(req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.delete('/playlist/:id', async (req, res) => {
  try {
    await PlaylistItem.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Schedules CRUD ===
router.get('/schedules', async (req, res) => {
  try {
    const data = await Schedule.findAll();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/schedules', async (req, res) => {
  try {
    const data = await Schedule.create(req.body);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.delete('/schedules/:id', async (req, res) => {
  try {
    await Schedule.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Sessions CRUD ===
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await LiveSession.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ ok: true, data: sessions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await LiveSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ ok: false, error: 'Session not found' });
    res.json({ ok: true, data: session });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.delete('/sessions/:id', async (req, res) => {
  try {
    await LiveSession.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
