-- 1. Membuat Tabel Users (Untuk Login)
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'karyawan')),
  nik text UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Membuat Tabel Karyawan
CREATE TABLE IF NOT EXISTS karyawan (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Data Pribadi Karyawan
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
  
  -- Informasi Pekerjaan (Administratif)
  tanggal_mulai_bekerja date,
  upt text,
  fungsi text,
  status_karyawan text CHECK (status_karyawan IN ('PTT', 'PTY', 'GTT', 'GTY')),
  total_jp integer,
  rincian_tugas text,
  
  -- Data Kinerja & Kompetensi
  pendidikan_terakhir text,
  nama_sekolah text,
  riwayat_pelatihan text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Nonaktifkan RLS (Row Level Security) untuk saat ini agar API Node.js dapat melakukan Insert/Update dengan Anon Key
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE karyawan DISABLE ROW LEVEL SECURITY;
