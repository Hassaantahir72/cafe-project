# ☕ Brewed Awakening — Full Stack Cafe Restaurant App

A complete, production-ready cafe/coffee shop web application with:
- Customer-facing website with menu, cart, checkout, reservations, order tracking
- AI-powered chatbot (Claude API) for support, bookings, and recommendations
- Real-time order updates via WebSockets (Socket.io)
- Full admin dashboard with analytics, order/reservation management, staff control
- Role-based authentication (customer / staff / admin)
- Loyalty points system

## 🗂 Project Structure

```
cafe-project/
├── frontend/     → Next.js 14 + TypeScript + Tailwind CSS
└── backend/      → Node.js + Express + PostgreSQL + Socket.io
```

---

## 🚀 Setup Guide (Step by Step)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running locally
- A Groq API key (FREE chatbot) — get one at https://console.groq.com

---

### 1️⃣ Set Up the Database

Open PostgreSQL and create the database:

```sql
CREATE DATABASE cafe_db;
```

---

### 2️⃣ Set Up the Backend

```bash
cd backend
npm install
```

Copy and fill in your environment variables:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cafe_db
JWT_SECRET=any_long_random_string_here
GROQ_API_KEY=gsk_your_key_here
ADMIN_EMAIL=admin@cafe.com
ADMIN_PASSWORD=Admin@123456
FRONTEND_URL=http://localhost:3000
PORT=5000
```

Initialize the database schema:
```bash
npm run db:init
```

Seed with demo data (categories, menu items, tables, admin user):
```bash
npm run db:seed
```

Start the backend server:
```bash
npm run dev
```

Backend will run at: **http://localhost:5000**

---

### 3️⃣ Set Up the Frontend

```bash
cd frontend
npm install
```

Copy env file:
```bash
cp .env.local.example .env.local
```

Start the frontend:
```bash
npm run dev
```

Frontend will run at: **http://localhost:3000**

---

## 🔑 Default Admin Login

```
Email: admin@cafe.com
Password: Admin@123456
```

Access admin panel at: **http://localhost:3000/admin/dashboard**

---

## 📄 Pages

### Customer Pages
| Page | URL |
|------|-----|
| Home | / |
| Menu | /menu |
| Reservations | /reservations |
| Order Tracking | /order-tracking |
| Checkout | /checkout |
| Login | /auth/login |
| Register | /auth/register |

### Admin Pages
| Page | URL |
|------|-----|
| Dashboard | /admin/dashboard |
| Orders | /admin/orders |
| Reservations | /admin/reservations |
| Menu Management | /admin/menu |
| Staff Management | /admin/staff |
| Settings | /admin/settings |

---

## 📧 Email OTP Verification Setup

This project uses **Nodemailer** to send OTP emails. You need a Gmail account (or any SMTP provider).

### Gmail Setup (Recommended)
1. Go to your Google Account → **Security** → **2-Step Verification** (enable it)
2. Then go to **Security** → **App Passwords**
3. Create an app password for "Mail"
4. Copy the 16-character password into your `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   ← the app password (spaces OK)
EMAIL_FROM=Brewed Awakening <your_gmail@gmail.com>
```

### OTP Flow
- **Register:** User fills form → OTP sent to email → Enter 6-digit code → Account verified → Auto login
- **Login with unverified account:** OTP automatically resent → Verify to log in
- **Forgot password:** Enter email → OTP sent → Enter code + new password → Reset complete
- OTPs expire in **10 minutes** and are single-use
- Resend is rate-limited to once per **60 seconds**

---

## 🤖 Chatbot Features

The AI chatbot (powered by Claude) supports:
- ☕ **Menu recommendations** — ask about dishes, dietary options, popular items
- 📅 **Table booking assistance** — collects booking info and guides to reservation page
- 📦 **Order tracking** — tells customer how to check order status
- ❓ **FAQs** — hours, WiFi, parking, location, pet policy
- 💬 **General support** — warm, helpful responses

---

## 🗄️ API Endpoints

### Auth
- `POST /api/auth/register` — Register customer
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get profile (auth required)

### Menu
- `GET  /api/menu/categories` — All categories
- `GET  /api/menu/items` — All items (filter: `?category=hot-drinks&featured=true&vegetarian=true&search=latte`)
- `POST /api/menu/items` — Add item (admin)
- `PUT  /api/menu/items/:id` — Update item (admin)
- `DELETE /api/menu/items/:id` — Delete item (admin)

### Orders
- `POST /api/orders` — Place order
- `GET  /api/orders/track/:orderNumber` — Track order (public)
- `GET  /api/orders/my` — My orders (auth)
- `GET  /api/orders` — All orders (admin)
- `PATCH /api/orders/:id/status` — Update status (admin)

### Reservations
- `GET  /api/reservations/availability` — Check availability
- `POST /api/reservations` — Book table
- `GET  /api/reservations/lookup/:code` — Lookup by code
- `GET  /api/reservations/my` — My reservations (auth)
- `PATCH /api/reservations/:id/cancel` — Cancel
- `GET  /api/reservations` — All reservations (admin)

### Chat
- `POST /api/chat` — Send message to AI chatbot

### Admin
- `GET  /api/admin/stats` — Dashboard stats
- `GET/POST/DELETE /api/admin/staff` — Staff management
- `GET/POST /api/admin/tables` — Table management

### Settings
- `GET  /api/settings` — Get all settings
- `PUT  /api/settings` — Update settings (admin)

---

## 🌐 Deploying to Production (Supabase + Vercel)

When you're ready to deploy:

### Backend
1. Create a Supabase project at https://supabase.com
2. Copy the **Connection String** from Supabase → Settings → Database
3. Update `DATABASE_URL` in your backend `.env`
4. Run `npm run db:init` and `npm run db:seed` with the Supabase URL
5. Deploy backend to Railway, Render, or any Node.js host
6. Set all env variables on the host

### Frontend
1. Deploy to Vercel: `vercel deploy`
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
3. Set `NEXT_PUBLIC_SOCKET_URL` to the same backend URL

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State | Zustand |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (local) → Supabase (production) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.io |
| AI Chatbot | Groq AI (free) |
| Charts | Recharts |

---

## 💡 Common Issues

**Database connection error:**
Make sure PostgreSQL is running: `pg_ctl start` or check Services on Windows

**Port already in use:**
Change `PORT` in backend `.env` or kill the process using that port

**Chatbot not working:**
Check that `GROQ_API_KEY` is set correctly in backend `.env`. Get a free key at https://console.groq.com

**JWT errors:**
Make sure `JWT_SECRET` is the same in both `.env` and hasn't changed between requests

---

## 🔒 Security Architecture

### Authentication & Sessions
- **JWT tokens** with unique `jti` (JWT ID) per token — enables individual token revocation
- **Token blacklist** stored in PostgreSQL — revoked tokens are rejected even before expiry
- **Session tracking** — every login records IP address, device, and last-active timestamp
- **Secure logout** — invalidates token server-side (blacklists jti), no client-only logout
- **Password reset** invalidates ALL existing sessions across all devices

### Admin Panel Protection
| Layer | Detail |
|---|---|
| Role check | Every request checks `role = 'admin'` fresh from DB |
| Audit logging | Every admin action logged with IP, user-agent, timestamp |
| Inactivity timeout | Auto-logout after 30 minutes of no activity |
| Session viewer | Admin can see and revoke any active session |
| Staff deletion | Revokes all sessions immediately on delete |
| Optional secret key | Set `ADMIN_SECRET_KEY` for an extra header requirement |

### Brute-Force Protection
- Max **10 failed attempts per IP** in 15 minutes → IP blocked
- Max **5 failed attempts per email** in 15 minutes → account temporarily locked
- All attempts logged to `login_attempts` table

### Input Security
- **XSS sanitization** — strips `<script>`, `javascript:`, event handlers from all inputs
- **SQL injection detection** — pattern matches and logs/blocks suspicious inputs
- **Body size limit** — 5MB max request body
- **CORS** — strictly limited to frontend origin only

### Password Security
- **bcrypt cost 14** — significantly stronger than default cost 10
- Staff accounts require minimum 10-character passwords
- Passwords never returned in any API response

### OTP Security
- 6-digit codes expire in **10 minutes**
- Single-use (marked `used=true` in DB immediately)
- Rate-limited: max 1 resend per **60 seconds**
- Old OTPs purged before each new one is created

### Security Headers (Helmet.js)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Auto Cleanup
Every 30 minutes the server automatically deletes:
- Expired blacklisted tokens
- Expired sessions
- Login attempt records older than 24 hours
- Expired OTP codes

---

## 🛡️ Admin Panel Pages

| Page | URL | Description |
|---|---|---|
| Dashboard | /admin/dashboard | Stats, revenue chart, recent activity |
| Orders | /admin/orders | Real-time order management |
| Reservations | /admin/reservations | All reservations with status control |
| Menu | /admin/menu | Full CRUD for menu items |
| Staff | /admin/staff | Add/remove staff, role assignment |
| **Audit Logs** | /admin/audit-logs | Every admin action logged with details |
| **Security** | /admin/security | Live session viewer, force-revoke any session |
| Settings | /admin/settings | Cafe info, hours, contact details |

