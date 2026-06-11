(function () {
  function ensureLoader() {
    if (document.getElementById('pageLoader')) return;
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="loader-card"><div class="loader-mark"><span></span></div><b>GeoSafe</b><small>Memuat data spasial...</small></div>';
    document.body.appendChild(loader);
    const hide = () => setTimeout(() => loader.classList.add('is-hidden'), 260);
    window.addEventListener('load', hide, { once: true });
    setTimeout(hide, 1200);
  }
  function initCommon() {
    ensureLoader();
    const page = document.body.dataset.page;
    document.querySelectorAll('.navlinks a').forEach((a) => {
      if (a.dataset.page === page) a.classList.add('active');
    });

    const mobileToggle = document.getElementById('mobileToggle');
    const navlinks = document.getElementById('navlinks');
    if (mobileToggle && navlinks) {
      mobileToggle.addEventListener('click', () => navlinks.classList.toggle('open'));
      navlinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navlinks.classList.remove('open')));
    }

    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow && matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', (e) => {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCommon);
  else initCommon();
})();
