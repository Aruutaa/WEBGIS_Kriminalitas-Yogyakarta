(async function(){
  const $=(s,r=document)=>r.querySelector(s);
  if(!window.GeoSafeData) return;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=m=>Number.isFinite(m)?(m>=1000?(m/1000).toFixed(2)+' km':Math.round(m)+' m'):'-';
  const state={data:null,filters:{q:'',zone:'all',year:'all'},charts:[]};

  function mapUrl(params={}){
    const p=new URLSearchParams();
    Object.entries(params).forEach(([k,v])=>{ if(v&&v!=='all')p.set(k,v); });
    p.set('showPju','1');
    return `peta.html?${p.toString()}`;
  }
  function updateMapLinks(){
    const params={q:state.filters.q,zona:state.filters.zone,tahun:state.filters.year};
    ['openMapWithFilter','heroMapLink','footerMapLink'].forEach(id=>{ const el=$('#'+id); if(el) el.href=mapUrl(params); });
  }
  function setOptions(id,values){
    const el=$('#'+id); if(!el)return;
    const cur=el.value;
    [...new Set((values||[]).filter(v=>v&&v!=='-'))].sort().forEach(v=>{
      if(![...el.options].some(o=>o.value===v)){ const o=document.createElement('option'); o.value=v; o.textContent=v; el.appendChild(o); }
    });
    if(cur) el.value=cur;
  }
  function applyParams(){
    const p=new URLSearchParams(location.search);
    const q=p.get('q')||p.get('lokasi')||p.get('cctv')||p.get('penerangan')||p.get('koridor')||'';
    const zona=p.get('zona')||p.get('zone')||'';
    const tahun=p.get('tahun')||p.get('year')||'';
    if(q){ state.filters.q=q; const e=$('#filterSearch'); if(e)e.value=q; }
    if(zona){ const el=$('#filterZone'); const opt=el&&[...el.options].find(o=>o.value.toLowerCase()===zona.toLowerCase()||o.textContent.toLowerCase()===zona.toLowerCase()); if(opt){ state.filters.zone=opt.value; el.value=opt.value; } }
    if(tahun){ const el=$('#filterYear'); const opt=el&&[...el.options].find(o=>String(o.value)===String(tahun)); if(opt){ state.filters.year=opt.value; el.value=opt.value; } }
  }
  function matchesSearch(i,q){ if(!q)return true; q=q.toLowerCase(); return [i.title,i.location,i.kecamatan,i.zone,i.source,i.domain,i.corridor,i.date,i.year].join(' ').toLowerCase().includes(q); }
  function filtered(){
    return state.data.incidents.filter(i=>(state.filters.zone==='all'||String(i.zone).toLowerCase()===String(state.filters.zone).toLowerCase())&&(state.filters.year==='all'||i.year===state.filters.year)&&matchesSearch(i,state.filters.q));
  }
  function activeZoneRows(inc){
    const ids=new Set(inc.map(i=>i.id));
    return state.data.zoneStats.map(z=>{
      const zi=z.incidents.filter(i=>ids.has(i.id));
      const covered=zi.filter(i=>i.covered500).length;
      return {...z,incidents:zi,covered,blind:zi.length-covered};
    }).filter(z=>state.filters.zone==='all'||String(z.classification).toLowerCase()===String(state.filters.zone).toLowerCase()||String(z.label).toLowerCase()===String(state.filters.zone).toLowerCase())
      .sort((a,b)=>b.weightedScore-a.weightedScore||b.incidents.length-a.incidents.length);
  }
  function destroyCharts(){ state.charts.forEach(c=>c.destroy()); state.charts=[]; }
  function chart(id,type,data,options={}){
    const ctx=$('#'+id); if(!ctx||!window.Chart)return;
    state.charts.push(new Chart(ctx,{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#f3e7df'}}},scales:type==='doughnut'?{}:{x:{ticks:{color:'#d8cdc6'},grid:{color:'rgba(255,255,255,.08)'}},y:{ticks:{color:'#d8cdc6'},grid:{color:'rgba(255,255,255,.08)'},beginAtZero:true}},...options}}));
  }
  function statCards(inc){
    const zones=new Set(inc.map(i=>i.zone).filter(Boolean));
    const blind=inc.filter(i=>!i.covered500).length;
    const cards=[
      ['Kejadian',inc.length,'titik sesuai filter','⚠️'],
      ['Zona aktif',zones.size,'kelas/wilayah terbaca','🗺️'],
      ['CCTV Kota',state.data.cctv.length,'titik setelah boundary','📹'],
      ['PJU/prioritas',state.data.lighting.length,'titik tampil di peta','💡'],
      ['Blind spot',blind,'kejadian di luar radius 500 m','📍'],
      ['CCTV disaring',state.data.cctvOutside?.length||0,'titik luar Kota Yogyakarta','🧹'],
      ['Koridor',GeoSafeData.corridorStats(inc,state.data.cctv).length,'ruas terbaca berulang','🛣️']
    ];
    $('#statCards').innerHTML=cards.map(([h,n,p,ic])=>`<article class="card"><div class="icon">${ic}</div><h3>${h}</h3><p><strong style="font-size:2rem;color:var(--cream)">${n}</strong><br>${p}</p></article>`).join('');
  }
  function renderCharts(inc,rows){
    destroyCharts();
    const zoneCounts={}; inc.forEach(i=>zoneCounts[i.zone||'Tidak diketahui']=(zoneCounts[i.zone||'Tidak diketahui']||0)+1);
    chart('riskBarChart','bar',{labels:rows.map(z=>z.label),datasets:[{label:'Skor akhir',data:rows.map(z=>z.weightedScore)},{label:'Kejadian',data:rows.map(z=>z.incidents.length)},{label:'Blind spot',data:rows.map(z=>z.blind)}]});
    chart('zoneDonutChart','doughnut',{labels:Object.keys(zoneCounts),datasets:[{data:Object.values(zoneCounts)}]});
    const yearCounts={}; inc.forEach(i=>{ if(i.year&&i.year!=='-') yearCounts[i.year]=(yearCounts[i.year]||0)+1; });
    const years=Object.keys(yearCounts).sort();
    chart('trendLineChart','line',{labels:years,datasets:[{label:'Kejadian',data:years.map(y=>yearCounts[y]),tension:.35}]});
    chart('coverageBarChart','bar',{labels:rows.map(z=>z.label),datasets:[{label:'CCTV',data:rows.map(z=>z.cctv.length)},{label:'PJU',data:rows.map(z=>z.lighting.length)},{label:'Blind spot',data:rows.map(z=>z.blind)}]});
  }
  function renderCorridors(inc){
    const cards=GeoSafeData.corridorStats(inc,state.data.cctv).slice(0,9);
    $('#corridorCards').innerHTML=cards.length?cards.map(c=>`<article class="corridor-card"><h4>${esc(c.name)}</h4><span class="pill ${c.count>=3?'danger':c.count>=2?'warning':'accent'}">${esc(c.status)}</span><div class="mini-metrics"><span><b>${c.count}</b>Kejadian</span><span><b>${c.blind}</b>Blind spot</span><span><b>${fmt(c.nearest)}</b>CCTV</span></div><p>Zona dominan: <strong>${esc(c.dominant)}</strong>. Koridor ini perlu dicek bersama layer CCTV dan PJU.</p><a class="btn small" href="${mapUrl({q:c.name})}">Buka di peta</a></article>`).join(''):'<div class="empty-state">Nama jalan/koridor belum terbaca dari data kejadian.</div>';
  }
  function renderPju(inc){
    const rows=state.data.lighting.map(l=>{ const nearInc=inc.filter(i=>GeoSafeData.meters(l,i)<=500).length; const nearCam=state.data.cctv.filter(c=>GeoSafeData.meters(l,c)<=500).length; const nearestCam=GeoSafeData.nearest(l,state.data.cctv).distance; return {...l,nearInc,nearCam,nearestCam}; }).sort((a,b)=>b.nearInc-a.nearInc||a.nearestCam-b.nearestCam).slice(0,8);
    $('#pjuList').innerHTML=rows.length?rows.map(l=>`<article class="rec-card"><h4>${esc(l.name)}</h4><p>${esc(l.location||'-')}</p><div class="mini-metrics"><span><b>${l.nearInc}</b>Kejadian 500 m</span><span><b>${l.nearCam}</b>CCTV 500 m</span><span><b>${fmt(l.nearestCam)}</b>CCTV terdekat</span></div><p>${esc(l.basis||'Prioritas verifikasi penerangan.')}</p><a class="btn small" href="${mapUrl({q:l.location||l.name,layer:'lighting'})}">Cek di peta</a></article>`).join(''):'<div class="empty-state">Layer PJU/prioritas penerangan belum memiliki titik.</div>';
  }
  function renderInsights(inc,rows){
    const blind=inc.filter(i=>!i.covered500).length; const worst=rows[0]; const cors=GeoSafeData.corridorStats(inc,state.data.cctv)[0];
    $('#insightCards').innerHTML=[
      `<article class="rec-card"><h4>Prioritas zona</h4><p>Zona dengan skor akhir tertinggi adalah <strong>${esc(worst?.label||'-')}</strong> dengan nilai <strong>${esc(worst?.weightedScore??'-')}</strong> dan status <strong>${esc(worst?.priority||'-')}</strong>.</p></article>`,
      `<article class="rec-card"><h4>Blind spot relatif</h4><p><strong>${blind}</strong> kejadian pada filter aktif berada di luar radius 500 meter CCTV. Titik ini perlu dicek ulang dengan arah hadap kamera dan kondisi lapangan.</p></article>`,
      `<article class="rec-card"><h4>PJU dan koridor</h4><p>${cors?`Koridor <strong>${esc(cors.name)}</strong> paling sering muncul (${cors.count} kejadian). Prioritaskan pengecekan PJU di sekitar titik berulang dan blind spot.`:'Belum ada koridor dominan yang terbaca pada filter aktif.'}</p></article>`
    ].join('');
  }
  function renderTable(rows){
    const body=$('#analysisTable tbody');
    body.innerHTML=rows.map((z,i)=>{ const c=z.components||{}; const cls=GeoSafeData.risk(z.classification).cls; return `<tr><td>${i+1}</td><td><strong>${esc(z.label)}</strong><br><span class="pill ${cls==='danger'?'danger':cls==='warn'?'warning':'safe'}">${esc(z.classification)}</span></td><td><strong>${z.weightedScore}</strong></td><td>${c.incidentIndex??'-'}</td><td>${c.classIndex??'-'}</td><td>${c.blindIndex??'-'}</td><td>${c.crowdIndex??'-'}</td><td>${z.incidents.length}</td><td>${z.cctv.length}</td><td>${z.lighting.length}</td><td>${z.blind}</td><td>${esc(z.priority)}</td><td><a class="btn small" href="${mapUrl({zona:z.classification})}">Peta</a></td></tr>`; }).join('');
  }
  function renderNarrative(inc,rows){
    const total=inc.length, blind=inc.filter(i=>!i.covered500).length, best=rows[0], cors=GeoSafeData.corridorStats(inc,state.data.cctv);
    $('#narrative').innerHTML=`Dengan filter aktif, sistem membaca <strong>${total}</strong> kejadian. Skor akhir dihitung memakai rumus <strong>S = 0,35I + 0,25K + 0,25B + 0,15L</strong>. Komponen I menunjukkan intensitas kejadian, K menunjukkan kelas zona pada peta, B menunjukkan proporsi blind spot terhadap CCTV radius 500 meter, dan L menunjukkan tekanan keramaian/PJU. ${best?`Zona <strong>${esc(best.label)}</strong> menjadi prioritas utama dengan skor <strong>${best.weightedScore}</strong>.`:''} Terdapat <strong>${blind}</strong> kejadian yang belum tercakup radius 500 meter CCTV. ${cors[0]?`Koridor paling menonjol adalah <strong>${esc(cors[0].name)}</strong>, sehingga pengecekan CCTV, PJU, dan patroli bisa difokuskan di sekitarnya.`:'Belum ada koridor dominan pada filter aktif.'}`;
  }
  function settings(inc){
    $('#settingsList').innerHTML=`<li><b>Filter:</b> ${esc(state.filters.q||'semua lokasi')} · ${esc(state.filters.zone)} · ${esc(state.filters.year)}</li><li><b>Data tampil:</b> ${inc.length} kejadian, ${state.data.cctv.length} CCTV Kota Yogyakarta, ${state.data.lighting.length} PJU/prioritas</li><li><b>Boundary CCTV:</b> ${state.data.cctvOutside?.length||0} titik luar Kota Yogyakarta disaring</li><li><b>Metode:</b> bobot 35% kejadian, 25% kelas zona, 25% blind spot CCTV, 15% keramaian/PJU</li>`;
  }
  function render(){
    const inc=filtered(); const rows=activeZoneRows(inc);
    updateMapLinks(); statCards(inc); renderCharts(inc,rows); renderPju(inc); renderCorridors(inc); renderInsights(inc,rows); renderTable(rows); renderNarrative(inc,rows); settings(inc);
  }
  try{ state.data=await GeoSafeData.loadAll(); }catch(e){ console.error(e); $('#settingsList')&&( $('#settingsList').innerHTML='<li>Data gagal dimuat. Jalankan lewat Live Server dan cek folder assets/data.</li>' ); return; }
  setOptions('filterZone',[...state.data.zoneStats.map(z=>z.classification),...state.data.incidents.map(i=>i.zone)]);
  setOptions('filterYear',state.data.incidents.map(i=>i.year));
  applyParams();
  $('#filterSearch')?.addEventListener('input',e=>{state.filters.q=e.target.value; render();});
  $('#filterZone')?.addEventListener('change',e=>{state.filters.zone=e.target.value; render();});
  $('#filterYear')?.addEventListener('change',e=>{state.filters.year=e.target.value; render();});
  $('#resetFilter')?.addEventListener('click',()=>{ Object.assign(state.filters,{q:'',zone:'all',year:'all'}); const search=$('#filterSearch'); if(search) search.value=''; ['filterZone','filterYear'].forEach(id=>{ const el=$('#'+id); if(el) el.value='all'; }); render(); });
  $('#exportCsv')?.addEventListener('click',()=>{
    const rows=activeZoneRows(filtered()).map(z=>({Zona:z.label,Klasifikasi:z.classification,Skor_Akhir:z.weightedScore,Indeks_Kejadian:z.components?.incidentIndex,Indeks_Kelas:z.components?.classIndex,Indeks_Blindspot:z.components?.blindIndex,Indeks_Keramaian_PJU:z.components?.crowdIndex,Kejadian:z.incidents.length,CCTV:z.cctv.length,PJU:z.lighting.length,BlindSpot:z.blind,Prioritas:z.priority}));
    const head=Object.keys(rows[0]||{Zona:'',Klasifikasi:'',Skor_Akhir:''});
    const csv=[head.join(','),...rows.map(r=>head.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(','))].join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='geosafe_analisis_zona_berbobot.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
  render();
})();
