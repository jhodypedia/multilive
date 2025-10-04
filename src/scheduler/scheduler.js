const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs-plugin-utc');
const tz = require('dayjs-plugin-timezone');
dayjs.extend(utc); dayjs.extend(tz);

const Schedule = require('../models/Schedule');
const Channel = require('../models/Channel');
const { startChannel } = require('../services/streamManager');

function bootScheduler(io){
  cron.schedule('*/15 * * * * *', async ()=>{
    const now = dayjs().tz('Asia/Jakarta');
    const nowStr = now.format('YYYY-MM-DD HH:mm:ss');
    const lower = now.subtract(30, 'second');
    const upper = now.add(15, 'second');

    const rows = await Schedule.findAll(); // ringan
    for (const s of rows){
      const due = dayjs.tz(s.startAtLocal, 'Asia/Jakarta');
      if (due.isAfter(lower) && due.isBefore(upper)){
        const ch = await Channel.findByPk(s.channelId);
        if (!ch || !ch.isActive) continue;
        try {
          await startChannel({ channelId: ch.id, io, scheduleId: s.id, durationMinutes: s.durationMinutes });
          io.emit('scheduler:started', { scheduleId: s.id, channelId: ch.id, at: nowStr });
        } catch (e) {
          io.emit('scheduler:error', { scheduleId: s.id, channelId: ch.id, error: e.message, at: nowStr });
        }
      }
    }
  }, { timezone: 'Asia/Jakarta' });
}

module.exports = { bootScheduler };
