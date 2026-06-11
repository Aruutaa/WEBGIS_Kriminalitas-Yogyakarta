(function () {
  const G = window.GeoSafe;
  const $ = G.$;
  let data;
  let charts = {};

  function filters() {
    return {
      zone: $('filterZone')?.value || 'all',
      year: $('filterYear')?.value || 'all',
      source: $('filterSource')?.value || 'all',
      top: Number($('filterTop')?.value || 9)
    };
  }
  function incidentZone(inc) {
    const feature = G.zoneForPoint(inc.lng, inc.lat, data.zones);
    return feature?.properties?._label || 'Di luar zona';
  }
  function nearestCctv(inc) {
    return data.cctv.map((cam) => ({ cam, d: G.haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng) })).sort((a, b) => a.d - b.d)[0] || null;
  }
  function relatedIncidents(inc, radius = 1000) {
    return data.incidents.map((item) => ({ item, d: G.haversineMeters(inc.lat, inc.lng, item.lat, item.lng) }))
      .filter((x) => String(x.item.id) !== String(inc.id) && x.d <= radius).sort((a,b)=>a.d-b.d);
  }
  function filteredIncidents() {
    const f = filters();
    return data.incidents.filter((inc) => {
      const label = incidentZone(inc);
      const sourceOk = f.source === 'all' || (f.source === 'url' ? G.isUrl(inc.url) : !G.isUrl(inc.url));
      return (f.zone === 'all' || G.normalizeKey(label) === G.normalizeKey(f.zone)) &&
        (f.year === 'all' || inc.year === f.year) && sourceOk;
    });
  }
  function zoneRows() {
    const rows = data.zoneStats.map((z) => {
      const inc = filteredIncidents().filter((item) => G.pointInFeature(item.lng, item.lat, z.feature));
      return { ...z, incidentCountFiltered: inc.length, filteredIncidents: inc };
    });
    const f = filters();
    return f.zone === 'all' ? rows : rows.filter((z) => G.normalizeKey(z.label) === G.normalizeKey(f.zone));
  }
  function setStatCards() {
    const inc = filteredIncidents();
    const rows = zoneRows();
    const veryRisk = rows.find((z) => G.normalizeKey(z.label).includes('sangat')) || rows[0];
    const urlCount = inc.filter((i) => G.isUrl(i.url)).length;
    const blind = rows.reduce((sum, z) => sum + z.blindspot, 0);
    const cards = [
      ['🗺️', 'Zona terbaca', rows.length, 'Dari file zona_kerawanan.geojson'],
      ['⚠️', 'Titik kejadian', inc.length, 'Sesuai filter aktif'],
      ['📹', 'Blind spot 500 m', blind, 'Kejadian tanpa CCTV dekat'],
      ['📰', 'Sumber tautan', urlCount, 'URL berita/medsos pada CSV']
    ];
    $('statCards').innerHTML = cards.map(([icon, label, value, desc]) => `<article class="card"><div class="icon">${icon}</div><h3>${G.escapeHtml(label)}</h3><div class="stat"><strong>${G.formatNum(value)}</strong><em>${G.escapeHtml(desc)}</em></div></article>`).join('');
    const settings = $('settingsList');
    if (settings) settings.innerHTML = `
      <li><b>Zona aktif:</b> ${G.escapeHtml(filters().zone === 'all' ? 'Semua zona' : filters().zone)}</li>
      <li><b>Tahun:</b> ${G.escapeHtml(filters().year === 'all' ? 'Semua tahun' : filters().year)}</li>
      <li><b>Zona prioritas:</b> ${veryRisk ? `Zona ${G.escapeHtml(veryRisk.label)} · skor ${veryRisk.score}` : '-'}</li>
      <li><b>Metode:</b> skor zona + titik kejadian + CCTV 500 m + sumber berita.</li>`;
  }
  function destroyCharts() { Object.values(charts).forEach((c) => c?.destroy?.()); charts = {}; }
  function chartDefaults() {
    if (!window.Chart) return;
    Chart.defaults.color = '#cab7ad';
    Chart.defaults.borderColor = 'rgba(247,204,169,.12)';
    Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  }
  function renderCharts() {
    if (!window.Chart) return;
    chartDefaults(); destroyCharts();
    const rows = zoneRows();
    const inc = filteredIncidents();
    const zoneLabels = rows.map((z) => z.label);
    const zoneScores = rows.map((z) => z.score);
    const zoneIncidents = rows.map((z) => z.incidentCountFiltered);
    const byYear = inc.reduce((acc, item)=>{ acc[item.year] = (acc[item.year] || 0) + 1; return acc; }, {});
    const years = Object.keys(byYear).sort();
    const bySource = inc.reduce((acc, item)=>{ const s = item.source || 'Sumber tidak tertulis'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    const sources = Object.entries(bySource).sort((a,b)=>b[1]-a[1]).slice(0,8);

    const barCtx = $('riskBarChart');
    if (barCtx) charts.risk = new Chart(barCtx, { type:'bar', data:{ labels:zoneLabels, datasets:[{ label:'Skor zona', data:zoneScores, backgroundColor:'rgba(179,61,56,.72)', borderColor:'#b33d38', borderWidth:1 }, { label:'Kejadian', data:zoneIncidents, backgroundColor:'rgba(247,204,169,.34)', borderColor:'#f7cca9', borderWidth:1 }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } } });
    const donutCtx = $('zoneDonutChart');
    if (donutCtx) charts.donut = new Chart(donutCtx, { type:'doughnut', data:{ labels:zoneLabels, datasets:[{ data:zoneIncidents, backgroundColor:rows.map((z)=>z.color || '#ae995b'), borderColor:'rgba(5,5,7,.85)', borderWidth:2 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } } });
    const trendCtx = $('trendLineChart');
    if (trendCtx) charts.trend = new Chart(trendCtx, { type:'line', data:{ labels:years, datasets:[{ label:'Jumlah kejadian', data:years.map((y)=>byYear[y]), borderColor:'#f7cca9', backgroundColor:'rgba(247,204,169,.12)', tension:.35, fill:true, pointRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ precision:0 } } } } });
    const sourceCtx = $('sourceBarChart');
    if (sourceCtx) charts.source = new Chart(sourceCtx, { type:'bar', data:{ labels:sources.map(([s])=>s), datasets:[{ label:'Frekuensi', data:sources.map(([,v])=>v), backgroundColor:'rgba(179,61,56,.72)', borderColor:'#b33d38', borderWidth:1 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', scales:{ x:{ beginAtZero:true, ticks:{ precision:0 } } }, plugins:{ legend:{ display:false } } } });
  }
  function renderSelectedAnalysis() {
    const box = $('selectedAnalysis');
    if (!box) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('incident');
    const inc = data.incidents.find((item)=>String(item.id)===String(id));
    if (!inc) {
      const top = [...filteredIncidents()].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
      box.innerHTML = `<div class="deep-card"><h4>Belum ada titik spesifik dari peta</h4><p>Buka <a href="peta.html" class="code">peta.html</a>, klik titik kejadian, lalu pilih tombol <b>Analisis</b>. Untuk gambaran awal, titik terbaru yang terbaca adalah <b>${top ? G.escapeHtml(top.kecamatan) : '-'}</b>.</p></div>`;
      return;
    }
    const zone = G.zoneForPoint(inc.lng, inc.lat, data.zones);
    const label = zone?.properties?._label || 'Di luar zona';
    const zstat = data.zoneStats.find((z)=>String(z.id)===String(zone?.properties?._zoneId));
    const nearest = nearestCctv(inc);
    const nearby = relatedIncidents(inc, 1200);
    const sameDistrict = data.incidents.filter((x)=>G.normalizeKey(x.kecamatan)===G.normalizeKey(inc.kecamatan));
    const sourceCards = [inc, ...nearby.map((x)=>x.item)].filter((x)=>x.url || x.title).slice(0,3);
    const blind = !nearest || nearest.d > 500;
    const score = zone?.properties?._score || G.zoneScore(label);
    const recommendation = blind
      ? 'Prioritas verifikasi: cek pencahayaan, rute patroli, dan kemungkinan penambahan kamera atau titik pantau mobile karena CCTV terdekat berada di luar radius 500 meter.'
      : 'Cakupan CCTV terdekat relatif dekat, sehingga verifikasi utama adalah arah pandang kamera, jam aktif, dan apakah titik kejadian benar terlihat dari posisi kamera.';
    box.innerHTML = `<div class="metric-strip">
      <span><b>${G.escapeHtml(label)}</b>Zona titik</span><span><b>${score}</b>Skor zona</span><span><b>${nearest ? G.formatDistance(nearest.d) : '-'}</b>CCTV terdekat</span><span><b>${nearby.length}</b>Kejadian ≤1,2 km</span>
    </div>
    <div class="selected-analysis-grid">
      <article class="deep-card"><h4>${G.escapeHtml(inc.kecamatan)} · ${G.escapeHtml(inc.date || '-')}</h4><p>Titik ini berada pada <b>Zona ${G.escapeHtml(label)}</b>. Di zona yang sama terdapat <b>${zstat?.incidentCount || 0}</b> kejadian historis, <b>${zstat?.cctvCount || 0}</b> CCTV di dalam zona, dan <b>${zstat?.blindspot || 0}</b> titik yang belum tercakup radius CCTV 500 meter. Dengan konteks ini, lokasi tidak hanya dibaca sebagai satu titik mentah, tetapi sebagai bagian dari pola zona, cakupan pengawasan, dan konsentrasi kejadian.</p><p><b>Kesimpulan awal:</b> ${recommendation}</p></article>
      <article class="deep-card"><h4>Metode pembacaan</h4><ul><li>Overlay titik kejadian terhadap polygon zona kerawanan.</li><li>Jarak titik ke CCTV terdekat dihitung dengan haversine.</li><li>Kejadian sekitar dihitung dalam radius 1,2 km sebagai indikasi klaster lokal.</li><li>Sumber berita ditautkan untuk validasi narasi peristiwa.</li></ul></article>
    </div>
    <div class="related-news-grid">${sourceCards.map((item)=>`<article class="related-news-card"><div class="related-news-thumb">${G.escapeHtml(item.source || 'Sumber')}</div><div><h4>${G.escapeHtml(item.title || 'Kejadian kriminalitas')}</h4><p>${G.escapeHtml(item.kecamatan)} · ${G.escapeHtml(item.date || '-')}</p>${G.isUrl(item.url) ? `<a class="btn small primary" href="${G.escapeHtml(item.url)}" target="_blank" rel="noopener">Buka sumber</a>` : '<span class="btn small">Judul/referensi</span>'}</div></article>`).join('')}</div>`;
  }
  function renderNews() {
    const inc = filteredIncidents().filter((i) => i.url || i.title).slice(0, filters().top);
    const grid = $('newsList');
    if (!grid) return;
    grid.innerHTML = inc.map((item) => {
      const near = nearestCctv(item);
      const label = incidentZone(item);
      return `<article class="news-mini">
        <span class="pill ${G.isUrl(item.url) ? 'warning' : ''}">${G.escapeHtml(item.source)}</span>
        <h4>${G.escapeHtml(item.title)}</h4>
        <p>${G.escapeHtml(item.kecamatan)} · ${G.escapeHtml(item.date || '-')} · Zona ${G.escapeHtml(label)}. CCTV terdekat ${near ? `${G.escapeHtml(near.cam.name)} (${G.formatDistance(near.d)})` : '-'}.</p>
        ${G.isUrl(item.url) ? `<br><a class="btn small primary" href="${G.escapeHtml(item.url)}" target="_blank" rel="noopener">Buka sumber</a>` : ''}
      </article>`;
    }).join('') || '<article class="news-mini"><h4>Belum ada data sesuai filter</h4><p>Ubah filter zona, tahun, atau jenis sumber.</p></article>';
  }
  function renderInsights() {
    const rows = zoneRows();
    const inc = filteredIncidents();
    const topScore = [...rows].sort((a,b)=>b.score-a.score)[0];
    const topIncident = [...rows].sort((a,b)=>b.incidentCountFiltered-a.incidentCountFiltered)[0];
    const blind = [...rows].sort((a,b)=>b.blindspot-a.blindspot)[0];
    const cards = [
      ['Zona paling rawan', topScore ? `Zona <b>${G.escapeHtml(topScore.label)}</b> memiliki skor ${topScore.score}. Klasifikasi ini langsung dibaca dari field <span class="code">Klasifikas</span> pada GeoJSON.` : 'Belum ada zona terbaca.'],
      ['Konsentrasi kejadian', topIncident ? `Jumlah titik terbanyak pada filter ini berada di <b>Zona ${G.escapeHtml(topIncident.label)}</b> sebanyak ${topIncident.incidentCountFiltered} titik. Area ini layak menjadi prioritas observasi jam malam dan validasi sumber.` : 'Belum ada titik kejadian.'],
      ['CCTV dan blind spot', blind ? `Zona <b>${G.escapeHtml(blind.label)}</b> memiliki ${blind.blindspot} titik kejadian yang belum tercakup CCTV dalam radius 500 meter. Ini adalah sinyal awal, bukan bukti tunggal bahwa area pasti tidak terpantau.` : 'Belum ada blind spot terbaca.']
    ];
    $('insightCards').innerHTML = cards.map(([title, body]) => `<article class="rec-card"><h4>${title}</h4><p>${body}</p></article>`).join('');
  }
  function renderTable() {
    const tbody = $('analysisTable')?.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = zoneRows().map((z, index) => `<tr>
      <td>${index + 1}</td><td><b>Zona ${G.escapeHtml(z.label)}</b><br><span class="muted">Gridcode ${G.escapeHtml(z.feature.properties.gridcode || '-')}</span></td>
      <td>${z.incidentCountFiltered}</td><td>${z.score}</td><td><span class="tag ${G.categoryClass(z.label)}">${G.escapeHtml(z.label)}</span></td>
      <td>${z.cctvCount}</td><td>${z.covered500}</td><td>${z.blindspot}</td>
      <td>${z.score >= 80 ? 'Prioritaskan patroli, verifikasi CCTV, dan mitigasi pada jam rawan.' : z.score >= 50 ? 'Perlu pemantauan berkala dan pengecekan blind spot.' : 'Pertahankan monitoring rutin sebagai area pembanding aman.'}</td>
    </tr>`).join('');
  }
  function renderNarrative() {
    const inc = filteredIncidents();
    const rows = zoneRows();
    const top = [...rows].sort((a,b)=>b.score-a.score)[0];
    const years = [...new Set(inc.map((i)=>i.year))].sort().join(', ') || 'tidak diketahui';
    $('narrative').innerHTML = `<p>Dashboard membaca <b>${inc.length} titik kejadian</b> dari CSV klitih dan <b>${rows.length} zona kerawanan</b> dari GeoJSON. Klasifikasi zona tidak lagi diasumsikan dari nama kecamatan, tetapi dibaca langsung dari atribut <span class="code">Klasifikas</span>, sehingga layer <b>Aman</b>, <b>Rawan</b>, dan <b>Sangat Rawan</b> tampil konsisten pada peta dan analisis.</p><br>
    <p>Zona dengan skor tertinggi pada filter aktif adalah <b>${top ? G.escapeHtml(top.label) : '-'}</b>. Rentang tahun data yang terbaca: <b>${G.escapeHtml(years)}</b>. Hasil ini sebaiknya digunakan sebagai indikator eksploratif untuk menentukan area validasi lapangan, bukan sebagai kesimpulan tunggal tanpa pengecekan data resmi.</p>`;
  }
  function exportCsv() {
    const rows = zoneRows();
    const header = ['peringkat','zona','gridcode','skor','jumlah_kejadian_filter','cctv_dalam_zona','kejadian_tercakup_500m','blindspot_500m'];
    const csv = [header.join(','), ...rows.map((z,i)=>[i+1,z.label,z.feature.properties.gridcode||'',z.score,z.incidentCountFiltered,z.cctvCount,z.covered500,z.blindspot].map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'export_analisis_zona_kerawanan.csv'; a.click(); URL.revokeObjectURL(a.href);
  }
  function renderAll() { setStatCards(); renderCharts(); renderSelectedAnalysis(); renderNews(); renderInsights(); renderTable(); renderNarrative(); }
  function populateFilters() {
    const zf = $('filterZone');
    const yf = $('filterYear');
    if (zf) {
      const zones = [...new Set(data.zones.features.map((f)=>f.properties._label))];
      zf.innerHTML = '<option value="all">Semua zona</option>' + zones.map((z)=>`<option value="${G.escapeHtml(z)}">${G.escapeHtml(z)}</option>`).join('');
    }
    if (yf) {
      const years = [...new Set(data.incidents.map((i)=>i.year).filter(Boolean))].sort();
      yf.innerHTML = '<option value="all">Semua tahun</option>' + years.map((y)=>`<option value="${G.escapeHtml(y)}">${G.escapeHtml(y)}</option>`).join('');
    }
  }
  async function init() {
    try {
      data = await G.loadAll();
      populateFilters();
      ['filterZone','filterYear','filterSource','filterTop'].forEach((id)=>$(id)?.addEventListener('change', renderAll));
      $('resetFilter')?.addEventListener('click', () => { ['filterZone','filterYear','filterSource'].forEach((id)=>{ if($(id)) $(id).value='all'; }); if($('filterTop')) $('filterTop').value='9'; renderAll(); });
      $('exportCsv')?.addEventListener('click', exportCsv);
      renderAll();
    } catch (err) {
      console.error(err);
      const n = $('narrative'); if (n) n.textContent = `Gagal memuat data: ${err.message}. Jalankan melalui Live Server agar fetch CSV/GeoJSON tidak diblokir browser.`;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
