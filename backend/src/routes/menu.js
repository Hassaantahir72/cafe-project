const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE is_active = true ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all menu items (with optional filters)
router.get('/items', async (req, res) => {
  try {
    const { category, featured, vegetarian, search } = req.query;
    let query = `
      SELECT m.*, c.name as category_name, c.slug as category_slug,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN reviews r ON r.menu_item_id = m.id AND r.is_approved = true
      WHERE m.is_available = true
    `;
    const params = [];
    if (category) { params.push(category); query += ` AND c.slug = $${params.length}`; }
    if (featured === 'true') query += ` AND m.is_featured = true`;
    if (vegetarian === 'true') query += ` AND m.is_vegetarian = true`;
    if (search) { params.push(`%${search}%`); query += ` AND (m.name ILIKE $${params.length} OR m.description ILIKE $${params.length})`; }
    query += ' GROUP BY m.id, c.name, c.slug ORDER BY m.sort_order, m.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single menu item with reviews
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await pool.query(`
      SELECT m.*, c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN reviews r ON r.menu_item_id = m.id AND r.is_approved = true
      WHERE m.id = $1 GROUP BY m.id, c.name`, [id]);
    if (!item.rows[0]) return res.status(404).json({ error: 'Item not found' });
    const reviews = await pool.query(`
      SELECT r.*, u.name as user_name FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.menu_item_id = $1 AND r.is_approved = true
      ORDER BY r.created_at DESC LIMIT 10`, [id]);
    res.json({ ...item.rows[0], reviews: reviews.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add review
router.post('/items/:id/reviews', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
    const result = await pool.query(
      'INSERT INTO reviews (user_id, menu_item_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, req.params.id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Create menu item
router.post('/items', authenticate, requireAdmin, async (req, res) => {
  try {
    const { category_id, name, description, price, image_url, is_featured, is_vegetarian, calories, prep_time, tags } = req.body;
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, is_vegetarian, calories, prep_time, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [category_id, name, description, price, image_url, is_featured, is_vegetarian, calories, prep_time, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Update menu item
router.put('/items/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url, is_available, is_featured, is_vegetarian, calories, prep_time, tags, category_id } = req.body;
    const result = await pool.query(
      `UPDATE menu_items SET name=$1, description=$2, price=$3, image_url=$4, is_available=$5, is_featured=$6,
       is_vegetarian=$7, calories=$8, prep_time=$9, tags=$10, category_id=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, description, price, image_url, is_available, is_featured, is_vegetarian, calories, prep_time, tags, category_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Delete menu item
router.delete('/items/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM menu_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
