require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Verified Unsplash images — accurate product photos
const IMAGES = {
  // Hot Drinks — real coffee cup photos
  'Signature Espresso':     'https://images.unsplash.com/photo-1696073374186-8cd59a07b3f0?w=600&q=80',
  'Flat White':             'https://images.unsplash.com/photo-1664275891894-c4fca9ea6ab0?w=600&q=80',
  'Cortado':                'https://images.unsplash.com/photo-1621241534699-b92f7c328fe4?w=600&q=80',
  'Chai Latte':             'https://images.unsplash.com/photo-1556742400-b5b7c512e956?w=600&q=80',
  'Matcha Latte':           'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&q=80',
  // Cold Drinks
  'Cold Brew':              'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  'Iced Caramel Latte':     'https://images.unsplash.com/photo-1582657233468-a84c686db81c?w=600&q=80',
  'Strawberry Smoothie':    'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&q=80',
  'Lemonade Mint':          'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80',
  // Breakfast
  'Avocado Toast':          'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  'Full English Breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
  'Acai Bowl':              'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
  'Pancake Stack':          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  // Sandwiches
  'Club Sandwich':          'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=600&q=80',
  'Caprese Panini':         'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  'BLT Wrap':               'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  // Pastries & Cakes
  'Croissant':              'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  'Blueberry Muffin':       'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80',
  'Cinnamon Roll':          'https://images.unsplash.com/photo-1609765405593-c8ee9e3e4aa4?w=600&q=80',
  'Chocolate Lava Cake':    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80',
  // Salads & Bowls
  'Caesar Salad':           'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&q=80',
  'Quinoa Power Bowl':      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // Admin user
    const hashedPw = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 14);
    await client.query(`
      INSERT INTO users (name, email, password, role, is_verified)
      VALUES ('Cafe Admin', $1, $2, 'admin', true)
      ON CONFLICT (email) DO UPDATE SET is_verified = true`,
      [process.env.ADMIN_EMAIL || 'admin@cafe.com', hashedPw]
    );

    // Categories
    const cats = await client.query(`
      INSERT INTO categories (name, slug, description, sort_order) VALUES
        ('Hot Drinks',      'hot-drinks',  'Freshly brewed coffees and teas', 1),
        ('Cold Drinks',     'cold-drinks', 'Refreshing iced drinks and smoothies', 2),
        ('Breakfast',       'breakfast',   'Start your day the right way', 3),
        ('Sandwiches',      'sandwiches',  'Fresh made-to-order sandwiches', 4),
        ('Pastries & Cakes','pastries',    'Freshly baked every morning', 5),
        ('Salads & Bowls',  'salads',      'Light and nourishing options', 6)
      ON CONFLICT (slug) DO NOTHING
      RETURNING id, slug
    `);
    const catMap = {};
    cats.rows.forEach(r => { catMap[r.slug] = r.id; });
    const existing = await client.query('SELECT id, slug FROM categories');
    existing.rows.forEach(r => { catMap[r.slug] = r.id; });

    // Menu items with images
    const items = [
      // Hot Drinks
      [catMap['hot-drinks'], 'Signature Espresso', 'Our house blend, rich and bold with deep chocolate notes and a silky crema', 3.50, true, true, 5, 3, ['bestseller','vegan']],
      [catMap['hot-drinks'], 'Flat White', 'Silky microfoam poured over double ristretto shots for a smooth, velvety finish', 4.20, true, true, 120, 4, ['popular']],
      [catMap['hot-drinks'], 'Cortado', 'Equal parts espresso and warm milk, perfectly balanced and deeply satisfying', 3.80, false, true, 80, 3, ['specialty']],
      [catMap['hot-drinks'], 'Chai Latte', 'House-spiced masala chai with steamed oat milk and a dusting of cinnamon', 4.50, true, true, 180, 5, ['spiced','comfort']],
      [catMap['hot-drinks'], 'Matcha Latte', 'Ceremonial grade Japanese matcha whisked smooth with steamed oat milk', 5.00, false, true, 150, 5, ['healthy']],
      // Cold Drinks
      [catMap['cold-drinks'], 'Cold Brew', 'Slow-steeped for 18 hours, impossibly smooth and naturally sweet', 4.80, true, true, 10, 2, ['vegan','bestseller']],
      [catMap['cold-drinks'], 'Iced Caramel Latte', 'Double espresso, fresh milk and house-made caramel over hand-chipped ice', 5.20, true, true, 220, 4, ['sweet','popular']],
      [catMap['cold-drinks'], 'Strawberry Smoothie', 'Fresh strawberries and banana blended with almond milk and a hint of vanilla', 5.80, false, true, 280, 5, ['healthy','fruit']],
      [catMap['cold-drinks'], 'Lemonade Mint', 'Hand-squeezed lemons with garden-fresh mint and a touch of honey', 3.80, false, true, 90, 3, ['refreshing']],
      // Breakfast
      [catMap['breakfast'], 'Avocado Toast', 'Sourdough, smashed avo, poached egg, chili flakes and micro herbs', 9.50, true, true, 380, 10, ['healthy','popular']],
      [catMap['breakfast'], 'Full English Breakfast', 'Two eggs, smoked bacon, pork sausage, baked beans, grilled tomato and toast', 13.50, true, false, 720, 15, ['hearty']],
      [catMap['breakfast'], 'Acai Bowl', 'Blended acai topped with house granola, banana, honey and seasonal berries', 10.50, true, true, 420, 8, ['healthy','vegan']],
      [catMap['breakfast'], 'Pancake Stack', 'Three fluffy buttermilk pancakes with maple syrup, whipped cream and fresh berries', 8.50, false, true, 560, 12, ['sweet']],
      // Sandwiches
      [catMap['sandwiches'], 'Club Sandwich', 'Grilled chicken, crispy bacon, fried egg, lettuce and tomato on toasted sourdough', 11.50, false, false, 520, 10, ['filling']],
      [catMap['sandwiches'], 'Caprese Panini', 'Fresh buffalo mozzarella, heritage tomato, basil pesto on toasted ciabatta', 9.80, true, true, 420, 8, ['vegetarian','popular']],
      [catMap['sandwiches'], 'BLT Wrap', 'Smoked bacon, crispy lettuce and tomato in a toasted whole wheat wrap', 9.20, false, false, 480, 7, ['classic']],
      // Pastries
      [catMap['pastries'], 'Croissant', 'Buttery, flaky all-butter croissant baked fresh every morning', 3.80, true, true, 240, 2, ['fresh','classic']],
      [catMap['pastries'], 'Blueberry Muffin', 'Bursting with fresh blueberries with a lemon zest crumble topping', 3.50, true, true, 320, 2, ['sweet','fresh']],
      [catMap['pastries'], 'Cinnamon Roll', 'Warm, gooey house-made roll with brown sugar filling and cream cheese icing', 4.50, true, true, 380, 5, ['warm','comfort']],
      [catMap['pastries'], 'Chocolate Lava Cake', 'Warm dark chocolate cake with a molten center, served with vanilla bean ice cream', 7.50, true, true, 450, 12, ['dessert','indulgent']],
      // Salads
      [catMap['salads'], 'Caesar Salad', 'Crisp romaine, shaved parmesan, house-made croutons and classic caesar dressing', 10.50, false, false, 320, 8, ['classic']],
      [catMap['salads'], 'Quinoa Power Bowl', 'Quinoa, roasted seasonal vegetables, chickpeas and creamy tahini dressing', 12.50, true, true, 420, 10, ['healthy','vegan']],
    ];

    for (const item of items) {
      const [cat_id, name, desc, price, featured, veg, cal, prep, tags] = item;
      const img = IMAGES[name] || null;
      await client.query(`
        INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, is_vegetarian, calories, prep_time, tags)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT DO NOTHING`,
        [cat_id, name, desc, price, img, featured, veg, cal, prep, tags]
      );
      // Update image if item already exists
      await client.query(
        'UPDATE menu_items SET image_url=$1, description=$2 WHERE name=$3 AND image_url IS NULL',
        [img, desc, name]
      );
    }

    // Restaurant tables
    await client.query(`
      INSERT INTO restaurant_tables (table_number, capacity, location) VALUES
        ('T1',2,'Window'),('T2',2,'Window'),('T3',4,'Main Hall'),
        ('T4',4,'Main Hall'),('T5',4,'Main Hall'),('T6',6,'Main Hall'),
        ('T7',6,'Terrace'),('T8',8,'Private Room'),('T9',2,'Bar'),('T10',2,'Bar')
      ON CONFLICT (table_number) DO NOTHING`);

    // Site settings
    await client.query(`
      INSERT INTO site_settings (key, value) VALUES
        ('cafe_name','Brewed Awakening'),
        ('tagline','Where every cup tells a story'),
        ('phone','+1 (555) 123-4567'),
        ('email','hello@brewedawakening.com'),
        ('address','42 Maple Street, Downtown'),
        ('opening_hours','{"Mon-Fri": "7:00 AM - 9:00 PM", "Sat-Sun": "8:00 AM - 10:00 PM"}'),
        ('instagram','@brewedawakening'),
        ('facebook','BrewedAwakening'),
        ('loyalty_points_per_dollar','10'),
        ('tax_rate','0.08')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`);

    await client.query('COMMIT');
    console.log('✅ Database seeded with images!');
    console.log('👤 Admin: admin@cafe.com / Admin@123456');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
