// ============================================================
// GeoSafe Yogyakarta - analisis.js
// Membaca Data Kejahatan Klitih.csv lalu membuat diagram, berita,
// tabel prioritas, insight spasial sederhana, dan narasi otomatis.
// ============================================================

const INCIDENT_CSV_PATH = "assets/data/Data%20Kejahatan%20Klitih.csv";
const ZONE_WEIGHT_PATH = "assets/data/hasil_pembobotan_zona.json";
const FALLBACK_INCIDENT_ROWS = [
  {
    "No": "1",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-01-12",
    "Bujur": "110,61",
    "Lintang": "-8,13",
    "Kecamatan": "Tanjungsari"
  },
  {
    "No": "2",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-01-15",
    "Bujur": "110,42",
    "Lintang": "7,83",
    "Kecamatan": "Piyungan"
  },
  {
    "No": "1",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-02-07",
    "Bujur": "110,3047",
    "Lintang": "7,8014",
    "Kecamatan": "Gondomanan"
  },
  {
    "No": "",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-02-25",
    "Bujur": "110,324",
    "Lintang": "-7,821",
    "Kecamatan": "Kasihan"
  },
  {
    "No": "2",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-03-24",
    "Bujur": "110,359",
    "Lintang": "-7,783",
    "Kecamatan": "Jetis"
  },
  {
    "No": "",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-04-16",
    "Bujur": "110,456",
    "Lintang": "-7,779",
    "Kecamatan": "Berbah"
  },
  {
    "No": "",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-05-03",
    "Bujur": "110,326",
    "Lintang": "-7,887",
    "Kecamatan": "Bantul"
  },
  {
    "No": "",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-05-07",
    "Bujur": "110,332",
    "Lintang": "-7,86",
    "Kecamatan": "Sewon"
  },
  {
    "No": "",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-05-20",
    "Bujur": "110,387",
    "Lintang": "-7,914",
    "Kecamatan": "Imogiri"
  },
  {
    "No": "3",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-05-27",
    "Bujur": "110,369",
    "Lintang": "-7,8",
    "Kecamatan": "Gondomanan"
  },
  {
    "No": "",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-08-13",
    "Bujur": "110,308",
    "Lintang": "-7,72",
    "Kecamatan": "Seyegan"
  },
  {
    "No": "4",
    "URL": "https://rri.co.id/yogyakarta/kriminalitas/500294/jpw-belasan-kejahatan-jalanan-di-diy-selama-2023",
    "Tanggal_up": "2023-10-01",
    "Bujur": "110,352",
    "Lintang": "-7,812",
    "Kecamatan": "Mantrijeron"
  },
  {
    "No": "",
    "URL": "https://newsmaker.tribunnews.com/2023/11/01/update-kasus-klitih-di-karanganyar-5-tersangka-masih-anak-anak-polisi-sebut-pelaku-bisa-bertambah",
    "Tanggal_up": "2023-10-21",
    "Bujur": "111,13",
    "Lintang": "-7,62",
    "Kecamatan": "Karangpandan"
  },
  {
    "No": "",
    "URL": "https://twitter.com/chocohzelnutt/status/1345401904914784256",
    "Tanggal_up": "2021-01-01",
    "Bujur": "110.375",
    "Lintang": "-7.865",
    "Kecamatan": "Banguntapan"
  },
  {
    "No": "",
    "URL": "https://twitter.com/DennyPriyono/status/1345506728310280192",
    "Tanggal_up": "2021-01-01",
    "Bujur": "110.307",
    "Lintang": "-7.728",
    "Kecamatan": "Sleman"
  },
  {
    "No": "",
    "URL": "https://twitter.com/mystingray91/status/1345885972454461440",
    "Tanggal_up": "2021-01-03",
    "Bujur": "110.307",
    "Lintang": "-7.728",
    "Kecamatan": "Sleman"
  },
  {
    "No": "",
    "URL": "https://twitter.com/nisfiani16/status/1346463231586406401",
    "Tanggal_up": "2021-01-04",
    "Bujur": "110.215",
    "Lintang": "-7.760",
    "Kecamatan": "Minggir"
  },
  {
    "No": "5",
    "URL": "7 Kawasan di Jogja yang Pernah Terjadi Klitih, Nomor 7 Malah di Pusat Keramaian",
    "Tanggal_up": "2022-04-03",
    "Bujur": "110,4019",
    "Lintang": "-7,8094",
    "Kecamatan": "Umbulharjo"
  },
  {
    "No": "6",
    "URL": "7 Kawasan di Jogja yang Pernah Terjadi Klitih, Nomor 7 Malah di Pusat Keramaian",
    "Tanggal_up": "2022-01-12",
    "Bujur": "110,3726",
    "Lintang": "-7,8034",
    "Kecamatan": "Pakualaman"
  },
  {
    "No": "7",
    "URL": "Daftar Lengkap Aksi Klitih di Jogja Sepanjang 2022, Warga Cari Obat dan Sahur Jadi Korban Kekerasan - ERA.ID",
    "Tanggal_up": "2022-01-01",
    "Bujur": "110,3759",
    "Lintang": "-7,7898",
    "Kecamatan": "Danurejan"
  },
  {
    "No": "8",
    "URL": "Daftar Lengkap Aksi Klitih di Jogja Sepanjang 2022, Warga Cari Obat dan Sahur Jadi Korban Kekerasan - ERA.ID",
    "Tanggal_up": "2022-01-28",
    "Bujur": "110,3677",
    "Lintang": "-7,7757",
    "Kecamatan": "Jetis"
  },
  {
    "No": "9",
    "URL": "Daftar Lengkap Aksi Klitih di Jogja Sepanjang 2022, Warga Cari Obat dan Sahur Jadi Korban Kekerasan - ERA.ID",
    "Tanggal_up": "2022-02-08",
    "Bujur": "110,3738",
    "Lintang": "-7,8176",
    "Kecamatan": "Mergangsan"
  },
  {
    "No": "10",
    "URL": "Daftar Lengkap Aksi Klitih di Jogja Sepanjang 2022, Warga Cari Obat dan Sahur Jadi Korban Kekerasan - ERA.ID",
    "Tanggal_up": "2022-02-20",
    "Bujur": "110,3672",
    "Lintang": "-7,7836",
    "Kecamatan": "Jetis"
  },
  {
    "No": "11",
    "URL": "7 Kawasan di Jogja yang Pernah Terjadi Klitih, Nomor 7 Malah di Pusat Keramaian",
    "Tanggal_up": "2021-10-31",
    "Bujur": "110,4088",
    "Lintang": "-7,7827",
    "Kecamatan": "Danurejan"
  },
  {
    "No": "12",
    "URL": "Baca Jogja – Aksi Brutal Geng Klitih di Kota Yogyakarta, Satu Korban Meninggal",
    "Tanggal_up": "2021-07-31",
    "Bujur": "110,3644",
    "Lintang": "-7,7798",
    "Kecamatan": "Jetis"
  },
  {
    "No": "13",
    "URL": "Baca Jogja – Polres Sleman Tangkap Enam Pelaku Klitih Jalan Kaliurang",
    "Tanggal_up": "2021-12-27",
    "Bujur": "110,3895",
    "Lintang": "-7,7285",
    "Kecamatan": "Ngaglik"
  },
  {
    "No": "14",
    "URL": "Harian Jogja – Tawuran Pecah di Jalan Kaliurang, Satu Korban Dibacok",
    "Tanggal_up": "2021-12-27",
    "Bujur": "110,3895",
    "Lintang": "-7,7285",
    "Kecamatan": "Ngaglik"
  },
  {
    "No": "15",
    "URL": "iNews Yogya – Polres Sleman Tangkap 6 Pelaku Klitih di Jalan Kaliurang",
    "Tanggal_up": "2021-12-28",
    "Bujur": "110,3928",
    "Lintang": "-7,7209",
    "Kecamatan": "Ngaglik"
  },
  {
    "No": "16",
    "URL": "JPNN Jogja – Pelaku Klitih Jalan Kaliurang Diringkus Polisi",
    "Tanggal_up": "2021-12-28",
    "Bujur": "110,3895",
    "Lintang": "-7,7285",
    "Kecamatan": "Ngaglik"
  },
  {
    "No": "17",
    "URL": "Inilah Jogja – Kekejaman Klitih di Jalan Kaliurang",
    "Tanggal_up": "2021-12-29",
    "Bujur": "110,3895",
    "Lintang": "-7,7285",
    "Kecamatan": "Ngaglik"
  },
  {
    "No": "18",
    "URL": "https://borobudurnews.com/fakta-terbaru-kasus-klitih-jogja-tewaskan-bocah-14-tahun-polisi-temukan-celurit-dan-gir/",
    "Tanggal_up": "2021-07-31",
    "Bujur": "110.36651072144824",
    "Lintang": "-7.778128990804081",
    "Kecamatan": "Jetis"
  },
  {
    "No": "20",
    "URL": "https://borobudurnews.com/pulang-kerja-pemuda-di-jogja-dibacok-rombongan-diduga-klitih/",
    "Tanggal_up": "2021-08-26",
    "Bujur": "110.3297268",
    "Lintang": "-7.835412",
    "Kecamatan": "Umbulharjo"
  },
  {
    "No": "21",
    "URL": "https://www.kompas.id/artikel/pulang-main-gim-tiga-pemuda-jadi-korban-klitih-di-yogyakarta",
    "Tanggal_up": "2021-01-20",
    "Bujur": "110.3880675",
    "Lintang": "-7.819137",
    "Kecamatan": "Umbulharjo"
  },
  {
    "No": "22",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/4",
    "Tanggal_up": "2021-01-01",
    "Bujur": "110.3500539",
    "Lintang": "-7.8028914",
    "Kecamatan": "Wirobrajan"
  },
  {
    "No": "23",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/5",
    "Tanggal_up": "2021-01-08",
    "Bujur": "110.3619767",
    "Lintang": "-7.8199858",
    "Kecamatan": "Mantrijeron"
  },
  {
    "No": "24",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/6",
    "Tanggal_up": "2021-01-26",
    "Bujur": "110.3500539",
    "Lintang": "-7.8028914",
    "Kecamatan": "Wirobrajan"
  },
  {
    "No": "25",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/8",
    "Tanggal_up": "2021-04-14",
    "Bujur": "110.3770867",
    "Lintang": "-7.8178415",
    "Kecamatan": "Kotagede"
  },
  {
    "No": "26",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/9",
    "Tanggal_up": "2021-05-27",
    "Bujur": "110.3622107",
    "Lintang": "-7.786428",
    "Kecamatan": "Gondokusuman"
  },
  {
    "No": "27",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/10",
    "Tanggal_up": "2021-10-14",
    "Bujur": "110.3747535",
    "Lintang": "-7.8111652",
    "Kecamatan": "Umbulharjo"
  },
  {
    "No": "28",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/11",
    "Tanggal_up": "2021-08-05",
    "Bujur": "110.3571386",
    "Lintang": "-7.8020894",
    "Kecamatan": "Gondomanan"
  },
  {
    "No": "29",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/12",
    "Tanggal_up": "2021-07-31",
    "Bujur": "110.3530417",
    "Lintang": "-7.7816014",
    "Kecamatan": "Jetis"
  },
  {
    "No": "30",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/13",
    "Tanggal_up": "2021-11-21",
    "Bujur": "110.3537647",
    "Lintang": "-7.8143171",
    "Kecamatan": "Mergangsan"
  },
  {
    "No": "31",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/14",
    "Tanggal_up": "2021-10-30",
    "Bujur": "110.3454656",
    "Lintang": "-7.8152551",
    "Kecamatan": "Umbulharjo"
  },
  {
    "No": "32",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/15",
    "Tanggal_up": "2021-11-28",
    "Bujur": "110.3385292",
    "Lintang": "-7.7804175",
    "Kecamatan": "Tegalrejo"
  },
  {
    "No": "33",
    "URL": "https://kumparan.com/kumparannews/waspada-ini-lokasi-laporan-kejahatan-jalanan-klitih-di-yogya-sepanjang-2021-1xD6XmJ2u3q/16",
    "Tanggal_up": "2021-11-06",
    "Bujur": "110.3619767",
    "Lintang": "-7.8199858",
    "Kecamatan": "Mantrijeron"
  },
  {
    "No": "34",
    "URL": "https://www.espos.id/tag/polsek-umbulharjo",
    "Tanggal_up": "2021-08-26",
    "Bujur": "110.3454656",
    "Lintang": "-7.8152551",
    "Kecamatan": "Umbulharjo"
  },
  {
    "No": "35",
    "URL": "https://jogja.idntimes.com/news/jogja/tunggul-damarjati/pelaku-klitih-tewaskan-pelajar-ngaku-korban-salah-tangkap",
    "Tanggal_up": "2022-6-28",
    "Bujur": "110.3995595",
    "Lintang": "-7.8113361",
    "Kecamatan": "Gedongkuning, Kotagede"
  },
  {
    "No": "36",
    "URL": "https://www.suara.com/news/2022/01/02/084315/klitih-kembali-teror-warga-yogyakarta-pemuda-jadi-korban-pembacokan",
    "Tanggal_up": "2022-01-02",
    "Bujur": "110.3668117",
    "Lintang": "-7.7926923",
    "Kecamatan": "Kecamatan Danurejan, Kota Yogyakarta"
  },
  {
    "No": "37",
    "URL": "https://www.youtube.com/watch?v=6FmtzQ7_IPo",
    "Tanggal_up": "2022-02-07",
    "Bujur": "110.367631",
    "Lintang": "-7.801324",
    "Kecamatan": "kecamatan gondomana"
  },
  {
    "No": "38",
    "URL": "https://www.krjogja.com/yogyakarta/1242459763/pelaku-curanmor-ditangkap-sempat-dorong-motor-curian-sejauh-5-km",
    "Tanggal_up": "2022-11-07",
    "Bujur": "110.3622107",
    "Lintang": "-7.786428",
    "Kecamatan": "Gondokusuman"
  },
  {
    "No": "39",
    "URL": "https://yogyakarta.kompas.com/read/2022/04/11/151500878/pelaku-penyerangan-yang-tewaskan-anak-anggota-dprd-kebumen-ada-yang",
    "Tanggal_up": "2022-04-11",
    "Bujur": "110.3995595",
    "Lintang": "-7.8113361",
    "Kecamatan": "Kotagede"
  },
  {
    "No": "40",
    "URL": "https://news.okezone.com/read/2023/03/24/510/2786735/klitih-terjadi-saat-ramadhan-di-yogyakarta-korban-seorang-pelajar",
    "Tanggal_up": "2023-03-24",
    "Bujur": "110.3549897",
    "Lintang": "-7.7859238",
    "Kecamatan": "Jalan Tentara Rakyat Mataram, Jetis"
  },
  {
    "No": "42",
    "URL": "https://jogja.suara.com/read/2023/10/01/140000/klitih-di-kota-jogja-satu-orang-luka-polisi-dalami-identitas-pelaku",
    "Tanggal_up": "2023-10-01",
    "Bujur": "110.3421526",
    "Lintang": "-7.8460639",
    "Kecamatan": "Jalan Bantul, Mantrijeron"
  },
  {
    "No": "43",
    "URL": "https://jogja.polri.go.id/polda/tribrata-news/online/detail/polda-diy-berhasil-meringkus-tersangka-pencurian-dengan-pemberatan-atas-laptop-jaksa-penuntut-komisi-pemberantasan-korupsi--kpk-.html",
    "Tanggal_up": "2022-12-24",
    "Bujur": "110.3500539",
    "Lintang": "-7.8028914",
    "Kecamatan": "Wirobrajan"
  },
  {
    "No": "44",
    "URL": "https://kumparan.com/tugujogja/angka-kriminalitas-di-kota-yogyakarta-meningkat-selama-2022-1zWQPgOGDCk",
    "Tanggal_up": "2023-05-27",
    "Bujur": "110.3888633",
    "Lintang": "-7.8020861",
    "Kecamatan": "Jalan Kusumanegara, Umbulharjo"
  },
  {
    "No": "45",
    "URL": "https://jogja.suara.com/read/2023/10/01/140000/klitih-di-kota-jogja-satu-orang-luka-polisi-dalami-identitas-pelaku",
    "Tanggal_up": "2023-10-01",
    "Bujur": "110.3421526",
    "Lintang": "-7.8460639",
    "Kecamatan": "Jalan Bantul, Gedongkiwo, Mantrijeron"
  },
  {
    "No": "48",
    "URL": "https://www.polresjogja.com/2022/01/konferensi-pers-polsek-umbulharjo.html",
    "Tanggal_up": "2022-01-12",
    "Bujur": "110.393103",
    "Lintang": "-7.809574",
    "Kecamatan": "Jalan Veteran, Umbulharjo"
  },
  {
    "No": "49",
    "URL": "https://www.benggala.com/2023/08/korban-sempat-diteriaki-klitih-polisi.html",
    "Tanggal_up": "2023-07-09",
    "Bujur": "110.3583665",
    "Lintang": "-7.7863631",
    "Kecamatan": "Selatan Tugu Yogyakarta"
  },
  {
    "No": "50",
    "URL": "https://bacajogja.id/2023/03/26/kronologi-klitih-bumijo-yogyakarta-polisi-tangkap-15-pelaku/",
    "Tanggal_up": "2023-03-26",
    "Bujur": "110.360645",
    "Lintang": "-7.783339",
    "Kecamatan": "Bumijo, Jetis"
  }
];

const KOTA_YOGYA_KECAMATAN = [
  "Danurejan", "Gedongtengen", "Gondokusuman", "Gondomanan", "Jetis", "Kotagede",
  "Kraton", "Mantrijeron", "Mergangsan", "Ngampilan", "Pakualaman", "Tegalrejo",
  "Umbulharjo", "Wirobrajan"
];

const state = {
  rawRows: [],
  incidents: [],
  filtered: [],
  areaStats: [],
  newsStats: [],
  charts: {},
  zoneWeights: [],
  zoneWeightLookup: new Map(),
  zoneWeightMeta: null
};

function cleanText(value) {
  return String(value ?? "").replace(/﻿/g, "").trim();
}

function escapeHtml(value) {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeNumber(value) {
  const text = cleanText(value).replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeLatitude(value) {
  let n = normalizeNumber(value);
  if(Number.isFinite(n) && n > 0 && n < 10) n = -n;
  return n;
}

function parseDate(value) {
  const text = cleanText(value);
  if(!text) return null;
  const d = new Date(text);
  if(Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDate(value) {
  const d = parseDate(value);
  if(!d) return cleanText(value) || "-";
  return d.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}

function yearOf(value) {
  const d = parseDate(value);
  return d ? String(d.getFullYear()) : "Tidak diketahui";
}

function monthKey(value) {
  const d = parseDate(value);
  if(!d) return "Tidak diketahui";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function isUrl(value) {
  return /^https?:\/\//i.test(cleanText(value));
}

function getDomain(value) {
  try {
    const url = new URL(cleanText(value));
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Sumber teks";
  }
}

function titleFromSource(value) {
  const text = cleanText(value);
  if(!text) return "Sumber tidak tersedia";
  if(!isUrl(text)) return text;
  try {
    const url = new URL(text);
    const slug = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || url.hostname);
    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\?.*$/, "")
      .replace(/\w/g, char => char.toUpperCase());
  } catch {
    return text;
  }
}

function sourceLabel(value) {
  const text = cleanText(value);
  if(!text) return "Tanpa sumber";
  return isUrl(text) ? getDomain(text) : text.split("–")[0].split("-")[0].trim();
}

function normalizeKecamatan(value) {
  const raw = cleanText(value);
  if(!raw) return "Tidak diketahui";
  const lower = raw.toLowerCase();
  const aliases = {
    "gondomana": "Gondomanan",
    "gondomanan": "Gondomanan",
    "danurejan": "Danurejan",
    "jetis": "Jetis",
    "tugu": "Jetis",
    "bumijo": "Jetis",
    "umbulharjo": "Umbulharjo",
    "mantrijeron": "Mantrijeron",
    "gedongkiwo": "Mantrijeron",
    "kotagede": "Kotagede",
    "gedongkuning": "Kotagede",
    "pakualaman": "Pakualaman",
    "mergangsan": "Mergangsan",
    "wirobrajan": "Wirobrajan",
    "tegalrejo": "Tegalrejo",
    "gondokusuman": "Gondokusuman",
    "gedongtengen": "Gedongtengen",
    "ngampilan": "Ngampilan",
    "kraton": "Kraton"
  };
  for(const [key, val] of Object.entries(aliases)) {
    if(lower.includes(key)) return val;
  }
  return raw
    .replace(/^kecamatan\s+/i, "")
    .replace(/,\s*kota yogyakarta/i, "")
    .trim()
    .replace(/\w/g, char => char.toUpperCase());
}

function isKotaYogya(kecamatan) {
  return KOTA_YOGYA_KECAMATAN.includes(normalizeKecamatan(kecamatan));
}

async function loadIncidentRows() {
  try {
    const res = await fetch(INCIDENT_CSV_PATH, { cache:"no-store" });
    if(!res.ok) throw new Error("CSV tidak ditemukan");
    const text = await res.text();
    const parsed = Papa.parse(text, { header:true, delimiter:";", skipEmptyLines:true });
    const rows = (parsed.data || []).filter(row => Object.values(row).some(v => cleanText(v)));
    if(!rows.length) throw new Error("CSV kosong");
    return rows;
  } catch(err) {
    console.warn("Memakai fallback data karena CSV gagal dibaca:", err.message);
    return FALLBACK_INCIDENT_ROWS;
  }
}

function enrichRows(rows) {
  return rows.map((row, index) => {
    const lng = normalizeNumber(row.Bujur ?? row.bujur ?? row.longitude ?? row.lng ?? row.lon);
    const lat = normalizeLatitude(row.Lintang ?? row.lintang ?? row.latitude ?? row.lat);
    const tanggal = cleanText(row.Tanggal_up ?? row.tanggal_up ?? row.tanggal ?? row.date);
    const kecamatan = normalizeKecamatan(row.Kecamatan ?? row.kecamatan ?? row.lokasi ?? row.location);
    const source = cleanText(row.URL ?? row.url ?? row.sumber ?? row.source);
    const no = cleanText(row.No ?? row.no ?? row.id ?? index + 1);
    const validCoord = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -10 && lat <= -5 && lng >= 108 && lng <= 113;
    return {
      id: `KLT-${String(index+1).padStart(3,"0")}`,
      no,
      tanggal,
      tahun: yearOf(tanggal),
      bulan: monthKey(tanggal),
      lat,
      lng,
      validCoord,
      kecamatan,
      kotaYogya: isKotaYogya(kecamatan),
      source,
      sourceType: isUrl(source) ? "url" : "title",
      domain: sourceLabel(source),
      title: titleFromSource(source),
      raw: row
    };
  }).filter(row => row.tanggal || row.kecamatan !== "Tidak diketahui" || row.source || row.validCoord);
}

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    kecamatan: params.get("kecamatan") || params.get("area") || "all",
    year: params.get("tahun") || params.get("year") || "all",
    scope: params.get("scope") || "all",
    source: params.get("source") || "all"
  };
}


async function loadZoneWeights() {
  try {
    const res = await fetch(ZONE_WEIGHT_PATH, { cache:"no-store" });
    if(!res.ok) throw new Error("File pembobotan zona tidak ditemukan");
    const data = await res.json();
    state.zoneWeightMeta = data;
    state.zoneWeights = data.zones || [];
    state.zoneWeightLookup = new Map(state.zoneWeights.map(zone => [normalizeKecamatan(zone.kecamatan), zone]));
  } catch (err) {
    console.warn(err.message);
    state.zoneWeightMeta = null;
    state.zoneWeights = [];
    state.zoneWeightLookup = new Map();
  }
}

function fallbackCategory(score) {
  const n = Number(score || 0);
  return n >= 70 ? "Tinggi" : n >= 45 ? "Sedang" : "Rendah";
}

function populateFilters() {
  const urlFilters = readFiltersFromUrl();
  const kecamatanList = [...new Set(state.incidents.map(r => r.kecamatan).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const yearList = [...new Set(state.incidents.map(r => r.tahun).filter(y => y && y !== "Tidak diketahui"))].sort((a,b)=>b.localeCompare(a));
  const kecSelect = document.getElementById("filterKecamatan");
  const yearSelect = document.getElementById("filterYear");
  kecSelect.innerHTML = '<option value="all">Semua</option>' + kecamatanList.map(k => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join("");
  yearSelect.innerHTML = '<option value="all">Semua</option>' + yearList.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join("");
  if([...kecSelect.options].some(o => o.value === urlFilters.kecamatan)) kecSelect.value = urlFilters.kecamatan;
  if([...yearSelect.options].some(o => o.value === urlFilters.year)) yearSelect.value = urlFilters.year;
  document.getElementById("filterScope").value = ["all","kota","luar"].includes(urlFilters.scope) ? urlFilters.scope : "all";
  document.getElementById("filterSource").value = ["all","url","title"].includes(urlFilters.source) ? urlFilters.source : "all";
}

function getActiveFilters() {
  return {
    kecamatan: document.getElementById("filterKecamatan").value,
    year: document.getElementById("filterYear").value,
    scope: document.getElementById("filterScope").value,
    source: document.getElementById("filterSource").value,
    topNews: Number(document.getElementById("filterTop").value || 9)
  };
}

function applyFilters() {
  const f = getActiveFilters();
  state.filtered = state.incidents.filter(row => {
    if(f.kecamatan !== "all" && row.kecamatan !== f.kecamatan) return false;
    if(f.year !== "all" && row.tahun !== f.year) return false;
    if(f.scope === "kota" && !row.kotaYogya) return false;
    if(f.scope === "luar" && row.kotaYogya) return false;
    if(f.source !== "all" && row.sourceType !== f.source) return false;
    return true;
  });
  state.areaStats = buildAreaStats(state.filtered);
  state.newsStats = buildNewsStats(state.filtered);
  renderAll();
}

function buildAreaStats(rows) {
  const map = new Map();
  rows.forEach(row => {
    const key = row.kecamatan || "Tidak diketahui";
    if(!map.has(key)) {
      map.set(key, { kecamatan:key, count:0, kotaYogya:isKotaYogya(key), years:new Set(), sources:new Map(), validCoords:0, rows:[] });
    }
    const item = map.get(key);
    item.count += 1;
    item.rows.push(row);
    if(row.tahun) item.years.add(row.tahun);
    if(row.validCoord) item.validCoords += 1;
    const src = sourceLabel(row.source);
    item.sources.set(src, (item.sources.get(src) || 0) + 1);
  });

  // Saat file pembobotan tersedia, tampilkan semua 14 kecamatan agar output analisis lengkap,
  // bukan hanya kecamatan yang lolos filter aktif.
  if(state.zoneWeightLookup && state.zoneWeightLookup.size) {
    state.zoneWeightLookup.forEach((zone, key) => {
      if(!map.has(key)) {
        map.set(key, { kecamatan:key, count:0, kotaYogya:isKotaYogya(key), years:new Set(), sources:new Map(), validCoords:0, rows:[] });
      }
    });
  }

  return [...map.values()].map(item => {
    const uniqueSources = item.sources.size;
    const dominantSource = [...item.sources.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";
    const repeatFactor = Math.min(35, item.count * 4);
    const sourceFactor = Math.min(20, uniqueSources * 4);
    const cityFactor = item.kotaYogya ? 12 : 5;
    const coordFactor = item.count ? Math.round((item.validCoords / item.count) * 5) : 0;
    const fallbackScore = Math.min(100, Math.round(28 + repeatFactor + sourceFactor + cityFactor + coordFactor));
    const zone = state.zoneWeightLookup.get(normalizeKecamatan(item.kecamatan));
    const score = zone ? Number(zone.skor_akhir ?? zone.skor_final ?? fallbackScore) : fallbackScore;
    const category = zone ? (zone.kategori || fallbackCategory(score)) : (score >= 75 ? "Tinggi" : score >= 55 ? "Sedang" : "Rendah");
    const direction = zone?.rekomendasi || (category === "Tinggi"
      ? "Prioritaskan validasi lapangan, overlay CCTV, dan pengecekan jam rawan."
      : category === "Sedang"
        ? "Pantau tren dan hubungkan dengan titik CCTV/keramaian."
        : "Gunakan sebagai pembanding; validasi ulang sebelum dijadikan prioritas utama.");
    return {
      ...item,
      uniqueSources,
      score,
      category,
      dominantSource,
      direction,
      zone,
      years:[...item.years].sort().join(", ") || (zone ? "-" : "")
    };
  }).sort((a,b)=>b.score-a.score || b.count-a.count || a.kecamatan.localeCompare(b.kecamatan));
}

function buildNewsStats(rows) {
  const map = new Map();
  rows.forEach(row => {
    const key = row.source || "Tanpa sumber";
    if(!map.has(key)) {
      map.set(key, { source:key, title:row.title, domain:row.domain, isUrl:isUrl(key), count:0, years:new Set(), kecamatan:new Set(), dates:[], rows:[] });
    }
    const item = map.get(key);
    item.count++;
    item.rows.push(row);
    if(row.tahun) item.years.add(row.tahun);
    if(row.kecamatan) item.kecamatan.add(row.kecamatan);
    const d = parseDate(row.tanggal);
    if(d) item.dates.push(d);
  });
  return [...map.values()].map(item => {
    item.yearsText = [...item.years].sort().join(", ") || "-";
    item.kecamatanText = [...item.kecamatan].slice(0,4).join(", ") + (item.kecamatan.size > 4 ? ` +${item.kecamatan.size-4} lain` : "");
    item.firstDate = item.dates.length ? new Date(Math.min(...item.dates.map(d=>d.getTime()))) : null;
    item.lastDate = item.dates.length ? new Date(Math.max(...item.dates.map(d=>d.getTime()))) : null;
    return item;
  }).sort((a,b)=>b.count-a.count || (b.lastDate?.getTime()||0) - (a.lastDate?.getTime()||0));
}

function countBy(rows, getter) {
  const map = new Map();
  rows.forEach(row => {
    const key = getter(row) || "Tidak diketahui";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a,b)=>b[1]-a[1]);
}

function renderAll() {
  renderSettings();
  renderStats();
  renderCharts();
  renderNews();
  renderInsights();
  renderTable();
  renderNarrative();
}

function renderSettings() {
  const f = getActiveFilters();
  const scopeText = f.scope === "kota" ? "Kota Yogyakarta" : f.scope === "luar" ? "Luar Kota Yogyakarta" : "Semua DIY";
  const sourceText = f.source === "url" ? "Tautan berita/medsos" : f.source === "title" ? "Judul/sumber tanpa link" : "Semua sumber";
  document.getElementById("settingsList").innerHTML = `
    <li><span>Kecamatan</span><b>${escapeHtml(f.kecamatan === "all" ? "Semua" : f.kecamatan)}</b></li>
    <li><span>Tahun</span><b>${escapeHtml(f.year === "all" ? "Semua" : f.year)}</b></li>
    <li><span>Cakupan</span><b>${escapeHtml(scopeText)}</b></li>
    <li><span>Sumber</span><b>${escapeHtml(sourceText)}</b></li>
    <li><span>Data terbaca</span><b>${state.filtered.length} titik</b></li>`;
}

function renderStats() {
  const rows = state.filtered;
  const validCoords = rows.filter(r => r.validCoord).length;
  const kota = rows.filter(r => r.kotaYogya).length;
  const uniqueAreas = new Set(rows.map(r => r.kecamatan)).size;
  const uniqueNews = state.newsStats.length;
  const topArea = state.areaStats[0]?.kecamatan || "-";
  const topScore = state.areaStats[0]?.score ?? 0;
  document.getElementById("statCards").innerHTML = `
    <article class="card stat-card"><div class="icon">📍</div><span>Total titik</span><strong>${rows.length}</strong><em>${validCoords} titik punya koordinat valid</em></article>
    <article class="card stat-card"><div class="icon">🏙️</div><span>Kota Yogyakarta</span><strong>${kota}</strong><em>${rows.length-kota} titik luar Kota Yogyakarta</em></article>
    <article class="card stat-card"><div class="icon">🗺️</div><span>Kecamatan terdampak</span><strong>${uniqueAreas}</strong><em>berdasarkan kolom kecamatan/lokasi</em></article>
    <article class="card stat-card"><div class="icon">⚠️</div><span>Prioritas tertinggi</span><strong>${escapeHtml(topArea)}</strong><em>skor risiko ${topScore}</em></article>`;
}

function destroyChart(id) {
  if(state.charts[id]) { state.charts[id].destroy(); state.charts[id] = null; }
}

function renderCharts() {
  const areaTop = state.areaStats.slice(0, 10);
  destroyChart("riskBarChart");
  state.charts.riskBarChart = new Chart(document.getElementById("riskBarChart"), {
    type:"bar",
    data:{ labels:areaTop.map(x=>x.kecamatan), datasets:[{ label:"Skor risiko", data:areaTop.map(x=>x.score), borderWidth:1, borderRadius:10, backgroundColor:"rgba(174,153,91,.76)", borderColor:"rgba(174,153,91,.95)" }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:"#1F1E2B" } } }, scales:{ x:{ ticks:{ color:"#6f5750" }, grid:{ color:"rgba(64,42,32,.10)" } }, y:{ beginAtZero:true, max:100, ticks:{ color:"#6f5750" }, grid:{ color:"rgba(64,42,32,.10)" } } } }
  });

  const kota = state.filtered.filter(r=>r.kotaYogya).length;
  const luar = state.filtered.length-kota;
  destroyChart("scopeDonutChart");
  state.charts.scopeDonutChart = new Chart(document.getElementById("scopeDonutChart"), {
    type:"doughnut",
    data:{ labels:["Kota Yogyakarta", "Luar Kota Yogyakarta"], datasets:[{ data:[kota, luar], backgroundColor:["rgba(179,61,56,.72)", "rgba(200,146,144,.64)"], borderColor:["rgba(179,61,56,.95)", "rgba(200,146,144,.90)"], borderWidth:1 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:"bottom", labels:{ color:"#1F1E2B" } } } }
  });

  const trend = countBy(state.filtered, r=>r.bulan).filter(([k])=>k !== "Tidak diketahui").sort((a,b)=>a[0].localeCompare(b[0]));
  destroyChart("trendLineChart");
  state.charts.trendLineChart = new Chart(document.getElementById("trendLineChart"), {
    type:"line",
    data:{ labels:trend.map(x=>x[0]), datasets:[{ label:"Jumlah titik", data:trend.map(x=>x[1]), tension:.35, fill:true, backgroundColor:"rgba(200,146,144,.20)", borderColor:"rgba(64,42,32,.92)", pointBackgroundColor:"rgba(179,61,56,.92)" }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:"#1F1E2B" } } }, scales:{ x:{ ticks:{ color:"#6f5750", maxRotation:45, minRotation:0 }, grid:{ color:"rgba(64,42,32,.10)" } }, y:{ beginAtZero:true, ticks:{ color:"#6f5750", precision:0 }, grid:{ color:"rgba(64,42,32,.10)" } } } }
  });

  const sources = state.newsStats.slice(0, 8);
  destroyChart("sourceBarChart");
  state.charts.sourceBarChart = new Chart(document.getElementById("sourceBarChart"), {
    type:"bar",
    data:{ labels:sources.map(x=>x.domain.length>20 ? x.domain.slice(0,20)+"…" : x.domain), datasets:[{ label:"Jumlah titik", data:sources.map(x=>x.count), borderWidth:1, borderRadius:10, backgroundColor:"rgba(179,61,56,.62)", borderColor:"rgba(179,61,56,.95)" }] },
    options:{ indexAxis:"y", responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:"#1F1E2B" } } }, scales:{ x:{ beginAtZero:true, ticks:{ color:"#6f5750", precision:0 }, grid:{ color:"rgba(64,42,32,.10)" } }, y:{ ticks:{ color:"#6f5750" }, grid:{ color:"rgba(64,42,32,.10)" } } } }
  });
}

function renderNews() {
  const f = getActiveFilters();
  const list = document.getElementById("newsList");
  const items = state.newsStats.slice(0, f.topNews);
  if(!items.length) {
    list.innerHTML = `<div class="news-card"><h4>Tidak ada sumber berita</h4><p>Data tidak ditemukan untuk filter aktif.</p></div>`;
    return;
  }
  list.innerHTML = items.map(item => {
    const dateRange = item.firstDate && item.lastDate
      ? `${item.firstDate.toLocaleDateString("id-ID", { month:"short", year:"numeric" })} - ${item.lastDate.toLocaleDateString("id-ID", { month:"short", year:"numeric" })}`
      : "Tanggal tidak lengkap";
    const safeTitle = escapeHtml(item.title.length > 96 ? item.title.slice(0,96)+"…" : item.title);
    const button = item.isUrl
      ? `<a class="btn primary" href="${escapeHtml(item.source)}" target="_blank" rel="noopener">Buka sumber</a>`
      : `<span class="btn" style="text-align:center;cursor:default">Judul/sumber teks</span>`;
    return `<article class="news-card">
      <div class="news-meta"><span class="tag live">${escapeHtml(item.domain)}</span><span class="tag">${item.count} titik</span><span class="tag">${escapeHtml(item.yearsText)}</span></div>
      <h4>${safeTitle}</h4>
      <p><b>Wilayah terkait:</b> ${escapeHtml(item.kecamatanText || "-")}</p>
      <p><b>Rentang data:</b> ${escapeHtml(dateRange)}</p>
      ${button}
    </article>`;
  }).join("");
}

function renderInsights() {
  const top = state.areaStats[0];
  const highAreas = state.areaStats.filter(a=>a.category === "Tinggi").length;
  const urlCount = state.filtered.filter(r=>r.sourceType === "url").length;
  const titleCount = state.filtered.filter(r=>r.sourceType === "title").length;
  const years = [...new Set(state.filtered.map(r=>r.tahun).filter(y=>y && y !== "Tidak diketahui"))].sort();
  const latestYear = years[years.length-1] || "-";
  const topNews = state.newsStats[0];
  document.getElementById("insightCards").innerHTML = `
    <div class="rec-card"><h4>Wilayah paling prioritas</h4><p>${top ? `<b>${escapeHtml(top.kecamatan)}</b> memiliki skor pembobotan tertinggi (${top.score}) dengan ${top.zone?.jumlah_kejadian ?? top.count} kejadian data dan ${top.zone?.jumlah_sumber_unik ?? top.uniqueSources} sumber.` : "Belum ada data untuk filter aktif."}</p></div>
    <div class="rec-card"><h4>Konsentrasi risiko</h4><p>Terdapat <b>${highAreas}</b> kecamatan kategori tinggi. Wilayah kategori tinggi lebih cocok dijadikan fokus validasi lapangan, pengecekan blind spot, dan overlay CCTV.</p></div>
    <div class="rec-card"><h4>Kualitas sumber</h4><p>Dari data aktif, <b>${urlCount}</b> titik punya tautan berita/medsos dan <b>${titleCount}</b> titik berupa judul/sumber teks tanpa link.</p></div>
    <div class="rec-card"><h4>Periode terbaru</h4><p>Tahun terbaru dalam filter aktif adalah <b>${escapeHtml(latestYear)}</b>. Tren perlu dibaca sebagai data berbasis unggahan/sumber, bukan statistik resmi kepolisian.</p></div>
    <div class="rec-card"><h4>Sumber dominan</h4><p>${topNews ? `<b>${escapeHtml(topNews.domain)}</b> menjadi sumber paling sering muncul dengan ${topNews.count} titik.` : "Tidak ada sumber dominan."}</p></div>
    <div class="rec-card"><h4>Arahan analisis lanjutan</h4><p>Gabungkan titik kejadian dengan layer CCTV, jam kejadian, kepadatan jalan, sekolah, ruang publik, dan laporan patroli agar interpretasi lebih kuat.</p></div>`;
}

function renderTable() {
  const tbody = document.querySelector("#analysisTable tbody");
  if(!state.areaStats.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Tidak ada data untuk filter aktif.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.areaStats.map((row, idx) => {
    const tagClass = row.category === "Tinggi" ? "high" : row.category === "Sedang" ? "med" : "low";
    const z = row.zone || {};
    const jumlahTitik = z.jumlah_kejadian ?? row.count;
    const detail = row.zone
      ? `Kejadian ${z.indeks_kejadian} · Kepadatan ${z.indeks_kepadatan} · CCTV ${z.indeks_blindspot_cctv} · Sumber ${z.indeks_sumber}`
      : `Skor dinamis dari ${row.count} titik aktif`;
    return `<tr>
      <td>${idx+1}</td>
      <td><b>${escapeHtml(row.kecamatan)}</b><br><span class="muted">${row.kotaYogya ? "Kota Yogyakarta" : "Luar Kota Yogyakarta/DIY"}</span></td>
      <td>${jumlahTitik}<br><span class="muted">aktif filter: ${row.count}</span></td>
      <td><b>${row.score}</b>/100</td>
      <td><span class="tag ${tagClass}">${row.category}</span></td>
      <td>${escapeHtml(row.dominantSource)}<br><span class="muted">${z.jumlah_sumber_unik ?? row.uniqueSources} sumber · tahun ${escapeHtml(row.years || "-")}</span></td>
      <td>${escapeHtml(detail)}<br><span class="muted">${z.kejadian_tercakup_cctv_500m ?? 0} tercakup CCTV ≤500 m · ${z.blindspot_kejadian ?? 0} blind spot</span></td>
      <td>${escapeHtml(row.direction)}</td>
    </tr>`;
  }).join("");
}

function renderNarrative() {
  const rows = state.filtered;
  const top = state.areaStats[0];
  const second = state.areaStats[1];
  const kota = rows.filter(r=>r.kotaYogya).length;
  const luar = rows.length-kota;
  const years = [...new Set(rows.map(r=>r.tahun).filter(y=>y && y !== "Tidak diketahui"))].sort();
  const sourceUrl = rows.filter(r=>r.sourceType === "url").length;
  const high = state.areaStats.filter(a=>a.category === "Tinggi");

  if(!rows.length) {
    document.getElementById("narrative").innerHTML = "Tidak ada data yang sesuai dengan filter aktif. Coba ubah kecamatan, tahun, cakupan wilayah, atau sumber data.";
    return;
  }

  document.getElementById("narrative").innerHTML = `
    <p>Berdasarkan filter aktif, sistem membaca <b>${rows.length} titik kejadian klitih</b> dari data CSV dan menggabungkannya dengan <b>${state.zoneWeights.length || state.areaStats.length} hasil pembobotan zona</b>. Sebanyak <b>${kota}</b> titik masuk ke kecamatan Kota Yogyakarta, sedangkan <b>${luar}</b> titik berada di luar Kota Yogyakarta atau wilayah DIY lain. Rentang tahun yang terbaca adalah <b>${escapeHtml(years.join(", ") || "tidak diketahui")}</b>.</p>
    <p>Wilayah dengan prioritas tertinggi adalah <b>${escapeHtml(top?.kecamatan || "-")}</b>${second ? `, disusul <b>${escapeHtml(second.kecamatan)}</b>` : ""}. Skor tinggi tidak otomatis berarti wilayah tersebut paling berbahaya secara resmi, tetapi menunjukkan kombinasi kejadian, kepadatan penduduk, gap/blind spot CCTV, dan keragaman sumber yang lebih kuat dalam data yang digunakan.</p>
    <p>Daftar berita menunjukkan <b>${sourceUrl}</b> titik memiliki tautan langsung ke sumber berita atau media sosial. Sumber tanpa tautan tetap ditampilkan sebagai rujukan, tetapi perlu divalidasi kembali bila analisis akan dipakai untuk laporan resmi atau pengambilan keputusan operasional.</p>
    <p>Arahan awal dari hasil ini adalah memprioritaskan <b>${high.length}</b> kecamatan kategori tinggi untuk dicek pada peta, dibandingkan dengan sebaran CCTV, koridor jalan, dan titik keramaian. Analisis berikutnya sebaiknya menambahkan waktu kejadian, jenis korban, jenis pelaku, kondisi jalan, dan status penanganan kasus agar hasil tidak hanya berbasis jumlah titik.</p>`;
}

function exportCsv() {
  const rows = state.areaStats;
  const header = ["peringkat", "kecamatan", "jumlah_titik", "aktif_filter", "skor_pembobotan", "kategori", "indeks_kejadian", "indeks_kepadatan", "indeks_blindspot_cctv", "indeks_sumber", "sumber_dominan", "tahun", "arahan_analisis"];
  const lines = [header.join(",")].concat(rows.map((r, idx) => [
    idx+1,
    r.kecamatan,
    (r.zone?.jumlah_kejadian ?? r.count),
    r.count,
    r.score,
    r.category,
    (r.zone?.indeks_kejadian ?? ""),
    (r.zone?.indeks_kepadatan ?? ""),
    (r.zone?.indeks_blindspot_cctv ?? ""),
    (r.zone?.indeks_sumber ?? ""),
    r.dominantSource,
    r.years,
    r.direction
  ].map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")));
  const blob = new Blob([lines.join("\n")], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hasil_analisis_klitih_crimescope.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function boot() {
  await loadZoneWeights();
  state.rawRows = await loadIncidentRows();
  state.incidents = enrichRows(state.rawRows);
  populateFilters();
  ["filterKecamatan", "filterYear", "filterScope", "filterSource", "filterTop"].forEach(id => {
    document.getElementById(id).addEventListener("change", applyFilters);
  });
  document.getElementById("resetFilter").addEventListener("click", () => {
    document.getElementById("filterKecamatan").value = "all";
    document.getElementById("filterYear").value = "all";
    document.getElementById("filterScope").value = "all";
    document.getElementById("filterSource").value = "all";
    document.getElementById("filterTop").value = "9";
    applyFilters();
  });
  document.getElementById("exportCsv").addEventListener("click", exportCsv);
  const mobileToggle = document.getElementById("mobileToggle");
  const nav = document.getElementById("navlinks");
  if(mobileToggle && nav) mobileToggle.addEventListener("click", () => nav.style.display = nav.style.display === "flex" ? "none" : "flex");
  applyFilters();
}

document.addEventListener("DOMContentLoaded", boot);
