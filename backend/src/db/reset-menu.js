// Nuclear option: wipe all menu items and re-seed clean
// Run: node src/db/reset-menu.js
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const IMAGES = {
  'Signature Espresso':     'https://images.unsplash.com/photo-1696073374186-8cd59a07b3f0?w=600&q=80',
  'Flat White':             'https://images.unsplash.com/photo-1664275891894-c4fca9ea6ab0?w=600&q=80',
  'Cortado':                'https://images.unsplash.com/photo-1621241534699-b92f7c328fe4?w=600&q=80',
  'Chai Latte':             'https://images.unsplash.com/photo-1556742400-b5b7c512e956?w=600&q=80',
  'Matcha Latte':           'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&q=80',
  'Cold Brew':              'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  'Iced Caramel Latte':     'https://images.unsplash.com/photo-1582657233468-a84c686db81c?w=600&q=80',
  'Strawberry Smoothie':    'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=80',
  'Lemonade Mint':          'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80',
  'Avocado Toast':          'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  'Full English Breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  'Acai Bowl':              'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
  'Pancake Stack':          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  'Club Sandwich':          'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=600&q=80',
  'Caprese Panini':         'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  'BLT Wrap':               'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  'Croissant':              'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  'Blueberry Muffin':       'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80',
  'Cinnamon Roll':          'https://images.unsplash.com/photo-1609765405593-c8ee9e3e4aa4?w=600&q=80',
  'Chocolate Lava Cake':    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80',
  'Caesar Salad':           'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80',
  'Quinoa Power Bowl':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

const MENU_ITEMS = [
  // [category_slug, name, description, price, featured, vegetarian, calories, prep_time, tags]
  ['hot-drinks','Signature Espresso','Our house blend, rich and bold with deep chocolate notes and a silky crema',3.50,true,true,5,3,['bestseller','vegan']],
  ['hot-drinks','Flat White','Silky microfoam poured over double ristretto shots for a smooth, velvety finish',4.20,true,true,120,4,['popular']],
  ['hot-drinks','Cortado','Equal parts espresso and warm milk, perfectly balanced and deeply satisfying',3.80,false,true,80,3,['specialty']],
  ['hot-drinks','Chai Latte','House-spiced masala chai with steamed oat milk and a dusting of cinnamon',4.50,true,true,180,5,['spiced','comfort']],
  ['hot-drinks','Matcha Latte','Ceremonial grade Japanese matcha whisked smooth with steamed oat milk',5.00,false,true,150,5,['healthy']],
  ['cold-drinks','Cold Brew','Slow-steeped for 18 hours, impossibly smooth and naturally sweet',4.80,true,true,10,2,['vegan','bestseller']],
  ['cold-drinks','Iced Caramel Latte','Double espresso, fresh milk and house-made caramel over hand-chipped ice',5.20,true,true,220,4,['sweet','popular']],
  ['cold-drinks','Strawberry Smoothie','Fresh strawberries and banana blended with almond milk and a hint of vanilla',5.80,false,true,280,5,['healthy','fruit']],
  ['cold-drinks','Lemonade Mint','Hand-squeezed lemons with garden-fresh mint and a touch of honey',3.80,false,true,90,3,['refreshing']],
  ['breakfast','Avocado Toast','Sourdough, smashed avo, poached egg, chili flakes and micro herbs',9.50,true,true,380,10,['healthy','popular']],
  ['breakfast','Full English Breakfast','Two eggs, smoked bacon, pork sausage, baked beans, grilled tomato and toast',13.50,true,false,720,15,['hearty']],
  ['breakfast','Acai Bowl','Blended acai topped with house granola, banana, honey and seasonal berries',10.50,true,true,420,8,['healthy','vegan']],
  ['breakfast','Pancake Stack','Three fluffy buttermilk pancakes with maple syrup, whipped cream and fresh berries',8.50,false,true,560,12,['sweet']],
  ['sandwiches','Club Sandwich','Grilled chicken, crispy bacon, fried egg, lettuce and tomato on toasted sourdough',11.50,false,false,520,10,['filling']],
  ['sandwiches','Caprese Panini','Fresh buffalo mozzarella, heritage tomato, basil pesto on toasted ciabatta',9.80,true,true,420,8,['vegetarian','popular']],
  ['sandwiches','BLT Wrap','Smoked bacon, crispy lettuce and tomato in a toasted whole wheat wrap',9.20,false,false,480,7,['classic']],
  ['pastries','Croissant','Buttery, flaky all-butter croissant baked fresh every morning',3.80,true,true,240,2,['fresh','classic']],
  ['pastries','Blueberry Muffin','Bursting with fresh blueberries with a lemon zest crumble topping',3.50,true,true,320,2,['sweet','fresh']],
  ['pastries','Cinnamon Roll','Warm, gooey house-made roll with brown sugar filling and cream cheese icing',4.50,true,true,380,5,['warm','comfort']],
  ['pastries','Chocolate Lava Cake','Warm dark chocolate cake with a molten center, served with vanilla bean ice cream',7.50,true,true,450,12,['dessert','indulgent']],
  ['salads','Caesar Salad','Crisp romaine, shaved parmesan, house-made croutons and classic caesar dressing',10.50,false,false,320,8,['classic']],
  ['salads','Quinoa Power Bowl','Quinoa, roasted seasonal vegetables, chickpeas and creamy tahini dressing',12.50,true,true,420,10,['healthy','vegan']],
];

async function resetMenu() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Resetting menu items...');
    await client.query('BEGIN');

    // Clear everything related to menu items
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM menu_items');
    console.log('✅ Cleared all menu items, order items, and reviews');

    // Get category map
    const cats = await client.query('SELECT id, slug FROM categories');
    const catMap = {};
    cats.rows.forEach(r => { catMap[r.slug] = r.id; });

    // Insert clean items
    let count = 0;
    for (const [slug, name, desc, price, featured, veg, cal, prep, tags] of MENU_ITEMS) {
      const catId = catMap[slug];
      if (!catId) { console.log(`⚠️  Category not found: ${slug}`); continue; }
      const img = IMAGES[name] || null;
      await client.query(
        `INSERT INTO menu_items
         (category_id, name, description, price, image_url, is_featured, is_vegetarian, calories, prep_time, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [catId, name, desc, price, img, featured, veg, cal, prep, tags]
      );
      console.log(`  ✅ ${name}`);
      count++;
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Done! Inserted ${count} clean menu items with images.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

resetMenu();
