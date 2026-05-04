# Tutorial Upload Database Supabase - HRD POMOSDA

Sistem Data Karyawan Yayasan Lil-Muqorrobien menggunakan **Supabase** sebagai database (berbasis PostgreSQL). Berikut adalah langkah-langkah untuk mengatur Supabase dan cara melakukan *upload* data.

## 1. Persiapan Proyek di Supabase
1. Buka [Supabase.com](https://supabase.com/) dan login (atau daftar jika belum punya akun).
2. Klik tombol **New Project**.
3. Pilih organisasi Anda, beri nama proyek (misal: `HRD-POMOSDA`), masukkan *Database Password* yang kuat, dan pilih *Region* terdekat (misal: Singapore).
4. Klik **Create new project** dan tunggu beberapa menit hingga proyek siap digunakan.

## 2. Membuat Tabel Database
Setelah proyek siap, kita perlu membuat tabel `users` dan `karyawan`. 
Anda bisa melakukannya melalui menu **SQL Editor** di menu sebelah kiri Supabase.

1. Buka menu **SQL Editor**.
2. Klik **New query**.
3. _Copy_ dan _Paste_ kode SQL berikut ini, lalu klik tombol **Run**:

```sql
-- Membuat Tabel Users (Untuk Login)
CREATE TABLE users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'karyawan')),
  nik text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Membuat Tabel Karyawan
CREATE TABLE karyawan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 1. Data Pribadi Karyawan
  nik text UNIQUE NOT NULL,
  nama_lengkap text NOT NULL,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  alamat_ktp text,
  nomor_hp text,
  email_pribadi text,
  status_perkawinan text,
  jumlah_anak integer DEFAULT 0,
  nomor_npwp text,
  nomor_bpjs text,
  status_kejamaahan text,
  
  -- 2. Informasi Pekerjaan (Administratif)
  tanggal_mulai_bekerja date,
  upt text,
  fungsi text,
  status_karyawan text CHECK (status_karyawan IN ('PTT', 'PTY', 'GTT', 'GTY')),
  total_jp integer,
  rincian_tugas text,
  
  -- 3. Data Kinerja & Kompetensi
  pendidikan_terakhir text,
  nama_sekolah text,
  riwayat_pelatihan text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 3. Konfigurasi Koneksi Node.js
Agar aplikasi Node.js Anda dapat terhubung ke Supabase:
1. Di *dashboard* Supabase, buka menu **Project Settings** (ikon gerigi) -> **API**.
2. Salin nilai **Project URL**.
3. Salin nilai **Project API keys (anon / public)**.
4. Buat file `.env` di folder proyek lokal Anda (satu tingkat dengan `server.js`) dan masukkan nilai tersebut:

```env
SUPABASE_URL=Masukkan_Project_URL_Disini
SUPABASE_ANON_KEY=Masukkan_Anon_Key_Disini
PORT=3000
JWT_SECRET=rahasia_jwt_super_aman_2026_hrd
```

## 4. Cara "Upload" (Insert) Data ke Database
Aplikasi ini sudah dilengkapi dengan API bawaan Node.js untuk melakukan *upload* data. 
Anda bisa menggunakannya melalui Admin Dashboard atau melalui Postman/Insomnia.

### Metode 1: Menggunakan Antarmuka Admin (Disarankan)
1. Jalankan aplikasi dengan perintah `node server.js`.
2. Buka `http://localhost:3000` di browser.
3. Login sebagai admin. (Catatan: buka URL `http://localhost:3000/api/setup` sekali saja untuk membuat akun admin `admin@pomosda.id` / `admin123`).
4. Buka halaman **Admin Dashboard**, dan gunakan formulir "Tambah Karyawan" untuk mengunggah data karyawan. Formulir tersebut secara otomatis akan melakukan `POST` request ke tabel `karyawan` di Supabase.

### Metode 2: Menggunakan API secara Langsung (Node.js -> Supabase)
Jika Anda ingin memahami cara kerja *upload* (Insert) di Node.js menggunakan modul `@supabase/supabase-js`, berikut adalah contoh fungsinya di dalam kode kita:

```javascript
// Contoh Upload Data Baru
const uploadDataKaryawan = async (dataBaru) => {
    const { data, error } = await supabase
        .from('karyawan')
        .insert([ dataBaru ])
        .select();
        
    if (error) {
        console.error("Gagal upload:", error.message);
    } else {
        console.log("Upload berhasil:", data);
    }
}
```

### Metode 3: Upload Massal menggunakan File CSV di Supabase
Jika Anda sudah memiliki data karyawan di Excel:
1. Simpan file Excel Anda sebagai `.csv`.
2. Di Supabase, buka menu **Table Editor** dan klik tabel `karyawan`.
3. Klik tombol **Insert** di kanan atas, dan pilih **Import data from CSV**.
4. Upload file `.csv` Anda, Supabase akan otomatis memetakan kolom-kolomnya ke dalam database!
