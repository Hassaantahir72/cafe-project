require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');
    await pool.end();
  } catch (err) {
    console.error('❌ Database init error:', err.message);
    process.exit(1);
  }
}

initDatabase();
