require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();


// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ================= SUPABASE CLIENT =================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);


// ================= MULTER CONFIG =================
// Use memory storage — no disk saving
const upload = multer({ storage: multer.memoryStorage() });


// ================= SERVE FRONTEND =================
const staticPath = path.join(__dirname, 'public');


// ================= DATABASE CONNECTION =================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false  // Required for Supabase
    }
});

const sessionStore = new pgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

app.use((req, res, next) => {
    if ((req.path === '/admin.html' || req.path.startsWith('/api/admin')) && !req.session.user) {
        if (req.path.startsWith('/api/admin')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        return res.redirect('/register.html');
    }

    next();
});

app.use(express.static(staticPath));

pool.connect()
    .then(async () => {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                price NUMERIC NOT NULL,
                description TEXT,
                image TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email TEXT
        `);

        await pool.query(`
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS image TEXT
        `);

        const seqResult = await pool.query(
            `SELECT pg_get_serial_sequence('products', 'id') AS seq`
        );

        if (seqResult.rows[0]?.seq) {
            await pool.query(
                `SELECT setval($1, GREATEST((SELECT COALESCE(MAX(id), 0) FROM products), 1), true)`,
                [seqResult.rows[0].seq]
            );
        }

        console.log('Connected to PostgreSQL');

    })
    .catch(err => console.error('Connection failed:', err));


// ======================================================
// ================= PRODUCTS API =======================
// ======================================================

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM products ORDER BY id ASC'
        );

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= LOGIN API ==========================
// ======================================================

app.post('/api/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });

    } catch (err) {

        console.error('Login error:', err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= REGISTER API =======================
// ======================================================

app.post('/api/register', async (req, res) => {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {

        return res.status(400).json({
            success: false,
            message: 'Username, email, and password are required.'
        });
    }

    try {

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'Username or email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
            (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword]
        );

        req.session.user = {
            id: result.rows[0].id,
            username: result.rows[0].username,
            email: result.rows[0].email,
            role: result.rows[0].role
        };

        res.json({
            success: true,
            message: 'Registration successful',
            user: result.rows[0]
        });

    } catch (err) {

        console.error('Register error:', err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }

        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/api/auth-status', (req, res) => {
    if (req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }

    res.json({ authenticated: false });
});


// ======================================================
// ================= CONTACT API ========================
// ======================================================

app.post('/api/contact', async (req, res) => {

    const { name, email, message } = req.body;

    try {

        await pool.query(
            'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)',
            [name, email, message]
        );

        res.json({
            success: true,
            message: 'Message saved successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= CHECKOUT API =======================
// ======================================================

app.post('/api/checkout', async (req, res) => {

    const {
        name,
        email,
        address,
        city,
        zip,
        paymentMethod,
        items
    } = req.body;

    try {

        let total = 0;

        items.forEach(item => {

            total += item.price * item.quantity;
        });

        await pool.query(
            `INSERT INTO orders
            (
                customer_name,
                email,
                address,
                city,
                zip,
                payment_method,
                items,
                total
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
                name,
                email,
                address,
                city,
                zip,
                paymentMethod,
                JSON.stringify(items),
                total
            ]
        );

        res.json({
            success: true,
            message: 'Order placed successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= ADMIN STATS API ====================
// ======================================================

app.get('/api/admin/stats', async (req, res) => {

    try {

        const products = await pool.query(
            'SELECT COUNT(*) FROM products'
        );

        const orders = await pool.query(
            'SELECT COUNT(*) FROM orders'
        );

        const users = await pool.query(
            'SELECT COUNT(*) FROM users'
        );

        res.json({
            products: products.rows[0].count,
            orders: orders.rows[0].count,
            users: users.rows[0].count
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ============ ADMIN PRODUCTS MANAGEMENT ===============
// ======================================================

// GET ALL PRODUCTS
app.get('/api/admin/products', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM products ORDER BY id ASC'
        );

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ADD PRODUCT WITH IMAGE UPLOAD
app.post('/api/admin/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description } = req.body;

        if (!name || !price || !req.file) {
            return res.status(400).json({ success: false, error: 'Name, price, and image are required.' });
        }

        // Upload image to Supabase Storage
        const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get permanent public URL
        const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        const imageUrl = data.publicUrl;

        // Save product with Supabase image URL
        const result = await pool.query(
            `INSERT INTO products (name, price, description, image)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, price, description, imageUrl]
        );

        res.json({ success: true, product: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// DELETE PRODUCT
app.delete('/api/admin/products/:id', async (req, res) => {

    const { id } = req.params;

    try {

        await pool.query(
            'DELETE FROM products WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= ORDERS API =========================
// ======================================================

app.get('/api/admin/orders', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM orders ORDER BY id DESC'
        );

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= USERS API ==========================
// ======================================================

app.get('/api/admin/users', async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
                id,
                username,
                email,
                role,
                created_at
            FROM users
            ORDER BY id ASC`
        );

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
});


// ======================================================
// ================= SPA FALLBACK =======================
// ======================================================

app.use((req, res) => {

    if (req.path.startsWith('/api')) {

        return res.status(404).json({
            error: 'API route not found'
        });
    }

    res.sendFile(
        path.join(staticPath, 'index.html')
    );
});


// ======================================================
// ================= START SERVER =======================
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});