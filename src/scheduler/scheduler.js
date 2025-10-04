const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const tz = require('dayjs/plugin/timezone');
dayjs.extend(utc); dayjs.extend(tz);

const Schedule = require('../models/Schedule');
const { startChannel } = require('../services/streamManager');

function bootScheduler(io){
  cron.schedule('*/15 * * * * *', async ()=>{
    const now = dayjs().tz('Asia/Jakarta');
    const rows = await Schedule.findAll();
    for(const s of rows){
      const due = dayjs.tz(s.startAtLocal,'Asia/Jakarta');
      if(now.isAfter(due) && now.diff(due,'seconds')<15){
        await startChannel({ channelId:s.channelId, io, scheduleId:s.id, durationMinutes:s.durationMinutes });
      }
    }
  }, { timezone:'Asia/Jakarta' });
}
module.exports = { bootScheduler };
