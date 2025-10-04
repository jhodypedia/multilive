const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Channel = require('../models/Channel');
const PlaylistItem = require('../models/PlaylistItem');
const Schedule = require('../models/Schedule');
const { startChannel, stopChannel } = require('../services/streamManager');

const router = express.Router();

// Upload dir
const uploadDir = path.join(__dirname,'..','..','uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req,f,cb)=> cb(null, Date.now()+'-'+f.originalname.replace(/\s+/g,'_'))
});
const upload = multer({ storage });

// Upload API
router.post('/upload', upload.single('file'), (req,res)=>{
  if(!req.file) return res.json({ ok:false, error:'No file' });
  res.json({ ok:true, file:'/uploads/'+req.file.filename });
});

// Channels
router.get('/channels', async(req,res)=> res.json({ok:true, data:await Channel.findAll()}));
router.post('/channels', async(req,res)=> res.json({ok:true, data:await Channel.create(req.body)}));
router.delete('/channels/:id', async(req,res)=>{ await Channel.destroy({where:{id:req.params.id}}); res.json({ok:true}) });
router.post('/channels/:id/start', async(req,res)=>{ try{ await startChannel({channelId:req.params.id, io:req.app.get('io')}); res.json({ok:true}) }catch(e){ res.json({ok:false,error:e.message}) } });
router.post('/channels/:id/stop', async(req,res)=>{ await stopChannel({channelId:req.params.id, io:req.app.get('io')}); res.json({ok:true}) });

// Playlist
router.get('/playlist', async(req,res)=> res.json({ok:true, data:await PlaylistItem.findAll()}));
router.post('/playlist', async(req,res)=> res.json({ok:true, data:await PlaylistItem.create(req.body)}));
router.delete('/playlist/:id', async(req,res)=>{ await PlaylistItem.destroy({where:{id:req.params.id}}); res.json({ok:true}) });

// Schedules
router.get('/schedules', async(req,res)=> res.json({ok:true, data:await Schedule.findAll()}));
router.post('/schedules', async(req,res)=> res.json({ok:true, data:await Schedule.create(req.body)}));
router.delete('/schedules/:id', async(req,res)=>{ await Schedule.destroy({where:{id:req.params.id}}); res.json({ok:true}) });

module.exports = router;
