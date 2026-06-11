(function(){
  const DATA_PATHS={
    incidents:[
      'assets/data/Data Kejahatan Klitih.csv','assets/data/Data Kejahatan Klitih.CSV','assets/data/data_kejahatan_klitih.csv','assets/data/kejadian_klitih.csv','assets/data/kejadian.csv'
    ],
    cctv:[
      'assets/data/cctv_yogyakarta.csv','assets/data/cctv_pemkot_yogyakarta_youtube_links.csv','assets/data/cctv_pemkot_yogyakarta_youtube.csv','assets/data/cctv.csv','assets/data/data_cctv.csv'
    ],
    crowd:['assets/data/keramaian.csv','assets/data/titik_keramaian.csv','assets/data/titik_keramaian_yogyakarta.csv'],
    zones:['assets/data/zona_kerawanan.geojson','assets/data/zona_kerawanan.json','assets/data/zona.geojson'],
    admin:['assets/data/kota_yogyakarta_admin.geojson','assets/data/batas_administrasi.geojson','assets/data/admin.geojson','assets/data/kota_yogyakarta_admin.json'],
    weights:['assets/data/hasil_pembobotan_zona.json','assets/data/hasil_pembobotan_zona.csv'],
    support:['assets/data/Data Pendukung - Sosial dan Ekonomi.csv','assets/data/Data Pendukung - Sosial dan Ekonomi.json','assets/data/data_pendukung_sosial_ekonomi.csv']
  };
  async function fetchText(path){ try{ const r=await fetch(path,{cache:'no-store'}); if(r.ok) return await r.text(); }catch(e){} return null; }
  async function fetchJson(path){ try{ const r=await fetch(path,{cache:'no-store'}); if(r.ok) return await r.json(); }catch(e){} return null; }
  async function loadFirstJson(paths){ for(const p of paths){ const j=await fetchJson(p); if(j) return {path:p,data:j}; } return {path:null,data:{type:'FeatureCollection',features:[]}}; }
  async function loadAllCsv(paths){ const out=[],loaded=[]; for(const p of paths){ const t=await fetchText(p); if(t&&t.trim()){ out.push(...parseCSV(t).map(r=>({...r,__file:p}))); loaded.push(p); } } return {paths:loaded,data:out}; }
  async function loadSupport(paths){ const rows=[],loaded=[]; for(const p of paths){ if(/\.json$/i.test(p)){ const j=await fetchJson(p); if(j){ loaded.push(p); if(Array.isArray(j)) rows.push(...j); else if(Array.isArray(j.data)) rows.push(...j.data); else if(j.features) rows.push(...j.features.map(f=>({...f.properties,__geometry:f.geometry,__file:p}))); } } else { const t=await fetchText(p); if(t){ rows.push(...parseCSV(t).map(r=>({...r,__file:p}))); loaded.push(p); } } } return {paths:loaded,data:rows}; }
  async function loadWeights(paths){ let rows=[],json=null,loaded=[]; for(const p of paths){ if(/\.json$/i.test(p)){ const j=await fetchJson(p); if(j){json=j; loaded.push(p);} } else { const t=await fetchText(p); if(t){rows.push(...parseCSV(t).map(r=>({...r,__file:p}))); loaded.push(p);} } } return {paths:loaded,rows,json}; }
  function detectDelimiter(line){ let best=',',n=-1; for(const d of [',',';','\t','|']){ let c=0,q=false; for(let i=0;i<line.length;i++){ const ch=line[i],nx=line[i+1]; if(ch==='"'&&q&&nx==='"'){i++;continue;} if(ch==='"'){q=!q;continue;} if(ch===d&&!q)c++; } if(c>n){n=c;best=d;} } return best; }
  function parseCSV(text){ if(!text) return []; text=String(text).replace(/^\uFEFF/,''); const first=text.split(/\r?\n/).find(l=>l.trim())||''; const delim=detectDelimiter(first); const rows=[]; let row=[],cur='',q=false; for(let i=0;i<text.length;i++){ const ch=text[i],nx=text[i+1]; if(ch==='"'&&q&&nx==='"'){cur+='"';i++;continue;} if(ch==='"'){q=!q;continue;} if(ch===delim&&!q){row.push(cur.trim());cur='';continue;} if((ch==='\n'||ch==='\r')&&!q){ if(ch==='\r'&&nx==='\n')i++; row.push(cur.trim()); if(row.some(x=>x!=='')) rows.push(row); row=[]; cur=''; continue; } cur+=ch; } row.push(cur.trim()); if(row.some(x=>x!=='')) rows.push(row); if(rows.length<2) return []; const head=rows[0].map(x=>String(x||'').trim()); return rows.slice(1).map(r=>{ const o={}; head.forEach((h,i)=>o[h]=r[i]??''); return o; }); }
  const clean=k=>String(k||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function pick(row,names){ row=row||{}; const keys=Object.keys(row); const exact={}; keys.forEach(k=>exact[clean(k)]=k); for(const n of names){ const k=exact[clean(n)]; if(k!==undefined&&row[k]!==undefined&&String(row[k]).trim()!=='') return row[k]; } for(const n of names){ const cn=clean(n); const k=keys.find(x=>clean(x).includes(cn)||cn.includes(clean(x))); if(k&&String(row[k]??'').trim()!=='') return row[k]; } return ''; }
  function num(v){ if(v==null||String(v).trim()==='') return null; let s=String(v).trim(); if(/^-?\d+,\d+$/.test(s)) s=s.replace(',','.'); else s=s.replace(/,/g,'.'); s=s.replace(/[^0-9.\-]/g,''); const n=parseFloat(s); return Number.isFinite(n)?n:null; }
  function validLat(n){ return Number.isFinite(n)&&n>=-11&&n<=7; }
  function validLon(n){ return Number.isFinite(n)&&n>=95&&n<=142; }
  function numbersIn(v){ return (String(v||'').match(/-?\d+(?:[\.,]\d+)?/g)||[]).map(num).filter(Number.isFinite); }
  function latLon(row){
    row=row||{};
    let lat=num(pick(row,['lat','latitude','lintang','y','koordinat_y','koordinat y','y_coord','ycoord','latitudey','latitude_y','LATITUDE','Y']));
    let lon=num(pick(row,['lon','lng','long','longitude','longtitude','bujur','x','koordinat_x','koordinat x','x_coord','xcoord','longitudex','longitude_x','LONGITUDE','X']));
    if(!(validLat(lat)&&validLon(lon))){
      const c=pick(row,['koordinat','coordinates','coord','titik koordinat','lokasi koordinat','geometry','wkt','geom','lat lon','latlong','longlat']);
      const ns=numbersIn(c);
      if(ns.length>=2){
        for(let i=0;i<ns.length-1;i++){ const a=ns[i],b=ns[i+1]; if(validLat(a)&&validLon(b)){ lat=a; lon=b; break; } if(validLon(a)&&validLat(b)){ lat=b; lon=a; break; } }
      }
    }
    if(!(validLat(lat)&&validLon(lon))){
      for(const v of Object.values(row)){
        const ns=numbersIn(v); if(ns.length<2) continue;
        for(let i=0;i<ns.length-1;i++){ const a=ns[i],b=ns[i+1]; if(validLat(a)&&validLon(b)){ lat=a; lon=b; break; } if(validLon(a)&&validLat(b)){ lat=b; lon=a; break; } }
        if(validLat(lat)&&validLon(lon)) break;
      }
    }
    if(!(validLat(lat)&&validLon(lon))){
      const vals=Object.values(row).map(num).filter(Number.isFinite);
      const la=vals.find(validLat), lo=vals.find(validLon); if(la!=null&&lo!=null){ lat=la; lon=lo; }
    }
    return {lat:validLat(lat)?lat:null, lon:validLon(lon)?lon:null};
  }
  function dateInfo(v){ const s=String(v||'').trim(); if(!s) return {text:'-',year:'-'}; const y=(s.match(/(?:19|20)\d{2}/)||[])[0]||'-'; return {text:s,year:y}; }
  function domain(url){ try{ if(/^https?:\/\//i.test(url)) return new URL(url).hostname.replace(/^www\./,''); }catch(e){} return ''; }
  function sourceType(src){ const s=String(src||'').toLowerCase(); if(!s) return 'Judul/referensi'; if(/instagram|tiktok|twitter|x\.com|facebook|youtube|youtu\.be|threads|whatsapp|medsos/.test(s)) return 'Media sosial'; if(/^https?:\/\//.test(s)) return 'Berita online'; return 'Judul/referensi'; }
  function corridor(text){ const s=String(text||'').replace(/\s+/g,' '); const pats=[/(?:Jl\.?|Jalan)\s+([A-Za-zÀ-ÿ0-9 .,'\-]{3,70})/i,/(Ring\s*Road\s*(?:Utara|Selatan|Barat|Timur)?)/i,/(Malioboro|Tugu|Gejayan|Seturan|Babarsari|Kaliurang|Magelang|Solo|Parangtritis|Imogiri|Godean|Wonosari|Palagan|Monjali|Affandi|Laksda Adisucipto|Sudirman|Mangkubumi|Tamansiswa|Veteran|Kusumanegara|HOS Cokroaminoto|Ahmad Dahlan|Janti)/i]; for(const p of pats){ const m=s.match(p); if(!m)continue; let v=(m[1]||m[0]).trim().replace(/[,;:|].*$/,'').replace(/\b(kecamatan|kelurahan|kota|kabupaten|yogyakarta|sleman|bantul).*$/i,'').trim(); if(!/^jalan/i.test(v)&&!/^ring/i.test(v)&&!['Malioboro','Tugu'].includes(v)) v='Jalan '+v; return v; } return ''; }
  function normalizeIncident(row,i){ const ll=latLon(row), dt=dateInfo(pick(row,['tanggal','tgl','date','waktu','tahun','tanggal kejadian','tanggal_kejadian'])); const src=pick(row,['url','link','tautan','sumber','berita','referensi','judul berita','source','media','link berita']); const title=pick(row,['judul','kejadian','kasus','peristiwa','keterangan','deskripsi','title','nama','ringkasan'])||`Kejadian ${i+1}`; const loc=pick(row,['lokasi','alamat','tempat','jalan','ruas jalan','nama jalan','tkp'])||title; const kec=pick(row,['kecamatan','kapanewon','wilayah','kelurahan','daerah','wadmkc','nama kecamatan'])||''; const zone=pick(row,['zona','klasifikasi','klasifikas','kelas','kerawanan','kelas zona'])||''; const image=pick(row,['gambar','image','foto','thumbnail','thumb','og_image','url gambar','link gambar','berita gambar']); const cor=corridor([loc,title,src,kec].join(' ')); return {id:'inc-'+i,raw:row,lat:ll.lat,lon:ll.lon,title,location:loc,kecamatan:kec,date:dt.text,year:dt.year,source:src,domain:domain(src),sourceType:sourceType(src),image,zone,corridor:cor}; }
  function normalizeCctv(row,i){ const ll=latLon(row); const src=pick(row,['url','link','tautan','sumber','source','youtube','link cctv','link youtube','stream','link_stream']); const name=pick(row,['nama','nama cctv','cctv','lokasi cctv','lokasi','name','title','nama lokasi','nama_kamera'])||`CCTV ${i+1}`; const loc=pick(row,['lokasi','alamat','jalan','lokasi cctv','keterangan'])||name; return {id:'cam-'+i,raw:row,lat:ll.lat,lon:ll.lon,name,type:pick(row,['jenis','tipe','type','kategori','fungsi'])||'CCTV',location:loc,source:src,domain:domain(src)}; }
  function normalizeCrowd(row,i){ const ll=latLon(row); const name=pick(row,['nama','lokasi','tempat','name','title','kawasan'])||`Keramaian ${i+1}`; return {id:'crowd-'+i,raw:row,lat:ll.lat,lon:ll.lon,name,location:pick(row,['lokasi','alamat','jalan','keterangan'])||name}; }
  function normalizeLighting(row,i){ const ll=latLon(row); const txt=Object.entries(row||{}).map(([k,v])=>`${k} ${v}`).join(' ').toLowerCase(); const maybeLight=/lampu|penerangan|pju|street\s*light|lighting|jalan terang|jalan gelap/.test(txt); if(!maybeLight && !(ll.lat!=null&&ll.lon!=null)) return null; if(!maybeLight && /sosial|ekonomi|penduduk|kemiskinan/.test(txt)) return null; const name=pick(row,['nama','lokasi','tempat','jalan','name','title','keterangan'])||`Penerangan ${i+1}`; return {id:'light-'+i,raw:row,lat:ll.lat,lon:ll.lon,name,location:pick(row,['lokasi','alamat','jalan','keterangan'])||name,type:pick(row,['jenis','tipe','type','kategori','status'])||'PJU/Penerangan'}; }
  function risk(z){ const s=String(z||'').toLowerCase(); if(s.includes('sangat'))return{label:'Sangat Rawan',score:90,cls:'danger'}; if(s.includes('rawan'))return{label:'Rawan',score:65,cls:'warn'}; if(s.includes('aman'))return{label:'Aman',score:30,cls:'safe'}; return{label:z||'Tidak diketahui',score:0,cls:'med'}; }
  function getZoneName(f){ const p=f?.properties||{}; return p.Klasifikas||p.klasifikas||p.Klasifikasi||p.klasifikasi||p.Zona||p.zona||p.kelas||p.Kelas||p.KATEGORI||p.KETERANGAN||'Tidak diketahui'; }
  function getLabel(f){ const p=f?.properties||{}; return p.NAMOBJ||p.nama||p.Nama||p.WADMKC||p.Kecamatan||p.kecamatan||p.KELURAHAN||p.DESA||p.KABUPATEN||p.name||p.Name||getZoneName(f); }
  function pointInRing(pt,ring){ let x=pt.lon,y=pt.lat,inside=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1]; const hit=((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi); if(hit)inside=!inside; } return inside; }
  function pointInFeature(pt,f){ try{ if(pt.lat==null||pt.lon==null||!f?.geometry)return false; const g=f.geometry; if(g.type==='Polygon') return g.coordinates.length&&pointInRing(pt,g.coordinates[0])&&!g.coordinates.slice(1).some(r=>pointInRing(pt,r)); if(g.type==='MultiPolygon') return g.coordinates.some(poly=>poly.length&&pointInRing(pt,poly[0])&&!poly.slice(1).some(r=>pointInRing(pt,r))); }catch(e){} return false; }
  function meters(a,b){ if(!a||!b||a.lat==null||a.lon==null||b.lat==null||b.lon==null)return Infinity; const R=6371000,to=x=>x*Math.PI/180; const dLat=to(b.lat-a.lat),dLon=to(b.lon-a.lon); const la1=to(a.lat),la2=to(b.lat); const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
  function nearest(pt,list){ let item=null,distance=Infinity; (list||[]).forEach(x=>{ const d=meters(pt,x); if(d<distance){distance=d; item=x;} }); return {item,distance}; }
  function weightFor(label,weights){ const all=[...(weights?.rows||[])]; if(weights?.json){ if(Array.isArray(weights.json)) all.push(...weights.json); else if(Array.isArray(weights.json.data)) all.push(...weights.json.data); else if(typeof weights.json==='object') all.push(...Object.values(weights.json).filter(v=>v&&typeof v==='object')); } const l=String(label||'').toLowerCase(); return all.find(r=>String(pick(r,['zona','nama','wilayah','kecamatan','kelas','klasifikasi','klasifikas'])||'').toLowerCase()===l || String(pick(r,['zona','nama','wilayah','kecamatan'])||'').toLowerCase().includes(l)); }
  function zoneStats(incidents,cctv,zones,weights){ const fs=zones?.features||[]; if(!fs.length){ const map=new Map(); incidents.forEach(i=>{ const k=i.zone||'Tidak diketahui'; if(!map.has(k)) map.set(k,{label:k,classification:k,score:risk(k).score,incidents:[],cctv:[],covered:0,blind:0}); map.get(k).incidents.push(i); }); return [...map.values()].sort((a,b)=>b.score-a.score||b.incidents.length-a.incidents.length); } return fs.map(f=>{ const label=getLabel(f), cls=getZoneName(f), r=risk(cls), inc=incidents.filter(i=>pointInFeature(i,f)), cams=cctv.filter(c=>pointInFeature(c,f)); const w=weightFor(label,weights)||weightFor(cls,weights)||{}; const score=num(pick(w,['skor','score','nilai','bobot','total']))??r.score; const covered=inc.filter(i=>i.covered500).length; return {feature:f,label,classification:cls,score,incidents:inc,cctv:cams,covered,blind:inc.length-covered}; }).sort((a,b)=>b.score-a.score||b.incidents.length-a.incidents.length); }
  function corridorStats(incidents,cctv){ const m=new Map(); (incidents||[]).forEach(i=>{ if(!i.corridor)return; if(!m.has(i.corridor))m.set(i.corridor,[]); m.get(i.corridor).push(i); }); return [...m.entries()].map(([name,items])=>{ const blind=items.filter(i=>!i.covered500).length; const nearests=items.map(i=>nearest(i,cctv).distance).filter(Number.isFinite); const zones={}; items.forEach(i=>{ const z=i.zone||'Tidak diketahui'; zones[z]=(zones[z]||0)+1; }); const dominant=Object.entries(zones).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-'; const count=items.length; return {name,count,blind,incidents:items,dominant,nearest:nearests.length?Math.min(...nearests):Infinity,status:count>=3?'Prioritas tinggi':count>=2?'Perlu dipantau':'Terindikasi'}; }).sort((a,b)=>b.count-a.count||b.blind-a.blind); }
  function dedupePoints(arr,prefix){ const seen=new Set(); return (arr||[]).filter((x,i)=>{ if(x.lat==null||x.lon==null)return false; const key=[prefix,Math.round(x.lat*1e5),Math.round(x.lon*1e5),String(x.name||x.title||'').toLowerCase()].join('|'); if(seen.has(key))return false; seen.add(key); return true; }); }
  async function loadAll(){
    const [incRaw,cctvRaw,crowdRaw,zones,admin,weights,supportRaw]=await Promise.all([loadAllCsv(DATA_PATHS.incidents),loadAllCsv(DATA_PATHS.cctv),loadAllCsv(DATA_PATHS.crowd),loadFirstJson(DATA_PATHS.zones),loadFirstJson(DATA_PATHS.admin),loadWeights(DATA_PATHS.weights),loadSupport(DATA_PATHS.support)]);
    let incidents=dedupePoints(incRaw.data.map(normalizeIncident),'inc');
    let cctv=dedupePoints(cctvRaw.data.map(normalizeCctv),'cctv');
    let crowd=dedupePoints(crowdRaw.data.map(normalizeCrowd),'crowd');
    let lighting=dedupePoints(supportRaw.data.map(normalizeLighting).filter(Boolean),'light');
    incidents.forEach(i=>{ if(!i.zone){ const f=(zones.data.features||[]).find(f=>pointInFeature(i,f)); if(f)i.zone=getZoneName(f); } const n=nearest(i,cctv); i.nearestCctv=n.item; i.nearestCctvDistance=n.distance; i.covered500=n.distance<=500; });
    const zs=zoneStats(incidents,cctv,zones.data,weights);
    return {incidents,cctv,crowd,lighting,zones:zones.data,admin:admin.data,weights,support:supportRaw.data,zoneStats:zs,loaded:{incidents:incRaw.paths,cctv:cctvRaw.paths,crowd:crowdRaw.paths,zones:zones.path,admin:admin.path,weights:weights.paths,support:supportRaw.paths}};
  }
  window.GeoSafeData={DATA_PATHS,parseCSV,pick,latLon,risk,getZoneName,getLabel,pointInFeature,meters,nearest,corridorStats,loadAll};
})();
