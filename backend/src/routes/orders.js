const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, requireAdmin, requireStaff, optionalAuth } = require('../middleware/auth');

function genOrderNumber() {
  return 'ORD' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2,4).toUpperCase();
}

// Place order
router.post('/', optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, type, customer_name, customer_email, customer_phone, table_id, delivery_address, special_instructions, payment_method } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Order items required' });

    await client.query('BEGIN');

    // Calculate totals
    let subtotal = 0;
    const itemDetails = [];
    for (const item of items) {
      const menuItem = await client.query('SELECT id, name, price FROM menu_items WHERE id = $1 AND is_available = true', [item.menu_item_id]);
      if (!menuItem.rows[0]) throw new Error(`Item not available: ${item.menu_item_id}`);
      const lineTotal = menuItem.rows[0].price * item.quantity;
      subtotal += lineTotal;
      itemDetails.push({ ...menuItem.rows[0], quantity: item.quantity, subtotal: lineTotal, notes: item.notes });
    }

    const taxRate = 0.08;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    const orderNumber = genOrderNumber();

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_number, type, customer_name, customer_email, customer_phone,
        table_id, delivery_address, subtotal, tax, total, payment_method, special_instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.user?.id, orderNumber, type || 'dine_in', customer_name, customer_email, customer_phone,
       table_id, delivery_address, subtotal, tax, total, payment_method || 'cash', special_instructions]
    );

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of itemDetails) {
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity, subtotal, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [order.id, item.id, item.name, item.price, item.quantity, item.subtotal, item.notes]
      );
    }

    // Award loyalty points
    if (req.user) {
      await client.query('UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2', [Math.floor(total * 10), req.user.id]);
    }

    await client.query('COMMIT');

    // Real-time notification to admin
    req.app.get('io')?.to('admin').emit('new_order', { order, items: itemDetails });

    res.status(201).json({ order, items: itemDetails });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// Track order by number (public)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*, json_agg(json_build_object('name', oi.item_name, 'qty', oi.quantity, 'price', oi.item_price)) as items
       FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.order_number = $1 GROUP BY o.id`,
      [req.params.orderNumber]
    );
    if (!order.rows[0]) return res.status(404).json({ error: 'Order not found' });
    res.json(order.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// My orders
router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object('name', oi.item_name, 'qty', oi.quantity)) as items
       FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Get all orders
router.get('/', authenticate, requireStaff, async (req, res) => {
  try {
    const { status, date, page = 1 } = req.query;
    let query = `SELECT o.*, json_agg(json_build_object('name', oi.item_name, 'qty', oi.quantity, 'price', oi.item_price)) as items
                 FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND o.status = $${params.length}`; }
    if (date) { params.push(date); query += ` AND DATE(o.created_at) = $${params.length}`; }
    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT 50 OFFSET ${(page-1)*50}`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Update order status
router.patch('/:id/status', authenticate, requireStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found' });
    // Real-time update to customer
    req.app.get('io')?.to(`order_${req.params.id}`).emit('order_update', { status, order: result.rows[0] });
    req.app.get('io')?.to('admin').emit('order_updated', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
