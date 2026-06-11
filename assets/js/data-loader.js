
(function(){
  const Data={};
  const DATA_PATHS={
    incidents:['assets/data/Data Kejahatan Klitih.csv','assets/data/data_kejahatan_klitih.csv','assets/data/kejadian_klitih.csv','assets/data/kejadian.csv'],
    cctv:['assets/data/cctv_pemkot_yogyakarta_youtube_links.csv','assets/data/cctv.csv'],
    crowd:['assets/data/titik_keramaian.csv','assets/data/keramaian.csv'],
    zones:['assets/data/zona_kerawanan.geojson'],
    admin:['assets/data/batas_administrasi.geojson','assets/data/admin.geojson']
  };
  async function fetchFirst(paths,type='text'){
    for(const path of paths){
      try{ const res=await fetch(path,{cache:'no-store'}); if(res.ok){ return {path, data:type==='json'?await res.json():await res.text()}; } }catch(e){}
    }
    return {path:null,data:type==='json'?null:''};
  }
  function parseCSV(text){
    if(!text||!text.trim()) return [];
    text=text.replace(/^\uFEFF/,'');
    const rows=[]; let row=[], cur='', q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"'&&q&&n==='"'){cur+='"';i++;continue}
      if(c==='"'){q=!q;continue}
      if(c===','&&!q){row.push(cur.trim());cur='';continue}
      if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n') i++; row.push(cur.trim()); if(row.some(x=>x!=='')) rows.push(row); row=[]; cur=''; continue; }
      cur+=c;
    }
    row.push(cur.trim()); if(row.some(x=>x!=='')) rows.push(row);
    if(rows.length<2) return [];
    const head=rows[0].map(h=>h.trim());
    return rows.slice(1).map(r=>{ const o={}; head.forEach((h,i)=>o[h]=r[i]??''); return o; });
  }
  function keyMap(row){ const m={}; Object.keys(row||{}).forEach(k=>m[k.toLowerCase().replace(/[\s_\-().]/g,'')]=k); return m; }
  function pick(row, names){ const m=keyMap(row); for(const n of names){ const k=m[n.toLowerCase().replace(/[\s_\-().]/g,'')]; if(k && row[k]!==undefined && String(row[k]).trim()!=='') return row[k]; } return ''; }
  function toNum(v){ if(v===undefined||v===null) return null; const s=String(v).replace(',','.').replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:null; }
  function findLatLon(row){
    let lat=toNum(pick(row,['lat','latitude','lintang','y','koordinat_y']));
    let lon=toNum(pick(row,['lon','lng','long','longitude','bujur','x','koordinat_x']));
    if((lat===null||lon===null)){
      const combined=pick(row,['koordinat','coordinates','coord','lokasi koordinat']);
      const nums=String(combined).match(/-?\d+(?:[\.,]\d+)?/g)?.map(toNum)||[];
      if(nums.length>=2){
        const a=nums[0], b=nums[1];
        if(Math.abs(a)<=11 && Math.abs(b)>90){ lat=a; lon=b; }
        else if(Math.abs(b)<=11 && Math.abs(a)>90){ lon=a; lat=b; }
      }
    }
    return {lat,lon};
  }
  function sourceType(src){ const s=String(src||'').toLowerCase(); if(!s) return 'Judul/referensi'; if(/instagram|tiktok|twitter|x\.com|facebook|fb\.|youtube|youtu\.be|threads/.test(s)) return 'Media sosial'; if(/^https?:\/\//.test(s)) return 'Berita online'; return 'Judul/referensi'; }
  function domainOf(url){ try{ if(/^https?:\/\//i.test(url)) return new URL(url).hostname.replace(/^www\./,''); }catch(e){} return ''; }
  function parseDate(v){ const s=String(v||'').trim(); if(!s) return {text:'-',year:'-'}; const nums=s.match(/\d{4}/); let d=null; if(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)){ const p=s.split(/[\/\-]/).map(Number); const y=p[2]<100?2000+p[2]:p[2]; d=new Date(y,p[1]-1,p[0]); } else { const t=Date.parse(s); if(Number.isFinite(t)) d=new Date(t); } const year=d&&!Number.isNaN(d)?String(d.getFullYear()):(nums?nums[0]:'-'); return {text:s, year}; }
  function riskFromZone(z){ const s=String(z||'').toLowerCase(); if(s.includes('sangat')) return {label:'Sangat Rawan',score:90,cls:'danger'}; if(s.includes('rawan')) return {label:'Rawan',score:65,cls:'warn'}; if(s.includes('aman')) return {label:'Aman',score:30,cls:'safe'}; return {label:z||'Tidak diketahui',score:0,cls:'med'}; }
  function normalizeIncident(row,idx){
    const {lat,lon}=findLatLon(row); const date=parseDate(pick(row,['tanggal','tgl','date','waktu','tahun']));
    const source=pick(row,['url','link','sumber','berita','referensi','judul berita','source']);
    const title=pick(row,['judul','kejadian','kasus','lokasi','keterangan','nama','deskripsi']) || `Kejadian ${idx+1}`;
    const zone=pick(row,['zona','klasifikasi','klasifikas','kelas','kerawanan']) || '';
    const kec=pick(row,['kecamatan','kapanewon','wilayah','kelurahan','lokasi kecamatan']) || '';
    const location=pick(row,['lokasi','alamat','tempat','jalan','ruas jalan']) || title;
    const img=pick(row,['gambar','image','foto','thumbnail','thumb','og_image']);
    const corridor=extractCorridor([location,title,source,kec].join(' '));
    return {id:`inc-${idx}`,raw:row,lat,lon,title,location,kecamatan:kec,date:date.text,year:date.year,source,domain:domainOf(source),sourceType:sourceType(source),image:img,zone,corridor};
  }
  function normalizeCctv(row,idx){ const {lat,lon}=findLatLon(row); const name=pick(row,['nama','nama cctv','cctv','lokasi','name','title']) || `CCTV ${idx+1}`; const type=pick(row,['jenis','tipe','type','kategori'])||'CCTV'; const source=pick(row,['sumber','source','url','link'])||''; return {id:`cam-${idx}`,raw:row,lat,lon,name,type,source,domain:domainOf(source),location:pick(row,['lokasi','alamat','jalan'])||name}; }
  function normalizeCrowd(row,idx){ const {lat,lon}=findLatLon(row); const name=pick(row,['nama','lokasi','tempat','name','title']) || `Keramaian ${idx+1}`; return {id:`crowd-${idx}`,raw:row,lat,lon,name,location:pick(row,['lokasi','alamat','jalan'])||name}; }
  function extractCorridor(text){
    const s=String(text||'').replace(/\s+/g,' ');
    const patterns=[/(?:Jl\.?|Jalan)\s+([A-Za-zÀ-ÿ0-9 .'-]{3,42})/i,/(Ring\s*Road\s*(?:Utara|Selatan|Barat|Timur)?)/i,/(Malioboro|Tugu|Gejayan|Seturan|Babarsari|Kaliurang|Magelang|Solo|Parangtritis|Imogiri|Godean|Wonosari|Palagan|Monjali)/i];
    for(const p of patterns){ const m=s.match(p); if(m){ let val=(m[1]||m[0]).trim(); val=val.replace(/[,;:|].*$/,'').replace(/\b(kecamatan|kelurahan|kota|kabupaten|yogyakarta|sleman|bantul).*$/i,'').trim(); if(!/^jalan/i.test(val)&&!/^ring/i.test(val)&&!['Malioboro','Tugu'].includes(val)) val='Jalan '+val; return val; }}
    return '';
  }
  function haversine(a,b){ if(!a||!b||a.lat==null||a.lon==null||b.lat==null||b.lon==null) return Infinity; const R=6371000, toRad=x=>x*Math.PI/180; const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon); const lat1=toRad(a.lat), lat2=toRad(b.lat); const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
  function nearest(point, list){ let best=null, dist=Infinity; for(const item of list||[]){ const d=haversine(point,item); if(d<dist){dist=d;best=item;} } return {item:best,distance:dist}; }
  function pointInRing(point, ring){ let x=point.lon,y=point.lat,inside=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1]; const intersect=((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi); if(intersect) inside=!inside; } return inside; }
  function pointInFeature(point, feature){ try{ const g=feature.geometry; if(!g) return false; if(g.type==='Polygon') return g.coordinates.some(r=>pointInRing(point,r)); if(g.type==='MultiPolygon') return g.coordinates.some(poly=>poly.some(r=>pointInRing(point,r))); }catch(e){} return false; }
  function centroidFeature(feature){ let pts=[]; const g=feature.geometry; if(!g) return null; const addRing=r=>r.forEach(p=>pts.push(p)); if(g.type==='Polygon') g.coordinates.forEach(addRing); if(g.type==='MultiPolygon') g.coordinates.forEach(poly=>poly.forEach(addRing)); if(!pts.length) return null; const avg=pts.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]],[0,0]); return {lat:avg[1]/pts.length,lon:avg[0]/pts.length}; }
  function getZoneName(feature){ const p=feature?.properties||{}; return p.Klasifikas||p.klasifikas||p.Klasifikasi||p.klasifikasi||p.zona||p.Zona||p.kelas||p.Kelas||'Tidak diketahui'; }
  function getFeatureLabel(feature){ const p=feature?.properties||{}; return p.NAMOBJ||p.nama||p.Nama||p.kecamatan||p.Kecamatan||p.WADMKC||p.DESA||p.KALURAHAN||getZoneName(feature); }
  function enrich(incidents,cctv,zones){
    incidents.forEach(i=>{ const inZone=(zones?.features||[]).find(f=>i.lat!=null&&pointInFeature(i,f)); if(inZone&&!i.zone) i.zone=getZoneName(inZone); i.zone=i.zone||'Tidak diketahui'; const near=nearest(i,cctv); i.nearestCctv=near.item; i.nearestCctvDistance=near.distance; i.covered500=near.distance<=500; });
    return incidents;
  }
  function zoneStats(incidents,cctv,zones){
    const features=zones?.features||[];
    if(!features.length){
      const by={}; incidents.forEach(i=>{ const k=i.zone||'Tidak diketahui'; if(!by[k]) by[k]={name:k,label:k,classification:k,incidents:0,cctv:0,covered:0,blind:0,score:riskFromZone(k).score}; by[k].incidents++; if(i.covered500) by[k].covered++; else by[k].blind++; });
      return Object.values(by).sort((a,b)=>b.score-a.score||b.incidents-a.incidents);
    }
    return features.map((f,idx)=>{ const name=getFeatureLabel(f), classification=getZoneName(f), risk=riskFromZone(classification); const inc=incidents.filter(i=>i.lat!=null&&pointInFeature(i,f)); const cams=cctv.filter(c=>c.lat!=null&&pointInFeature(c,f)); return {id:`zone-${idx}`,feature:f,name,label:name,classification,score:risk.score,incidents:inc.length,cctv:cams.length,covered:inc.filter(i=>i.covered500).length,blind:inc.filter(i=>!i.covered500).length}; }).sort((a,b)=>b.score-a.score||b.incidents-a.incidents);
  }
  function corridorStats(incidents,cctv){
    const by={};
    incidents.forEach(i=>{ const k=i.corridor || extractCorridor([i.location,i.title].join(' ')); if(!k) return; if(!by[k]) by[k]={name:k,incidents:[],zones:{},nearest:Infinity,nearestName:'-'}; by[k].incidents.push(i); by[k].zones[i.zone||'Tidak diketahui']=(by[k].zones[i.zone||'Tidak diketahui']||0)+1; const near=nearest(i,cctv); if(near.distance<by[k].nearest){ by[k].nearest=near.distance; by[k].nearestName=near.item?.name||'-'; } });
    return Object.values(by).map(c=>{ const dominant=Object.entries(c.zones).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-'; const count=c.incidents.length; const status=count>=3?'Prioritas tinggi':count>=2?'Perlu dipantau':'Indikasi awal'; return {...c,count,dominant,status}; }).sort((a,b)=>b.count-a.count||a.nearest-b.nearest);
  }
  async function loadAll(){
    const [incRaw,cctvRaw,crowdRaw,zonesRaw,adminRaw]=await Promise.all([
      fetchFirst(DATA_PATHS.incidents),fetchFirst(DATA_PATHS.cctv),fetchFirst(DATA_PATHS.crowd),fetchFirst(DATA_PATHS.zones,'json'),fetchFirst(DATA_PATHS.admin,'json')
    ]);
    const incidents=parseCSV(incRaw.data).map(normalizeIncident).filter(d=>d.lat!=null&&d.lon!=null);
    const cctv=parseCSV(cctvRaw.data).map(normalizeCctv).filter(d=>d.lat!=null&&d.lon!=null);
    const crowd=parseCSV(crowdRaw.data).map(normalizeCrowd).filter(d=>d.lat!=null&&d.lon!=null);
    const zones=zonesRaw.data || {type:'FeatureCollection',features:[]};
    const admin=adminRaw.data || {type:'FeatureCollection',features:[]};
    enrich(incidents,cctv,zones);
    const meta={incidentsPath:incRaw.path,cctvPath:cctvRaw.path,crowdPath:crowdRaw.path,zonesPath:zonesRaw.path,adminPath:adminRaw.path};
    return {incidents,cctv,crowd,zones,admin,meta,zoneStats:zoneStats(incidents,cctv,zones),corridors:corridorStats(incidents,cctv)};
  }
  Object.assign(Data,{loadAll,parseCSV,pick,domainOf,haversine,nearest,pointInFeature,centroidFeature,getZoneName,getFeatureLabel,riskFromZone,extractCorridor,corridorStats});
  window.GeoSafeData=Data;
})();
