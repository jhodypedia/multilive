(function(){
  const $ = sel => document.querySelector(sel);
  const elPage = name => document.getElementById(`page-${name}`);
  const sock = io();

  // ===== Loader & Progress =====
  const loader = $('#loader');
  const pageload = $('#pageload');
  let loadCount = 0, progTimer=null;

  function showLoader(show=true){
    if(show) loader.classList.remove('hidden');
    else loader.classList.add('hidden');
  }
  function startProgress(){
    pageload.style.width = '5%';
    clearInterval(progTimer);
    progTimer = setInterval(()=>{
      const cur = parseFloat(pageload.style.width) || 0;
      pageload.style.width = Math.min(cur + Math.random()*12, 92) + '%';
    }, 220);
  }
  function endProgress(){
    clearInterval(progTimer);
    pageload.style.width = '100%';
    setTimeout(()=> pageload.style.width='0%', 350);
  }
  async function withLoad(promise){
    if(loadCount===0){ showLoader(true); startProgress(); }
    loadCount++;
    try{ return await promise; }
    finally{ loadCount--; if(loadCount<=0){ loadCount=0; showLoader(false); endProgress(); } }
  }

  // ===== Toasts =====
  const toasts = $('#toasts');
  function toast(msg, type='success'){
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `<i class="ri-information-line"></i> ${msg}`;
    toasts.appendChild(node);
    setTimeout(()=> node.remove(), 3500);
  }

  // ===== NAV dropdown (mobile) =====
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  navToggle.addEventListener('click', ()=> navMenu.classList.toggle('show'));
  document.querySelectorAll('.nav a').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      showPage(a.dataset.page);
      navMenu.classList.remove('show');
    });
  });

  function skeleton(height=44){ return `<div class="skeleton" style="height:${height}px"></div>`; }

  function showPage(name){
    document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
    elPage(name).classList.remove('hidden');
    loadPage(name);
  }

  // ===== API helpers =====
  async function apiGet(url){ return withLoad(fetch(url).then(r=>r.json())); }
  async function api(url, method, body){
    return withLoad(fetch(url,{
      method, headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body||{})
    }).then(r=>r.json()));
  }

  // ===== DASHBOARD =====
  async function loadDashboard(){
    elPage('dashboard').innerHTML = `
      <div class="grid">
        <div class="card">${skeleton(220)}</div>
        <div class="card">${skeleton(220)}</div>
      </div>`;
    const [channels, sessions] = await Promise.all([
      apiGet('/api/channels'),
      apiGet('/api/sessions').catch(()=>({data:[]}))
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
                  <button class="btn btn-outline ripple" data-act="start" data-id="${c.id}"><i class="ri-play-line"></i></button>
                  <button class="btn btn-outline ripple" data-act="stop" data-id="${c.id}"><i class="ri-stop-line"></i></button>
                </td>
              </tr>`).join('')}
          </table>
        </div>
        <div class="card">
          <h2>Sessions</h2>
          <table class="table">
            <tr><th>ID</th><th>Channel</th><th>Status</th><th>Start</th><th>Stop</th></tr>
            ${sessions.data.map(s=>`
              <tr>
                <td>${s.id}</td>
                <td>${s.channelId}</td>
                <td><span class="badge ${s.status}">${s.status}</span></td>
                <td>${s.startedAt||''}</td>
                <td>${s.stoppedAt||''}</td>
              </tr>`).join('')}
          </table>
        </div>
      </div>
    `;
    elPage('dashboard').querySelectorAll('[data-act]').forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.dataset.id;
        if(btn.dataset.act==='start'){ await api(`/api/channels/${id}/start`,'POST'); toast(`Start channel #${id}`) }
        if(btn.dataset.act==='stop'){  await api(`/api/channels/${id}/stop`,'POST');  toast(`Stop channel #${id}`,'warn') }
        loadDashboard();
      };
    });
  }

  // ===== CHANNELS =====
  async function loadChannels(){
    elPage('channels').innerHTML = `<div class="card">${skeleton(160)}</div>`;
    const data = await apiGet('/api/channels');
    elPage('channels').innerHTML = `
      <div class="card">
        <h2>Tambah Channel</h2>
        <form id="formChannel" class="row">
          <input name="name" placeholder="Nama Channel" required />
          <input name="rtmpUrl" placeholder="RTMP URL" required />
          <input name="resolution" placeholder="1280x720" />
          <input name="framerate" type="number" placeholder="30" />
          <input name="videoBitrate" placeholder="3500k" />
          <input name="audioBitrate" placeholder="160k" />
          <button class="btn btn-primary ripple">Simpan</button>
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
                <button class="btn btn-outline ripple" data-act="start" data-id="${c.id}"><i class="ri-play-line"></i></button>
                <button class="btn btn-outline ripple" data-act="stop" data-id="${c.id}"><i class="ri-stop-line"></i></button>
                <button class="btn btn-danger ripple" data-act="del" data-id="${c.id}"><i class="ri-delete-bin-line"></i></button>
              </td>
            </tr>`).join('')}
        </table>
      </div>
    `;
    $('#formChannel').onsubmit = async e=>{
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target).entries());
      await api('/api/channels','POST',body);
      toast('Channel ditambahkan'); loadChannels();
    };
    elPage('channels').querySelectorAll('[data-act]').forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.dataset.id;
        if(btn.dataset.act==='start'){ await api(`/api/channels/${id}/start`,'POST'); toast(`Start channel #${id}`) }
        if(btn.dataset.act==='stop'){  await api(`/api/channels/${id}/stop`,'POST'); toast(`Stop channel #${id}`,'warn') }
        if(btn.dataset.act==='del'){   await api(`/api/channels/${id}`,'DELETE'); toast(`Channel #${id} dihapus`,'error') }
        loadChannels();
      };
    });
  }

  // ===== PLAYLIST =====
  async function loadPlaylist(){
    elPage('playlist').innerHTML = `<div class="card">${skeleton(160)}</div>`;
    const data = await apiGet('/api/playlist');
    elPage('playlist').innerHTML = `
      <div class="card">
        <h2>Tambah Item</h2>
        <form id="formItem" class="row">
          <input name="title" placeholder="Judul" required />
          <input name="source" placeholder="/uploads/video.mp4 atau URL" required />
          <input name="order" type="number" placeholder="0" />
          <label>Loop?
            <select name="loop"><option value="true">Yes</option><option value="false">No</option></select>
          </label>
          <button class="btn btn-primary ripple">Simpan</button>
        </form>
      </div>
      <div class="card">
        <h2>Daftar Playlist</h2>
        <table class="table">
          <tr><th>ID</th><th>Judul</th><th>Source</th><th>Loop</th><th>Aksi</th></tr>
          ${data.data.map(i=>`
            <tr>
              <td>${i.id}</td>
              <td>${i.title}</td>
              <td class="mono">${i.source}</td>
              <td>${i.loop ? 'Yes':'No'}</td>
              <td><button class="btn btn-danger ripple" data-act="delItem" data-id="${i.id}"><i class="ri-delete-bin-line"></i></button></td>
            </tr>`).join('')}
        </table>
      </div>
    `;
    $('#formItem').onsubmit = async e=>{
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target).entries());
      await api('/api/playlist','POST',body);
      toast('Item ditambahkan'); loadPlaylist();
    };
    elPage('playlist').querySelectorAll('[data-act="delItem"]').forEach(btn=>{
      btn.onclick = async ()=>{ await api(`/api/playlist/${btn.dataset.id}`,'DELETE'); toast('Item dihapus','error'); loadPlaylist(); };
    });
  }

  // ===== SCHEDULES =====
  async function loadSchedules(){
    elPage('schedules').innerHTML = `<div class="card">${skeleton(160)}</div>`;
    const [schedules, channels] = await Promise.all([ apiGet('/api/schedules'), apiGet('/api/channels') ]);
    elPage('schedules').innerHTML = `
      <div class="card">
        <h2>Buat Schedule (WIB)</h2>
        <form id="formSchedule" class="row">
          <select name="channelId">${channels.data.map(c=>`<option value="${c.id}">#${c.id} ${c.name}</option>`).join('')}</select>
          <input name="startAtLocal" placeholder="YYYY-MM-DD HH:mm:ss" required />
          <input name="durationMinutes" type="number" placeholder="60" />
          <input name="notes" placeholder="Catatan" />
          <button class="btn btn-primary ripple">Simpan</button>
        </form>
      </div>
      <div class="card">
        <h2>Daftar Schedule</h2>
        <table class="table">
          <tr><th>ID</th><th>Channel</th><th>Start</th><th>Durasi</th><th>Notes</th><th>Aksi</th></tr>
          ${schedules.data.map(s=>`
            <tr>
              <td>${s.id}</td><td>${s.channelId}</td>
              <td class="mono">${s.startAtLocal}</td>
              <td>${s.durationMinutes}</td>
              <td>${s.notes||''}</td>
              <td><button class="btn btn-danger ripple" data-act="delSch" data-id="${s.id}"><i class="ri-delete-bin-line"></i></button></td>
            </tr>`).join('')}
        </table>
      </div>
    `;
    $('#formSchedule').onsubmit = async e=>{
      e.preventDefault();
      const body = Object.fromEntries(new FormData(e.target).entries());
      await api('/api/schedules','POST',body);
      toast('Schedule ditambahkan'); loadSchedules();
    };
    elPage('schedules').querySelectorAll('[data-act="delSch"]').forEach(btn=>{
      btn.onclick = async ()=>{ await api(`/api/schedules/${btn.dataset.id}`,'DELETE'); toast('Schedule dihapus','error'); loadSchedules(); };
    });
  }

  // ===== UPLOAD (AJAX + progress bar + cancel) =====
  let currentXhr = null;
  async function loadUpload(){
    elPage('upload').innerHTML = `
      <div class="card">
        <h2>Upload Video</h2>
        <form id="formUpload">
          <input type="file" name="file" accept="video/*" required />
          <button type="submit" class="btn btn-primary ripple">Upload</button>
          <button type="button" id="btnCancel" class="btn btn-danger ripple" disabled>Batal</button>
        </form>
        <div class="progress-bar"><div id="uploadProgress"></div></div>
        <div id="uploadResult"></div>
      </div>
      <div class="card">
        <h2>Daftar Video Upload</h2>
        <div id="uploadList">${skeleton(120)}</div>
      </div>
    `;
    $('#formUpload').onsubmit = e=>{
      e.preventDefault();
      const file = e.target.file.files[0];
      if(!file) return toast('Pilih file dulu','error');
      const fd = new FormData();
      fd.append('file', file);
      const xhr = new XMLHttpRequest();
      currentXhr = xhr;
      xhr.open('POST','/api/upload',true);

      xhr.upload.onprogress = e=>{
        if(e.lengthComputable){
          const percent = Math.round((e.loaded/e.total)*100);
          const bar = $('#uploadProgress');
          bar.style.width = percent+'%';
          bar.style.background = percent<50 ? 'var(--primary)' : percent<80 ? 'orange' : 'limegreen';
        }
      };

      xhr.onload = ()=>{
        $('#btnCancel').disabled = true;
        currentXhr = null;
        if(xhr.status===200){
          const j = JSON.parse(xhr.responseText);
          if(j.ok){
            $('#uploadResult').innerHTML = `<p>Uploaded: <code>${j.file}</code></p>`;
            toast('Upload berhasil');
            $('#uploadProgress').style.width = '0%';
            loadUploadsList();
          } else {
            $('#uploadResult').textContent = 'Error: '+j.error;
            toast('Upload gagal','error');
          }
        }
      };

      $('#btnCancel').disabled = false;
      $('#btnCancel').onclick = ()=>{
        if(currentXhr){
          currentXhr.abort();
          currentXhr = null;
          $('#uploadProgress').style.width = '0%';
          $('#btnCancel').disabled = true;
          toast('Upload dibatalkan','warn');
        }
      };

      xhr.send(fd);
    };
    loadUploadsList();
  }

  async function loadUploadsList(){
    const r = await fetch('/api/uploads'); 
    const j = await r.json();
    if(j.ok){
      $('#uploadList').innerHTML = `
        <table class="table">
          <tr><th>Nama File</th><th>URL</th><th>Aksi</th></tr>
          ${j.files.map(f=>`
            <tr>
              <td>${f.name}</td>
              <td class="mono">${f.url}</td>
              <td>
                <button class="btn btn-outline ripple" onclick="navigator.clipboard.writeText('${f.url}');toast('Copied!')">
                  <i class="ri-file-copy-line"></i>
                </button>
                <button class="btn btn-primary ripple" onclick="addToPlaylist('${f.url}','${f.name}')">
                  <i class="ri-add-line"></i> Playlist
                </button>
              </td>
            </tr>`).join('')}
        </table>
      `;
    }
  }

  window.addToPlaylist = async function(url,name){
    await api('/api/playlist','POST',{ title:name, source:url, order:0, loop:true, isActive:true });
    toast(`Ditambah ke Playlist: ${name}`);
    loadPlaylist();
  }

  // ===== LOGS =====
  let logBox=null;
  function loadLogs(){ elPage('logs').innerHTML = `<div class="card"><h2>Realtime Logs</h2><pre id="logBox" class="log"></pre></div>`; logBox=$('#logBox'); }
  function appendLog(line){ if(!logBox) return; logBox.textContent += `[${new Date().toLocaleTimeString()}] ${line}\n`; logBox.scrollTop = logBox.scrollHeight; }

  // ===== SOCKET realtime =====
  sock.on('hello', d=> appendLog('Connected TZ='+d.tz));
  sock.on('session:update', d=>{ appendLog(`[SESSION] channel=${d.channelId} -> ${d.status}`); if(!elPage('dashboard').classList.contains('hidden')) loadDashboard(); });
  sock.on('session:log', d=> appendLog(`[FFMPEG] ${d.line}`));
  sock.on('scheduler:started', d=> { appendLog(`[SCHED] channel=${d.channelId}`); toast(`Schedule start #${d.channelId}`) });
  sock.on('scheduler:error', d=> { appendLog(`[SCHED-ERR] ${d.error}`); toast(`Schedule error: ${d.error}`,'error') });

  // ===== Router =====
  async function loadPage(name){
    if(name==='dashboard') return loadDashboard();
    if(name==='channels')  return loadChannels();
    if(name==='playlist')  return loadPlaylist();
    if(name==='schedules') return loadSchedules();
    if(name==='upload')    return loadUpload();
    if(name==='logs')      return loadLogs();
  }

  // Start
  showLoader(false);
  showPage('dashboard');
})();
