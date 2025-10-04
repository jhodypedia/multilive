const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const tz = require('dayjs/plugin/timezone');
dayjs.extend(utc); dayjs.extend(tz);

const Channel = require('../models/Channel');
const PlaylistItem = require('../models/PlaylistItem');
const LiveSession = require('../models/LiveSession');
const { spawnFFmpeg } = require('./ffmpegService');

const SESSIONS = new Map();
function nowWIB(){ return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'); }

async function startChannel({ channelId, io, scheduleId=null, durationMinutes=null }){
  const channel = await Channel.findByPk(channelId);
  if (!channel) throw new Error('Channel not found');
  if (SESSIONS.has(channelId)) throw new Error('Channel sudah jalan');

  const items = await PlaylistItem.findAll({ where:{ isActive:true }, order:[['order','ASC']] });
  if (!items.length) throw new Error('Playlist kosong');

  const session = await LiveSession.create({ channelId, status:'starting', startedAt:new Date(), scheduleId });
  const state = { channelId, io, sessionId:session.id, items, playingIndex:0, stopping:false };
  SESSIONS.set(channelId, state);

  const playNext = ()=>{
    if(state.stopping) return;
    const item = state.items[state.playingIndex];

    LiveSession.update({ status:'streaming', currentItemId:item.id, message:`Now: ${item.title}` }, { where:{ id: state.sessionId }});
    io.emit('session:update',{ channelId, status:'streaming', item, at:nowWIB() });

    const child = spawnFFmpeg({
      input:item.source, rtmpUrl:channel.rtmpUrl,
      vBitrate:channel.videoBitrate, aBitrate:channel.audioBitrate,
      resolution:channel.resolution, framerate:channel.framerate,
      loop:item.loop, onLog:(line)=> io.emit('session:log',{channelId,line})
    });
    state.child = child;
    child.on('close',()=>{ if(!state.stopping){ state.playingIndex=(state.playingIndex+1)%state.items.length; playNext(); }});
  };

  playNext();
  return { ok:true };
}

async function stopChannel({ channelId, io }){
  const state = SESSIONS.get(channelId);
  if(!state) return { ok:true };
  state.stopping = true;
  if(state.child) state.child.kill('SIGINT');
  await LiveSession.update({ status:'stopped', stoppedAt:new Date() },{ where:{ id: state.sessionId }});
  io.emit('session:update',{ channelId, status:'stopped', at:nowWIB() });
  SESSIONS.delete(channelId);
  return { ok:true };
}

module.exports = { startChannel, stopChannel };
