(function(){
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  window.GeoSafeUI={$, $$};
  function ensureLoader(){
    if($('#siteLoader')) return $('#siteLoader');
    const div=document.createElement('div');
    div.id='siteLoader';
    div.className='site-loader';
    div.innerHTML='<div class="loader-card" role="status" aria-live="polite"><div class="loader-row"><span class="loader-dot"></span><strong>Memuat GeoSafe</strong></div><div class="loader-bar"><span></span></div><small>Menyiapkan layer, filter, dan tampilan interaktif...</small></div>';
    document.body.prepend(div);
    return div;
  }
  function hideLoader(){ const loader=$('#siteLoader'); if(loader) loader.classList.add('is-hidden'); }
  document.addEventListener('DOMContentLoaded',()=>{
    ensureLoader();
    const page=document.body.dataset.page;
    $$('.navlinks a').forEach(a=>{ if(a.dataset.page===page) a.classList.add('active'); });
    const mobile=$('#mobileToggle'), nav=$('#navlinks');
    if(mobile&&nav) mobile.addEventListener('click',()=>nav.classList.toggle('open'));
    const glow=$('#cursorGlow');
    if(glow){ document.addEventListener('pointermove',e=>{ glow.style.left=e.clientX+'px'; glow.style.top=e.clientY+'px'; }, {passive:true}); }
    window.addEventListener('load',()=>setTimeout(hideLoader,180));
    window.addEventListener('geosafe:data-loaded',()=>setTimeout(hideLoader,120));
    setTimeout(hideLoader,2400);
  });
})();
