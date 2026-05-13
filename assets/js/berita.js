(function () {
  function initNewsPage() {
    if (!window.CrimeScopeData) return;

    const grid = document.getElementById("newsGrid");
    const search = document.getElementById("newsSearch");
    const type = document.getElementById("newsType");
    const sort = document.getElementById("newsSort");
    const newsData = window.CrimeScopeData.newsData || [];

    if (!grid || !search || !type || !sort) return;

    function renderNews() {
      const q = search.value.trim().toLowerCase();
      let items = newsData.filter((item) => {
        const matchQ = !q || [item.title, item.source, item.description, item.tag, item.type].join(" ").toLowerCase().includes(q);
        const matchType = type.value === "all" || item.type === type.value;
        return matchQ && matchType;
      });

      if (sort.value === "source") items = items.sort((a, b) => a.source.localeCompare(b.source));
      if (sort.value === "type") items = items.sort((a, b) => a.type.localeCompare(b.type));

      grid.innerHTML = items.map((item, index) => `
        <article class="news-card">
          <div class="news-poster">
            <div class="poster-content">
              <div class="source"><span>${item.source}</span><span>${String(index + 1).padStart(2, "0")}</span></div>
              <h3>${item.title}</h3>
            </div>
          </div>
          <div class="news-body">
            <div class="news-meta"><span class="pill accent">${item.tag}</span><span class="pill warning">${item.type}</span><span class="pill">${item.date}</span></div>
            <p>${item.description}</p>
            <div class="news-footer"><span class="muted">Klik untuk membuka sumber asli</span><a class="btn small primary" href="${item.url}" target="_blank" rel="noopener">Baca</a></div>
          </div>
        </article>
      `).join("") || `<div class="card wide"><h3>Tidak ada berita yang cocok</h3><p>Ubah kata kunci atau filter jenis berita.</p></div>`;
    }

    [search, type, sort].forEach((el) => {
      ["input", "change"].forEach((evt) => el.addEventListener(evt, renderNews));
    });

    renderNews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNewsPage);
  } else {
    initNewsPage();
  }
})();
