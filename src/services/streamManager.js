const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const tz = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(tz);

const Channel = require('../models/Channel');
const PlaylistItem = require('../models/PlaylistItem');
const LiveSession = require('../models/LiveSession');
const { spawnFFmpeg } = require('./ffmpegService');

const SESSIONS = new Map(); // channelId -> state

function nowWIBStr(){ 
  return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'); 
}

async function loadPlaylistActive(){
  return await PlaylistItem.findAll({ where:{ isActive:true }, order:[['order','ASC'],['id','ASC']] });
}

function setAutoStop(state, minutes){
  clearTimeout(state.stopTimer);
  if (!minutes || minutes <= 0) return;
  state.stopTimer = setTimeout(
    ()=> stopChannel({ channelId: state.channelId, io: state.io, by:'schedule' }), 
    minutes*60*1000
  );
}

async function startChannel({ channelId, io, scheduleId=null, durationMinutes=null }){
  const channel = await Channel.findByPk(channelId);
  if (!channel || !channel.isActive) throw new Error('Channel tidak ditemukan / nonaktif');
  if (SESSIONS.has(channelId)) throw new Error('Channel ini sudah streaming');

  const items = await loadPlaylistActive();
  if (!items.length) throw new Error('Playlist kosong. Tambahkan item dulu.');

  const session = await LiveSession.create({
    channelId, status:'starting', startedAt:new Date(), message:'Starting...', scheduleId
  });

  const state = {
    channelId, io, child:null, items, playingIndex:0,
    sessionId: session.id, stopping:false, stopTimer:null
  };
  SESSIONS.set(channelId, state);
  setAutoStop(state, durationMinutes);

  const playNext = async () => {
    if (state.stopping) return;
    const item = state.items[state.playingIndex];

    await LiveSession.update(
      { status:'streaming', currentItemId:item.id, message:`Streaming: ${item.title}` }, 
      { where:{ id: state.sessionId }}
    );

    io.emit('session:update', { channelId, status:'streaming', item, at: nowWIBStr() });

    const child = spawnFFmpeg({
      input: item.source,
      rtmpUrl: channel.rtmpUrl,
      vBitrate: channel.videoBitrate,
      aBitrate: channel.audioBitrate,
      resolution: channel.resolution,
      framerate: channel.framerate,
      onLog: (line)=> io.emit('session:log', { channelId, line, at: nowWIBStr() })
    });
    state.child = child;

    child.on('close', () => {
      if (state.stopping) return;
      state.playingIndex = (state.playingIndex + 1) % state.items.length;
      playNext();
    });
  };

  io.emit('session:update', { channelId, status:'starting', at: nowWIBStr(), scheduleId });
  playNext();
  return { ok:true };
}

async function stopChannel({ channelId, io, by='user' }){
  const state = SESSIONS.get(channelId);
  if (!state) return { ok:true, note:'Not streaming' };
  state.stopping = true;
  clearTimeout(state.stopTimer);
  if (state.child) { try{ state.child.kill('SIGINT'); }catch(e){} }
  await LiveSession.update(
    { status:'stopped', stoppedAt:new Date(), message:`Stopped by ${by}` }, 
    { where:{ id: state.sessionId }}
  );
  SESSIONS.delete(channelId);
  io.emit('session:update', { channelId, status:'stopped', at: nowWIBStr(), by });
  return { ok:true };
}

function listRuntime(){
  const arr = [];
  for (const [channelId, st] of SESSIONS.entries()){
    arr.push({ channelId, playingIndex: st.playingIndex, itemCount: st.items.length });
  }
  return arr;
}

module.exports = { startChannel, stopChannel, listRuntime };
