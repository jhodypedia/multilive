const { spawn } = require('child_process');
require('dotenv').config();

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function spawnFFmpeg({ input, rtmpUrl, vBitrate, aBitrate, resolution, framerate, loop, onLog }) {
  const args = ['-hide_banner','-loglevel','warning','-re'];
  if (!input.startsWith('http') && loop) args.push('-stream_loop','-1');
  args.push('-i', input);

  args.push(
    '-vf', `scale=${resolution.replace('x',':')},fps=${framerate}`,
    '-c:v','libx264','-preset','veryfast','-tune','zerolatency',
    '-b:v', vBitrate, '-maxrate', vBitrate, '-bufsize','2M',
    '-pix_fmt','yuv420p','-g', String(framerate*2),
    '-c:a','aac','-b:a', aBitrate,'-ar','44100','-ac','2',
    '-f','flv', rtmpUrl
  );

  const child = spawn(FFMPEG, args, { stdio:['ignore','pipe','pipe'] });
  child.stdout.on('data', d=> onLog && onLog(d.toString()));
  child.stderr.on('data', d=> onLog && onLog(d.toString()));
  return child;
}

module.exports = { spawnFFmpeg };
