/* =========================================================
   GeoSafe Yogyakarta - Data Dashboard + Helper Functions
   ---------------------------------------------------------
   File ini sengaja dibuat global/namespace agar aman dipakai
   oleh peta.html, analisis.html, dan berita.html.
========================================================= */
(function () {
  const demoAreas = [
    { id: 1, kecamatan: "Danurejan", lat: -7.7928, lng: 110.3671, kasus: 84, risiko: 74, kategori: "Tinggi", dominan: "Pencurian", kepadatan: 18200, kemiskinan: 7.8, tpt: 4.6, crimes: { curat: 25, curanmor: 22, penganiayaan: 12, narkotika: 9, penipuan: 16 } },
    { id: 2, kecamatan: "Gedongtengen", lat: -7.7897, lng: 110.3602, kasus: 91, risiko: 82, kategori: "Tinggi", dominan: "Curanmor", kepadatan: 16600, kemiskinan: 8.4, tpt: 4.9, crimes: { curat: 20, curanmor: 32, penganiayaan: 9, narkotika: 10, penipuan: 20 } },
    { id: 3, kecamatan: "Gondokusuman", lat: -7.7829, lng: 110.3848, kasus: 76, risiko: 68, kategori: "Sedang", dominan: "Penipuan", kepadatan: 13200, kemiskinan: 5.9, tpt: 4.2, crimes: { curat: 18, curanmor: 17, penganiayaan: 10, narkotika: 8, penipuan: 23 } },
    { id: 4, kecamatan: "Gondomanan", lat: -7.8032, lng: 110.3657, kasus: 62, risiko: 61, kategori: "Sedang", dominan: "Pencurian", kepadatan: 14800, kemiskinan: 6.7, tpt: 4.1, crimes: { curat: 21, curanmor: 13, penganiayaan: 8, narkotika: 6, penipuan: 14 } },
    { id: 5, kecamatan: "Jetis", lat: -7.7730, lng: 110.3650, kasus: 73, risiko: 70, kategori: "Tinggi", dominan: "Curanmor", kepadatan: 15000, kemiskinan: 6.1, tpt: 4.4, crimes: { curat: 16, curanmor: 25, penganiayaan: 12, narkotika: 7, penipuan: 13 } },
    { id: 6, kecamatan: "Kotagede", lat: -7.8212, lng: 110.3982, kasus: 47, risiko: 48, kategori: "Sedang", dominan: "Pencurian", kepadatan: 11800, kemiskinan: 5.7, tpt: 3.9, crimes: { curat: 15, curanmor: 11, penganiayaan: 7, narkotika: 4, penipuan: 10 } },
    { id: 7, kecamatan: "Kraton", lat: -7.8086, lng: 110.3631, kasus: 36, risiko: 41, kategori: "Rendah", dominan: "Penipuan", kepadatan: 9800, kemiskinan: 5.2, tpt: 3.5, crimes: { curat: 8, curanmor: 6, penganiayaan: 6, narkotika: 3, penipuan: 13 } },
    { id: 8, kecamatan: "Mantrijeron", lat: -7.8186, lng: 110.3588, kasus: 52, risiko: 50, kategori: "Sedang", dominan: "Curanmor", kepadatan: 10400, kemiskinan: 5.8, tpt: 3.8, crimes: { curat: 11, curanmor: 18, penganiayaan: 8, narkotika: 4, penipuan: 11 } },
    { id: 9, kecamatan: "Mergangsan", lat: -7.8118, lng: 110.3750, kasus: 58, risiko: 56, kategori: "Sedang", dominan: "Pencurian", kepadatan: 12000, kemiskinan: 6.4, tpt: 4.0, crimes: { curat: 18, curanmor: 14, penganiayaan: 9, narkotika: 5, penipuan: 12 } },
    { id: 10, kecamatan: "Ngampilan", lat: -7.8018, lng: 110.3583, kasus: 49, risiko: 53, kategori: "Sedang", dominan: "Penipuan", kepadatan: 15700, kemiskinan: 7.0, tpt: 4.3, crimes: { curat: 10, curanmor: 12, penganiayaan: 7, narkotika: 5, penipuan: 15 } },
    { id: 11, kecamatan: "Pakualaman", lat: -7.8002, lng: 110.3759, kasus: 38, risiko: 44, kategori: "Rendah", dominan: "Pencurian", kepadatan: 9200, kemiskinan: 5.1, tpt: 3.6, crimes: { curat: 12, curanmor: 8, penganiayaan: 5, narkotika: 3, penipuan: 10 } },
    { id: 12, kecamatan: "Tegalrejo", lat: -7.7758, lng: 110.3547, kasus: 64, risiko: 60, kategori: "Sedang", dominan: "Curanmor", kepadatan: 12600, kemiskinan: 6.2, tpt: 4.1, crimes: { curat: 13, curanmor: 22, penganiayaan: 10, narkotika: 6, penipuan: 13 } },
    { id: 13, kecamatan: "Umbulharjo", lat: -7.8155, lng: 110.3890, kasus: 88, risiko: 78, kategori: "Tinggi", dominan: "Curanmor", kepadatan: 13700, kemiskinan: 6.9, tpt: 4.5, crimes: { curat: 20, curanmor: 30, penganiayaan: 13, narkotika: 8, penipuan: 17 } },
    { id: 14, kecamatan: "Wirobrajan", lat: -7.8088, lng: 110.3477, kasus: 45, risiko: 46, kategori: "Sedang", dominan: "Pencurian", kepadatan: 11200, kemiskinan: 6.0, tpt: 3.9, crimes: { curat: 14, curanmor: 10, penganiayaan: 7, narkotika: 4, penipuan: 10 } }
  ];

  const crowdPoints = [];

    Papa.parse("assets/data/keramaian.csv", {
     download: true,
     header: true,
     complete: function(results) {

       results.data.forEach((item, index) => {

         if (!item.lat || !item.lng) return;

         crowdPoints.push({
           id: index + 1,
           nama: item.nama,
           kategori: item.kategori,
           lat: parseFloat(item.lat),
           lng: parseFloat(item.lng)
         });

       });

    console.log("Data keramaian loaded:", crowdPoints);

    // kalau mau langsung nampilin ke map
    if (window.renderCrowdPoints) {
      window.renderCrowdPoints(crowdPoints);
    }

  }
});
   
  const newsData = [
    {
      id: 1,
      source: "Contoh sumber berita",
      date: "Isi tanggal asli",
      tag: "Kota Yogyakarta",
      type: "Kejahatan jalanan",
      title: "Contoh headline berita kriminalitas di Kota Jogja",
      description: "Masukkan ringkasan pendek dari sumber asli agar pembaca dapat menghubungkan berita dengan pola spasial pada peta.",
      url: "#"
    },
    {
      id: 2,
      source: "Contoh sumber berita",
      date: "Isi tanggal asli",
      tag: "Keamanan lingkungan",
      type: "Curanmor",
      title: "Contoh berita curanmor dan pemetaan titik rawan",
      description: "Gunakan kartu ini untuk menampilkan ringkasan kasus dan arahkan pengguna ke sumber asli untuk verifikasi lanjutan.",
      url: "#"
    },
    {
      id: 3,
      source: "Contoh sumber berita",
      date: "Isi tanggal asli",
      tag: "Sosial perkotaan",
      type: "Pencurian",
      title: "Contoh poster berita pencurian di wilayah perkotaan",
      description: "Deskripsi ideal berisi lokasi umum, jenis kejadian, waktu publikasi, dan relevansi dengan peta risiko kriminalitas.",
      url: "#"
    },
    {
      id: 4,
      source: "Contoh sumber berita",
      date: "Isi tanggal asli",
      tag: "Patroli & pencegahan",
      type: "Penganiayaan",
      title: "Contoh ringkasan berita pengamanan kawasan publik",
      description: "Tampilan dibuat seperti selebaran digital agar menarik, tetapi tetap informatif untuk pembaca umum maupun instansi.",
      url: "#"
    },
    {
      id: 5,
      source: "Contoh sumber berita",
      date: "Isi tanggal asli",
      tag: "Data pendukung",
      type: "Penipuan",
      title: "Contoh berita penipuan dan literasi keamanan warga",
      description: "Pada versi statis, data berita diisi dari array newsData. Pada pengembangan lanjut, bagian ini dapat dihubungkan ke API berita atau basis data internal.",
      url: "#"
    },
    {
      id: 6,
      source: "Contoh sumber berita",
      date: "Isi tanggal asli",
      tag: "Narkotika",
      type: "Narkotika",
      title: "Contoh kartu berita operasi atau imbauan keamanan",
      description: "Kartu berita dapat difilter berdasarkan jenis isu sehingga halaman berita tetap rapi meskipun artikel bertambah.",
      url: "#"
    }
  ];

  function colorByRisk(kategori) {
    if (kategori === "Tinggi") return "#B33D38";
    if (kategori === "Sedang") return "#AE995B";
    return "#C89290";
  }

  function tagClass(kategori) {
    if (kategori === "Tinggi") return "tag-high";
    if (kategori === "Sedang") return "tag-mid";
    return "tag-low";
  }

  function crimeLabel(key) {
    const labels = {
      all: "Semua jenis",
      curat: "Pencurian/Curat",
      curanmor: "Curanmor",
      penganiayaan: "Penganiayaan",
      narkotika: "Narkotika",
      penipuan: "Penipuan"
    };
    return labels[key] || key || "Semua jenis";
  }

  function getAnalysisSettings() {
    try {
      return JSON.parse(localStorage.getItem("crimeScopeAnalysisSettings")) || {};
    } catch (e) {
      return {};
    }
  }

  function filterAreas(settings = {}) {
    const q = String(settings.search || "").trim().toLowerCase();
    const risk = settings.risk || "all";
    const crime = settings.crime || "all";
    const minRisk = Number(settings.minRisk || 0);

    return demoAreas.filter((area) => {
      const matchQ = !q || area.kecamatan.toLowerCase().includes(q);
      const matchRisk = risk === "all" || area.kategori === risk;
      const matchCrime = crime === "all" || (area.crimes && area.crimes[crime] > 0);
      const matchMin = area.risiko >= minRisk;
      return matchQ && matchRisk && matchCrime && matchMin;
    });
  }

  function aggregateCrimes(areas = []) {
    return areas.reduce((acc, area) => {
      Object.entries(area.crimes || {}).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + Number(value || 0);
      });
      return acc;
    }, {});
  }

  window.CrimeScopeData = {
    demoAreas,
    crowdPoints,
    newsData,
    colorByRisk,
    tagClass,
    crimeLabel,
    getAnalysisSettings,
    filterAreas,
    aggregateCrimes
  };

  // Backward compatibility untuk file lama yang masih memanggil nama fungsi langsung.
  window.demoAreas = demoAreas;
  window.newsData = newsData;
  window.colorByRisk = colorByRisk;
  window.tagClass = tagClass;
  window.crimeLabel = crimeLabel;
  window.getAnalysisSettings = getAnalysisSettings;
  window.filterAreas = filterAreas;
  window.aggregateCrimes = aggregateCrimes;
})();
