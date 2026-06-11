
(async function(){
  const $=window.GeoSafeUI?.$ || ((s,r=document)=>r.querySelector(s));
  const $$=window.GeoSafeUI?.$$ || ((s,r=document)=>Array.from(r.querySelectorAll(s)));
  const state={data:null,map:null,layers:{zones:L.layerGroup(),admin:L.layerGroup(),incidents:L.layerGroup(),cctv:L.layerGroup(),buffer:L.layerGroup(),crowd:L.layerGroup(),corridors:L.layerGroup()},filters:{zone:'all',year:'all',q:'',cctvType:'all',cctvSource:'all'}};
  const colors={safe:'#39d98a',warn:'#ffba3a',danger:'#ff4747',unknown:'#cab7ad'};
  function status(t){ const el=$('#mapStatus'); if(el) el.textContent=t; }
  function fitToData(){
    const group=L.featureGroup(Object.values(state.layers).filter(l=>state.map.hasLayer(l)));
    try{ if(group.getLayers().length) state.map.fitBounds(group.getBounds().pad(.12)); }catch(e){}
  }
  function icon(cls){ return L.divIcon({className:`${cls}-icon`,iconSize:[18,18],html:''}); }
  function escape(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function formatDist(m){ if(!Number.isFinite(m)) return '-'; return m>=1000?`${(m/1000).toFixed(2)} km`:`${Math.round(m)} m`; }
  function newsVisual(n){ if(n.image) return `<img src="${escape(n.image)}" alt="Gambar sumber berita" onerror="this.remove()">`; const d=(n.domain||n.sourceType||'N').slice(0,2).toUpperCase(); return escape(d); }
  function relatedNews(item){
    const all=state.data.incidents||[]; const key=[item.kecamatan,item.zone,item.corridor].filter(Boolean).map(x=>String(x).toLowerCase());
    let list=all.filter(i=>i.source && (i.id===item.id || key.some(k=>String([i.kecamatan,i.zone,i.corridor,i.location,i.title].join(' ')).toLowerCase().includes(k))));
    if(!list.length && item.source) list=[item];
    return list.slice(0,3);
  }
  function popupIncident(i){
    const near=state.data.incidents.filter(o=>o.id!==i.id && GeoSafeData.haversine(i,o)<=1000).length;
    const news=relatedNews(i);
    const risk=GeoSafeData.riskFromZone(i.zone);
    const cctv=i.nearestCctv?`${escape(i.nearestCctv.name)} (${formatDist(i.nearestCctvDistance)})`:'Tidak ada CCTV terbaca';
    return `<div class="popup-card"><div class="popup-head"><div class="icon">⚠️</div><div><h3 class="popup-title">${escape(i.title)}</h3><div class="popup-sub">${escape(i.location)} · ${escape(i.date)}</div></div></div>
      <div class="popup-grid"><div class="popup-stat"><small>Zona</small><strong>${escape(i.zone||'Tidak diketahui')}</strong></div><div class="popup-stat"><small>Status CCTV</small><strong>${i.covered500?'Tercakup 500 m':'Blind spot relatif'}</strong></div><div class="popup-stat"><small>CCTV terdekat</small><strong>${cctv}</strong></div><div class="popup-stat"><small>Kejadian sekitar</small><strong>${near} titik ≤ 1 km</strong></div></div>
      <div class="popup-section"><h4>Analisis lokasi</h4><p>Lokasi ini berada pada kelas <b>${escape(risk.label)}</b>. Indikasi kerawanan dibaca dari klasifikasi zona, kedekatan dengan CCTV, dan konsentrasi titik kejadian sekitar. ${i.covered500?'CCTV terdekat masih dalam radius 500 m, tetapi konteks waktu dan arah kamera tetap perlu diverifikasi.':'Jarak ke CCTV terdekat melebihi 500 m sehingga titik ini perlu diprioritaskan untuk pengecekan blind spot atau patroli.'}</p></div>
      <div class="popup-section"><h4>Koridor terkait</h4><p>${i.corridor?`Terdeteksi pada ${escape(i.corridor)}. Gunakan ringkasan koridor untuk melihat apakah ruas ini berulang pada beberapa kejadian.`:'Nama jalan/koridor belum terbaca dari teks data, sehingga perlu pelabelan lokasi lebih rinci bila ingin analisis ruas.'}</p></div>
      <div class="popup-section"><h4>Berita/sumber terkait</h4><div class="popup-news">${news.length?news.map(n=>`<a href="${escape(n.source||'#')}" target="_blank" rel="noopener"><span class="news-thumb">${newsVisual(n)}</span><span><strong>${escape(n.title)}</strong><span>${escape(n.domain||n.sourceType)} · ${escape(n.year)}</span></span></a>`).join(''):'<p>Belum ada URL/gambar sumber pada data titik ini.</p>'}</div></div></div>`;
  }
  function popupCctv(c){
    const near=state.data.incidents.filter(i=>GeoSafeData.haversine(c,i)<=500).length;
    return `<div class="popup-card"><div class="popup-head"><div class="icon">📹</div><div><h3 class="popup-title">${escape(c.name)}</h3><div class="popup-sub">${escape(c.location)}</div></div></div><div class="popup-grid"><div class="popup-stat"><small>Jenis</small><strong>${escape(c.type)}</strong></div><div class="popup-stat"><small>Kejadian radius 500 m</small><strong>${near}</strong></div></div><div class="popup-section"><h4>Analisis CCTV</h4><p>CCTV ini dipakai untuk membaca cakupan radius 500 meter. Banyaknya kejadian di sekitar CCTV tidak otomatis berarti kamera merekam kejadian; arah pandang, kualitas rekaman, dan jam operasi tetap perlu dicek.</p></div></div>`;
  }
  function popupZone(feature){
    const label=GeoSafeData.getFeatureLabel(feature), cls=GeoSafeData.getZoneName(feature), risk=GeoSafeData.riskFromZone(cls);
    const inc=state.data.incidents.filter(i=>GeoSafeData.pointInFeature(i,feature));
    const cams=state.data.cctv.filter(c=>GeoSafeData.pointInFeature(c,feature));
    const blind=inc.filter(i=>!i.covered500).length;
    const news=inc.filter(i=>i.source).slice(0,3);
    return `<div class="popup-card"><div class="popup-head"><div class="icon">🗺️</div><div><h3 class="popup-title">${escape(label)}</h3><div class="popup-sub">Kelas ${escape(cls)}</div></div></div><div class="popup-grid"><div class="popup-stat"><small>Skor</small><strong>${risk.score}</strong></div><div class="popup-stat"><small>Kejadian</small><strong>${inc.length}</strong></div><div class="popup-stat"><small>CCTV dalam zona</small><strong>${cams.length}</strong></div><div class="popup-stat"><small>Blind spot relatif</small><strong>${blind}</strong></div></div><div class="popup-section"><h4>Analisis zona</h4><p>Zona ini masuk kategori <b>${escape(risk.label)}</b> sesuai atribut GeoJSON. Prioritas tindak lanjut meningkat jika kejadian terpusat dan banyak titik belum tercakup radius CCTV 500 m.</p></div><div class="popup-section"><h4>Sumber kejadian dalam zona</h4><div class="popup-news">${news.length?news.map(n=>`<a href="${escape(n.source||'#')}" target="_blank" rel="noopener"><span class="news-thumb">${newsVisual(n)}</span><span><strong>${escape(n.title)}</strong><span>${escape(n.domain||n.sourceType)} · ${escape(n.year)}</span></span></a>`).join(''):'<p>Belum ada sumber berita ber-URL pada zona ini.</p>'}</div></div></div>`;
  }
  function initControls(){
    $('#btnToggleLeft')?.addEventListener('click',()=>{ document.querySelector('.map-app')?.classList.toggle('panel-collapsed'); const collapsed=document.querySelector('.map-app')?.classList.contains('panel-collapsed'); $('#btnToggleLeft').textContent=collapsed?'☰':'×'; setTimeout(()=>state.map.invalidateSize(),260); });
    $('#legendToggle')?.addEventListener('click',()=>{ const l=$('#mapLegend'); l.classList.toggle('collapsed'); const open=!l.classList.contains('collapsed'); $('#legendToggle').setAttribute('aria-expanded',String(open)); $('#legendToggle span').textContent=open?'⌃':'⌄'; });
    $('#btnFitMap')?.addEventListener('click',fitToData); $('#btnFit')?.addEventListener('click',fitToData);
    $('#btnReset')?.addEventListener('click',()=>{ ['zoneFilter','yearFilter','cctvTypeFilter','cctvSourceFilter'].forEach(id=>{ const el=$('#'+id); if(el) el.value='all'; }); const s=$('#searchInput'); if(s) s.value=''; state.filters={zone:'all',year:'all',q:'',cctvType:'all',cctvSource:'all'}; render(); });
    $('#searchInput')?.addEventListener('input',e=>{state.filters.q=e.target.value.toLowerCase(); render();});
    $('#zoneFilter')?.addEventListener('change',e=>{state.filters.zone=e.target.value; render();});
    $('#yearFilter')?.addEventListener('change',e=>{state.filters.year=e.target.value; render();});
    $('#cctvTypeFilter')?.addEventListener('change',e=>{state.filters.cctvType=e.target.value; render();});
    $('#cctvSourceFilter')?.addEventListener('change',e=>{state.filters.cctvSource=e.target.value; render();});
    $('#zoneOpacity')?.addEventListener('input',renderZones);
    $$('.layer-toggle input').forEach(inp=>inp.addEventListener('change',()=>{ const l=state.layers[inp.dataset.layer]; if(!l) return; inp.checked?l.addTo(state.map):state.map.removeLayer(l); }));
  }
  function populateFilters(){
    const add=(id,vals)=>{ const el=$('#'+id); if(!el) return; vals.filter(Boolean).sort().forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; el.appendChild(o); }); };
    add('zoneFilter',[...new Set(state.data.zoneStats.map(z=>z.classification).concat(state.data.incidents.map(i=>i.zone)))]);
    add('yearFilter',[...new Set(state.data.incidents.map(i=>i.year).filter(y=>y&&y!=='-'))]);
    add('cctvTypeFilter',[...new Set(state.data.cctv.map(c=>c.type))]);
    add('cctvSourceFilter',[...new Set(state.data.cctv.map(c=>c.domain||c.source).filter(Boolean))]);
  }
  function filteredIncidents(){ return state.data.incidents.filter(i=>{ const q=state.filters.q; const txt=[i.title,i.location,i.kecamatan,i.zone,i.source,i.corridor].join(' ').toLowerCase(); return (state.filters.zone==='all'||i.zone===state.filters.zone) && (state.filters.year==='all'||i.year===state.filters.year) && (!q||txt.includes(q)); }); }
  function filteredCctv(){ return state.data.cctv.filter(c=>{ const q=state.filters.q; const txt=[c.name,c.location,c.type,c.source,c.domain].join(' ').toLowerCase(); return (state.filters.cctvType==='all'||c.type===state.filters.cctvType) && (state.filters.cctvSource==='all'||(c.domain||c.source)===state.filters.cctvSource) && (!q||txt.includes(q)); }); }
  function renderZones(){
    state.layers.zones.clearLayers(); const op=parseFloat($('#zoneOpacity')?.value||.58);
    const zones=state.data.zones?.features||[];
    zones.forEach(f=>{ const risk=GeoSafeData.riskFromZone(GeoSafeData.getZoneName(f)); const color=colors[risk.cls]||colors.unknown; L.geoJSON(f,{style:{color,weight:2,fillColor:color,fillOpacity:op},onEachFeature:(feature,layer)=>{ layer.bindPopup(()=>popupZone(feature)); layer.on('mouseover',()=>layer.setStyle({weight:4,fillOpacity:Math.min(op+.12,.9)})); layer.on('mouseout',()=>layer.setStyle({weight:2,fillOpacity:op})); }}).addTo(state.layers.zones); });
  }
  function renderAdmin(){ state.layers.admin.clearLayers(); if(state.data.admin?.features?.length) L.geoJSON(state.data.admin,{style:{color:'#fff4ea',weight:1,fillOpacity:0,opacity:.35}}).addTo(state.layers.admin); }
  function renderCorridors(inc){
    state.layers.corridors.clearLayers(); const cors=GeoSafeData.corridorStats(inc,state.data.cctv).slice(0,8);
    cors.forEach(c=>{ const pts=c.incidents.filter(i=>i.lat!=null).map(i=>[i.lat,i.lon]); if(pts.length>=2){ L.polyline(pts,{color:'#ff3b3b',weight:4,opacity:.72,dashArray:'8,8'}).bindPopup(`<div class="popup-card"><div class="popup-head"><div class="icon">🛣️</div><div><h3 class="popup-title">${escape(c.name)}</h3><div class="popup-sub">${c.count} kejadian · ${escape(c.status)}</div></div></div><div class="popup-section"><h4>Analisis koridor</h4><p>Koridor ini berulang pada data kejadian. Prioritaskan pengecekan pencahayaan, akses keluar-masuk, CCTV terdekat, dan jam rawan.</p></div></div>`).addTo(state.layers.corridors); }
      if(pts.length){ L.marker(pts[0],{icon:L.divIcon({className:'corridor-marker',html:`<div class="corridor-label">${escape(c.name)} · ${c.count}</div>`})}).addTo(state.layers.corridors); }
    });
  }
  function render(){
    const inc=filteredIncidents(), cams=filteredCctv();
    Object.entries(state.layers).forEach(([k,l])=>{ if(!['zones','admin'].includes(k)) l.clearLayers(); });
    renderZones(); renderAdmin();
    inc.forEach(i=>{ const m=L.marker([i.lat,i.lon],{icon:icon('incident')}).bindPopup(()=>popupIncident(i)); m.addTo(state.layers.incidents); });
    cams.forEach(c=>{ L.marker([c.lat,c.lon],{icon:icon('cctv')}).bindPopup(()=>popupCctv(c)).addTo(state.layers.cctv); L.circle([c.lat,c.lon],{radius:500,color:'#5eb8ff',weight:1,fillColor:'#5eb8ff',fillOpacity:.08,opacity:.32}).addTo(state.layers.buffer); });
    state.data.crowd.forEach(c=>L.marker([c.lat,c.lon],{icon:icon('crowd')}).bindPopup(`<div class="popup-card"><div class="popup-head"><div class="icon">👥</div><div><h3 class="popup-title">${escape(c.name)}</h3><div class="popup-sub">Titik keramaian</div></div></div><div class="popup-section"><h4>Analisis konteks</h4><p>Titik keramaian dipakai sebagai konteks aktivitas publik. Hubungkan dengan kejadian terdekat sebelum menarik kesimpulan risiko.</p></div></div>`).addTo(state.layers.crowd));
    renderCorridors(inc);
    $('#statZones')&&( $('#statZones').textContent=state.data.zoneStats.length ); $('#statIncidents')&&( $('#statIncidents').textContent=inc.length ); $('#statCctv')&&( $('#statCctv').textContent=cams.length ); $('#statBlind')&&( $('#statBlind').textContent=inc.filter(i=>!i.covered500).length );
    renderZoneSummary(inc); status(`${inc.length} kejadian · ${cams.length} CCTV aktif`);
  }
  function renderZoneSummary(inc){ const box=$('#zoneSummary'); if(!box) return; const by={}; inc.forEach(i=>{ const k=i.zone||'Tidak diketahui'; by[k]=(by[k]||0)+1; }); const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]); box.innerHTML=rows.length?rows.map(([k,v])=>`<div class="layer-toggle"><span>${escape(k)}</span><b>${v}</b></div>`).join(''):'<div class="empty-state">Belum ada kejadian sesuai filter.</div>'; }
  try{
    state.map=L.map('map',{zoomControl:false}).setView([-7.797,110.37],12);
    L.control.zoom({position:'bottomleft'}).addTo(state.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(state.map);
    Object.values(state.layers).forEach(l=>l.addTo(state.map)); state.map.removeLayer(state.layers.buffer); state.map.removeLayer(state.layers.crowd);
    initControls(); status('Memuat data...');
    state.data=await GeoSafeData.loadAll(); populateFilters(); render(); setTimeout(fitToData,350);
    if(!state.data.meta.incidentsPath && !state.data.meta.zonesPath) status('Data belum ditemukan di assets/data');
  }catch(err){ console.error(err); status('Peta gagal dimuat. Cek koneksi CDN/data.'); }
})();
