require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');

const {
  sanitizeInput, detectSQLInjection, securityHeaders,
  authLimiter, otpLimiter, adminLimiter, apiLimiter
} = require('./middleware/security');

const app = express();
const httpServer = createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Require auth for socket connections
  allowRequest: (req, callback) => {
    callback(null, true);
  }
});

app.set('io', io);

// ─── Core security middleware ─────────────────────────────────────────────────
app.set('trust proxy', 1); // trust first proxy for rate limiting
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(securityHeaders);
app.use(sanitizeInput);
app.use('/uploads', express.static('uploads'));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  // Never leak stack traces in production
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({ error: 'An unexpected error occurred' });
  } else {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Socket.io (real-time) ────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const clientId = socket.id;
  console.log(`[Socket] Connected: ${clientId}`);

  socket.on('join_order', (orderId) => {
    if (orderId && typeof orderId === 'string' && orderId.length < 100) {
      socket.join(`order_${orderId}`);
    }
  });

  socket.on('join_admin', (token) => {
    // Only verified admins join admin room
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'admin') socket.join('admin');
    } catch (_) {}
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${clientId}`);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security: helmet, cors, rate-limiting, XSS, SQL-injection protection`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
