GeoSafe Yogyakarta - Dark Rebuild
=================================

Cara membuka:
1. Ekstrak ZIP.
2. Buka folder project di VS Code.
3. Jalankan dengan Live Server / local server.
   Jangan membuka HTML langsung dari file:// karena browser bisa memblokir fetch CSV/JSON.

Struktur penting:
- index.html             : dashboard utama
- peta.html              : peta interaktif Leaflet
- analisis.html          : grafik, tabel, dan narasi analisis
- berita.html            : katalog sumber berita/referensi
- assets/styles/         : semua CSS tampilan web
- assets/js/             : semua script web
- assets/data/           : CSV, GeoJSON, JSON pembobotan
- assets/img/gallery/    : placeholder gambar konteks web

Perbaikan zona kerawanan:
- Layer utama dibaca dari assets/data/zona_kerawanan.geojson
- Field klasifikasi yang dibaca: Klasifikas
- Kelas warna:
  Aman          : hijau lembut
  Rawan         : krem/gold
  Sangat Rawan  : merah gelap
- Ringkasan pembobotan tersedia di assets/data/hasil_pembobotan_zona.json

Mengganti gambar hero:
- Saat ini dashboard utama tidak memakai gambar latar tetap.
- Tambahkan gambar baru ke assets/img/, lalu jadikan background pada .hero::before atau .hero-image-slot di assets/styles/home.css.

Mengganti gambar galeri:
- Ganti file SVG di assets/img/gallery/ dengan foto/ilustrasi sendiri.
- Nama file bisa dipertahankan agar HTML tidak perlu diubah.
