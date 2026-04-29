const bcrypt = require('bcryptjs');
const { init, run } = require('../db');

const args = process.argv.slice(2);
const getArgValue = (flag) => {
    const index = args.indexOf(flag);
    if (index === -1) return null;
    return args[index + 1];
};

const email = getArgValue('--email');
const password = getArgValue('--password');

if (!email || !password) {
    console.log('Usage: node scripts/create-admin.js --email you@example.com --password yourPassword');
    process.exit(1);
}

const createAdmin = async () => {
    await init();
    const passwordHash = bcrypt.hashSync(password, 10);
    await run(`
        INSERT INTO admins (email, password_hash)
        VALUES (?, ?)
        ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
    `, [email, passwordHash]);
    console.log(`Admin account ready for ${email}`);
};

createAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
