(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function initMapPage() {
    const status = $("mapStatus");
    const setStatus = (text) => {
      if (status) status.textContent = text;
    };

    if (!window.L) {
      setStatus("Leaflet gagal dimuat. Cek koneksi internet/CDN.");
      const mapBox = $("map");
      if (mapBox) {
        mapBox.innerHTML = `<div style="height:100%;display:grid;place-items:center;padding:24px;text-align:center;color:#eef4ff;background:#0b1328;border-radius:26px;">Leaflet gagal dimuat. Pastikan koneksi internet aktif dan CDN Leaflet tidak diblokir.</div>`;
      }
      return;
    }

    if (!window.CrimeScopeData) {
      setStatus("Data demo gagal dimuat. Cek assets/js/data.js.");
      return;
    }

    const {
      colorByRisk,
      filterAreas
    } = window.CrimeScopeData;

    const mapElement = $("map");
    if (!mapElement) return;

    const map = L.map("map", {
      zoomControl: false,
      preferCanvas: true
    }).setView([-7.7972, 110.3688], 13);

    window.crimeScopeMap = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const baseMaps = {
      "OSM Standard": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
      }),
      "Carto Voyager": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 20,
        subdomains: "abcd"
      }),
      "Esri World Imagery": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
      }),
      "Esri Topographic": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
      }),
      "OSM HOT": L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors, Tiles style by HOT",
        maxZoom: 20
      })
    };

    let activeBasemapName = "OSM Standard";
    let activeBasemap = baseMaps[activeBasemapName].addTo(map);

    function attachTileStatus(layer, name) {
      layer.on("tileload", () => setStatus(`${name} aktif — data demo`));
      layer.on("tileerror", () => setStatus(`Sebagian tile ${name} gagal dimuat. Cek koneksi atau coba basemap lain.`));
    }
    Object.entries(baseMaps).forEach(([name, layer]) => attachTileStatus(layer, name));

    const riskLayer = L.layerGroup().addTo(map);
    const pointLayer = L.layerGroup().addTo(map);
    const labelLayer = L.layerGroup().addTo(map);
    const layerState = { risk: true, points: true, labels: true };

    function getSettingsFromUI() {
      return {
        search: $("searchArea") ? $("searchArea").value : "",
        crime: $("crimeType") ? $("crimeType").value : "all",
        risk: $("riskFilter") ? $("riskFilter").value : "all",
        minRisk: $("minRisk") ? $("minRisk").value : "0",
        opacity: $("opacityRange") ? $("opacityRange").value : "0.72",
        timestamp: new Date().toISOString()
      };
    }

    function buildPopup(area) {
      return `
        <div class="popup-card">
          <h4>${area.kecamatan}</h4>
          <p>Zona risiko <strong>${area.kategori}</strong> dengan indikator dominan: ${area.dominan}.</p>
          <div class="popup-grid">
            <div class="popup-metric"><span>Kasus demo</span><strong>${area.kasus}</strong></div>
            <div class="popup-metric"><span>Skor risiko</span><strong>${area.risiko}</strong></div>
            <div class="popup-metric"><span>Kepadatan</span><strong>${Number(area.kepadatan || 0).toLocaleString("id-ID")}</strong></div>
            <div class="popup-metric"><span>Kemiskinan</span><strong>${area.kemiskinan}%</strong></div>
          </div>
        </div>`;
    }

    function syncLayerVisibility() {
      const layers = { risk: riskLayer, points: pointLayer, labels: labelLayer };
      Object.entries(layers).forEach(([key, layer]) => {
        if (layerState[key]) {
          if (!map.hasLayer(layer)) layer.addTo(map);
        } else if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    }

    function updateInsight(area) {
      const box = $("insightBox");
      if (!box) return;
      box.innerHTML = `<strong>${area.kecamatan}</strong> memiliki skor risiko <strong>${area.risiko}</strong> dan kategori <strong>${area.kategori}</strong>. Kasus dominan pada data demo adalah <strong>${area.dominan}</strong>.`;
    }

    function updateStats(areas) {
      const totalKasus = areas.reduce((sum, a) => sum + Number(a.kasus || 0), 0);
      const top = [...areas].sort((a, b) => b.risiko - a.risiko)[0];
      if ($("statWilayah")) $("statWilayah").textContent = areas.length;
      if ($("statKasus")) $("statKasus").textContent = totalKasus.toLocaleString("id-ID");
      if ($("statPrioritas")) $("statPrioritas").textContent = top ? top.kecamatan : "-";
      setStatus(`${areas.length} wilayah aktif — ${totalKasus} kasus demo — ${activeBasemapName}`);
    }

    function renderMap() {
      const settings = getSettingsFromUI();
      const opacity = Number(settings.opacity || 0.72);
      const areas = filterAreas(settings);

      riskLayer.clearLayers();
      pointLayer.clearLayers();
      labelLayer.clearLayers();

      areas.forEach((area) => {
        const color = colorByRisk(area.kategori);

        const zone = L.circle([area.lat, area.lng], {
          radius: 260 + area.risiko * 9,
          color,
          weight: 1.4,
          fillColor: color,
          fillOpacity: opacity * 0.33,
          opacity: Math.min(1, opacity + 0.18)
        }).bindPopup(buildPopup(area), { className: "custom-popup" });
        zone.on("click", () => updateInsight(area));
        riskLayer.addLayer(zone);

        const point = L.circleMarker([area.lat, area.lng], {
          radius: 7 + area.risiko / 18,
          fillColor: color,
          color: "#ffffff",
          weight: 1.2,
          opacity: 0.95,
          fillOpacity: 0.9
        }).bindPopup(buildPopup(area), { className: "custom-popup" });
        point.on("click", () => updateInsight(area));
        pointLayer.addLayer(point);

        labelLayer.addLayer(L.marker([area.lat, area.lng], {
          interactive: false,
          icon: L.divIcon({
            className: "area-label",
            html: `<div style="transform:translate(-50%,-160%);background:rgba(7,12,29,.78);border:1px solid rgba(255,255,255,.16);color:#eef4ff;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:900;white-space:nowrap;backdrop-filter:blur(12px);">${area.kecamatan}</div>`,
            iconSize: [1, 1]
          })
        }));
      });

      syncLayerVisibility();
      updateStats(areas);
    }

    function bindFilterEvents() {
      ["searchArea", "crimeType", "riskFilter", "minRisk", "opacityRange"].forEach((id) => {
        const el = $(id);
        if (!el) return;
        ["input", "change"].forEach((evt) => {
          el.addEventListener(evt, () => {
            if ($("minRiskValue")) $("minRiskValue").textContent = $("minRisk").value;
            if ($("opacityValue")) $("opacityValue").textContent = `${Math.round(Number($("opacityRange").value) * 100)}%`;
            renderMap();
          });
        });
      });
    }

    function bindLayerButtons() {
      document.querySelectorAll("[data-layer-toggle]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          const key = btn.dataset.layerToggle;
          layerState[key] = !layerState[key];
          btn.classList.toggle("active", layerState[key]);
          syncLayerVisibility();
        });
      });
    }

    function bindBasemapButtons() {
      document.querySelectorAll("[data-basemap]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          const name = btn.dataset.basemap;
          if (!baseMaps[name]) {
            setStatus(`Basemap ${name} belum tersedia di konfigurasi.`);
            return;
          }
          if (activeBasemap) map.removeLayer(activeBasemap);
          activeBasemapName = name;
          activeBasemap = baseMaps[name].addTo(map);
          activeBasemap.bringToBack();
          document.querySelectorAll("[data-basemap]").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          renderMap();
        });
      });
    }

    if ($("btnHome")) {
      $("btnHome").addEventListener("click", () => map.setView([-7.7972, 110.3688], 13));
    }

    if ($("btnLocate")) {
      $("btnLocate").addEventListener("click", () => map.locate({ setView: true, maxZoom: 16 }));
    }

    map.on("locationfound", (e) => {
      L.circleMarker(e.latlng, {
        radius: 8,
        color: "#ffffff",
        fillColor: "#68f0ff",
        fillOpacity: 0.9,
        weight: 2
      }).addTo(map).bindPopup("Lokasi kamu saat ini").openPopup();
    });

    map.on("locationerror", () => {
      alert("Lokasi tidak dapat diakses. Pastikan izin lokasi browser aktif.");
    });

    if ($("runAnalysis")) {
      $("runAnalysis").addEventListener("click", () => {
        const settings = getSettingsFromUI();
        localStorage.setItem("crimeScopeAnalysisSettings", JSON.stringify(settings));
        const params = new URLSearchParams(settings).toString();
        window.location.href = `analisis.html?${params}`;
      });
    }

    bindFilterEvents();
    bindLayerButtons();
    bindBasemapButtons();
    renderMap();

    setTimeout(() => map.invalidateSize(), 250);
    setTimeout(() => map.invalidateSize(), 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMapPage);
  } else {
    initMapPage();
  }
})();
