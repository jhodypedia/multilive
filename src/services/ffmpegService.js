const { spawn } = require('child_process');
require('dotenv').config();

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function spawnFFmpeg({ input, rtmpUrl, vBitrate, aBitrate, resolution, framerate, onLog }) {
  const args = [
    '-hide_banner','-loglevel','warning',
    '-re',
    ...(input.startsWith('http') ? ['-i', input] : ['-stream_loop','-1','-i', input]),
    '-vf', `scale=${resolution.replace('x',':')},fps=${framerate}`,
    '-c:v','libx264','-preset','veryfast','-tune','zerolatency',
    '-b:v', vBitrate, '-maxrate', vBitrate, '-bufsize', '2M',
    '-pix_fmt','yuv420p','-g', String(framerate*2),
    '-c:a','aac','-b:a', aBitrate, '-ar','44100','-ac','2',
    '-f','flv', rtmpUrl
  ];

  const child = spawn(FFMPEG, args, { stdio: ['ignore','pipe','pipe'] });

  const log = (d) => onLog && onLog(d.toString().trim());
  child.stdout.on('data', log);
  child.stderr.on('data', log);
  child.on('close', code => log(`[ffmpeg] exit code ${code}`));

  return child;
}

module.exports = { spawnFFmpeg };
