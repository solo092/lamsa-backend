const { pool } = require('../config/db');
require('dotenv').config();

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT 'Admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        delivery_fee DECIMAL(12, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
        location VARCHAR(100) NOT NULL,
        image_urls TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // إضافة العمود تلقائياً في حالة كان جدول المنتجات موجود سابقاً
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(12, 2) DEFAULT 0;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        whatsapp VARCHAR(50),
        location VARCHAR(100),
        state VARCHAR(100),
        address TEXT,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name_snapshot VARCHAR(255),
        color VARCHAR(50),
        size VARCHAR(20),
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(12, 2) DEFAULT 0,
        total_price DECIMAL(12, 2) NOT NULL,
        selected_images TEXT[] DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'جديد',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // إضافة الأعمدة الجديدة تلقائياً للجدول المباشر
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS state VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS color VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_images TEXT[] DEFAULT '{}';
      ALTER TABLE orders ALTER COLUMN whatsapp DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN location DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN product_name_snapshot DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN size DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN address DROP NOT NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
    `);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
