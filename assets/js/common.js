(function () {
  function initCommon() {
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
