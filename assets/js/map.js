(function () {
  const G = window.GeoSafe;
  const $ = G.$;
  let map, data;
  let zoneLayer, incidentLayer, cctvLayer, crowdLayer, adminLayer, bufferLayer;
  let selectedIncidentId = null;
  let selectedCctvId = null;
  const layerState = { zones: true, incidents: true, cctv: true, buffer: false, crowd: false, admin: true };

  function setStatus(text) { const el = $('mapStatus'); if (el) el.textContent = text; }
  function scoreClass(label) { return G.categoryClass(label); }
  function zoneStyle(feature) {
    const label = feature.properties?._label || G.zoneLabel(feature.properties);
    const color = feature.properties?._color || G.zoneColor(label);
    const opacity = Number($('zoneOpacity')?.value || .58);
    return { color, weight: 2, opacity: .9, fillColor: color, fillOpacity: opacity };
  }
  function circleIcon(html, className) {
    return L.divIcon({
      className: '',
      html: `<div class="${className}">${html}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -15]
    });
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
    return {
      search: ($('searchInput')?.value || '').trim().toLowerCase(),
      zone: $('zoneFilter')?.value || 'all',
      year: $('yearFilter')?.value || 'all',
      cctvType: $('cctvTypeFilter')?.value || 'all',
      cctvSource: $('cctvSourceFilter')?.value || 'all'
    };
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
  function popupLink(url, label = 'Buka sumber') {
    return url ? `<a href="${G.escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>` : '';
  }
  function incidentPopup(inc) {
    const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
    const zoneLabel = zone?.properties?._label || 'Di luar layer kerawanan';
    const near = data.cctv.map((cam) => ({ cam, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).sort((a, b) => a.d - b.d)[0];
    return `<div class="popup-title">Kejadian klitih</div>
      <div class="popup-meta"><b>Kecamatan:</b> ${G.escapeHtml(inc.kecamatan)}<br><b>Tanggal:</b> ${G.escapeHtml(inc.date || '-')}<br><b>Zona:</b> ${G.escapeHtml(zoneLabel)}<br><b>CCTV terdekat:</b> ${near ? `${G.escapeHtml(near.cam.name)} (${G.formatDistance(near.d)})` : '-'}</div>
      <div class="popup-actions">${popupLink(inc.url)}<button type="button" onclick="window.GeoSafeMap.focusIncident('${G.escapeHtml(inc.id)}')">Detail</button></div>`;
  }
  function cctvPopup(cam) {
    return `<div class="popup-title">${G.escapeHtml(cam.name)}</div>
      <div class="popup-meta"><b>Jenis:</b> ${G.escapeHtml(cam.type)}<br><b>Koridor:</b> ${G.escapeHtml(cam.group)}<br><b>Sumber:</b> ${G.escapeHtml(cam.source)}<br><b>Koordinat:</b> ${cam.lat.toFixed(5)}, ${cam.lng.toFixed(5)}<br><b>Catatan:</b> ${G.escapeHtml(cam.accuracy || '-')}</div>
      <div class="popup-actions">${popupLink(cam.url, 'Buka CCTV')}<button type="button" onclick="window.GeoSafeMap.focusCctv('${G.escapeHtml(cam.id)}')">Detail</button></div>`;
  }
  function zonePopup(feature) {
    const stat = data.zoneStats.find((z) => String(z.id) === String(feature.properties._zoneId));
    const label = feature.properties._label;
    return `<div class="popup-title">Zona ${G.escapeHtml(label)}</div>
      <div class="popup-meta"><b>Gridcode:</b> ${G.escapeHtml(feature.properties.gridcode || '-')}<br><b>Skor dashboard:</b> ${feature.properties._score}<br><b>Titik kejadian:</b> ${stat?.incidentCount ?? 0}<br><b>CCTV di dalam zona:</b> ${stat?.cctvCount ?? 0}<br><b>Blind spot 500 m:</b> ${stat?.blindspot ?? 0}</div>`;
  }

  function renderZones() {
    zoneLayer.clearLayers();
    if (!layerState.zones) return;
    L.geoJSON(data.zones, {
      style: zoneStyle,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(zonePopup(feature));
        layer.on('mouseover', () => layer.setStyle({ weight: 4, fillOpacity: Math.min(.82, Number($('zoneOpacity')?.value || .58) + .12) }));
        layer.on('mouseout', () => layer.setStyle(zoneStyle(feature)));
      }
    }).addTo(zoneLayer);
  }
  function renderAdmin() {
    adminLayer.clearLayers();
    if (!layerState.admin || !data.admin) return;
    L.geoJSON(data.admin, { style: { color: '#f7cca9', weight: 1.4, opacity: .42, fillOpacity: 0 } }).addTo(adminLayer);
  }
  function renderIncidents() {
    incidentLayer.clearLayers();
    if (!layerState.incidents) return;
    const rows = data.incidents.filter(incidentMatches);
    rows.forEach((inc) => {
      const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
      const label = zone?.properties?._label || '';
      const color = G.zoneColor(label);
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: selectedIncidentId === String(inc.id) ? 9 : 6,
        color: '#fff8ef', weight: 1.5,
        fillColor: color || '#b33d38', fillOpacity: .92
      }).bindPopup(incidentPopup(inc));
      marker.on('click', () => { selectedIncidentId = String(inc.id); renderIncidentList(); updateDetailIncident(inc); });
      marker.addTo(incidentLayer);
    });
  }
  function renderBuffer() {
    bufferLayer.clearLayers();
    if (!layerState.buffer) return;
    data.cctv.filter(cctvMatches).forEach((cam) => {
      L.circle([cam.lat, cam.lng], { radius: 500, color: '#f7cca9', weight: 1, opacity: .26, fillColor: '#f7cca9', fillOpacity: .055 }).addTo(bufferLayer);
    });
  }
  function renderCctv() {
    cctvLayer.clearLayers();
    if (!layerState.cctv) return;
    data.cctv.filter(cctvMatches).forEach((cam) => {
      const marker = L.marker([cam.lat, cam.lng], { icon: circleIcon(cam.type === 'PTZ' ? '📹' : '📷', 'mk-cctv') }).bindPopup(cctvPopup(cam));
      marker.on('click', () => { selectedCctvId = String(cam.id); renderCctvList(); updateDetailCctv(cam); });
      marker.addTo(cctvLayer);
    });
  }
  function renderCrowd() {
    crowdLayer.clearLayers();
    if (!layerState.crowd) return;
    data.crowd.forEach((item) => {
      L.marker([item.lat, item.lng], { icon: circleIcon('●', 'mk-crowd') })
        .bindPopup(`<div class="popup-title">${G.escapeHtml(item.name)}</div><div class="popup-meta"><b>Kategori:</b> ${G.escapeHtml(item.category)}<br><b>Wilayah:</b> ${G.escapeHtml(item.city)}</div>`)
        .addTo(crowdLayer);
    });
  }
  function renderAll() {
    renderZones(); renderAdmin(); renderIncidents(); renderBuffer(); renderCctv(); renderCrowd(); renderStats(); renderZoneList(); renderIncidentList(); renderCctvList();
    setStatus(`Layer aktif · ${data.zones.features.length} zona kerawanan · ${data.incidents.filter(incidentMatches).length} kejadian · ${data.cctv.filter(cctvMatches).length} CCTV`);
  }

  function renderStats() {
    const inc = data.incidents.filter(incidentMatches);
    const cams = data.cctv.filter(cctvMatches);
    const veryRisk = data.zoneStats.find((z) => G.normalizeKey(z.label).includes('sangat'));
    $('statZones').textContent = data.zones.features.length;
    $('statIncidents').textContent = inc.length;
    $('statCctv').textContent = cams.length;
    $('statBlind').textContent = veryRisk?.blindspot ?? 0;
  }
  function renderZoneList() {
    const box = $('zoneSummary');
    if (!box) return;
    box.innerHTML = data.zoneStats.map((z) => `<article class="item-card" data-zone="${G.escapeHtml(z.label)}">
      <h4>Zona ${G.escapeHtml(z.label)}</h4>
      <div class="item-meta"><span class="tag ${scoreClass(z.label)}">Skor ${z.score}</span><span class="tag">${z.incidentCount} kejadian</span><span class="tag">${z.cctvCount} CCTV</span></div>
      <div class="meter" style="margin-top:10px"><i style="width:${Math.min(100, z.score)}%"></i></div>
      <small>Blind spot 500 m: ${z.blindspot}. Klik layer di peta untuk detail bentuk zona.</small>
    </article>`).join('');
    box.querySelectorAll('[data-zone]').forEach((el) => el.addEventListener('click', () => {
      $('zoneFilter').value = el.dataset.zone; renderAll();
    }));
  }
  function renderIncidentList() {
    const list = $('incidentList');
    if (!list) return;
    const rows = data.incidents.filter(incidentMatches).slice(0, 40);
    list.innerHTML = rows.map((inc) => {
      const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
      const label = zone?.properties?._label || 'Luar zona';
      return `<article class="item-card ${selectedIncidentId === String(inc.id) ? 'active' : ''}" data-id="${G.escapeHtml(inc.id)}">
        <h4>${G.escapeHtml(inc.kecamatan)}</h4>
        <p>${G.escapeHtml(inc.title)}</p>
        <div class="item-meta"><span class="tag ${scoreClass(label)}">${G.escapeHtml(label)}</span><span class="tag">${G.escapeHtml(inc.year)}</span></div>
      </article>`;
    }).join('') || '<div class="item-card"><p>Tidak ada kejadian sesuai filter.</p></div>';
    list.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => focusIncident(el.dataset.id)));
  }
  function renderCctvList() {
    const list = $('cctvList');
    if (!list) return;
    const rows = data.cctv.filter(cctvMatches).slice(0, 40);
    list.innerHTML = rows.map((cam) => `<article class="item-card ${selectedCctvId === String(cam.id) ? 'active' : ''}" data-id="${G.escapeHtml(cam.id)}">
      <h4>${G.escapeHtml(cam.name)}</h4><p>${G.escapeHtml(cam.group)}</p>
      <div class="item-meta"><span class="tag">${G.escapeHtml(cam.type)}</span><span class="tag">${G.escapeHtml(cam.source)}</span></div>
    </article>`).join('') || '<div class="item-card"><p>Tidak ada CCTV sesuai filter.</p></div>';
    list.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => focusCctv(el.dataset.id)));
  }
  function updateDetailIncident(inc) {
    const box = $('detailBox');
    if (!box) return;
    const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
    const label = zone?.properties?._label || 'Di luar layer kerawanan';
    const nearest = data.cctv.map((cam) => ({ cam, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).sort((a, b) => a.d - b.d)[0];
    box.innerHTML = `<div class="icon">⚠️</div><h3>Detail Kejadian</h3><p><b>${G.escapeHtml(inc.kecamatan)}</b> · ${G.escapeHtml(inc.date || '-')}</p>
      <div class="item-meta"><span class="tag ${scoreClass(label)}">${G.escapeHtml(label)}</span><span class="tag">${G.escapeHtml(inc.source)}</span></div>
      <p style="margin-top:12px">CCTV terdekat: <b>${nearest ? G.escapeHtml(nearest.cam.name) : '-'}</b> ${nearest ? `(${G.formatDistance(nearest.d)})` : ''}. ${nearest && nearest.d > 500 ? 'Titik ini perlu dicek sebagai potensi blind spot 500 meter.' : 'Titik ini masih berada dalam cakupan pemantauan 500 meter.'}</p>
      ${inc.url ? `<br><a class="btn small primary" href="${G.escapeHtml(inc.url)}" target="_blank" rel="noopener">Buka sumber</a>` : ''}`;
  }
  function updateDetailCctv(cam) {
    const box = $('detailBox');
    if (!box) return;
    const nearIncidents = data.incidents.map((inc) => ({ inc, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).filter((x) => x.d <= 500);
    box.innerHTML = `<div class="icon">📹</div><h3>Detail CCTV</h3><p><b>${G.escapeHtml(cam.name)}</b><br>${G.escapeHtml(cam.group)}</p>
      <div class="item-meta"><span class="tag">${G.escapeHtml(cam.type)}</span><span class="tag">${G.escapeHtml(cam.source)}</span><span class="tag">${nearIncidents.length} kejadian ≤500m</span></div>
      <p style="margin-top:12px">Koordinat: ${cam.lat.toFixed(5)}, ${cam.lng.toFixed(5)}. Catatan: ${G.escapeHtml(cam.accuracy || '-')}</p>
      ${cam.embed ? `<div class="video-wrap"><iframe src="${G.escapeHtml(cam.embed)}" title="CCTV ${G.escapeHtml(cam.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}
      ${cam.url ? `<br><a class="btn small primary" href="${G.escapeHtml(cam.url)}" target="_blank" rel="noopener">Buka CCTV</a>` : ''}`;
  }
  function focusIncident(id) {
    const inc = data.incidents.find((item) => String(item.id) === String(id));
    if (!inc) return;
    selectedIncidentId = String(id);
    updateDetailIncident(inc);
    map.setView([inc.lat, inc.lng], 15, { animate: true });
    renderIncidents(); renderIncidentList();
  }
  function focusCctv(id) {
    const cam = data.cctv.find((item) => String(item.id) === String(id));
    if (!cam) return;
    selectedCctvId = String(id);
    updateDetailCctv(cam);
    map.setView([cam.lat, cam.lng], 16, { animate: true });
    renderCctv(); renderCctvList();
  }

  function populateFilters() {
    const zoneFilter = $('zoneFilter');
    const yearFilter = $('yearFilter');
    const typeFilter = $('cctvTypeFilter');
    const sourceFilter = $('cctvSourceFilter');
    if (zoneFilter) {
      const zones = [...new Set(data.zones.features.map((f) => f.properties._label))];
      zoneFilter.innerHTML = '<option value="all">Semua zona</option>' + zones.map((z) => `<option value="${G.escapeHtml(z)}">${G.escapeHtml(z)}</option>`).join('');
    }
    if (yearFilter) {
      const years = [...new Set(data.incidents.map((i) => i.year).filter(Boolean))].sort();
      yearFilter.innerHTML = '<option value="all">Semua tahun</option>' + years.map((y) => `<option value="${G.escapeHtml(y)}">${G.escapeHtml(y)}</option>`).join('');
    }
    if (typeFilter) {
      const types = [...new Set(data.cctv.map((c) => c.type))].sort();
      typeFilter.innerHTML = '<option value="all">Semua jenis</option>' + types.map((t) => `<option value="${G.escapeHtml(t)}">${G.escapeHtml(t)}</option>`).join('');
    }
    if (sourceFilter) {
      const sources = [...new Set(data.cctv.map((c) => c.source))].sort();
      sourceFilter.innerHTML = '<option value="all">Semua sumber</option>' + sources.map((s) => `<option value="${G.escapeHtml(s)}">${G.escapeHtml(s)}</option>`).join('');
    }
  }
  function bindUi() {
    ['searchInput', 'zoneFilter', 'yearFilter', 'cctvTypeFilter', 'cctvSourceFilter', 'zoneOpacity'].forEach((id) => {
      const el = $(id); if (!el) return;
      ['input', 'change'].forEach((evt) => el.addEventListener(evt, renderAll));
    });
    document.querySelectorAll('[data-layer]').forEach((el) => {
      el.addEventListener('change', () => { layerState[el.dataset.layer] = el.checked; renderAll(); });
    });
    $('btnReset')?.addEventListener('click', () => {
      ['searchInput', 'zoneFilter', 'yearFilter', 'cctvTypeFilter', 'cctvSourceFilter'].forEach((id) => { const el = $(id); if (el) el.value = 'all'; });
      if ($('searchInput')) $('searchInput').value = '';
      renderAll();
    });
    function fitZones(){ try { map.fitBounds(L.geoJSON(data.zones).getBounds(), { padding: [30, 30] }); } catch { map.setView([-7.7972, 110.3688], 13); } }
    $('btnFit')?.addEventListener('click', fitZones);
    $('btnFitMap')?.addEventListener('click', fitZones);
    $('btnToggleLeft')?.addEventListener('click', () => $('mainLayout')?.classList.toggle('left-collapsed'));
  }

  async function init() {
    markerCss();
    if (!window.L) { setStatus('Leaflet gagal dimuat. Cek koneksi internet/CDN.'); return; }
    setStatus('Memuat data CSV, GeoJSON zona kerawanan, dan CCTV...');
    map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([-7.7972, 110.3688], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const baseMaps = {
      'Carto Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO' }),
      'Carto Voyager': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', { maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO' }),
      'OSM Standard': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }),
      'Esri Imagery': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' })
    };
    baseMaps['Carto Dark'].addTo(map);
    L.control.layers(baseMaps, null, { position: 'bottomright', collapsed: true }).addTo(map);
    zoneLayer = L.layerGroup().addTo(map);
    adminLayer = L.layerGroup().addTo(map);
    incidentLayer = L.layerGroup().addTo(map);
    cctvLayer = L.layerGroup().addTo(map);
    bufferLayer = L.layerGroup().addTo(map);
    crowdLayer = L.layerGroup().addTo(map);
    try {
      data = await G.loadAll();
      window.GeoSafeLoadedData = data;
      populateFilters(); bindUi(); renderAll();
      try { map.fitBounds(L.geoJSON(data.zones).getBounds(), { padding: [36, 36] }); } catch {}
      if (data.incidents[0]) updateDetailIncident(data.incidents[0]);
      setStatus(`Data berhasil dimuat · GeoJSON zona terbaca dari ${G.PATHS.zones}`);
    } catch (err) {
      console.error(err);
      setStatus(`Gagal memuat data: ${err.message}. Jalankan via Live Server, bukan file://`);
    }
  }

  window.GeoSafeMap = { focusIncident, focusCctv };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
