const express = require('express');
const router = express.Router();

const Channel = require('../models/Channel');
const PlaylistItem = require('../models/PlaylistItem');
const LiveSession = require('../models/LiveSession');
const Schedule = require('../models/Schedule');

const { startChannel, stopChannel } = require('../services/streamManager');

// ---- Channels
router.get('/channels', async (req,res)=> {
  const rows = await Channel.findAll({ order:[['id','ASC']] });
  res.json({ ok:true, data: rows });
});

router.post('/channels', async (req,res)=> {
  try{
    const { name, rtmpUrl, videoBitrate, audioBitrate, resolution, framerate } = req.body;
    const row = await Channel.create({ name, rtmpUrl, videoBitrate, audioBitrate, resolution, framerate });
    res.json({ ok:true, data: row });
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

router.patch('/channels/:id', async (req,res)=> {
  try{
    const id = Number(req.params.id);
    await Channel.update(req.body, { where:{ id }});
    const row = await Channel.findByPk(id);
    res.json({ ok:true, data: row });
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

router.delete('/channels/:id', async (req,res)=> {
  const id = Number(req.params.id);
  await Channel.destroy({ where:{ id }});
  res.json({ ok:true });
});

router.post('/channels/:id/start', async (req,res)=> {
  const id = Number(req.params.id);
  try{
    await startChannel({ channelId:id, io: req.app.get('io') });
    res.json({ ok:true });
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

router.post('/channels/:id/stop', async (req,res)=> {
  const id = Number(req.params.id);
  try{
    const out = await stopChannel({ channelId:id, io: req.app.get('io') });
    res.json(out);
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

// ---- Playlist
router.get('/playlist', async (req,res)=>{
  const rows = await PlaylistItem.findAll({ where:{ isActive:true }, order:[['order','ASC'],['id','ASC']] });
  res.json({ ok:true, data: rows });
});

router.post('/playlist', async (req,res)=>{
  try{
    const { title, source, order } = req.body;
    const row = await PlaylistItem.create({ title, source, order: Number(order)||0, isActive:true });
    res.json({ ok:true, data: row });
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

router.patch('/playlist/:id', async (req,res)=>{
  try{
    const id = Number(req.params.id);
    await PlaylistItem.update(req.body, { where:{ id }});
    const row = await PlaylistItem.findByPk(id);
    res.json({ ok:true, data: row });
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

router.delete('/playlist/:id', async (req,res)=>{
  const id = Number(req.params.id);
  await PlaylistItem.destroy({ where:{ id }});
  res.json({ ok:true });
});

// ---- Sessions (history)
router.get('/sessions', async (req,res)=>{
  const rows = await LiveSession.findAll({ order:[['id','DESC']], limit:50 });
  res.json({ ok:true, data: rows });
});

// ---- Schedules (WIB)
router.get('/schedules', async (req,res)=>{
  const rows = await Schedule.findAll({ order:[['startAtLocal','ASC']] });
  res.json({ ok:true, data: rows });
});

router.post('/schedules', async (req,res)=>{
  try{
    const { channelId, startAtLocal, durationMinutes, notes } = req.body;
    const row = await Schedule.create({
      channelId, startAtLocal, durationMinutes: Number(durationMinutes)||60, notes
    });
    res.json({ ok:true, data: row });
  }catch(e){ res.status(400).json({ ok:false, error: e.message }); }
});

router.delete('/schedules/:id', async (req,res)=>{
  const id = Number(req.params.id);
  await Schedule.destroy({ where:{ id }});
  res.json({ ok:true });
});

module.exports = router;
