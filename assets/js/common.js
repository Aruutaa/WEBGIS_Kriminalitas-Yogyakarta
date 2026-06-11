
(function(){
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  window.GeoSafeUI={$, $$};
  document.addEventListener('DOMContentLoaded',()=>{
    const page=document.body.dataset.page;
    $$(`.navlinks a`).forEach(a=>{ if(a.dataset.page===page) a.classList.add('active'); });
    const mobile=$('#mobileToggle'), nav=$('#navlinks');
    if(mobile&&nav) mobile.addEventListener('click',()=>nav.classList.toggle('open'));
    const glow=$('#cursorGlow');
    if(glow){ document.addEventListener('pointermove',e=>{ glow.style.left=e.clientX+'px'; glow.style.top=e.clientY+'px'; }); }
    const loader=$('#siteLoader');
    if(loader){
      const hide=()=>loader.classList.add('is-hidden');
      window.addEventListener('load',()=>setTimeout(hide,220));
      setTimeout(hide,1600);
    }
  });
})();
