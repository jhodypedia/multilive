(function(){
  const $ = sel => document.querySelector(sel);
  const elPage = name => document.getElementById(`page-${name}`);
  const sock = io();

  // NAV
  document.querySelectorAll('.nav button').forEach(b=>{
    b.addEventListener('click', ()=> showPage(b.dataset.page));
  });
  function showPage(name){
    document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
    elPage(name).classList.remove('hidden');
    loadPage(name);
  }

  // API helper
  async function apiGet(url){ const r = await fetch(url); if(!r.ok) throw new Error(await r.text()); return r.json(); }
  async function api(url, method, body){
    const r = await fetch(url,{method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{})});
    const j = await r.json().catch(()=>({}));
    if(!r.ok || j.ok===false) throw new Error(j.error || r.statusText);
    return j;
  }

  // DASHBOARD
  async function loadDashboard(){
    const [channels, sessions] = await Promise.all([
      apiGet('/api/channels'),
      apiGet('/api/sessions')
    ]);
    elPage('dashboard').innerHTML = `
      <div class="grid">
        <div class="card">
          <h2>Channels</h2>
          <table class="table">
            <tr><th>ID</th><th>Nama</th><th>RTMP</th><th>Cfg</th><th>Aksi</th></tr>
            ${channels.data.map(c=>`
              <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td class="mono">${c.rtmpUrl}</td>
                <td class="mono">${c.resolution}@${c.framerate} v=${c.videoBitrate} a=${c.audioBitrate}</td>
                <td>
                  <button class="btn btn-outline" data-act="start" data-id="${c.id}"><i class="ri-play-line"></i> Start</button>
                  <button class="btn btn-outline" data-act="stop" data-id="${c.id}"><i class="ri-stop-line"></i> Stop</button>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
        <div class="card">
          <h2>Sessions (Last 50)</h2>
          <table class="table">
            <tr><th>ID</th><th>Channel</th><th>Status</th><th>Start</th><th>Stop</th></tr>
            ${sessions.data.map(s=>`
              <tr>
                <td>${s.id}</td>
                <td>${s.channelId}</td>
                <td><span class="badge ${s.status}">${s.status}</span></td>
                <td>${s.startedAt? new Date(s.startedAt).toLocaleString('id-ID', { hour12:false }): ''}</td>
                <td>${s.stoppedAt? new Date(s.stoppedAt).toLocaleString('id-ID', { hour12:false }): ''}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>
    `;
    elPage('dashboard').querySelectorAll('[data-act]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.dataset.id;
        try{
          if(btn.dataset.act==='start') await api(`/api/channels/${id}/start`,'POST');
          if(btn.dataset.act==='stop')  await api(`/api/channels/${id}/stop`,'POST');
          loadDashboard();
          appendLog(`[ACTION] ${btn.dataset.act.toUpperCase()} channel=${id}`);
        }catch(e){ appendLog('ERR '+e.message); }
      });
    });
  }

  // CHANNELS
  async function loadChannels(){
    const data = await apiGet('/api/channels');
    elPage('channels').innerHTML = `
      <div class="card">
        <h2>Tambah Channel</h2>
        <form id="formChannel" class="row">
          <input name="name" placeholder="Nama Channel" required />
          <input name="rtmpUrl" placeholder="RTMP URL (rtmp://.../live2/KEY)" required class="full" />
          <input name="resolution" placeholder="1280x720" />
          <input name="framerate" type="number" placeholder="30" />
          <input name="videoBitrate" placeholder="3500k" />
          <input name="audioBitrate" placeholder="160k" />
          <button class="btn btn-primary">Simpan</button>
        </form>
      </div>
      <div class="card">
        <h2>Daftar Channel</h2>
        <table class="table">
          <tr><th>ID</th><th>Nama</th><th>RTMP</th><th>Cfg</th><th>Aksi</th></tr>
          ${data.data.map(c=>`
            <tr>
              <td>${c.id}</td>
              <td>${c.name}</td>
              <td class="mono">${c.rtmpUrl}</td>
              <td class="mono">${c.resolution}@${c.framerate} v=${c.videoBitrate} a=${c.audioBitrate}</td>
              <td>
                <button class="btn btn-outline" data-act="start" data-id="${c.id}"><i class="ri-play-line"></i></button>
                <button class="btn btn-outline" data-act="stop" data-id="${c.id}"><i class="ri-stop-line"></i></button>
                <button class="btn btn-danger" data-act="del" data-id="${c.id}"><i class="ri-delete-bin-line"></i></button>
              </td>
            </tr>`).join('')}
        </table>
      </div>
    `;
    $('#formChannel').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      await api('/api/channels','POST',body);
      e.target.reset(); loadChannels();
    });
    elPage('channels').querySelectorAll('[data-act]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = btn.dataset.id;
        try{
          if(btn.dataset.act==='start') await api(`/api/channels/${id}/start`,'POST');
          if(btn.dataset.act==='stop')  await api(`/api/channels/${id}/stop`,'POST');
          if(btn.dataset.act==='del')   await api(`/api/channels/${id}`,'DELETE');
          loadChannels(); appendLog(`[ACTION] ${btn.dataset.act.toUpperCase()} channel=${id}`);
        }catch(e){ appendLog('ERR '+e.message); }
      });
    });
  }

  // PLAYLIST
  async function loadPlaylist(){
    const data = await apiGet('/api/playlist');
    elPage('playlist').innerHTML = `
      <div class="card">
        <h2>Tambah Item</h2>
        <form id="formItem" class="row">
          <input name="title" placeholder="Judul" required />
          <input name="source" placeholder="/abs/path/video.mp4 atau https://..." required class="full" />
          <input name="order" type="number" placeholder="0" />
          <button class="btn btn-primary">Simpan</button>
        </form>
      </div>
      <div class="card">
        <h2>Daftar Item Aktif</h2>
        <table class="table">
          <tr><th>ID</th><th>Judul</th><th>Sumber</th><th>Order</th><th>Aksi</th></tr>
          ${data.data.map(i=>`
            <tr>
              <td>${i.id}</td>
              <td>${i.title}</td>
              <td class="mono">${i.source}</td>
              <td>${i.order}</td>
              <td>
                <button class="btn btn-danger" data-act="delItem" data-id="${i.id}"><i class="ri-delete-bin-line"></i></button>
              </td>
            </tr>`).join('')}
        </table>
      </div>
    `;
    $('#formItem').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      await api('/api/playlist','POST',body);
      e.target.reset(); loadPlaylist();
    });
    elPage('playlist').querySelectorAll('[data-act="delItem"]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        await api(`/api/playlist/${btn.dataset.id}`,'DELETE');
        loadPlaylist();
      });
    });
  }

  // SCHEDULES
  async function loadSchedules(){
    const [schedules, channels] = await Promise.all([
      apiGet('/api/schedules'),
      apiGet('/api/channels')
    ]);
    elPage('schedules').innerHTML = `
      <div class="card">
        <h2>Buat Schedule (WIB)</h2>
        <form id="formSchedule" class="row">
          <select name="channelId" required>
            ${channels.data.map(c=>`<option value="${c.id}">#${c.id} ${c.name}</option>`).join('')}
          </select>
          <input name="startAtLocal" placeholder="YYYY-MM-DD HH:mm:ss (WIB)" required class="full" />
          <input name="durationMinutes" type="number" placeholder="60" />
          <input name="notes" placeholder="Catatan (opsional)" class="full" />
          <button class="btn btn-primary">Simpan</button>
        </form>
      </div>
      <div class="card">
        <h2>Daftar Schedule</h2>
        <table class="table">
          <tr><th>ID</th><th>Channel</th><th>Start (WIB)</th><th>Durasi (m)</th><th>Catatan</th><th>Aksi</th></tr>
          ${schedules.data.map(s=>`
            <tr>
              <td>${s.id}</td>
              <td>${s.channelId}</td>
              <td>${s.startAtLocal}</td>
              <td>${s.durationMinutes}</td>
              <td>${s.notes||''}</td>
              <td><button class="btn btn-danger" data-act="delSch" data-id="${s.id}"><i class="ri-delete-bin-line"></i></button></td>
            </tr>`).join('')}
        </table>
      </div>
    `;
    $('#formSchedule').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      await api('/api/schedules','POST',body);
      e.target.reset(); loadSchedules();
    });
    elPage('schedules').querySelectorAll('[data-act="delSch"]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        await api(`/api/schedules/${btn.dataset.id}`,'DELETE');
        loadSchedules();
      });
    });
  }

  // LOGS realtime
  const logState = { box: null };
  function appendLog(line){
    if(!logState.box) return;
    const at = new Date().toLocaleTimeString('id-ID',{ hour12:false });
    logState.box.textContent += `[${at}] ${line}\n`;
    logState.box.scrollTop = logState.box.scrollHeight;
  }
  function loadLogs(){
    elPage('logs').innerHTML = `
      <div class="card">
        <h2>Realtime Logs</h2>
        <pre id="logBox" class="log"></pre>
      </div>
    `;
    logState.box = $('#logBox');
  }

  // SOCKET events
  sock.on('hello', d=> appendLog(`Connected (TZ=${d.tz})`));
  sock.on('session:update', d=>{
    appendLog(`[STATUS] channel=${d.channelId} -> ${d.status}${d.item?` | ${d.item.title}`:''}`);
    // refresh dashboard quietly
    if(!elPage('dashboard').classList.contains('hidden')) loadDashboard();
  });
  sock.on('session:log', d=> appendLog(`[${d.at}] ch=${d.channelId} ${d.line}`));
  sock.on('scheduler:started', d=> appendLog(`[SCHED] start schedule=${d.scheduleId} channel=${d.channelId}`));
  sock.on('scheduler:error', d=> appendLog(`[SCHED-ERR] schedule=${d.scheduleId} channel=${d.channelId} ${d.error}`));

  // Router simple
  async function loadPage(name){
    if(name==='dashboard') return loadDashboard();
    if(name==='channels')  return loadChannels();
    if(name==='playlist')  return loadPlaylist();
    if(name==='schedules') return loadSchedules();
    if(name==='logs')      return loadLogs();
  }

  // default
  showPage('dashboard');
})();
