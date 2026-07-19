const router = require('express').Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin, auditLog } = require('../middleware/auth');
const { detectSQLInjection } = require('../middleware/security');

// Apply SQL injection detection to all admin routes
router.use(detectSQLInjection);

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [orders, revenue, reservations, customers, topItems, recentOrders, dailyRevenue, recentAudit] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='pending') as pending,
                  COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE) as today FROM orders`),
      pool.query(`SELECT COALESCE(SUM(total),0) as total,
                  COALESCE(SUM(total) FILTER (WHERE DATE(created_at)=CURRENT_DATE),0) as today,
                  COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW())),0) as this_month
                  FROM orders WHERE payment_status='paid'`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='pending') as pending,
                  COUNT(*) FILTER (WHERE reservation_date=CURRENT_DATE) as today FROM reservations`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE) as today FROM users WHERE role='customer'`),
      pool.query(`SELECT mi.name, SUM(oi.quantity) as ordered, SUM(oi.subtotal) as revenue
                  FROM order_items oi JOIN menu_items mi ON oi.menu_item_id=mi.id
                  GROUP BY mi.id,mi.name ORDER BY ordered DESC LIMIT 5`),
      pool.query(`SELECT o.*, json_agg(json_build_object('name',oi.item_name,'qty',oi.quantity)) as items
                  FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
                  GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5`),
      pool.query(`SELECT DATE(created_at) as date, COALESCE(SUM(total),0) as revenue, COUNT(*) as orders
                  FROM orders WHERE created_at>=NOW()-INTERVAL '30 days' AND payment_status='paid'
                  GROUP BY DATE(created_at) ORDER BY date`),
      pool.query(`SELECT action, user_email, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10`),
    ]);
    res.json({
      orders: orders.rows[0], revenue: revenue.rows[0],
      reservations: reservations.rows[0], customers: customers.rows[0],
      topItems: topItems.rows, recentOrders: recentOrders.rows,
      dailyRevenue: dailyRevenue.rows, recentAudit: recentAudit.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Audit logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, action, user_email } = req.query;
    let query = `SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id WHERE 1=1`;
    const params = [];
    if (action) { params.push(`%${action}%`); query += ` AND al.action ILIKE $${params.length}`; }
    if (user_email) { params.push(`%${user_email}%`); query += ` AND al.user_email ILIKE $${params.length}`; }
    query += ` ORDER BY al.created_at DESC LIMIT 50 OFFSET ${(parseInt(page)-1)*50}`;
    const result = await pool.query(query, params);
    const count = await pool.query('SELECT COUNT(*) FROM audit_logs');
    res.json({ logs: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Staff management ─────────────────────────────────────────────────────────
router.get('/staff', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id,u.name,u.email,u.role,u.phone,u.is_verified,u.created_at,
       COUNT(s.id) as active_sessions
       FROM users u LEFT JOIN user_sessions s ON s.user_id=u.id AND s.expires_at>NOW()
       WHERE u.role IN ('admin','staff') GROUP BY u.id ORDER BY u.created_at`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/staff', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (!['staff', 'admin'].includes(role)) return res.status(400).json({ error: 'Role must be staff or admin' });
    if (password.length < 10) return res.status(400).json({ error: 'Staff password must be at least 10 characters' });
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(400).json({ error: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 14);
    const result = await pool.query(
      'INSERT INTO users (name,email,password,phone,role,is_verified) VALUES ($1,$2,$3,$4,$5,true) RETURNING id,name,email,role,phone',
      [name, email, hashed, phone||null, role]
    );
    await auditLog(req, 'STAFF_CREATED', 'user', result.rows[0].id, { email, role });
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/staff/:id', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot edit your own role' });
    const result = await pool.query(
      'UPDATE users SET name=$1,phone=$2,role=$3,updated_at=NOW() WHERE id=$4 AND role!=\'admin\' RETURNING id,name,email,role,phone',
      [name, phone||null, role, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Staff member not found or cannot edit another admin' });
    await auditLog(req, 'STAFF_UPDATED', 'user', req.params.id, { name, role });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const target = await pool.query('SELECT email,role FROM users WHERE id=$1', [req.params.id]);
    if (!target.rows[0]) return res.status(404).json({ error: 'Staff member not found' });
    if (target.rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot delete another admin' });
    // Revoke all sessions first
    const sessions = await pool.query('SELECT token_jti FROM user_sessions WHERE user_id=$1', [req.params.id]);
    for (const s of sessions.rows) {
      await pool.query('INSERT INTO token_blacklist (token_jti,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL \'7 days\') ON CONFLICT DO NOTHING', [s.token_jti, req.params.id]);
    }
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    await auditLog(req, 'STAFF_DELETED', 'user', req.params.id, { email: target.rows[0].email });
    res.json({ message: 'Staff member deleted and sessions revoked' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Customer management ──────────────────────────────────────────────────────
router.get('/customers', async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    let query = `SELECT id,name,email,phone,loyalty_points,is_verified,created_at FROM users WHERE role='customer'`;
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $1 OR email ILIKE $1)`; }
    query += ` ORDER BY created_at DESC LIMIT 50 OFFSET ${(parseInt(page)-1)*50}`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Tables management ────────────────────────────────────────────────────────
router.get('/tables', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurant_tables ORDER BY table_number');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tables', async (req, res) => {
  try {
    const { table_number, capacity, location } = req.body;
    if (!table_number || !capacity) return res.status(400).json({ error: 'Table number and capacity required' });
    const result = await pool.query(
      'INSERT INTO restaurant_tables (table_number,capacity,location) VALUES ($1,$2,$3) RETURNING *',
      [table_number, parseInt(capacity), location||null]
    );
    await auditLog(req, 'TABLE_CREATED', 'table', result.rows[0].id, { table_number });
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/tables/:id', async (req, res) => {
  try {
    const { table_number, capacity, location, is_available } = req.body;
    const result = await pool.query(
      'UPDATE restaurant_tables SET table_number=$1,capacity=$2,location=$3,is_available=$4 WHERE id=$5 RETURNING *',
      [table_number, parseInt(capacity), location||null, is_available, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Table not found' });
    await auditLog(req, 'TABLE_UPDATED', 'table', req.params.id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/tables/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM restaurant_tables WHERE id=$1', [req.params.id]);
    await auditLog(req, 'TABLE_DELETED', 'table', req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Active sessions overview ─────────────────────────────────────────────────
router.get('/active-sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.ip_address, s.user_agent, s.last_active, s.created_at,
             u.name as user_name, u.email as user_email, u.role
      FROM user_sessions s JOIN users u ON s.user_id=u.id
      WHERE s.expires_at>NOW() ORDER BY s.last_active DESC LIMIT 50`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Force-revoke a session
router.delete('/sessions/:jti', async (req, res) => {
  try {
    const session = await pool.query('SELECT user_id FROM user_sessions WHERE token_jti=$1', [req.params.jti]);
    if (!session.rows[0]) return res.status(404).json({ error: 'Session not found' });
    await pool.query('INSERT INTO token_blacklist (token_jti,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL \'7 days\') ON CONFLICT DO NOTHING', [req.params.jti, session.rows[0].user_id]);
    await pool.query('DELETE FROM user_sessions WHERE token_jti=$1', [req.params.jti]);
    await auditLog(req, 'SESSION_FORCE_REVOKED', 'session', req.params.jti);
    res.json({ message: 'Session revoked' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
