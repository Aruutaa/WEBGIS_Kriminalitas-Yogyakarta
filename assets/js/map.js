(function () {
  const G = window.GeoSafe;
  const $ = G.$;
  let map, data;
  let zoneLayer, incidentLayer, cctvLayer, crowdLayer, adminLayer, bufferLayer, roadLayer;
  let selectedIncidentId = null;
  let selectedCctvId = null;
  let selectedRoadId = null;
  const layerState = { zones: true, incidents: true, cctv: true, roads: true, buffer: false, crowd: false, admin: true };

  const ROAD_CORRIDORS = [
    { id:'malioboro', name:'Malioboro - Margo Utomo', scale:'utama', coords:[[-7.8014,110.3648],[-7.7953,110.3657],[-7.7890,110.3666],[-7.7829,110.3671]] },
    { id:'kaliurang', name:'Jalan Kaliurang', scale:'utama', coords:[[-7.7840,110.3779],[-7.7658,110.3818],[-7.7460,110.3862],[-7.7285,110.3895]] },
    { id:'solo', name:'Koridor Jalan Solo - Laksda Adisucipto', scale:'utama', coords:[[-7.7827,110.3787],[-7.7839,110.3983],[-7.7833,110.4200],[-7.7828,110.4560]] },
    { id:'wates', name:'Koridor Wirobrajan - Jalan Wates', scale:'utama', coords:[[-7.8013,110.3499],[-7.8018,110.3300],[-7.8010,110.3070],[-7.7975,110.2800]] },
    { id:'parangtritis', name:'Jalan Parangtritis', scale:'utama', coords:[[-7.8137,110.3701],[-7.8350,110.3650],[-7.8600,110.3550],[-7.8870,110.3260]] },
    { id:'imogiri', name:'Jalan Imogiri Timur', scale:'sekunder', coords:[[-7.8132,110.3754],[-7.8420,110.3830],[-7.8750,110.3885],[-7.9140,110.3870]] },
    { id:'kotagede', name:'Koridor Kotagede - Banguntapan', scale:'sekunder', coords:[[-7.8030,110.3900],[-7.8212,110.3982],[-7.8450,110.3900],[-7.8650,110.3750]] },
    { id:'tugu-jetis', name:'Tugu - Jetis - Monjali', scale:'sekunder', coords:[[-7.7829,110.3671],[-7.7730,110.3650],[-7.7550,110.3690],[-7.7280,110.3720]] }
  ];

  function setStatus(text) { const el = $('mapStatus'); if (el) el.textContent = text; }
  function scoreClass(label) { return G.categoryClass(label); }
  function zoneStyle(feature) {
    const label = feature.properties?._label || G.zoneLabel(feature.properties);
    const color = feature.properties?._color || G.zoneColor(label);
    const opacity = Number($('zoneOpacity')?.value || .58);
    return { color, weight: 2, opacity: .9, fillColor: color, fillOpacity: opacity };
  }
  function circleIcon(html, className) {
    return L.divIcon({ className: '', html: `<div class="${className}">${html}</div>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -15] });
  }
  function markerCss() {
    if (document.getElementById('dynamic-marker-css')) return;
    const style = document.createElement('style');
    style.id = 'dynamic-marker-css';
    style.textContent = `
      .mk-cctv,.mk-incident,.mk-crowd{width:34px;height:34px;display:grid;place-items:center;border-radius:15px;border:2px solid rgba(255,248,239,.75);box-shadow:0 12px 26px rgba(0,0,0,.45);font-size:16px;}
      .mk-cctv{background:linear-gradient(135deg,#f7cca9,#ae995b);color:#11101a}.mk-incident{background:linear-gradient(135deg,#b33d38,#402a20);color:#fff}.mk-crowd{background:linear-gradient(135deg,#ae995b,#f7cca9);color:#11101a;border-radius:50%}.mk-zone-label{padding:6px 9px;border-radius:999px;background:rgba(5,5,7,.72);border:1px solid rgba(247,204,169,.18);color:#fff8ef;font:800 11px Inter,sans-serif;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.32)}
    `;
    document.head.appendChild(style);
  }
  function activeFilters() {
    return { search: ($('searchInput')?.value || '').trim().toLowerCase(), zone: $('zoneFilter')?.value || 'all', year: $('yearFilter')?.value || 'all', cctvType: $('cctvTypeFilter')?.value || 'all', cctvSource: $('cctvSourceFilter')?.value || 'all' };
  }
  function incidentMatches(inc) {
    const f = activeFilters();
    const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
    const zoneLabel = zone?.properties?._label || 'Luar zona';
    const hay = [inc.kecamatan, inc.title, inc.source, inc.date, zoneLabel].join(' ').toLowerCase();
    return (!f.search || hay.includes(f.search)) && (f.zone === 'all' || G.normalizeKey(zoneLabel) === G.normalizeKey(f.zone)) && (f.year === 'all' || inc.year === f.year);
  }
  function cctvMatches(cam) {
    const f = activeFilters();
    const hay = [cam.name, cam.group, cam.source, cam.type].join(' ').toLowerCase();
    return (!f.search || hay.includes(f.search)) && (f.cctvType === 'all' || cam.type === f.cctvType) && (f.cctvSource === 'all' || cam.source === f.cctvSource);
  }
  function popupLink(url, label = 'Buka sumber') { return url ? `<a href="${G.escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>` : ''; }
  function pointSegmentDistanceMeters(lat, lng, a, b) {
    const ref = lat * Math.PI / 180;
    const x = (p) => p[1] * 111320 * Math.cos(ref);
    const y = (p) => p[0] * 110540;
    const px = lng * 111320 * Math.cos(ref), py = lat * 110540;
    const ax = x(a), ay = y(a), bx = x(b), by = y(b);
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) || 1)));
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
  }
  function distanceToCorridor(lat, lng, corridor) {
    let best = Infinity;
    for (let i = 0; i < corridor.coords.length - 1; i++) best = Math.min(best, pointSegmentDistanceMeters(lat, lng, corridor.coords[i], corridor.coords[i+1]));
    return best;
  }
  function corridorStats(corridor) {
    const nearIncidents = data.incidents.filter((inc)=>distanceToCorridor(inc.lat, inc.lng, corridor) <= 430);
    const nearCctv = data.cctv.filter((cam)=>distanceToCorridor(cam.lat, cam.lng, corridor) <= 430);
    const nearCrowd = data.crowd.filter((item)=>distanceToCorridor(item.lat, item.lng, corridor) <= 430);
    const blind = nearIncidents.filter((inc)=>{
      const nearest = data.cctv.map((cam)=>G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng)).sort((a,b)=>a-b)[0] ?? Infinity;
      return nearest > 500;
    });
    const sampledScores = corridor.coords.map(([lat,lng]) => {
      const zone = G.zoneForPoint(lng, lat, data.zones);
      return zone?.properties?._score || 45;
    });
    const zoneAvg = sampledScores.reduce((a,b)=>a+b,0) / (sampledScores.length || 1);
    const score = Math.max(15, Math.min(100, Math.round(zoneAvg * .48 + nearIncidents.length * 7 + blind.length * 8 + nearCrowd.length * 2 - nearCctv.length * 1.2)));
    const label = score >= 75 ? 'Sangat Rawan' : score >= 50 ? 'Rawan' : 'Perlu Monitor';
    return { ...corridor, nearIncidents, nearCctv, nearCrowd, blind, zoneAvg, score, label };
  }
  function allCorridorStats() { return ROAD_CORRIDORS.map(corridorStats).sort((a,b)=>b.score-a.score); }
  function roadColor(score) { return score >= 75 ? '#b33d38' : score >= 50 ? '#f7cca9' : '#6dd5a5'; }
  function relatedNewsCards(inc) {
    const rows = data.incidents.filter((x)=>G.normalizeKey(x.kecamatan)===G.normalizeKey(inc.kecamatan) || G.haversineMeters(inc.lat, inc.lng, x.lat, x.lng) <= 1100).filter((x)=>x.url || x.title).slice(0,3);
    return rows.length ? `<div class="popup-news">${rows.map((x)=>`<a href="${G.isUrl(x.url) ? G.escapeHtml(x.url) : '#'}" ${G.isUrl(x.url) ? 'target="_blank" rel="noopener"' : ''}><span class="news-thumb-dot">${G.escapeHtml((x.source||'S').slice(0,1).toUpperCase())}</span><span>${G.escapeHtml(x.title || x.source)}<br><small>${G.escapeHtml(x.date || '-')} · ${G.escapeHtml(x.kecamatan)}</small></span></a>`).join('')}</div>` : '';
  }
  function incidentAnalysis(inc) {
    const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
    const label = zone?.properties?._label || 'Di luar layer kerawanan';
    const score = zone?.properties?._score || G.zoneScore(label);
    const near = data.cctv.map((cam) => ({ cam, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).sort((a, b) => a.d - b.d)[0];
    const nearInc = data.incidents.filter((x)=>String(x.id)!==String(inc.id) && G.haversineMeters(inc.lat, inc.lng, x.lat, x.lng)<=1000);
    const corridors = allCorridorStats().filter((r)=>distanceToCorridor(inc.lat, inc.lng, r)<=520).slice(0,2);
    const blind = !near || near.d > 500;
    const sentence = blind ? 'indikasi blind spot CCTV karena kamera terdekat di luar radius 500 m' : 'masih masuk radius CCTV 500 m, tetapi arah pandang kamera tetap perlu diverifikasi';
    return { zone, label, score, near, nearInc, corridors, blind, sentence };
  }
  function incidentPopup(inc) {
    const a = incidentAnalysis(inc);
    return `<div class="popup-title">Kejadian klitih · ${G.escapeHtml(inc.kecamatan)}</div>
      <div class="popup-meta"><b>Tanggal:</b> ${G.escapeHtml(inc.date || '-')}<br><b>Zona:</b> ${G.escapeHtml(a.label)} · skor ${a.score}<br><b>CCTV terdekat:</b> ${a.near ? `${G.escapeHtml(a.near.cam.name)} (${G.formatDistance(a.near.d)})` : '-'}<br><b>Koridor terkait:</b> ${a.corridors.map((r)=>G.escapeHtml(r.name)).join(', ') || '-'}</div>
      <div class="popup-analysis">Analisis: titik ini memiliki ${a.nearInc.length} kejadian lain dalam radius 1 km dan ${a.sentence}. Prioritas tindak lanjut adalah validasi lokasi, jam kejadian, pencahayaan, dan rute patroli terdekat.</div>
      ${relatedNewsCards(inc)}
      <div class="popup-actions">${popupLink(inc.url)}<button type="button" onclick="window.GeoSafeMap.focusIncident('${G.escapeHtml(inc.id)}')">Detail</button><a href="analisis.html?incident=${encodeURIComponent(inc.id)}#analisis-terpilih">Analisis</a></div>`;
  }
  function cctvPopup(cam) {
    const nearIncidents = data.incidents.map((inc) => ({ inc, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).filter((x)=>x.d<=500).sort((a,b)=>a.d-b.d);
    return `<div class="popup-title">${G.escapeHtml(cam.name)}</div>
      <div class="popup-meta"><b>Jenis:</b> ${G.escapeHtml(cam.type)}<br><b>Koridor:</b> ${G.escapeHtml(cam.group)}<br><b>Sumber:</b> ${G.escapeHtml(cam.source)}<br><b>Kejadian ≤500 m:</b> ${nearIncidents.length}<br><b>Catatan:</b> ${G.escapeHtml(cam.accuracy || '-')}</div>
      <div class="popup-analysis">Analisis: CCTV ini berguna untuk membaca area sekitar, tetapi validitas pengawasan perlu dicek dari arah pandang, kualitas video malam hari, dan apakah ruas jalan kejadian berada dalam bidang pandang kamera.</div>
      <div class="popup-actions">${popupLink(cam.url, 'Buka CCTV')}<button type="button" onclick="window.GeoSafeMap.focusCctv('${G.escapeHtml(cam.id)}')">Detail</button></div>`;
  }
  function zonePopup(feature) {
    const stat = data.zoneStats.find((z) => String(z.id) === String(feature.properties._zoneId));
    const label = feature.properties._label;
    const dominant = stat?.incidents?.reduce((acc, inc)=>{ acc[inc.kecamatan]=(acc[inc.kecamatan]||0)+1; return acc; }, {});
    const top = dominant ? Object.entries(dominant).sort((a,b)=>b[1]-a[1])[0] : null;
    return `<div class="popup-title">Zona ${G.escapeHtml(label)}</div>
      <div class="popup-meta"><b>Gridcode:</b> ${G.escapeHtml(feature.properties.gridcode || '-')}<br><b>Skor dashboard:</b> ${feature.properties._score}<br><b>Titik kejadian:</b> ${stat?.incidentCount ?? 0}<br><b>CCTV di dalam zona:</b> ${stat?.cctvCount ?? 0}<br><b>Blind spot 500 m:</b> ${stat?.blindspot ?? 0}</div>
      <div class="popup-analysis">Analisis: ${top ? `konsentrasi kejadian terbesar di ${G.escapeHtml(top[0])} (${top[1]} titik).` : 'belum ada konsentrasi kejadian pada data aktif.'} Zona ini perlu dibaca bersama cakupan CCTV dan sumber berita agar tidak semata-mata bergantung pada warna polygon.</div>`;
  }
  function roadPopup(road) {
    return `<div class="popup-title">${G.escapeHtml(road.name)}</div><div class="popup-meta"><b>Kelas koridor:</b> ${G.escapeHtml(road.scale)}<br><b>Skor risiko koridor:</b> ${road.score}<br><b>Klasifikasi:</b> ${G.escapeHtml(road.label)}<br><b>Kejadian dekat koridor:</b> ${road.nearIncidents.length}<br><b>Blind spot kejadian:</b> ${road.blind.length}<br><b>CCTV dekat koridor:</b> ${road.nearCctv.length}</div><div class="popup-analysis">Analisis koridor memakai jarak titik kejadian ke ruas estimasi ±430 m, cakupan CCTV 500 m, titik keramaian, dan rata-rata skor zona di sepanjang ruas. Ini adalah indikator awal untuk memilah ruas prioritas, bukan pengganti survei geometri jalan yang presisi.</div><div class="popup-actions"><button type="button" onclick="window.GeoSafeMap.focusRoad('${G.escapeHtml(road.id)}')">Detail koridor</button></div>`;
  }
  function renderZones() {
    zoneLayer.clearLayers(); if (!layerState.zones) return;
    L.geoJSON(data.zones, { style: zoneStyle, onEachFeature: (feature, layer) => { layer.bindPopup(zonePopup(feature)); layer.on('click', () => updateDetailZone(feature)); layer.on('mouseover', () => layer.setStyle({ weight: 4, fillOpacity: Math.min(.82, Number($('zoneOpacity')?.value || .58) + .12) })); layer.on('mouseout', () => layer.setStyle(zoneStyle(feature))); } }).addTo(zoneLayer);
  }
  function renderAdmin() { adminLayer.clearLayers(); if (!layerState.admin || !data.admin) return; L.geoJSON(data.admin, { style: { color: '#f7cca9', weight: 1.4, opacity: .42, fillOpacity: 0 } }).addTo(adminLayer); }
  function renderIncidents() {
    incidentLayer.clearLayers(); if (!layerState.incidents) return;
    data.incidents.filter(incidentMatches).forEach((inc) => {
      const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones); const label = zone?.properties?._label || ''; const color = G.zoneColor(label);
      const marker = L.circleMarker([inc.lat, inc.lng], { radius: selectedIncidentId === String(inc.id) ? 9 : 6, color: '#fff8ef', weight: 1.5, fillColor: color || '#b33d38', fillOpacity: .92 }).bindPopup(incidentPopup(inc));
      marker.on('click', () => { selectedIncidentId = String(inc.id); renderIncidentList(); updateDetailIncident(inc); }); marker.addTo(incidentLayer);
    });
  }
  function renderBuffer() { bufferLayer.clearLayers(); if (!layerState.buffer) return; data.cctv.filter(cctvMatches).forEach((cam) => { L.circle([cam.lat, cam.lng], { radius: 500, color: '#f7cca9', weight: 1, opacity: .26, fillColor: '#f7cca9', fillOpacity: .055 }).addTo(bufferLayer); }); }
  function renderCctv() { cctvLayer.clearLayers(); if (!layerState.cctv) return; data.cctv.filter(cctvMatches).forEach((cam) => { const marker = L.marker([cam.lat, cam.lng], { icon: circleIcon(cam.type === 'PTZ' ? '📹' : '📷', 'mk-cctv') }).bindPopup(cctvPopup(cam)); marker.on('click', () => { selectedCctvId = String(cam.id); renderCctvList(); updateDetailCctv(cam); }); marker.addTo(cctvLayer); }); }
  function renderCrowd() { crowdLayer.clearLayers(); if (!layerState.crowd) return; data.crowd.forEach((item) => { L.marker([item.lat, item.lng], { icon: circleIcon('●', 'mk-crowd') }).bindPopup(`<div class="popup-title">${G.escapeHtml(item.name)}</div><div class="popup-meta"><b>Kategori:</b> ${G.escapeHtml(item.category)}<br><b>Wilayah:</b> ${G.escapeHtml(item.city)}</div>`).addTo(crowdLayer); }); }
  function renderRoads() {
    roadLayer.clearLayers(); if (!layerState.roads) return;
    allCorridorStats().forEach((road) => {
      L.polyline(road.coords, { color: roadColor(road.score), weight: selectedRoadId === road.id ? 8 : 5, opacity: .86, className:'road-risk-line' }).bindPopup(roadPopup(road)).on('click', () => { selectedRoadId = road.id; updateDetailRoad(road); renderRoadList(); renderRoads(); }).addTo(roadLayer);
    });
  }
  function renderAll() { renderZones(); renderAdmin(); renderRoads(); renderIncidents(); renderBuffer(); renderCctv(); renderCrowd(); renderStats(); renderZoneList(); renderIncidentList(); renderRoadList(); renderCctvList(); setStatus(`Layer aktif · ${data.zones.features.length} zona · ${data.incidents.filter(incidentMatches).length} kejadian · ${data.cctv.filter(cctvMatches).length} CCTV · ${ROAD_CORRIDORS.length} koridor`); }
  function renderStats() { const inc = data.incidents.filter(incidentMatches); const cams = data.cctv.filter(cctvMatches); const veryRisk = data.zoneStats.find((z) => G.normalizeKey(z.label).includes('sangat')); $('statZones').textContent = data.zones.features.length; $('statIncidents').textContent = inc.length; $('statCctv').textContent = cams.length; $('statBlind').textContent = veryRisk?.blindspot ?? 0; }
  function renderZoneList() { const box = $('zoneSummary'); if (!box) return; box.innerHTML = data.zoneStats.map((z) => `<article class="item-card" data-zone="${G.escapeHtml(z.label)}"><h4>Zona ${G.escapeHtml(z.label)}</h4><div class="item-meta"><span class="tag ${scoreClass(z.label)}">Skor ${z.score}</span><span class="tag">${z.incidentCount} kejadian</span><span class="tag">${z.cctvCount} CCTV</span></div><div class="meter" style="margin-top:10px"><i style="width:${Math.min(100, z.score)}%"></i></div><small>Blind spot 500 m: ${z.blindspot}. Klik layer di peta untuk detail bentuk zona.</small></article>`).join(''); box.querySelectorAll('[data-zone]').forEach((el) => el.addEventListener('click', () => { $('zoneFilter').value = el.dataset.zone; renderAll(); })); }
  function renderIncidentList() { const list = $('incidentList'); if (!list) return; const rows = data.incidents.filter(incidentMatches).slice(0, 34); list.innerHTML = rows.map((inc) => { const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones); const label = zone?.properties?._label || 'Luar zona'; return `<article class="item-card ${selectedIncidentId === String(inc.id) ? 'active' : ''}" data-id="${G.escapeHtml(inc.id)}"><h4>${G.escapeHtml(inc.kecamatan)}</h4><p>${G.escapeHtml(inc.title)}</p><div class="item-meta"><span class="tag ${scoreClass(label)}">${G.escapeHtml(label)}</span><span class="tag">${G.escapeHtml(inc.year)}</span></div></article>`; }).join('') || '<div class="item-card"><p>Tidak ada kejadian sesuai filter.</p></div>'; list.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => focusIncident(el.dataset.id))); }
  function renderCctvList() { const list = $('cctvList'); if (!list) return; const rows = data.cctv.filter(cctvMatches).slice(0, 26); list.innerHTML = rows.map((cam) => `<article class="item-card ${selectedCctvId === String(cam.id) ? 'active' : ''}" data-id="${G.escapeHtml(cam.id)}"><h4>${G.escapeHtml(cam.name)}</h4><p>${G.escapeHtml(cam.group)}</p><div class="item-meta"><span class="tag">${G.escapeHtml(cam.type)}</span><span class="tag">${G.escapeHtml(cam.source)}</span></div></article>`).join('') || '<div class="item-card"><p>Tidak ada CCTV sesuai filter.</p></div>'; list.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => focusCctv(el.dataset.id))); }
  function renderRoadList() { const list = $('roadList'); if (!list) return; const rows = allCorridorStats(); list.innerHTML = rows.map((r)=>`<article class="item-card ${selectedRoadId === r.id ? 'active' : ''}" data-road="${G.escapeHtml(r.id)}"><h4>${G.escapeHtml(r.name)}</h4><p>${G.escapeHtml(r.label)} · skor ${r.score}</p><div class="item-meta"><span class="tag ${scoreClass(r.label)}">${G.escapeHtml(r.scale)}</span><span class="tag">${r.nearIncidents.length} kejadian</span><span class="tag">${r.blind.length} blind</span></div></article>`).join(''); list.querySelectorAll('[data-road]').forEach((el)=>el.addEventListener('click',()=>focusRoad(el.dataset.road))); }
  function updateDetailZone(feature) { const box = $('detailBox'); if (!box) return; const stat = data.zoneStats.find((z)=>String(z.id)===String(feature.properties._zoneId)); box.innerHTML = `<div class="icon">🗺️</div><h3>Analisis Zona ${G.escapeHtml(feature.properties._label)}</h3><p>Skor ${feature.properties._score}. Zona ini memuat ${stat?.incidentCount || 0} kejadian, ${stat?.cctvCount || 0} CCTV, dan ${stat?.blindspot || 0} titik potensi blind spot 500 m.</p><div class="deep-metrics"><span><b>${stat?.covered500 || 0}</b>Tercakup CCTV</span><span><b>${stat?.blindspot || 0}</b>Blind spot</span></div><p style="margin-top:12px">Rekomendasi: gunakan warna zona sebagai prioritas awal, lalu cek ulang dengan titik kejadian dan koridor jalan yang melintas.</p>`; }
  function updateDetailIncident(inc) { const box = $('detailBox'); if (!box) return; const a = incidentAnalysis(inc); box.innerHTML = `<div class="icon">⚠️</div><h3>Analisis Kejadian</h3><p><b>${G.escapeHtml(inc.kecamatan)}</b> · ${G.escapeHtml(inc.date || '-')}</p><div class="item-meta"><span class="tag ${scoreClass(a.label)}">${G.escapeHtml(a.label)}</span><span class="tag">${G.escapeHtml(inc.source)}</span><span class="tag">${a.nearInc.length} kejadian ≤1 km</span></div><p style="margin-top:12px">Titik ini dibaca sebagai bagian dari pola zona dan pengawasan. CCTV terdekat: <b>${a.near ? G.escapeHtml(a.near.cam.name) : '-'}</b> ${a.near ? `(${G.formatDistance(a.near.d)})` : ''}. Kesimpulan awal: ${a.sentence}.</p><div class="deep-metrics"><span><b>${a.score}</b>Skor zona</span><span><b>${a.corridors.length || '-'}</b>Koridor terkait</span></div><p style="margin-top:12px">${a.blind ? 'Prioritas: cek pencahayaan, aktivitas malam, dan opsi penambahan titik pantau.' : 'Prioritas: cek arah pandang kamera, kualitas rekaman malam, dan waktu kejadian.'}</p><div class="row-actions" style="margin-top:12px">${inc.url ? `<a class="btn small primary" href="${G.escapeHtml(inc.url)}" target="_blank" rel="noopener">Buka sumber</a>` : ''}<a class="btn small" href="analisis.html?incident=${encodeURIComponent(inc.id)}#analisis-terpilih">Analisis lengkap</a></div>`; }
  function updateDetailCctv(cam) { const box = $('detailBox'); if (!box) return; const nearIncidents = data.incidents.map((inc) => ({ inc, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).filter((x) => x.d <= 500); box.innerHTML = `<div class="icon">📹</div><h3>Detail CCTV</h3><p><b>${G.escapeHtml(cam.name)}</b><br>${G.escapeHtml(cam.group)}</p><div class="item-meta"><span class="tag">${G.escapeHtml(cam.type)}</span><span class="tag">${G.escapeHtml(cam.source)}</span><span class="tag">${nearIncidents.length} kejadian ≤500m</span></div><p style="margin-top:12px">Koordinat: ${cam.lat.toFixed(5)}, ${cam.lng.toFixed(5)}. Catatan: ${G.escapeHtml(cam.accuracy || '-')}</p>${cam.embed ? `<div class="video-wrap"><iframe src="${G.escapeHtml(cam.embed)}" title="CCTV ${G.escapeHtml(cam.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}${cam.url ? `<br><a class="btn small primary" href="${G.escapeHtml(cam.url)}" target="_blank" rel="noopener">Buka CCTV</a>` : ''}`; }
  function updateDetailRoad(road) { const box = $('detailBox'); if (!box) return; box.innerHTML = `<div class="icon">🛣️</div><h3>Analisis Koridor</h3><p><b>${G.escapeHtml(road.name)}</b> · ${G.escapeHtml(road.scale)}</p><div class="item-meta"><span class="tag ${scoreClass(road.label)}">${G.escapeHtml(road.label)}</span><span class="tag">Skor ${road.score}</span><span class="tag">${road.nearIncidents.length} kejadian</span></div><p style="margin-top:12px">Skor dihitung dari kedekatan titik kejadian terhadap ruas, rata-rata skor zona, titik keramaian, jumlah CCTV dekat koridor, dan kejadian yang berada di luar radius CCTV 500 meter.</p><div class="deep-metrics"><span><b>${road.nearCctv.length}</b>CCTV dekat</span><span><b>${road.blind.length}</b>Blind spot</span><span><b>${road.nearCrowd.length}</b>Keramaian</span><span><b>${Math.round(road.zoneAvg)}</b>Rata-rata zona</span></div>`; }
  function focusIncident(id) { const inc = data.incidents.find((item) => String(item.id) === String(id)); if (!inc) return; selectedIncidentId = String(id); updateDetailIncident(inc); map.setView([inc.lat, inc.lng], 15, { animate: true }); renderIncidents(); renderIncidentList(); }
  function focusCctv(id) { const cam = data.cctv.find((item) => String(item.id) === String(id)); if (!cam) return; selectedCctvId = String(id); updateDetailCctv(cam); map.setView([cam.lat, cam.lng], 16, { animate: true }); renderCctv(); renderCctvList(); }
  function focusRoad(id) { const road = allCorridorStats().find((item)=>item.id===id); if (!road) return; selectedRoadId = id; updateDetailRoad(road); map.fitBounds(L.polyline(road.coords).getBounds(), { padding:[70,70] }); renderRoads(); renderRoadList(); }
  function populateFilters() { const zoneFilter = $('zoneFilter'); const yearFilter = $('yearFilter'); const typeFilter = $('cctvTypeFilter'); const sourceFilter = $('cctvSourceFilter'); if (zoneFilter) { const zones = [...new Set(data.zones.features.map((f) => f.properties._label))]; zoneFilter.innerHTML = '<option value="all">Semua zona</option>' + zones.map((z) => `<option value="${G.escapeHtml(z)}">${G.escapeHtml(z)}</option>`).join(''); } if (yearFilter) { const years = [...new Set(data.incidents.map((i) => i.year).filter(Boolean))].sort(); yearFilter.innerHTML = '<option value="all">Semua tahun</option>' + years.map((y) => `<option value="${G.escapeHtml(y)}">${G.escapeHtml(y)}</option>`).join(''); } if (typeFilter) { const types = [...new Set(data.cctv.map((c) => c.type))].sort(); typeFilter.innerHTML = '<option value="all">Semua jenis</option>' + types.map((t) => `<option value="${G.escapeHtml(t)}">${G.escapeHtml(t)}</option>`).join(''); } if (sourceFilter) { const sources = [...new Set(data.cctv.map((c) => c.source))].sort(); sourceFilter.innerHTML = '<option value="all">Semua sumber</option>' + sources.map((s) => `<option value="${G.escapeHtml(s)}">${G.escapeHtml(s)}</option>`).join(''); } }
  function bindUi() { ['searchInput', 'zoneFilter', 'yearFilter', 'cctvTypeFilter', 'cctvSourceFilter', 'zoneOpacity'].forEach((id) => { const el = $(id); if (!el) return; ['input', 'change'].forEach((evt) => el.addEventListener(evt, renderAll)); }); document.querySelectorAll('[data-layer]').forEach((el) => { el.addEventListener('change', () => { layerState[el.dataset.layer] = el.checked; renderAll(); }); }); $('btnReset')?.addEventListener('click', () => { ['zoneFilter', 'yearFilter', 'cctvTypeFilter', 'cctvSourceFilter'].forEach((id) => { const el = $(id); if (el) el.value = 'all'; }); if ($('searchInput')) $('searchInput').value = ''; renderAll(); }); function fitZones(){ try { map.fitBounds(L.geoJSON(data.zones).getBounds(), { padding: [30, 30] }); } catch { map.setView([-7.7972, 110.3688], 13); } } $('btnFit')?.addEventListener('click', fitZones); $('btnFitMap')?.addEventListener('click', fitZones); $('btnToggleControls')?.addEventListener('click', () => $('mapControls')?.classList.toggle('is-open')); $('btnCloseControls')?.addEventListener('click', () => $('mapControls')?.classList.remove('is-open')); $('btnToggleLegend')?.addEventListener('click', () => $('mapLegend')?.classList.toggle('is-hidden')); $('btnCloseLegend')?.addEventListener('click', () => $('mapLegend')?.classList.add('is-hidden')); }
  async function init() { markerCss(); if (!window.L) { setStatus('Leaflet gagal dimuat. Cek koneksi internet/CDN.'); return; } setStatus('Memuat data CSV, GeoJSON zona kerawanan, dan CCTV...'); map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([-7.7972, 110.3688], 13); L.control.zoom({ position: 'bottomright' }).addTo(map); const baseMaps = { 'Carto Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO' }), 'Carto Voyager': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO' }), 'OSM Standard': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }), 'Esri Imagery': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }) }; baseMaps['Carto Dark'].addTo(map); L.control.layers(baseMaps, null, { position: 'bottomright', collapsed: true }).addTo(map); zoneLayer = L.layerGroup().addTo(map); adminLayer = L.layerGroup().addTo(map); roadLayer = L.layerGroup().addTo(map); incidentLayer = L.layerGroup().addTo(map); cctvLayer = L.layerGroup().addTo(map); bufferLayer = L.layerGroup().addTo(map); crowdLayer = L.layerGroup().addTo(map); try { data = await G.loadAll(); window.GeoSafeLoadedData = data; populateFilters(); bindUi(); renderAll(); try { map.fitBounds(L.geoJSON(data.zones).getBounds(), { padding: [36, 36] }); } catch {} if (data.incidents[0]) updateDetailIncident(data.incidents[0]); setStatus(`Data berhasil dimuat · klik titik/koridor untuk analisis detail`); } catch (err) { console.error(err); setStatus(`Gagal memuat data: ${err.message}. Jalankan via Live Server, bukan file://`); } }
  window.GeoSafeMap = { focusIncident, focusCctv, focusRoad };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
