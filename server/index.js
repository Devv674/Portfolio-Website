const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const { init, run, get, all } = require('./db');

const app = express();
const rootDir = path.resolve(__dirname, '..');

const requireAuth = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

const listRows = async (table, orderBy, showAll) => {
    const whereClause = showAll ? '' : 'WHERE is_published = 1';
    const order = orderBy || 'created_at DESC';
    return all(`SELECT * FROM ${table} ${whereClause} ORDER BY ${order}`);
};

const insertRow = async (table, payload) => {
    const columns = Object.keys(payload);
    const values = columns.map((key) => payload[key]);
    const placeholders = columns.map(() => '?').join(', ');
    const info = await run(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, values);
    return get(`SELECT * FROM ${table} WHERE id = ?`, [info.lastID]);
};

const updateRow = async (table, id, payload) => {
    const columns = Object.keys(payload);
    const values = columns.map((key) => payload[key]);
    const setters = columns.map((key) => `${key} = ?`).join(', ');
    await run(`UPDATE ${table} SET ${setters} WHERE id = ?`, [...values, id]);
    return get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
};

const deleteRow = async (table, id) => {
    await run(`DELETE FROM ${table} WHERE id = ?`, [id]);
};

const parsePublished = (value) => {
    if (value === 0 || value === '0' || value === false || value === null || value === undefined) {
        return 0;
    }
    return 1;
};

const startServer = async () => {
    await init();

    app.use(express.json());
    app.use(session({
        secret: process.env.SESSION_SECRET || 'dev-session-secret',
        resave: false,
        saveUninitialized: false,
        store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
        cookie: {
            httpOnly: true,
            sameSite: 'lax'
        }
    }));

    app.use(express.static(rootDir));

    app.get('/admin', (req, res) => {
        res.sendFile(path.join(rootDir, 'admin.html'));
    });

    app.get('/api/me', asyncHandler(async (req, res) => {
        if (!req.session || !req.session.adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const admin = await get('SELECT id, email FROM admins WHERE id = ?', [req.session.adminId]);
        if (!admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        return res.json(admin);
    }));

    app.post('/api/login', asyncHandler(async (req, res) => {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required.' });
        }
        const admin = await get('SELECT id, email, password_hash FROM admins WHERE email = ?', [email]);
        if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        req.session.adminId = admin.id;
        return res.json({ id: admin.id, email: admin.email });
    }));

    app.post('/api/logout', (req, res) => {
        if (!req.session) {
            return res.json({ ok: true });
        }
        req.session.destroy(() => {
            res.json({ ok: true });
        });
    });

    app.get('/api/projects', asyncHandler(async (req, res) => {
        const showAll = req.query.all === '1';
        if (showAll && (!req.session || !req.session.adminId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const rows = await listRows('projects', 'created_at DESC', showAll);
        return res.json(rows);
    }));

    app.post('/api/projects', requireAuth, asyncHandler(async (req, res) => {
        const { title, description, tags, link, year, is_published } = req.body || {};
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const row = await insertRow('projects', {
            title,
            description,
            tags,
            link,
            year,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.put('/api/projects/:id', requireAuth, asyncHandler(async (req, res) => {
        const { title, description, tags, link, year, is_published } = req.body || {};
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const row = await updateRow('projects', req.params.id, {
            title,
            description,
            tags,
            link,
            year,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.delete('/api/projects/:id', requireAuth, asyncHandler(async (req, res) => {
        await deleteRow('projects', req.params.id);
        return res.json({ ok: true });
    }));

    app.get('/api/certificates', asyncHandler(async (req, res) => {
        const showAll = req.query.all === '1';
        if (showAll && (!req.session || !req.session.adminId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const rows = await listRows('certificates', 'created_at DESC', showAll);
        return res.json(rows);
    }));

    app.post('/api/certificates', requireAuth, asyncHandler(async (req, res) => {
        const { title, issuer, issue_date, link, description, image, is_published } = req.body || {};
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const row = await insertRow('certificates', {
            title,
            issuer,
            issue_date,
            link,
            description,
            image,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.put('/api/certificates/:id', requireAuth, asyncHandler(async (req, res) => {
        const { title, issuer, issue_date, link, description, image, is_published } = req.body || {};
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const row = await updateRow('certificates', req.params.id, {
            title,
            issuer,
            issue_date,
            link,
            description,
            image,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.delete('/api/certificates/:id', requireAuth, asyncHandler(async (req, res) => {
        await deleteRow('certificates', req.params.id);
        return res.json({ ok: true });
    }));

    app.get('/api/testimonials', asyncHandler(async (req, res) => {
        const showAll = req.query.all === '1';
        if (showAll && (!req.session || !req.session.adminId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const rows = await listRows('testimonials', 'created_at DESC', showAll);
        return res.json(rows);
    }));

    app.post('/api/testimonials', requireAuth, asyncHandler(async (req, res) => {
        const { name, role, company, quote, link, is_published } = req.body || {};
        if (!name || !quote) {
            return res.status(400).json({ error: 'Name and quote are required.' });
        }
        const row = await insertRow('testimonials', {
            name,
            role,
            company,
            quote,
            link,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.put('/api/testimonials/:id', requireAuth, asyncHandler(async (req, res) => {
        const { name, role, company, quote, link, is_published } = req.body || {};
        if (!name || !quote) {
            return res.status(400).json({ error: 'Name and quote are required.' });
        }
        const row = await updateRow('testimonials', req.params.id, {
            name,
            role,
            company,
            quote,
            link,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.delete('/api/testimonials/:id', requireAuth, asyncHandler(async (req, res) => {
        await deleteRow('testimonials', req.params.id);
        return res.json({ ok: true });
    }));

    app.get('/api/posts', asyncHandler(async (req, res) => {
        const showAll = req.query.all === '1';
        if (showAll && (!req.session || !req.session.adminId)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const rows = await listRows('posts', 'published_at DESC, created_at DESC', showAll);
        return res.json(rows);
    }));

    app.post('/api/posts', requireAuth, asyncHandler(async (req, res) => {
        const { title, excerpt, content, link, published_at, is_published } = req.body || {};
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const row = await insertRow('posts', {
            title,
            excerpt,
            content,
            link,
            published_at,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.put('/api/posts/:id', requireAuth, asyncHandler(async (req, res) => {
        const { title, excerpt, content, link, published_at, is_published } = req.body || {};
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const row = await updateRow('posts', req.params.id, {
            title,
            excerpt,
            content,
            link,
            published_at,
            is_published: parsePublished(is_published)
        });
        return res.json(row);
    }));

    app.delete('/api/posts/:id', requireAuth, asyncHandler(async (req, res) => {
        await deleteRow('posts', req.params.id);
        return res.json({ ok: true });
    }));

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({ error: 'Server error.' });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
};

startServer().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});
