(function () {
  const PATHS = {
    incidents: 'assets/data/Data%20Kejahatan%20Klitih.csv',
    cctvOfficial: 'assets/data/cctv_pemkot_yogyakarta_youtube_links.csv',
    cctvOsm: 'assets/data/cctv_yogyakarta.csv',
    crowd: 'assets/data/keramaian.csv',
    admin: 'assets/data/kota_yogyakarta_admin.geojson',
    zones: 'assets/data/zona_kerawanan.geojson',
    weights: 'assets/data/hasil_pembobotan_zona.json'
  };

  const CCTV_COORDS = {
    'SIMPANG JOKTENG WETAN (PTZ)': { lat: -7.813764, lng: 110.370091, accuracy: 'estimasi lokasi simpang' },
    'SIMPANG JOKTENG WETAN V. TIMUR': { lat: -7.813693, lng: 110.370222, accuracy: 'estimasi lokasi simpang' },
    'SIMPANG TUGU': { lat: -7.78293, lng: 110.36707, accuracy: 'estimasi landmark' },
    'NOL KM - UTARA': { lat: -7.801372, lng: 110.364775, accuracy: 'estimasi kawasan nol kilometer' },
    'NOL KM (PTZ)': { lat: -7.80135, lng: 110.36472, accuracy: 'estimasi kawasan nol kilometer' },
    'NOL KM - GEDUNG AGUNG': { lat: -7.80113, lng: 110.36412, accuracy: 'estimasi sisi Gedung Agung' },
    'SIMPANG BALAIKOTA V. UTARA-BARAT': { lat: -7.79815, lng: 110.39379, accuracy: 'estimasi kompleks Balai Kota' },
    'SIMPANG WIROBRAJAN (PTZ)': { lat: -7.80127, lng: 110.34986, accuracy: 'estimasi lokasi simpang' },
    'SIMPANG GRAMEDIA V. UTARA-TIMUR': { lat: -7.78374, lng: 110.37789, accuracy: 'estimasi lokasi simpang' },
    'SIMPANG GRAMEDIA (PTZ)': { lat: -7.78369, lng: 110.37782, accuracy: 'estimasi lokasi simpang' },
    'SIMPANG GRAMEDIA V. TIMUR': { lat: -7.78379, lng: 110.37796, accuracy: 'estimasi lokasi simpang' },
    'SIMPANG MELIA PUROSANI (PTZ)': { lat: -7.79528, lng: 110.36715, accuracy: 'estimasi sekitar Melia Purosani' },
    'SIMPANG MENTERI SUPENO V. TIMUR': { lat: -7.81318, lng: 110.37536, accuracy: 'estimasi koridor Menteri Supeno' },
    'DEPAN DPRD V. UTARA': { lat: -7.79755, lng: 110.39495, accuracy: 'estimasi depan DPRD/Balai Kota' },
    'KOTABARU - JL. YOS SUDARSO': { lat: -7.7865, lng: 110.3744, accuracy: 'estimasi ruas Kotabaru' },
    'KOTABARU - JL. SAJIONO': { lat: -7.7861, lng: 110.3731, accuracy: 'estimasi ruas Kotabaru' },
    'KOTABARU - JL. WARDHANI': { lat: -7.78655, lng: 110.3729, accuracy: 'estimasi ruas Kotabaru' },
    'MARGO UTOMO - OPTIC TUGU': { lat: -7.78424, lng: 110.36692, accuracy: 'estimasi koridor Margo Utomo' },
    'JL. MAS SUHARTO V. SELATAN': { lat: -7.78835, lng: 110.36946, accuracy: 'estimasi ruas Mas Suharto' },
    'SIMPANG GALERIA (PTZ)': { lat: -7.78272, lng: 110.37866, accuracy: 'estimasi Simpang Galeria' },
    'SIMPANG BOROBUDUR PLAZA V. UTARA': { lat: -7.77268, lng: 110.36367, accuracy: 'estimasi koridor utara kota' }
  };

  const ZONE_SCORE = { 'aman': 25, 'rawan': 65, 'sangat rawan': 90 };
  const ZONE_COLOR = { 'aman': '#6dd5a5', 'rawan': '#f7cca9', 'sangat rawan': '#b33d38' };

  function $(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function normalizeKey(value) {
    return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  }
  function parseNumber(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') return value;
    let s = String(value).trim().replace(/^\uFEFF/, '');
    if (!s) return NaN;
    if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
    s = s.replace(/[^0-9.+-]/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  function normalizeLatitude(value) {
    let n = parseNumber(value);
    if (Number.isFinite(n) && n > 0 && n >= 6 && n <= 9) n = -n;
    return n;
  }
  function isUrl(value) { return /^https?:\/\//i.test(String(value || '').trim()); }
  function sourceLabel(value) {
    const v = String(value || '').trim();
    if (!v) return 'Sumber tidak tertulis';
    try { return isUrl(v) ? new URL(v).hostname.replace(/^www\./, '') : v.split('–')[0].slice(0, 52); } catch { return v.slice(0, 52); }
  }
  function categoryClass(category) {
    const key = normalizeKey(category);
    if (key.includes('sangat') || key.includes('tinggi')) return 'high';
    if (key.includes('rawan') || key.includes('sedang')) return 'med';
    return 'low';
  }
  function zoneLabel(props) {
    return props?.Klasifikas || props?.Klasifikasi || props?.klasifikasi || props?.kategori || props?.Kategori || props?.gridcode || 'Tidak diketahui';
  }
  function zoneScore(label) { return ZONE_SCORE[normalizeKey(label)] ?? 55; }
  function zoneColor(label) { return ZONE_COLOR[normalizeKey(label)] ?? '#ae995b'; }
  function riskLevelFromScore(score) { return score >= 80 ? 'Sangat Rawan' : score >= 50 ? 'Rawan' : 'Aman'; }
  function formatNum(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function formatDistance(m) { return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`; }

  async function fetchText(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Gagal membaca ${path}`);
    return res.text();
  }
  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Gagal membaca ${path}`);
    return res.json();
  }
  function splitDelimitedLine(line, delimiter) {
    const out = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }
  function parseDelimited(text) {
    const clean = String(text || '').replace(/^\uFEFF/, '').replace(/\r/g, '');
    const lines = clean.split('\n').filter((line) => line.trim().length);
    if (!lines.length) return [];
    const first = lines[0];
    const delimiter = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
    const headers = splitDelimitedLine(first, delimiter).map((h) => h.trim().replace(/^\uFEFF/, ''));
    return lines.slice(1).map((line, index) => {
      const cells = splitDelimitedLine(line, delimiter);
      const row = { _row: index + 2 };
      headers.forEach((h, i) => { if (h) row[h] = (cells[i] ?? '').trim(); });
      return row;
    });
  }
  async function loadCsv(path) { return parseDelimited(await fetchText(path)); }

  async function loadIncidents() {
    const rows = await loadCsv(PATHS.incidents);
    return rows.map((row, index) => {
      const lng = parseNumber(row.Bujur ?? row.bujur ?? row.longitude ?? row.lng ?? row.lon);
      const lat = normalizeLatitude(row.Lintang ?? row.lintang ?? row.latitude ?? row.lat);
      const date = String(row.Tanggal_up || row.tanggal || row.date || '').trim();
      const year = /^\d{4}/.test(date) ? date.slice(0, 4) : 'Tidak diketahui';
      return {
        id: row.No || `K-${index + 1}`,
        url: row.URL || row.url || '',
        source: sourceLabel(row.URL || row.url),
        title: isUrl(row.URL) ? sourceLabel(row.URL) : (row.URL || 'Kejadian klitih'),
        date,
        year,
        lng,
        lat,
        kecamatan: String(row.Kecamatan || row.kecamatan || 'Tidak diketahui').trim() || 'Tidak diketahui',
        valid: Number.isFinite(lat) && Number.isFinite(lng) && lat > -10 && lat < -5 && lng > 108 && lng < 113,
        raw: row
      };
    }).filter((item) => item.valid);
  }

  async function loadCctv() {
    const officialRows = await loadCsv(PATHS.cctvOfficial).catch(() => []);
    const official = officialRows.map((row, index) => {
      const name = row.nama_cctv || row.nama || `CCTV Pemkot ${index + 1}`;
      const coord = CCTV_COORDS[name] || (() => {
        const angle = index * 1.91;
        return { lat: -7.7972 + Math.sin(angle) * 0.018, lng: 110.3688 + Math.cos(angle) * 0.018, accuracy: 'fallback otomatis - perlu validasi koordinat' };
      })();
      return {
        id: `official-${row.id || index + 1}`,
        name,
        lat: coord.lat,
        lng: coord.lng,
        type: /ptz/i.test(row.jenis_view || name) ? 'PTZ' : 'Fixed',
        group: row.playlist_group || 'CCTV Pemkot',
        url: row.youtube_watch_url || row.channel_streams_url || '',
        embed: row.youtube_nocookie_embed_url || row.youtube_embed_url || '',
        source: 'Pemkot YouTube',
        accuracy: coord.accuracy
      };
    }).filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

    const osmRows = await loadCsv(PATHS.cctvOsm).catch(() => []);
    const osm = osmRows.map((row, index) => ({
      id: `osm-${row.osm_id || index + 1}`,
      name: row.nama_jalan && row.nama_jalan !== 'Nama jalan tidak diketahui' ? row.nama_jalan : (row.alamat_lengkap || `CCTV OSM ${index + 1}`),
      lat: parseNumber(row.latitude),
      lng: parseNumber(row.longitude),
      type: 'CCTV',
      group: row.kecamatan || row.kota_kab || 'OSM',
      url: '',
      embed: '',
      source: 'OSM/CSV',
      accuracy: 'koordinat dari CSV'
    })).filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
    return [...official, ...osm];
  }

  async function loadCrowd() {
    const rows = await loadCsv(PATHS.crowd).catch(() => []);
    return rows.map((row, index) => ({
      id: row.id || index + 1,
      name: row.nama_lokasi || 'Titik keramaian',
      category: row.kategori || 'Keramaian',
      city: row.kabupaten_kota || '',
      lat: parseNumber(row.latitude),
      lng: parseNumber(row.longitude)
    })).filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
  }

  async function loadZones() {
    const geojson = await fetchJson(PATHS.zones);
    const features = (geojson.features || []).map((feature, index) => {
      const props = feature.properties || {};
      const klas = String(zoneLabel(props));
      return {
        ...feature,
        id: props.OBJECTID || props.id || index + 1,
        properties: {
          ...props,
          _zoneId: props.OBJECTID || props.id || index + 1,
          _label: klas,
          _score: zoneScore(klas),
          _color: zoneColor(klas),
          _riskClass: riskLevelFromScore(zoneScore(klas))
        }
      };
    });
    return { ...geojson, features };
  }
  async function loadAdmin() { return fetchJson(PATHS.admin).catch(() => null); }
  async function loadWeights() { return fetchJson(PATHS.weights).catch(() => ({ zones: [] })); }

  function pointInRing(point, ring) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function pointInPolygon(point, polygon) {
    if (!polygon || !polygon.length) return false;
    if (!pointInRing(point, polygon[0])) return false;
    for (let i = 1; i < polygon.length; i++) if (pointInRing(point, polygon[i])) return false;
    return true;
  }
  function pointInFeature(lng, lat, feature) {
    const geom = feature?.geometry;
    if (!geom) return false;
    const point = [lng, lat];
    if (geom.type === 'Polygon') return pointInPolygon(point, geom.coordinates);
    if (geom.type === 'MultiPolygon') return geom.coordinates.some((poly) => pointInPolygon(point, poly));
    return false;
  }
  function zoneForPoint(lng, lat, zoneGeojson) {
    return (zoneGeojson?.features || []).find((feature) => pointInFeature(lng, lat, feature)) || null;
  }
  function summarizeZones(zoneGeojson, incidents, cctv) {
    return (zoneGeojson?.features || []).map((feature) => {
      const label = feature.properties._label;
      const score = feature.properties._score;
      const inside = incidents.filter((inc) => pointInFeature(inc.lng, inc.lat, feature));
      const cctvInside = cctv.filter((cam) => pointInFeature(cam.lng, cam.lat, feature));
      const nearestDistances = inside.map((inc) => {
        const distances = cctv.map((cam) => haversineMeters(inc.lat, inc.lng, cam.lat, cam.lng));
        return distances.length ? Math.min(...distances) : Infinity;
      });
      const covered = nearestDistances.filter((d) => d <= 500).length;
      return {
        id: feature.properties._zoneId,
        label,
        score,
        color: feature.properties._color,
        category: feature.properties._riskClass,
        incidents: inside,
        incidentCount: inside.length,
        cctvCount: cctvInside.length,
        covered500: covered,
        blindspot: Math.max(0, inside.length - covered),
        feature
      };
    }).sort((a, b) => b.score - a.score || b.incidentCount - a.incidentCount);
  }

  async function loadAll() {
    const [incidents, cctv, crowd, zones, admin, weights] = await Promise.all([
      loadIncidents(), loadCctv(), loadCrowd(), loadZones(), loadAdmin(), loadWeights()
    ]);
    return { incidents, cctv, crowd, zones, admin, weights, zoneStats: summarizeZones(zones, incidents, cctv) };
  }

  window.GeoSafe = {
    PATHS, $, escapeHtml, normalizeKey, parseNumber, normalizeLatitude, isUrl, sourceLabel,
    categoryClass, zoneLabel, zoneScore, zoneColor, riskLevelFromScore, formatNum, haversineMeters, formatDistance,
    fetchText, fetchJson, loadCsv, loadIncidents, loadCctv, loadCrowd, loadZones, loadAdmin, loadWeights, loadAll,
    pointInFeature, zoneForPoint, summarizeZones
  };
})();
