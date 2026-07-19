const router = require('express').Router();
const Groq = require('groq-sdk');
const pool = require('../db/pool');
const { optionalAuth } = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Current supported Groq models (as of 2025):
// llama-3.3-70b-versatile  — best quality, free
// llama-3.1-8b-instant     — fastest, free
// mixtral-8x7b-32768       — large context, free
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function getCafeContext() {
  try {
    const [items, cats, settings] = await Promise.all([
      pool.query('SELECT name, description, price, is_vegetarian, tags FROM menu_items WHERE is_available = true ORDER BY name LIMIT 50'),
      pool.query('SELECT name FROM categories WHERE is_active = true'),
      pool.query('SELECT key, value FROM site_settings'),
    ]);
    const settingsMap = {};
    settings.rows.forEach(s => { settingsMap[s.key] = s.value; });
    return { items: items.rows, categories: cats.rows, settings: settingsMap };
  } catch (e) {
    console.error('getCafeContext error:', e.message);
    return { items: [], categories: [], settings: {} };
  }
}

function getCafeStatus() {
  const now = new Date();
  // Get local time in the cafe's timezone (adjust CAFE_TIMEZONE in env if needed)
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: process.env.CAFE_TIMEZONE || 'America/New_York' }));
  const day = tzNow.getDay(); // 0=Sun,6=Sat
  const hour = tzNow.getHours();
  const minute = tzNow.getMinutes();
  const time = hour * 60 + minute;

  const isWeekend = day === 0 || day === 6;
  const openTime  = isWeekend ? 8 * 60  : 7 * 60;   // 8:00 AM / 7:00 AM
  const closeTime = isWeekend ? 22 * 60 : 21 * 60;  // 10:00 PM / 9:00 PM

  const isOpen = time >= openTime && time < closeTime;
  const opensAt = isWeekend ? '8:00 AM' : '7:00 AM';
  const closesAt = isWeekend ? '10:00 PM' : '9:00 PM';

  return { isOpen, opensAt, closesAt, isWeekend };
}

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { messages, sessionId } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'Messages required' });

    const ctx = await getCafeContext();
    const cafeStatus = getCafeStatus();
    const menuText = ctx.items.map(i =>
      `- ${i.name}: $${i.price}${i.is_vegetarian ? ' (Vegetarian)' : ''}${i.tags?.length ? ` [${i.tags.join(', ')}]` : ''} — ${i.description || ''}`
    ).join('\n');

    const systemPrompt = `You are the friendly and knowledgeable cafe assistant for "${ctx.settings.cafe_name || 'Brewed Awakening'}" — ${ctx.settings.tagline || 'Where every cup tells a story'}.

CURRENT STATUS: The cafe is ${cafeStatus.isOpen ? 'OPEN RIGHT NOW' : 'CURRENTLY CLOSED'}.
TODAY'S HOURS: ${cafeStatus.opensAt} – ${cafeStatus.closesAt} (${cafeStatus.isWeekend ? 'Weekend' : 'Weekday'})

CAFE INFORMATION:
- Name: ${ctx.settings.cafe_name || 'Brewed Awakening'}
- Phone: ${ctx.settings.phone || '+1 (555) 123-4567'}
- Email: ${ctx.settings.email || 'hello@brewedawakening.com'}
- Address: ${ctx.settings.address || '42 Maple Street, Downtown'}
- Weekday Hours: Monday–Friday 7:00 AM – 9:00 PM
- Weekend Hours: Saturday–Sunday 8:00 AM – 10:00 PM
- WiFi: Free high-speed WiFi available
- Parking: Street parking, 2-hour limit nearby
- Pets: Outdoor patio is pet-friendly
- Reservations: Available online at /reservations

FULL MENU:
${menuText}

CATEGORIES AVAILABLE: ${ctx.categories.map(c => c.name).join(', ')}

YOUR ROLE:
1. Answer menu questions warmly — recommend dishes based on preferences, explain ingredients, suggest pairings
2. Help with table reservations — collect name, email, phone, date, time, guest count, then say "Great! Please visit our Reservations page (/reservations) to confirm your booking."
3. Order tracking — ask for their order number (starts with ORD), then direct them to /order-tracking
4. Answer FAQs — hours, location, parking, WiFi, dietary options
5. General warm support

TONE RULES:
- Warm, friendly, like a knowledgeable barista
- Keep replies concise (2-4 sentences usually)
- Use coffee-related expressions naturally (e.g. "Great choice!", "You'll love it!")
- Use emojis sparingly (1-2 max per message)
- NEVER make up prices or items not in the menu above
- If asked something you don't know, offer to connect them with staff`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      max_tokens: 600,
      temperature: 0.65,
    });

    const reply = completion.choices[0]?.message?.content?.trim()
      || "I'm sorry, I couldn't process that. Please try again or call us directly!";

    // Save session (non-blocking)
    if (sessionId) {
      pool.query(
        `INSERT INTO chat_sessions (session_id, user_id, messages)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id) DO UPDATE SET messages = $3, updated_at = NOW()`,
        [sessionId, req.user?.id || null, JSON.stringify(messages)]
      ).catch(() => {});
    }

    res.json({ reply, role: 'assistant' });
  } catch (err) {
    console.error('Chat error:', err.status, JSON.stringify(err.error || err.message));
    // Give a helpful fallback instead of generic error
    res.status(500).json({
      reply: "I'm having a little technical hiccup! ☕ Please try again in a moment, or call us at +1 (555) 123-4567",
      role: 'assistant',
    });
  }
});

module.exports = router;
