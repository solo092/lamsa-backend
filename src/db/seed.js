const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
require('dotenv').config();

const seed = async () => {
  const client = await pool.connect();
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@lamsashababia.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    const hash = await bcrypt.hash(password, 12);

    const existing = await client.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists:', email);
    } else {
      await client.query(
        'INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)',
        [email, hash, 'مدير لمسة شبابية']
      );
      console.log('Admin created successfully:', email);
    }

    console.log('Seed completed.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
