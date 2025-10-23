// server.js - Main Node.js Backend Server
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'septan_developers',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg|webp|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, avatar_url FROM admin_users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to check permissions
const checkPermission = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Activity logging helper
async function logActivity(userId, action, entityType, entityId, description, ipAddress, userAgent) {
    try {
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, action, entityType, entityId, description, ipAddress, userAgent]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// ==================== AUTHENTICATION ROUTES ====================

// Login
app.post('/api/auth/login', [
    body('username').notEmpty().trim(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        const [users] = await pool.query(
            'SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = TRUE',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Log activity
        await logActivity(user.id, 'login', 'auth', user.id, 'User logged in', req.ip, req.get('user-agent'));

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// ==================== ADMIN USERS ROUTES ====================

// Get all users (Super Admin only)
app.get('/api/admin/users', authenticateToken, checkPermission(['super_admin']), async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, avatar_url, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC'
        );
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new user (Super Admin only)
app.post('/api/admin/users', authenticateToken, checkPermission(['super_admin']), [
    body('username').notEmpty().trim().isLength({ min: 3, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').notEmpty().trim(),
    body('role').isIn(['super_admin', 'admin', 'editor', 'viewer'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, full_name, role } = req.body;

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, password_hash, full_name, role]
        );

        await logActivity(req.user.id, 'create', 'admin_user', result.insertId, `Created user: ${username}`, req.ip, req.get('user-agent'));

        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Update user (Super Admin only)
app.put('/api/admin/users/:id', authenticateToken, checkPermission(['super_admin']), async (req, res) => {
    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    try {
        await pool.query(
            'UPDATE admin_users SET full_name = ?, role = ?, is_active = ? WHERE id = ?',
            [full_name, role, is_active, id]
        );

        await logActivity(req.user.id, 'update', 'admin_user', id, `Updated user #${id}`, req.ip, req.get('user-agent'));

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== SERVICES ROUTES ====================

// Get all services (public)
app.get('/api/services', async (req, res) => {
    try {
        const [services] = await pool.query(
            'SELECT * FROM services WHERE is_active = TRUE ORDER BY display_order ASC'
        );
        res.json({ services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get service by slug (public)
app.get('/api/services/:slug', async (req, res) => {
    const { slug } = req.params;
    
    try {
        const [services] = await pool.query(
            'SELECT * FROM services WHERE slug = ? AND is_active = TRUE',
            [slug]
        );

        if (services.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json({ service: services[0] });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create/Update services (Admin only)
app.post('/api/admin/services', authenticateToken, checkPermission(['super_admin', 'admin']), async (req, res) => {
    const { id, title, slug, short_description, full_description, icon_svg, featured_image, gallery, meta_title, meta_description, meta_keywords, display_order, is_active } = req.body;

    try {
        if (id) {
            // Update
            await pool.query(
                'UPDATE services SET title = ?, slug = ?, short_description = ?, full_description = ?, icon_svg = ?, featured_image = ?, gallery = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, display_order = ?, is_active = ?, updated_by = ? WHERE id = ?',
                [title, slug, short_description, full_description, icon_svg, featured_image, JSON.stringify(gallery), meta_title, meta_description, meta_keywords, display_order, is_active, req.user.id, id]
            );
            await logActivity(req.user.id, 'update', 'service', id, `Updated service: ${title}`, req.ip, req.get('user-agent'));
            res.json({ message: 'Service updated successfully', serviceId: id });
        } else {
            // Create
            const [result] = await pool.query(
                'INSERT INTO services (title, slug, short_description, full_description, icon_svg, featured_image, gallery, meta_title, meta_description, meta_keywords, display_order, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, slug, short_description, full_description, icon_svg, featured_image, JSON.stringify(gallery), meta_title, meta_description, meta_keywords, display_order, is_active, req.user.id]
            );
            await logActivity(req.user.id, 'create', 'service', result.insertId, `Created service: ${title}`, req.ip, req.get('user-agent'));
            res.status(201).json({ message: 'Service created successfully', serviceId: result.insertId });
        }
    } catch (error) {
        console.error('Error saving service:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Continue in next message due to length...
