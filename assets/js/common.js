(function(){
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function activeNav(){ const page=document.body?.dataset.page; $$('.navlinks a').forEach(a=>{ if(a.dataset.page===page) a.classList.add('active'); }); }
  function mobileNav(){ $('#mobileToggle')?.addEventListener('click',()=>$('#navlinks')?.classList.toggle('open')); }
  function cursorGlow(){ const glow=$('#cursorGlow'); if(!glow||matchMedia('(pointer:coarse)').matches) return; window.addEventListener('mousemove',e=>{ glow.style.left=e.clientX+'px'; glow.style.top=e.clientY+'px'; },{passive:true}); }
  function loading(){
    if(document.body.classList.contains('map-page')||document.querySelector('[data-no-loader]')) return;
    const el=document.createElement('div'); el.className='loading-screen'; el.innerHTML='<div class="loading-card"><div class="loading-mark"></div><strong>GeoSafe Yogyakarta</strong><span>Memuat tampilan...</span></div>';
    document.body.appendChild(el); document.body.classList.add('is-loading');
    window.addEventListener('load',()=>setTimeout(()=>{el.classList.add('hide'); document.body.classList.remove('is-loading'); setTimeout(()=>el.remove(),280);},260));
  }
  document.addEventListener('DOMContentLoaded',()=>{ activeNav(); mobileNav(); cursorGlow(); loading(); });
})();
