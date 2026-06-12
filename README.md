# PlantCare AI — Prototipe Web Analisis Tanaman

Fitur yang sudah tersedia:

- Membuka kamera belakang pada ponsel
- Mengambil gambar tanaman
- Mengunggah gambar dari galeri
- Pertanyaan gejala tanaman
- Mesin aturan sistem pakar
- Analisis warna gambar sederhana
- Hasil diagnosis, penyebab, dan rekomendasi
- Penyimpanan riwayat dengan localStorage
- Tampilan responsif untuk ponsel

## Cara menjalankan

Kamera browser umumnya hanya bekerja melalui `localhost` atau HTTPS.

### Pilihan 1 — VS Code Live Server

1. Buka folder proyek di VS Code.
2. Pasang extension **Live Server**.
3. Klik kanan `index.html`.
4. Pilih **Open with Live Server**.

### Pilihan 2 — Python

Buka terminal di folder proyek:

```bash
python -m http.server 8000
```

Kemudian buka:

```text
http://localhost:8000
```

## Penting

Versi ini adalah prototipe sistem pakar. Analisis gambar menggunakan statistik warna sederhana, belum model AI yang dilatih menggunakan dataset penyakit tanaman.

Agar menjadi AI sungguhan:

1. Kumpulkan dataset untuk setiap kelas penyakit.
2. Latih model klasifikasi gambar, misalnya dengan Teachable Machine atau TensorFlow.
3. Ekspor model ke TensorFlow.js.
4. Ganti fungsi `calculateImageStats()` dan pemilihan diagnosis di `js/app.js` dengan hasil prediksi model.
5. Tetap gunakan pertanyaan gejala sebagai penguat diagnosis.

## Struktur

- `index.html` — seluruh tampilan
- `css/style.css` — desain responsif
- `js/app.js` — kamera, navigasi, penyimpanan, dan hasil
- `js/diagnosis-engine.js` — basis aturan sistem pakar
