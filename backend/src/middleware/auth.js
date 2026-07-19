const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

// ─── Generate secure JWT with jti (unique ID for blacklisting) ───────────────
function generateToken(user, expiresIn = '7d') {
  const jti = uuidv4();
  const token = jwt.sign(
    { id: user.id, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  return { token, jti };
}

// ─── Check if token jti is blacklisted ───────────────────────────────────────
async function isBlacklisted(jti) {
  const res = await pool.query('SELECT id FROM token_blacklist WHERE token_jti=$1', [jti]);
  return res.rows.length > 0;
}

// ─── Authenticate middleware ──────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please log in again.', expired: true });
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check blacklist
    if (decoded.jti && await isBlacklisted(decoded.jti)) {
      return res.status(401).json({ error: 'Session revoked. Please log in again.' });
    }

    // Fetch user fresh from DB every request (catches role changes, bans)
    const result = await pool.query(
      'SELECT id, name, email, role, is_verified FROM users WHERE id=$1',
      [decoded.id]
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'Account not found' });
    if (!result.rows[0].is_verified) return res.status(403).json({ error: 'Email not verified' });

    req.user = result.rows[0];
    req.tokenJti = decoded.jti;

    // Update session last_active (non-blocking)
    if (decoded.jti) {
      pool.query('UPDATE user_sessions SET last_active=NOW() WHERE token_jti=$1', [decoded.jti]).catch(() => {});
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// ─── Admin only ───────────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') {
    // Audit the attempt
    pool.query(
      `INSERT INTO audit_logs (user_id, user_email, action, ip_address, user_agent, details)
       VALUES ($1,$2,'UNAUTHORIZED_ADMIN_ACCESS',$3,$4,$5)`,
      [req.user.id, req.user.email, req.ip, req.get('user-agent'), JSON.stringify({ path: req.path })]
    ).catch(() => {});
    return res.status(403).json({ error: 'Admin access required. This action has been logged.' });
  }
  next();
};

// ─── Staff or admin ───────────────────────────────────────────────────────────
const requireStaff = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
};

// ─── Optional auth (for public routes that benefit from user context) ─────────
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.jti && !await isBlacklisted(decoded.jti)) {
        const result = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [decoded.id]);
        if (result.rows[0]) { req.user = result.rows[0]; req.tokenJti = decoded.jti; }
      }
    }
  } catch (_) {}
  next();
};

// ─── Audit logger helper ──────────────────────────────────────────────────────
async function auditLog(req, action, resource = null, resourceId = null, details = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_email, action, resource, resource_id, details, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        req.user?.id || null,
        req.user?.email || 'anonymous',
        action, resource, resourceId,
        details ? JSON.stringify(details) : null,
        req.ip, req.get('user-agent')
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// ─── Brute-force check ────────────────────────────────────────────────────────
async function checkBruteForce(ip, email) {
  // Max 10 failed attempts per IP in 15 minutes
  const ipAttempts = await pool.query(
    `SELECT COUNT(*) FROM login_attempts WHERE ip_address=$1 AND success=false AND attempted_at > NOW() - INTERVAL '15 minutes'`,
    [ip]
  );
  if (parseInt(ipAttempts.rows[0].count) >= 10) {
    return { blocked: true, reason: 'Too many failed attempts from this IP. Try again in 15 minutes.' };
  }
  // Max 5 failed attempts per email in 15 minutes
  if (email) {
    const emailAttempts = await pool.query(
      `SELECT COUNT(*) FROM login_attempts WHERE email=$1 AND success=false AND attempted_at > NOW() - INTERVAL '15 minutes'`,
      [email]
    );
    if (parseInt(emailAttempts.rows[0].count) >= 5) {
      return { blocked: true, reason: 'Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.' };
    }
  }
  return { blocked: false };
}

async function recordLoginAttempt(ip, email, success) {
  await pool.query(
    'INSERT INTO login_attempts (ip_address, email, success) VALUES ($1,$2,$3)',
    [ip, email || null, success]
  ).catch(() => {});
}

module.exports = { authenticate, requireAdmin, requireStaff, optionalAuth, auditLog, generateToken, checkBruteForce, recordLoginAttempt, isBlacklisted };
