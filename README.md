# 🚰 Visualisasi Pipa Sumur Bor

Aplikasi web interaktif untuk memvisualisasikan konstruksi sumur bor, termasuk pipa, saringan (screen), open hole, muka air tanah (MAT), serta dilengkapi fitur dokumentasi lengkap.

Proyek ini dirancang untuk membantu para insinyur geoteknik, hidrogeologi, atau teknisi lapangan dalam merancang dan mendokumentasikan spesifikasi sumur bor secara visual dan terstruktur.

## ✨ Fitur Utama

- **Visualisasi Dinamis**: Gambarkan pipa, saringan, dan open hole secara proporsional dalam kanvas.
- **Titik Acuan & MAT**: Atur posisi permukaan tanah dan level muka air tanah yang dinamis.
- **Manajemen Komponen**:
  - Tambah pipa utama dengan kedalaman tertentu.
  - Tambah saringan (screen) di kedalaman dan panjang yang diinginkan.
  - Atur open hole di dasar sumur.
- **Data Teknis Sumur**: Isi informasi perusahaan, lokasi, koordinat, elevasi, kedalaman pompa, dll.
- **Dokumentasi Terintegrasi**:
  - Unggah foto borehole dan diagram.
  - 6 kategori dokumentasi (papan nama, sumur, persiapan, kegiatan, pipa PVC, pompa).
  - Setiap kategori mendukung hingga 3 foto.
- **Export/Reset Data**: Mulai ulang atau simpan data untuk laporan.

## 🧑‍💻 Teknologi yang Digunakan

- **HTML5**: Struktur halaman dan form input.
- **CSS3**: Styling, layout responsif (Flexbox/Grid), dan animasi.
- **JavaScript (ES6+)**: Logika visualisasi, manajemen state, dan interaksi DOM.
- **Canvas API**: Menggambar pipa, saringan, MAT, dan skala kedalaman.
- **LocalStorage** (opsional): Menyimpan data sumur sementara.
- **FileReader API**: Upload dan preview gambar dokumentasi.
