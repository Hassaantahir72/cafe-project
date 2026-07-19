require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetAdmin() {
  try {
    const password = 'Admin1234';
    const hashed = await bcrypt.hash(password, 12);

    // Check if admin exists
    const check = await pool.query("SELECT id, email FROM users WHERE email = 'admin@cafe.com'");

    if (check.rows.length === 0) {
      // Create fresh admin
      await pool.query(`
        INSERT INTO users (name, email, password, role, is_verified)
        VALUES ('Cafe Admin', 'admin@cafe.com', $1, 'admin', true)
      `, [hashed]);
      console.log('✅ Admin account CREATED');
    } else {
      // Update existing
      await pool.query(`
        UPDATE users
        SET password = $1, is_verified = true, role = 'admin'
        WHERE email = 'admin@cafe.com'
      `, [hashed]);
      console.log('✅ Admin password UPDATED');
    }

    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Email:    admin@cafe.com');
    console.log('   Password: Admin1234');
    console.log('');
    console.log('🌐 Go to: http://localhost:3000/auth/login');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
