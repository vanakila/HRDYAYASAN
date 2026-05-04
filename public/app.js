const API_URL = 'http://localhost:3000/api';

// --- Authentication ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('email', email);
                
                // Parse JWT to get NIK
                const base64Url = data.token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decodedToken = JSON.parse(jsonPayload);
                if (decodedToken.nik) {
                    localStorage.setItem('nik', decodedToken.nik);
                }

                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'karyawan.html';
                }
            } else {
                errorDiv.innerText = data.message;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.innerText = 'Gagal terhubung ke server.';
            errorDiv.style.display = 'block';
        }
    });
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function checkAuth(requiredRole) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    
    if (requiredRole && role !== requiredRole) {
        if (role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'karyawan.html';
        return false;
    }
    
    const emailElem = document.getElementById('user-email');
    if (emailElem) emailElem.innerText = localStorage.getItem('email');
    
    return true;
}

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

// --- Admin Dashboard ---
let isEditMode = false;
let currentEditNik = '';

async function initAdmin() {
    if (!checkAuth('admin')) return;
    loadKaryawanList();
    
    // Set up form submission
    document.getElementById('karyawan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            nik: document.getElementById('nik').value,
            nama_lengkap: document.getElementById('nama_lengkap').value,
            tempat_lahir: document.getElementById('tempat_lahir').value,
            tanggal_lahir: document.getElementById('tanggal_lahir').value || null,
            jenis_kelamin: document.getElementById('jenis_kelamin').value,
            alamat_ktp: document.getElementById('alamat_ktp').value,
            nomor_hp: document.getElementById('nomor_hp').value,
            email_pribadi: document.getElementById('email_pribadi').value,
            status_perkawinan: document.getElementById('status_perkawinan').value,
            jumlah_anak: parseInt(document.getElementById('jumlah_anak').value) || 0,
            nomor_npwp: document.getElementById('nomor_npwp').value,
            nomor_bpjs: document.getElementById('nomor_bpjs').value,
            status_kejamaahan: document.getElementById('status_kejamaahan').value,
            
            tanggal_mulai_bekerja: document.getElementById('tanggal_mulai_bekerja').value || null,
            upt: document.getElementById('upt').value,
            fungsi: document.getElementById('fungsi').value,
            status_karyawan: document.getElementById('status_karyawan').value,
            total_jp: parseInt(document.getElementById('total_jp').value) || null,
            rincian_tugas: document.getElementById('rincian_tugas').value,
            
            pendidikan_terakhir: document.getElementById('pendidikan_terakhir').value,
            nama_sekolah: document.getElementById('nama_sekolah').value,
            riwayat_pelatihan: document.getElementById('riwayat_pelatihan').value
        };

        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode ? `${API_URL}/karyawan/${currentEditNik}` : `${API_URL}/karyawan`;

        try {
            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (data.success) {
                alert(isEditMode ? 'Data berhasil diupdate' : 'Data berhasil ditambahkan');
                closeModal();
                loadKaryawanList();
            } else {
                alert('Gagal: ' + data.message);
            }
        } catch (error) {
            alert('Terjadi kesalahan koneksi.');
        }
    });
}

async function loadKaryawanList() {
    try {
        const res = await fetch(`${API_URL}/karyawan`, { headers: getHeaders() });
        const { data } = await res.json();
        
        const tbody = document.getElementById('karyawan-list');
        tbody.innerHTML = '';
        
        data.forEach(k => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge';
            if(k.status_karyawan === 'PTY') badgeClass += ' badge-pty';
            else if(k.status_karyawan === 'PTT') badgeClass += ' badge-ptt';
            else if(k.status_karyawan === 'GTY') badgeClass += ' badge-gty';
            else if(k.status_karyawan === 'GTT') badgeClass += ' badge-gtt';
            
            tr.innerHTML = `
                <td>${k.nik}</td>
                <td><strong>${k.nama_lengkap}</strong></td>
                <td>${k.upt || '-'}</td>
                <td><span class="${badgeClass}">${k.status_karyawan || '-'}</span></td>
                <td>${k.nomor_hp || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editKaryawan('${k.nik}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteKaryawan('${k.nik}')">Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading karyawan:', error);
    }
}

async function editKaryawan(nik) {
    try {
        const res = await fetch(`${API_URL}/karyawan/${nik}`, { headers: getHeaders() });
        const { data } = await res.json();
        
        document.getElementById('modal-title').innerText = 'Edit Data Karyawan';
        isEditMode = true;
        currentEditNik = nik;
        
        // Populate form
        Object.keys(data).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                if (el.type === 'date' && data[key]) {
                    el.value = data[key].split('T')[0];
                } else {
                    el.value = data[key] || '';
                }
            }
        });
        
        document.getElementById('nik').readOnly = true;
        document.getElementById('karyawanModal').classList.add('active');
    } catch (error) {
        alert('Gagal mengambil data karyawan.');
    }
}

async function deleteKaryawan(nik) {
    if(confirm('Yakin ingin menghapus data karyawan ini?')) {
        try {
            const res = await fetch(`${API_URL}/karyawan/${nik}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if(data.success) {
                loadKaryawanList();
            } else {
                alert('Gagal: ' + data.message);
            }
        } catch (error) {
            alert('Terjadi kesalahan koneksi.');
        }
    }
}

function openModal() {
    isEditMode = false;
    currentEditNik = '';
    document.getElementById('karyawan-form').reset();
    document.getElementById('nik').readOnly = false;
    document.getElementById('modal-title').innerText = 'Tambah Data Karyawan';
    document.getElementById('karyawanModal').classList.add('active');
}

function closeModal() {
    document.getElementById('karyawanModal').classList.remove('active');
}

// --- Employee Portal ---
async function initKaryawan() {
    if (!checkAuth('karyawan') && !checkAuth('admin')) return; // Allow admin to preview if needed
    
    const nik = localStorage.getItem('nik');
    if (!nik) {
        alert('Data NIK tidak ditemukan. Silakan hubungi admin.');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/karyawan/${nik}`, { headers: getHeaders() });
        const { data } = await res.json();
        
        if (data) {
            // Populate profile data
            document.getElementById('p-nik').innerText = data.nik;
            document.getElementById('p-nama_lengkap').innerText = data.nama_lengkap;
            
            const tempatLahir = data.tempat_lahir || '';
            const tglLahir = data.tanggal_lahir ? new Date(data.tanggal_lahir).toLocaleDateString('id-ID') : '';
            document.getElementById('p-ttl').innerText = `${tempatLahir}, ${tglLahir}`.replace(/^,\s/, '');
            
            document.getElementById('p-jenis_kelamin').innerText = data.jenis_kelamin || '-';
            document.getElementById('p-alamat_ktp').innerText = data.alamat_ktp || '-';
            document.getElementById('p-nomor_hp').innerText = data.nomor_hp || '-';
            document.getElementById('p-email_pribadi').innerText = data.email_pribadi || '-';
            document.getElementById('p-status_perkawinan').innerText = data.status_perkawinan || '-';
            document.getElementById('p-jumlah_anak').innerText = data.jumlah_anak || '0';
            document.getElementById('p-nomor_npwp').innerText = data.nomor_npwp || '-';
            document.getElementById('p-nomor_bpjs').innerText = data.nomor_bpjs || '-';
            document.getElementById('p-status_kejamaahan').innerText = data.status_kejamaahan || '-';
            
            const tglMulai = data.tanggal_mulai_bekerja ? new Date(data.tanggal_mulai_bekerja).toLocaleDateString('id-ID') : '-';
            document.getElementById('p-tanggal_mulai_bekerja').innerText = tglMulai;
            document.getElementById('p-upt').innerText = data.upt || '-';
            document.getElementById('p-fungsi').innerText = data.fungsi || '-';
            document.getElementById('p-total_jp').innerText = data.total_jp ? `${data.total_jp} JP` : '-';
            document.getElementById('p-rincian_tugas').innerText = data.rincian_tugas || '-';
            
            document.getElementById('p-pendidikan_terakhir').innerText = data.pendidikan_terakhir || '-';
            document.getElementById('p-nama_sekolah').innerText = data.nama_sekolah || '-';
            document.getElementById('p-riwayat_pelatihan').innerText = data.riwayat_pelatihan || '-';
            
            // Set status badge
            const badgeEl = document.getElementById('status-badge');
            if (data.status_karyawan) {
                badgeEl.innerText = data.status_karyawan;
                if(data.status_karyawan === 'PTY') badgeEl.className = 'badge badge-pty';
                else if(data.status_karyawan === 'PTT') badgeEl.className = 'badge badge-ptt';
                else if(data.status_karyawan === 'GTY') badgeEl.className = 'badge badge-gty';
                else if(data.status_karyawan === 'GTT') badgeEl.className = 'badge badge-gtt';
            } else {
                badgeEl.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}
