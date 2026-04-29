const path = require('path');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

const exec = (sql) => new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
        if (err) {
            reject(err);
            return;
        }
        resolve();
    });
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) {
            reject(err);
            return;
        }
        resolve(this);
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(row);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(rows);
    });
});

const init = async () => {
    await exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            link TEXT,
            year TEXT,
            is_published INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            issuer TEXT,
            issue_date TEXT,
            link TEXT,
            description TEXT,
            image TEXT,
            is_published INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS testimonials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            company TEXT,
            quote TEXT NOT NULL,
            link TEXT,
            is_published INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            excerpt TEXT,
            content TEXT,
            link TEXT,
            published_at TEXT,
            is_published INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Ensure image column exists for older databases
    try {
        await run(`ALTER TABLE certificates ADD COLUMN image TEXT`);
    } catch (err) {
        // ignore "duplicate column name" errors that happen when column already exists
        if (!err.message || !/duplicate column name/i.test(err.message)) {
            console.error('Failed to add image column to certificates table:', err && err.message ? err.message : err);
        }
    }

    // Seed the Credly certificate if it does not already exist (one-time)
    try {
        await run(
            `INSERT INTO certificates (title, issuer, issue_date, link, description, image, is_published)
             SELECT ?,?,?,?,?,?,?
             WHERE NOT EXISTS (SELECT 1 FROM certificates WHERE link = ?)`,
            [
                'Artificial Intelligence Fundamentals',
                'IBM-SkillsBuild',
                '',
                'https://www.credly.com/badges/5b0a45f1-7de5-44f9-8158-187f81d55e22',
                'This credential earner demonstrates knowledge of artificial intelligence (AI) concepts, such as natural language processing, computer vision, machine learning, deep learning, chatbots, and neural networks; AI ethics; and the applications of AI. The individual has a conceptual understanding of how to run an AI model using IBM Watson Studio. The earner is aware of the job outlook in fields that use AI and is familiar with the skills required for success in various roles in the domain.',
                'https://images.credly.com/images/82b908e1-fdcd-4785-9d32-97f11ccbcf08/linkedin_thumb_image.png',
                1,
                'https://www.credly.com/badges/5b0a45f1-7de5-44f9-8158-187f81d55e22'
            ]
        );
    } catch (err) {
        // ignore seed errors so server still starts
        console.error('Certificate seed failed:', err && err.message ? err.message : err);
    }
};

module.exports = { db, init, run, get, all };
