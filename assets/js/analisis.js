(function () {
  function initAnalysisPage() {
    if (!window.CrimeScopeData) {
      const narrative = document.getElementById("narrative");
      if (narrative) narrative.textContent = "Data gagal dimuat. Cek assets/js/data.js.";
      return;
    }

    if (!window.Chart) {
      const narrative = document.getElementById("narrative");
      if (narrative) narrative.textContent = "Chart.js gagal dimuat. Cek koneksi internet/CDN.";
      return;
    }

    const {
      getAnalysisSettings,
      filterAreas,
      aggregateCrimes,
      crimeLabel,
      tagClass
    } = window.CrimeScopeData;

    function settingsFromQueryOrStorage() {
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length) return Object.fromEntries(params.entries());
      return getAnalysisSettings();
    }

    const settings = settingsFromQueryOrStorage();
    const areas = filterAreas(settings).sort((a, b) => b.risiko - a.risiko);
    const totalKasus = areas.reduce((sum, a) => sum + Number(a.kasus || 0), 0);
    const avgRisk = areas.length ? (areas.reduce((sum, a) => sum + Number(a.risiko || 0), 0) / areas.length).toFixed(1) : 0;
    const top = areas[0];
    const highCount = areas.filter((a) => a.kategori === "Tinggi").length;

    const settingsList = document.getElementById("settingsList");
    if (settingsList) {
      settingsList.innerHTML = `
        <li><b>Kecamatan:</b> ${settings.search || "Semua kecamatan"}</li>
        <li><b>Jenis kasus:</b> ${crimeLabel(settings.crime || "all")}</li>
        <li><b>Kategori risiko:</b> ${settings.risk || "all"}</li>
        <li><b>Skor minimum:</b> ${settings.minRisk || 0}</li>
      `;
    }

    const statCards = document.getElementById("statCards");
    if (statCards) {
      statCards.innerHTML = `
        <div class="card"><div class="icon">🗺️</div><h3>${areas.length}</h3><p>Wilayah masuk hasil analisis berdasarkan parameter aktif.</p></div>
        <div class="card"><div class="icon">🚨</div><h3>${totalKasus}</h3><p>Total kasus demo pada wilayah yang sedang dianalisis.</p></div>
        <div class="card"><div class="icon">📈</div><h3>${avgRisk}</h3><p>Rata-rata skor risiko dari wilayah hasil filter.</p></div>
        <div class="card"><div class="icon">🔥</div><h3>${highCount}</h3><p>Jumlah wilayah yang masuk kategori risiko tinggi.</p></div>
      `;
    }

    const tableBody = document.querySelector("#analysisTable tbody");
    if (tableBody) {
      tableBody.innerHTML = areas.map((area, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${area.kecamatan}</strong></td>
          <td>${area.kasus}</td>
          <td>${area.risiko}</td>
          <td><span class="risk-tag ${tagClass(area.kategori)}">${area.kategori}</span></td>
          <td>${area.dominan}</td>
          <td>${area.kategori === "Tinggi" ? "Prioritas patroli, pengawasan titik rawan, dan validasi lapangan." : area.kategori === "Sedang" ? "Pemantauan berkala dan pembaruan data periodik." : "Pengawasan rutin dan edukasi preventif."}</td>
        </tr>
      `).join("") || `<tr><td colspan="7">Tidak ada wilayah yang sesuai dengan parameter.</td></tr>`;
    }

    const agg = aggregateCrimes(areas);
    const riskChart = document.getElementById("riskBarChart");
    if (riskChart) {
      new Chart(riskChart, {
        type: "bar",
        data: {
          labels: areas.map((a) => a.kecamatan),
          datasets: [{ label: "Skor Risiko", data: areas.map((a) => a.risiko), borderWidth: 1, borderRadius: 10 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: "#eef4ff" } } },
          scales: {
            x: { ticks: { color: "#9fb0d4", maxRotation: 60, minRotation: 25 }, grid: { color: "rgba(255,255,255,.08)" } },
            y: { ticks: { color: "#9fb0d4" }, grid: { color: "rgba(255,255,255,.08)" }, suggestedMax: 100 }
          }
        }
      });
    }

    const donutChart = document.getElementById("crimeDonutChart");
    if (donutChart) {
      new Chart(donutChart, {
        type: "doughnut",
        data: {
          labels: ["Curat", "Curanmor", "Penganiayaan", "Narkotika", "Penipuan"],
          datasets: [{ data: [agg.curat || 0, agg.curanmor || 0, agg.penganiayaan || 0, agg.narkotika || 0, agg.penipuan || 0], borderWidth: 1 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "64%",
          plugins: { legend: { position: "bottom", labels: { color: "#eef4ff", usePointStyle: true } } }
        }
      });
    }

    const narrative = document.getElementById("narrative");
    if (narrative) {
      narrative.textContent = areas.length
        ? `Berdasarkan parameter aktif, terdapat ${areas.length} wilayah yang masuk analisis dengan total ${totalKasus} kasus demo. Wilayah dengan skor risiko tertinggi adalah ${top.kecamatan} dengan skor ${top.risiko} dan kategori ${top.kategori}. Interpretasi akhir harus menggunakan data resmi dan periode waktu yang jelas. Dalam konteks WebGIS kriminalitas, hasil ini dapat dipakai untuk menyusun prioritas pengawasan, mengidentifikasi konsentrasi kejadian, serta membandingkan pola kasus dengan indikator sosial seperti kepadatan penduduk, kemiskinan, pengangguran, dan keberadaan fasilitas publik.`
        : "Tidak ada wilayah yang memenuhi parameter filter. Kembali ke halaman peta dan longgarkan parameter analisis.";
    }

    const exportBtn = document.getElementById("exportCsv");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const header = "peringkat,kecamatan,kasus_demo,skor_risiko,kategori,indikator_dominan\n";
        const rows = areas.map((a, i) => `${i + 1},${a.kecamatan},${a.kasus},${a.risiko},${a.kategori},${a.dominan}`).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "hasil_analisis_kriminalitas_demo.csv";
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnalysisPage);
  } else {
    initAnalysisPage();
  }
})();
