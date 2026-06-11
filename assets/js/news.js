(function () {
  const G = window.GeoSafe;
  const $ = G.$;
  let incidents = [];
  function filters() { return { q: ($('newsSearch')?.value || '').toLowerCase().trim(), type: $('newsType')?.value || 'all', sort: $('newsSort')?.value || 'date' }; }
  function rowType(item) {
    const text = [item.title, item.url, item.source].join(' ').toLowerCase();
    if (text.includes('twitter') || text.includes('x.com')) return 'Media sosial';
    if (G.isUrl(item.url)) return 'Berita online';
    return 'Judul/referensi';
  }
  function domainInitial(source) { return String(source || 'G').trim().slice(0,1).toUpperCase(); }
  function renderStats(rows) {
    const box = $('newsStats'); if (!box) return;
    const online = rows.filter((x)=>x.type==='Berita online').length;
    const social = rows.filter((x)=>x.type==='Media sosial').length;
    const districts = new Set(rows.map((x)=>x.kecamatan).filter(Boolean)).size;
    box.innerHTML = [
      ['Total sumber', rows.length], ['Berita online', online], ['Media sosial', social], ['Kecamatan', districts]
    ].map(([label,value])=>`<article class="news-stat"><span>${G.escapeHtml(label)}</span><b>${G.formatNum(value)}</b></article>`).join('');
  }
  function render() {
    const f = filters();
    let rows = incidents.map((item) => ({ ...item, type: rowType(item) })).filter((item) => {
      const hay = [item.title, item.source, item.kecamatan, item.date, item.type].join(' ').toLowerCase();
      return (!f.q || hay.includes(f.q)) && (f.type === 'all' || item.type === f.type);
    });
    if (f.sort === 'source') rows.sort((a,b)=>a.source.localeCompare(b.source));
    else if (f.sort === 'kecamatan') rows.sort((a,b)=>a.kecamatan.localeCompare(b.kecamatan));
    else rows.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    renderStats(rows);
    $('newsGrid').innerHTML = rows.map((item, index) => `<article class="news-card">
      <div class="news-poster"><div><div class="source"><span>${G.escapeHtml(item.source)}</span><span>${String(index+1).padStart(2,'0')}</span></div><h3>${G.escapeHtml(item.title || 'Kejadian kriminalitas')}</h3></div></div>
      <div class="news-body"><div class="news-meta"><span class="pill warning">${G.escapeHtml(item.type)}</span><span class="pill">${G.escapeHtml(item.date || '-')}</span><span class="pill">${G.escapeHtml(item.kecamatan)}</span></div>
      <p><b>${domainInitial(item.source)}</b> · Referensi ini dipakai sebagai konteks titik kejadian. Buka sumber asli untuk memvalidasi detail lokasi, waktu, korban, dan status hukum.</p>
      <div class="news-footer"><span class="muted">Sumber titik kejadian</span>${G.isUrl(item.url) ? `<a class="btn small primary" href="${G.escapeHtml(item.url)}" target="_blank" rel="noopener">Baca</a>` : `<span class="btn small">Judul saja</span>`}</div></div>
    </article>`).join('') || '<div class="card wide"><h3>Tidak ada sumber yang cocok</h3><p>Ubah kata kunci atau filter sumber.</p></div>';
  }
  async function init() {
    try {
      incidents = await G.loadIncidents();
      ['newsSearch','newsType','newsSort'].forEach((id) => {
        const el = $(id); if (!el) return;
        ['input','change'].forEach((evt)=>el.addEventListener(evt, render));
      });
      render();
    } catch (err) {
      console.error(err);
      $('newsGrid').innerHTML = `<div class="card wide"><h3>Data berita gagal dimuat</h3><p>${G.escapeHtml(err.message)}. Jalankan melalui Live Server.</p></div>`;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
