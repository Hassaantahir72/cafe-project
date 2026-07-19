// Run this to remove all duplicate menu items: node src/db/fix-duplicates.js
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixDuplicates() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking for duplicates...');

    // Show current counts
    const before = await client.query('SELECT COUNT(*) as total FROM menu_items');
    console.log(`📊 Total items before: ${before.rows[0].total}`);

    const dupes = await client.query(`
      SELECT name, COUNT(*) as count
      FROM menu_items
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (dupes.rows.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`\n⚠️  Found ${dupes.rows.length} duplicate names:`);
    dupes.rows.forEach(r => console.log(`   - "${r.name}" appears ${r.count} times`));

    await client.query('BEGIN');

    // For each duplicate name, keep only the one with the best data (has image_url, lowest created_at)
    for (const dupe of dupes.rows) {
      // Keep the row with image_url, or the first one created
      const rows = await client.query(
        `SELECT id, image_url, created_at FROM menu_items WHERE name=$1 ORDER BY
         CASE WHEN image_url IS NOT NULL THEN 0 ELSE 1 END, created_at ASC`,
        [dupe.name]
      );
      const keepId = rows.rows[0].id;
      const deleteIds = rows.rows.slice(1).map(r => r.id);

      // Delete order_items referencing these duplicates
      await client.query(`DELETE FROM order_items WHERE menu_item_id = ANY($1::uuid[])`, [deleteIds]);
      await client.query(`DELETE FROM reviews WHERE menu_item_id = ANY($1::uuid[])`, [deleteIds]);
      await client.query(`DELETE FROM menu_items WHERE id = ANY($1::uuid[])`, [deleteIds]);
      console.log(`   ✅ "${dupe.name}" — kept 1, removed ${deleteIds.length}`);
    }

    await client.query('COMMIT');

    const after = await client.query('SELECT COUNT(*) as total FROM menu_items');
    console.log(`\n✅ Done! Items after cleanup: ${after.rows[0].total}`);
    console.log('\n🖼️  Now run: npm run db:update-images');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicates();
