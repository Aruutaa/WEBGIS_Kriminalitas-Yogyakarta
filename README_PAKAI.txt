GeoSafe Yogyakarta - Paket HTML + CSS + JS fix

Isi paket ini:
- index.html
- peta.html
- analisis.html
- berita.html
- assets/styles/*.css
- assets/js/*.js

Tidak ada folder assets/data dan assets/img di paket ini. Data dan gambar kamu tetap pakai folder yang sudah ada.

File data yang akan dicari otomatis oleh assets/js/data-loader.js:
- assets/data/Data Kejahatan Klitih.csv
- assets/data/cctv_yogyakarta.csv
- assets/data/cctv_pemkot_yogyakarta_youtube_links.csv
- assets/data/keramaian.csv
- assets/data/zona_kerawanan.geojson
- assets/data/kota_yogyakarta_admin.geojson
- assets/data/hasil_pembobotan_zona.json
- assets/data/hasil_pembobotan_zona.csv
- assets/data/Data Pendukung - Sosial dan Ekonomi.csv

Catatan:
- Browser tidak bisa membaca isi folder secara otomatis, jadi nama file harus sesuai dengan daftar di atas.
- File kota_yogyakarta_admin.zip dan source_shapefile tidak dibaca langsung oleh Leaflet; yang dibaca adalah GeoJSON-nya.
- Jalankan web lewat Live Server / python -m http.server, bukan file://.
