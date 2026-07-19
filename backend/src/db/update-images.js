require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Using photo IDs directly — most reliable Unsplash format
const IMAGES = {
  // Hot Drinks
  'Signature Espresso':     'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80',
  'Flat White':             'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  'Cortado':                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  'Chai Latte':             'https://images.unsplash.com/photo-1556742400-b5b7c512e956?w=600&q=80',
  'Matcha Latte':           'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&q=80',
  // Cold Drinks
  'Cold Brew':              'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80',
  'Iced Caramel Latte':     'https://images.unsplash.com/photo-1577961018248-f50e9f82b9a1?w=600&q=80',
  'Strawberry Smoothie':    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  'Lemonade Mint':          'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80',
  // Breakfast
  'Avocado Toast':          'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  'Full English Breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  'Acai Bowl':              'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
  'Pancake Stack':          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  // Sandwiches
  'Club Sandwich':          'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  'Caprese Panini':         'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=600&q=80',
  'BLT Wrap':               'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  // Pastries
  'Croissant':              'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  'Blueberry Muffin':       'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80',
  'Cinnamon Roll':          'https://images.unsplash.com/photo-1609765405593-c8ee9e3e4aa4?w=600&q=80',
  'Chocolate Lava Cake':    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80',
  // Salads
  'Caesar Salad':           'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80',
  'Quinoa Power Bowl':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

async function updateImages() {
  console.log('🖼️  Updating menu item images...');
  let updated = 0;
  for (const [name, url] of Object.entries(IMAGES)) {
    const result = await pool.query(
      'UPDATE menu_items SET image_url = $1 WHERE name = $2 RETURNING id',
      [url, name]
    );
    if (result.rowCount > 0) { console.log(`  ✅ ${name}`); updated++; }
    else console.log(`  ⚠️  Not found: ${name}`);
  }
  console.log(`\n✅ Updated ${updated}/${Object.keys(IMAGES).length} items`);
  await pool.end();
}

updateImages().catch(err => { console.error('❌', err.message); process.exit(1); });
