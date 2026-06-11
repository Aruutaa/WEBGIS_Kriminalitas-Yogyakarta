(async function(){
  const $=window.GeoSafeUI?.$||((s,r=document)=>r.querySelector(s));
  const $$=window.GeoSafeUI?.$$||((s,r=document)=>Array.from(r.querySelectorAll(s)));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fmt=m=>!Number.isFinite(m)?'-':(m>=1000?`${(m/1000).toFixed(2)} km`:`${Math.round(m)} m`);
  const colors={safe:'#6dd5a5',warn:'#f7cca9',danger:'#b33d38',med:'#ae995b'};
  const state={data:null,map:null,layers:{zones:L.layerGroup(),admin:L.layerGroup(),incidents:L.layerGroup(),cctv:L.layerGroup(),buffer:L.layerGroup(),crowd:L.layerGroup(),corridors:L.layerGroup()},filters:{zone:'all',year:'all',q:'',cctvType:'all',cctvSource:'all'}};
  function status(t){ const el=$('#mapStatus'); if(el) el.textContent=t; }
  function ensureLegendToggle(){
    const legend=$('.legend'); if(!legend) return;
    legend.id=legend.id||'mapLegend';
    if(!legend.querySelector('.legend-head')){
      const h=legend.querySelector('h4');
      const head=document.createElement('div'); head.className='legend-head';
      const title=document.createElement('h4'); title.textContent=h?h.textContent:'Legenda';
      const btn=document.createElement('button'); btn.type='button'; btn.className='legend-toggle'; btn.id='legendToggle'; btn.setAttribute('aria-expanded','true'); btn.innerHTML='<span>⌄</span>';
      if(h) h.remove(); head.append(title,btn); legend.prepend(head);
    }
    $('#legendToggle')?.addEventListener('click',()=>{ const open=!legend.classList.toggle('collapsed'); $('#legendToggle').setAttribute('aria-expanded',String(open)); $('#legendToggle span').textContent=open?'⌄':'⌃'; });
  }
  function addCorridorToggle(){
    const list=$('.layer-list'); if(!list||list.querySelector('[data-layer="corridors"]')) return;
    const label=document.createElement('label'); label.className='layer-toggle';
    label.innerHTML='<span>Koridor/jalan rawan</span><input data-layer="corridors" type="checkbox">';
    list.appendChild(label);
  }
  function ensureToast(){
    const box=$('.mapbox'); if(!box||$('#mapToast')) return;
    const div=document.createElement('div'); div.id='mapToast'; div.className='map-toast';
    div.innerHTML='<strong>Mode popup aktif.</strong> Klik titik kejadian, CCTV, zona, atau koridor untuk membaca analisis lokasi.';
    box.appendChild(div); setTimeout(()=>div.remove(),5200);
  }
  function icon(cls){ return L.divIcon({className:`${cls}-icon`,iconSize:[18,18],html:''}); }
  function newsVisual(n){ if(n.image) return `<img src="${esc(n.image)}" alt="Gambar berita" onerror="this.remove()">`; return esc((n.domain||n.sourceType||'N').slice(0,2).toUpperCase()); }
  function relatedNews(item){
    const keys=[item.kecamatan,item.zone,item.corridor,item.location].filter(Boolean).map(x=>String(x).toLowerCase());
    let list=(state.data.incidents||[]).filter(i=>i.source&&(i.id===item.id||keys.some(k=>String([i.kecamatan,i.zone,i.corridor,i.location,i.title].join(' ')).toLowerCase().includes(k))));
    if(!list.length&&item.source) list=[item];
    return list.slice(0,3);
  }
  function popupNews(list){ return `<div class="popup-news">${list.length?list.map(n=>`<a href="${/^https?:/i.test(n.source||'')?esc(n.source):'#'}" target="_blank" rel="noopener"><span class="news-thumb">${newsVisual(n)}</span><span><strong>${esc(n.title)}</strong><span>${esc(n.domain||n.sourceType)} · ${esc(n.year)}</span></span></a>`).join(''):'<p>Belum ada URL/gambar sumber pada data lokasi ini.</p>'}</div>`; }
  function popupIncident(i){
    const near=(state.data.incidents||[]).filter(o=>o.id!==i.id&&GeoSafeData.haversine(i,o)<=1000).length;
    const risk=GeoSafeData.riskFromZone(i.zone);
    const cctv=i.nearestCctv?`${esc(i.nearestCctv.name)} (${fmt(i.nearestCctvDistance)})`:'Tidak ada CCTV terbaca';
    return `<div class="popup-card"><div class="popup-head"><div class="icon">⚠️</div><div><h3 class="popup-title">${esc(i.title)}</h3><div class="popup-sub">${esc(i.location)} · ${esc(i.date)}</div></div></div><div class="popup-grid"><div class="popup-stat"><small>Zona</small><strong>${esc(i.zone||'Tidak diketahui')}</strong></div><div class="popup-stat"><small>Status CCTV</small><strong>${i.covered500?'Tercakup 500 m':'Blind spot relatif'}</strong></div><div class="popup-stat"><small>CCTV terdekat</small><strong>${cctv}</strong></div><div class="popup-stat"><small>Kejadian sekitar</small><strong>${near} titik ≤ 1 km</strong></div></div><div class="popup-section"><h4>Analisis lokasi</h4><p>Lokasi ini berada pada kelas <b>${esc(risk.label)}</b>. Pembacaan tambahan memakai data yang sama: klasifikasi zona, kedekatan CCTV, dan konsentrasi kejadian sekitar. ${i.covered500?'Titik masih dalam radius 500 m CCTV, tetapi arah kamera, kualitas rekaman, dan waktu kejadian tetap perlu diverifikasi.':'Titik berada di luar radius 500 m dari CCTV terdekat, sehingga layak diprioritaskan sebagai indikasi blind spot relatif.'}</p></div><div class="popup-section"><h4>Koridor terkait</h4><p>${i.corridor?`Teks lokasi mengarah ke <b>${esc(i.corridor)}</b>. Bila ruas ini berulang pada beberapa titik, koridor tersebut bisa dibaca sebagai prioritas audit jalan.`:'Nama jalan/koridor belum cukup jelas dari data, sehingga pelabelan lokasi perlu dirinci untuk analisis ruas.'}</p></div><div class="popup-section"><h4>Berita/sumber terkait</h4>${popupNews(relatedNews(i))}</div></div>`;
  }
  function popupCctv(c){
    const near=(state.data.incidents||[]).filter(i=>GeoSafeData.haversine(c,i)<=500).length;
    return `<div class="popup-card"><div class="popup-head"><div class="icon">📹</div><div><h3 class="popup-title">${esc(c.name)}</h3><div class="popup-sub">${esc(c.location||'Lokasi CCTV')}</div></div></div><div class="popup-grid"><div class="popup-stat"><small>Jenis</small><strong>${esc(c.type)}</strong></div><div class="popup-stat"><small>Kejadian radius 500 m</small><strong>${near}</strong></div></div><div class="popup-section"><h4>Analisis CCTV</h4><p>Radius ini hanya indikator kedekatan spasial. Banyaknya kejadian dekat CCTV tidak otomatis berarti kejadian terekam; arah pandang, jam aktif, dan kualitas rekaman tetap harus dicek.</p></div></div>`;
  }
  function popupZone(f){
    const label=GeoSafeData.getFeatureLabel(f), cls=GeoSafeData.getZoneName(f), risk=GeoSafeData.riskFromZone(cls);
    const inc=state.data.incidents.filter(i=>GeoSafeData.pointInFeature(i,f));
    const cams=state.data.cctv.filter(c=>GeoSafeData.pointInFeature(c,f));
    const blind=inc.filter(i=>!i.covered500).length;
    return `<div class="popup-card"><div class="popup-head"><div class="icon">🗺️</div><div><h3 class="popup-title">${esc(label)}</h3><div class="popup-sub">Kelas ${esc(cls)}</div></div></div><div class="popup-grid"><div class="popup-stat"><small>Skor kelas</small><strong>${risk.score}</strong></div><div class="popup-stat"><small>Kejadian</small><strong>${inc.length}</strong></div><div class="popup-stat"><small>CCTV dalam zona</small><strong>${cams.length}</strong></div><div class="popup-stat"><small>Blind spot relatif</small><strong>${blind}</strong></div></div><div class="popup-section"><h4>Analisis zona</h4><p>Zona ini mengikuti atribut klasifikasi pada GeoJSON. Prioritas meningkat bila kejadian terkonsentrasi dan banyak titik berada di luar radius CCTV 500 m.</p></div><div class="popup-section"><h4>Sumber dalam zona</h4>${popupNews(inc.filter(i=>i.source).slice(0,3))}</div></div>`;
  }
  function popupCorridor(c){
    return `<div class="popup-card"><div class="popup-head"><div class="icon">🛣️</div><div><h3 class="popup-title">${esc(c.name)}</h3><div class="popup-sub">${esc(c.status)}</div></div></div><div class="popup-grid"><div class="popup-stat"><small>Kejadian</small><strong>${c.count}</strong></div><div class="popup-stat"><small>Blind spot</small><strong>${c.blind}</strong></div><div class="popup-stat"><small>Zona dominan</small><strong>${esc(c.dominant)}</strong></div><div class="popup-stat"><small>CCTV terdekat</small><strong>${fmt(c.nearest)}</strong></div></div><div class="popup-section"><h4>Analisis koridor</h4><p>Koridor ini dihitung dari nama jalan/ruas yang terbaca pada data kejadian. Ini bukan data jalan baru, melainkan ringkasan tambahan dari data yang sudah ada untuk melihat ruas yang berulang.</p></div></div>`;
  }
  function filteredIncidents(){ return state.data.incidents.filter(i=>{ const q=state.filters.q; const txt=[i.title,i.location,i.kecamatan,i.zone,i.source,i.corridor].join(' ').toLowerCase(); return (state.filters.zone==='all'||i.zone===state.filters.zone)&&(state.filters.year==='all'||i.year===state.filters.year)&&(!q||txt.includes(q)); }); }
  function filteredCctv(){ return state.data.cctv.filter(c=>{ const q=state.filters.q; const txt=[c.name,c.location,c.type,c.source,c.domain].join(' ').toLowerCase(); return (state.filters.cctvType==='all'||c.type===state.filters.cctvType)&&(state.filters.cctvSource==='all'||(c.domain||c.source)===state.filters.cctvSource)&&(!q||txt.includes(q)); }); }
  function setOptions(id,vals){ const el=$('#'+id); if(!el) return; const old=el.value; vals.filter(Boolean).sort().forEach(v=>{ if(![...el.options].some(o=>o.value===v)){ const o=document.createElement('option'); o.value=v; o.textContent=v; el.appendChild(o); } }); el.value=old||'all'; }
  function renderStats(inc,cctv){ $('#statZones')&&( $('#statZones').textContent=state.data.zoneStats.length ); $('#statIncidents')&&( $('#statIncidents').textContent=inc.length ); $('#statCctv')&&( $('#statCctv').textContent=cctv.length ); $('#statBlind')&&( $('#statBlind').textContent=inc.filter(i=>!i.covered500).length ); }
  function renderZones(){ state.layers.zones.clearLayers(); const op=parseFloat($('#zoneOpacity')?.value||.58); (state.data.zones.features||[]).forEach(f=>{ const risk=GeoSafeData.riskFromZone(GeoSafeData.getZoneName(f)); const layer=L.geoJSON(f,{style:{color:colors[risk.cls]||colors.med,weight:1.4,fillColor:colors[risk.cls]||colors.med,fillOpacity:op}}).bindPopup(()=>popupZone(f),{className:'custom-popup'}).addTo(state.layers.zones); }); }
  function renderAdmin(){ state.layers.admin.clearLayers(); if(state.data.admin?.features?.length) L.geoJSON(state.data.admin,{style:{color:'#eadad0',weight:1,dashArray:'4 5',fillOpacity:0}}).addTo(state.layers.admin); }
  function renderIncidents(inc){ state.layers.incidents.clearLayers(); inc.forEach(i=>L.marker([i.lat,i.lon],{icon:icon('incident')}).bindPopup(()=>popupIncident(i),{className:'custom-popup'}).addTo(state.layers.incidents)); }
  function renderCctv(cctv){ state.layers.cctv.clearLayers(); state.layers.buffer.clearLayers(); cctv.forEach(c=>{ L.marker([c.lat,c.lon],{icon:icon('cctv')}).bindPopup(()=>popupCctv(c),{className:'custom-popup'}).addTo(state.layers.cctv); L.circle([c.lat,c.lon],{radius:500,color:'#8fc8ff',weight:1,fillColor:'#8fc8ff',fillOpacity:.08}).addTo(state.layers.buffer); }); }
  function renderCrowd(){ state.layers.crowd.clearLayers(); state.data.crowd.forEach(c=>L.marker([c.lat,c.lon],{icon:icon('crowd')}).bindPopup(`<div class="popup-card"><div class="popup-head"><div class="icon">👥</div><div><h3 class="popup-title">${esc(c.name)}</h3><div class="popup-sub">Titik keramaian</div></div></div></div>`,{className:'custom-popup'}).addTo(state.layers.crowd)); }
  function renderCorridors(inc){
    state.layers.corridors.clearLayers(); const cors=GeoSafeData.corridorStats(inc,state.data.cctv).slice(0,12);
    cors.forEach(c=>{ const pts=c.incidents.filter(i=>i.lat!=null&&i.lon!=null).map(i=>[i.lat,i.lon]); if(pts.length>=2){ L.polyline(pts,{color:'#f7cca9',weight:4,opacity:.75,dashArray:'8 7',className:'corridor-line'}).bindPopup(()=>popupCorridor(c),{className:'custom-popup'}).addTo(state.layers.corridors); } else if(pts.length===1){ L.marker(pts[0],{icon:icon('corridor-node')}).bindPopup(()=>popupCorridor(c),{className:'custom-popup'}).addTo(state.layers.corridors); } });
  }
  function fitToData(){ const layers=Object.values(state.layers).filter(l=>state.map.hasLayer(l)); const fg=L.featureGroup(layers); try{ if(fg.getLayers().length) state.map.fitBounds(fg.getBounds().pad(.12)); }catch(e){} }
  function render(){ const inc=filteredIncidents(), cctv=filteredCctv(); renderStats(inc,cctv); renderZones(); renderIncidents(inc); renderCctv(cctv); renderCrowd(); renderCorridors(inc); status(`${inc.length} kejadian · ${cctv.length} CCTV · ${inc.filter(i=>!i.covered500).length} blind spot relatif`); setTimeout(()=>state.map.invalidateSize(),80); }
  function bind(){
    $('#btnToggleLeft')?.addEventListener('click',()=>{ $('#mainLayout')?.classList.toggle('left-collapsed'); $('.map-app')?.classList.toggle('panel-collapsed'); const collapsed=$('#mainLayout')?.classList.contains('left-collapsed')||$('.map-app')?.classList.contains('panel-collapsed'); $('#btnToggleLeft').textContent=collapsed?'☰':'×'; setTimeout(()=>state.map.invalidateSize(),260); });
    $('#btnFitMap')?.addEventListener('click',fitToData); $('#btnFit')?.addEventListener('click',fitToData);
    $('#btnReset')?.addEventListener('click',()=>{ Object.assign(state.filters,{zone:'all',year:'all',q:'',cctvType:'all',cctvSource:'all'}); ['zoneFilter','yearFilter','cctvTypeFilter','cctvSourceFilter'].forEach(id=>{ const el=$('#'+id); if(el) el.value='all'; }); if($('#searchInput')) $('#searchInput').value=''; render(); });
    $('#searchInput')?.addEventListener('input',e=>{state.filters.q=e.target.value.toLowerCase(); render();});
    $('#zoneFilter')?.addEventListener('change',e=>{state.filters.zone=e.target.value; render();});
    $('#yearFilter')?.addEventListener('change',e=>{state.filters.year=e.target.value; render();});
    $('#cctvTypeFilter')?.addEventListener('change',e=>{state.filters.cctvType=e.target.value; render();});
    $('#cctvSourceFilter')?.addEventListener('change',e=>{state.filters.cctvSource=e.target.value; render();});
    $('#zoneOpacity')?.addEventListener('input',render);
    $$('.layer-toggle input').forEach(inp=>inp.addEventListener('change',()=>{ const l=state.layers[inp.dataset.layer]; if(!l) return; inp.checked?l.addTo(state.map):state.map.removeLayer(l); }));
  }
  if(!window.L||!$('#map')) return;
  ensureLegendToggle(); addCorridorToggle(); ensureToast();
  state.map=L.map('map',{zoomControl:true}).setView([-7.7956,110.3695],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(state.map);
  Object.entries(state.layers).forEach(([k,l])=>{ if(['zones','incidents','cctv','admin'].includes(k)) l.addTo(state.map); });
  try{ state.data=await GeoSafeData.loadAll(); }catch(e){ console.error(e); status('Data belum bisa dimuat. Pastikan memakai server lokal dan path assets/data benar.'); return; }
  setOptions('zoneFilter',[...new Set(state.data.zoneStats.map(z=>z.classification).concat(state.data.incidents.map(i=>i.zone)))]);
  setOptions('yearFilter',[...new Set(state.data.incidents.map(i=>i.year).filter(y=>y&&y!=='-'))]);
  setOptions('cctvTypeFilter',[...new Set(state.data.cctv.map(c=>c.type))]);
  setOptions('cctvSourceFilter',[...new Set(state.data.cctv.map(c=>c.domain||c.source).filter(Boolean))]);
  bind(); render(); setTimeout(fitToData,300);
})();
