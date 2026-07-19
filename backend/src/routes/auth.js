const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { authenticate, generateToken, auditLog, checkBruteForce, recordLoginAttempt } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/email');
const { otpLimiter } = require('../middleware/security');

function genOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// ─── Register (Step 1) ────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    const existing = await pool.query('SELECT id, is_verified FROM users WHERE email=$1', [email]);
    if (existing.rows[0]?.is_verified) return res.status(400).json({ error: 'Email already registered. Please log in.' });

    const hashed = await bcrypt.hash(password, 14); // cost 14 for extra security
    if (existing.rows.length) {
      await pool.query('UPDATE users SET name=$1, password=$2, phone=$3, updated_at=NOW() WHERE email=$4', [name, hashed, phone||null, email]);
    } else {
      await pool.query('INSERT INTO users (name,email,password,phone,is_verified) VALUES ($1,$2,$3,$4,false)', [name, email, hashed, phone||null]);
    }

    await pool.query("DELETE FROM otp_codes WHERE email=$1 AND type='email_verify'", [email]);
    const otp = genOTP();
    await pool.query("INSERT INTO otp_codes (email,code,type,expires_at) VALUES ($1,$2,'email_verify',NOW()+INTERVAL '10 minutes')", [email, otp]);
    await sendOTPEmail(email, name, otp, 'email_verify');

    res.json({ message: 'OTP sent to your email. Please verify to complete registration.', email });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── Verify OTP (Step 2) ──────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const otpRow = await pool.query(
      "SELECT * FROM otp_codes WHERE email=$1 AND code=$2 AND type='email_verify' AND used=false AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1",
      [email, otp.toString().trim()]
    );
    if (!otpRow.rows.length) return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });

    await pool.query('UPDATE otp_codes SET used=true WHERE id=$1', [otpRow.rows[0].id]);
    const userResult = await pool.query(
      'UPDATE users SET is_verified=true, updated_at=NOW() WHERE email=$1 RETURNING id,name,email,role,loyalty_points,phone',
      [email]
    );
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];
    const { token, jti } = generateToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Record session
    await pool.query(
      'INSERT INTO user_sessions (user_id,token_jti,ip_address,user_agent,expires_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, jti, req.ip, req.get('user-agent'), expiresAt]
    );

    await auditLog(req, 'EMAIL_VERIFIED', 'user', user.id);
    sendWelcomeEmail(email, user.name).catch(() => {});
    res.json({ message: 'Email verified! Welcome to Brewed Awakening!', user, token });
  } catch (err) {
    console.error('Verify OTP:', err.message);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await pool.query('SELECT name, is_verified FROM users WHERE email=$1', [email]);
    if (!user.rows.length) return res.status(404).json({ error: 'No account found' });
    if (user.rows[0].is_verified) return res.status(400).json({ error: 'Account already verified' });

    const recent = await pool.query(
      "SELECT created_at FROM otp_codes WHERE email=$1 AND type='email_verify' AND created_at>NOW()-INTERVAL '60 seconds' LIMIT 1",
      [email]
    );
    if (recent.rows.length) return res.status(429).json({ error: 'Please wait 60 seconds before requesting a new OTP.' });

    await pool.query("DELETE FROM otp_codes WHERE email=$1 AND type='email_verify'", [email]);
    const otp = genOTP();
    await pool.query("INSERT INTO otp_codes (email,code,type,expires_at) VALUES ($1,$2,'email_verify',NOW()+INTERVAL '10 minutes')", [email, otp]);
    await sendOTPEmail(email, user.rows[0].name, otp, 'email_verify');
    res.json({ message: 'New OTP sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend OTP.' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const ip = req.ip;
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Brute-force check
    const bf = await checkBruteForce(ip, email);
    if (bf.blocked) return res.status(429).json({ error: bf.reason });

    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await recordLoginAttempt(ip, email, false);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      // Auto-resend OTP
      await pool.query("DELETE FROM otp_codes WHERE email=$1 AND type='email_verify'", [email]);
      const otp = genOTP();
      await pool.query("INSERT INTO otp_codes (email,code,type,expires_at) VALUES ($1,$2,'email_verify',NOW()+INTERVAL '10 minutes')", [email, otp]);
      await sendOTPEmail(email, user.name, otp, 'email_verify').catch(() => {});
      await recordLoginAttempt(ip, email, false);
      return res.status(403).json({ error: 'Email not verified. A new OTP has been sent.', requiresVerification: true, email });
    }

    await recordLoginAttempt(ip, email, true);
    const { password: _, ...userSafe } = user;
    const { token, jti } = generateToken(userSafe);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO user_sessions (user_id,token_jti,ip_address,user_agent,expires_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, jti, ip, req.get('user-agent'), expiresAt]
    );
    await auditLog(req, 'LOGIN', 'user', user.id, { role: user.role });
    res.json({ user: userSafe, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  try {
    if (req.tokenJti) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        'INSERT INTO token_blacklist (token_jti,user_id,expires_at) VALUES ($1,$2,$3) ON CONFLICT (token_jti) DO NOTHING',
        [req.tokenJti, req.user.id, expiresAt]
      );
      await pool.query('DELETE FROM user_sessions WHERE token_jti=$1', [req.tokenJti]);
    }
    await auditLog(req, 'LOGOUT', 'user', req.user.id);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await pool.query('SELECT name,is_verified FROM users WHERE email=$1', [email]);
    if (!user.rows.length || !user.rows[0].is_verified) {
      return res.json({ message: 'If an account exists, a reset code has been sent.' });
    }
    await pool.query("DELETE FROM otp_codes WHERE email=$1 AND type='password_reset'", [email]);
    const otp = genOTP();
    await pool.query("INSERT INTO otp_codes (email,code,type,expires_at) VALUES ($1,$2,'password_reset',NOW()+INTERVAL '10 minutes')", [email, otp]);
    await sendOTPEmail(email, user.rows[0].name, otp, 'password_reset');
    await auditLog(req, 'PASSWORD_RESET_REQUESTED', 'user', null, { email });
    res.json({ message: 'If an account exists, a reset code has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const otpRow = await pool.query(
      "SELECT * FROM otp_codes WHERE email=$1 AND code=$2 AND type='password_reset' AND used=false AND expires_at>NOW() LIMIT 1",
      [email, otp.toString().trim()]
    );
    if (!otpRow.rows.length) return res.status(400).json({ error: 'Invalid or expired reset code' });

    await pool.query('UPDATE otp_codes SET used=true WHERE id=$1', [otpRow.rows[0].id]);
    const hashed = await bcrypt.hash(newPassword, 14);
    const userRes = await pool.query('UPDATE users SET password=$1,updated_at=NOW() WHERE email=$2 RETURNING id', [hashed, email]);

    // Invalidate ALL existing sessions for this user (force re-login everywhere)
    if (userRes.rows[0]) {
      const sessions = await pool.query('SELECT token_jti FROM user_sessions WHERE user_id=$1', [userRes.rows[0].id]);
      for (const s of sessions.rows) {
        await pool.query(
          'INSERT INTO token_blacklist (token_jti,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL \'7 days\') ON CONFLICT DO NOTHING',
          [s.token_jti, userRes.rows[0].id]
        );
      }
      await pool.query('DELETE FROM user_sessions WHERE user_id=$1', [userRes.rows[0].id]);
      await auditLog(req, 'PASSWORD_RESET', 'user', userRes.rows[0].id);
    }

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

// ─── Get profile ──────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,name,email,phone,role,loyalty_points,is_verified,created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Update profile ───────────────────────────────────────────────────────────
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await pool.query(
      'UPDATE users SET name=$1,phone=$2,updated_at=NOW() WHERE id=$3 RETURNING id,name,email,phone,role,loyalty_points',
      [name, phone||null, req.user.id]
    );
    await auditLog(req, 'PROFILE_UPDATED', 'user', req.user.id);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Get active sessions (for user's security page) ──────────────────────────
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,ip_address,user_agent,last_active,created_at FROM user_sessions WHERE user_id=$1 AND expires_at>NOW() ORDER BY last_active DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Revoke all other sessions ────────────────────────────────────────────────
router.post('/revoke-all-sessions', authenticate, async (req, res) => {
  try {
    const sessions = await pool.query(
      'SELECT token_jti FROM user_sessions WHERE user_id=$1 AND token_jti!=$2',
      [req.user.id, req.tokenJti]
    );
    for (const s of sessions.rows) {
      await pool.query(
        'INSERT INTO token_blacklist (token_jti,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL \'7 days\') ON CONFLICT DO NOTHING',
        [s.token_jti, req.user.id]
      );
    }
    await pool.query('DELETE FROM user_sessions WHERE user_id=$1 AND token_jti!=$2', [req.user.id, req.tokenJti]);
    await auditLog(req, 'ALL_SESSIONS_REVOKED', 'user', req.user.id);
    res.json({ message: 'All other sessions revoked successfully.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
