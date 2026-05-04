require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'hrd_pomosda_secret_key_2026';

// --- Authentication Routes ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error) throw error;
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Email tidak ditemukan.' });
        }

        const user = users[0];
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Password salah.' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, role: user.role, nik: user.nik }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ success: true, token, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

// Middleware for auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Employee Routes ---
// Get all employees (Admin)
app.get('/api/karyawan', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    try {
        const { data, error } = await supabase.from('karyawan').select('*');
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get specific employee by NIK (Employee)
app.get('/api/karyawan/:nik', authenticateToken, async (req, res) => {
    // Only allow admin or the employee themselves
    if (req.user.role !== 'admin' && req.user.nik !== req.params.nik) {
         return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .select('*')
            .eq('nik', req.params.nik)
            .single();
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create Employee
app.post('/api/karyawan', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .insert([req.body])
            .select();
        
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Employee
app.put('/api/karyawan/:nik', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    try {
        const { data, error } = await supabase
            .from('karyawan')
            .update(req.body)
            .eq('nik', req.params.nik)
            .select();
            
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Employee
app.delete('/api/karyawan/:nik', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }
    try {
        const { error } = await supabase
            .from('karyawan')
            .delete()
            .eq('nik', req.params.nik);
            
        if (error) throw error;
        res.json({ success: true, message: 'Data berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API for registration (internal use for setup)
app.post('/api/register', async (req, res) => {
    const { email, password, role, nik } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const { data, error } = await supabase
            .from('users')
            .insert([
                { email, password: hashedPassword, role, nik }
            ]);
            
        if (error) throw error;
        res.json({ success: true, message: 'User created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Helper route to create initial admin
app.get('/api/setup', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const { data, error } = await supabase
            .from('users')
            .insert([
                { email: 'admin@pomosda.id', password: hashedPassword, role: 'admin', nik: 'ADMIN001' }
            ]);
        
        if (error && error.code !== '23505') throw error; // Ignore duplicate key if already setup
        res.json({ success: true, message: 'Setup completed. Admin login: admin@pomosda.id / admin123' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
