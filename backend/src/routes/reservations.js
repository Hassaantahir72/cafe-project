const router = require('express').Router();
const pool = require('../db/pool');
const { authenticate, requireAdmin, requireStaff, optionalAuth } = require('../middleware/auth');

function genConfirmCode() {
  return 'RES' + Math.random().toString(36).slice(2,8).toUpperCase();
}

// Check table availability
router.get('/availability', async (req, res) => {
  try {
    const { date, time, guests } = req.query;
    if (!date || !time || !guests) return res.status(400).json({ error: 'date, time and guests required' });

    const booked = await pool.query(
      `SELECT table_id FROM reservations
       WHERE reservation_date = $1 AND reservation_time = $2
       AND status IN ('pending','confirmed')`,
      [date, time]
    );
    const bookedIds = booked.rows.map(r => r.table_id);
    const tables = await pool.query(
      `SELECT * FROM restaurant_tables WHERE capacity >= $1 AND is_available = true ORDER BY capacity`,
      [parseInt(guests)]
    );
    const available = tables.rows.filter(t => !bookedIds.includes(t.id));
    res.json({ available, total: available.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Book reservation
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, guests, reservation_date, reservation_time, special_requests } = req.body;
    if (!customer_name || !customer_email || !customer_phone || !guests || !reservation_date || !reservation_time) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Find available table
    const booked = await pool.query(
      `SELECT table_id FROM reservations WHERE reservation_date=$1 AND reservation_time=$2 AND status IN ('pending','confirmed')`,
      [reservation_date, reservation_time]
    );
    const bookedIds = booked.rows.map(r => r.table_id);
    const tables = await pool.query(
      `SELECT id FROM restaurant_tables WHERE capacity >= $1 AND is_available = true ORDER BY capacity LIMIT 1`,
      [parseInt(guests)]
    );
    const available = tables.rows.filter(t => !bookedIds.includes(t.id));
    if (!available.length) return res.status(400).json({ error: 'No tables available for this time slot' });

    const confirmCode = genConfirmCode();
    const result = await pool.query(
      `INSERT INTO reservations (user_id, table_id, customer_name, customer_email, customer_phone, guests, reservation_date, reservation_time, special_requests, confirmation_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user?.id, available[0].id, customer_name, customer_email, customer_phone, guests, reservation_date, reservation_time, special_requests, confirmCode]
    );

    req.app.get('io')?.to('admin').emit('new_reservation', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lookup reservation by code
router.get('/lookup/:code', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, t.table_number, t.location FROM reservations r
       LEFT JOIN restaurant_tables t ON r.table_id = t.id
       WHERE r.confirmation_code = $1`,
      [req.params.code]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// My reservations
router.get('/my', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, t.table_number, t.location FROM reservations r
       LEFT JOIN restaurant_tables t ON r.table_id = t.id
       WHERE r.user_id = $1 ORDER BY r.reservation_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cancel reservation
router.patch('/:id/cancel', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE reservations SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Get all reservations
router.get('/', authenticate, requireStaff, async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = `SELECT r.*, t.table_number, t.location FROM reservations r LEFT JOIN restaurant_tables t ON r.table_id = t.id WHERE 1=1`;
    const params = [];
    if (date) { params.push(date); query += ` AND r.reservation_date = $${params.length}`; }
    if (status) { params.push(status); query += ` AND r.status = $${params.length}`; }
    query += ' ORDER BY r.reservation_date, r.reservation_time';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Update reservation status
router.patch('/:id/status', authenticate, requireStaff, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE reservations SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
