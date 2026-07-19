const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');

// ─── Input sanitiser (strip XSS patterns) ────────────────────────────────────
function sanitize(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitize(v)]));
  }
  return obj;
}

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
};

// ─── SQL injection detection ──────────────────────────────────────────────────
const SQL_PATTERNS = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|;|'|\/\*|\*\/)/i;
const detectSQLInjection = (req, res, next) => {
  const check = JSON.stringify({ ...req.body, ...req.query, ...req.params });
  if (SQL_PATTERNS.test(check)) {
    pool.query(
      `INSERT INTO audit_logs (action, ip_address, user_agent, details) VALUES ('SQL_INJECTION_ATTEMPT',$1,$2,$3)`,
      [req.ip, req.get('user-agent'), JSON.stringify({ path: req.path, body: req.body })]
    ).catch(() => {});
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  next();
};

// ─── Security headers ─────────────────────────────────────────────────────────
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// ─── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Try again in 10 minutes.' },
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: { error: 'Too many admin requests. Slow down.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Rate limit exceeded. Try again later.' },
});

// ─── Validate admin 2FA header (optional extra layer) ─────────────────────────
// Admin requests must include X-Admin-Key matching env var for extra protection
const validateAdminKey = (req, res, next) => {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return next(); // skip if not configured
  const provided = req.headers['x-admin-key'];
  if (!provided || provided !== adminKey) {
    pool.query(
      `INSERT INTO audit_logs (action, ip_address, user_agent, details) VALUES ('INVALID_ADMIN_KEY',$1,$2,$3)`,
      [req.ip, req.get('user-agent'), JSON.stringify({ path: req.path })]
    ).catch(() => {});
    return res.status(403).json({ error: 'Invalid admin access key' });
  }
  next();
};

// ─── Cleanup expired tokens/sessions (run periodically) ──────────────────────
async function cleanupExpired() {
  try {
    await pool.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
    await pool.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    await pool.query("DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours'");
    await pool.query("DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour'");
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupExpired, 30 * 60 * 1000);

module.exports = { sanitizeInput, detectSQLInjection, securityHeaders, authLimiter, otpLimiter, adminLimiter, apiLimiter, validateAdminKey, cleanupExpired };
