require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// ── Middleware ──
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Database Setup ──
const db = new Database(path.join(__dirname, 'attendx.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    ot_start TEXT DEFAULT '',
    ot_end TEXT DEFAULT '',
    ot_hours TEXT DEFAULT '',
    note TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
  );
`);

// ── In-memory session store ──
const sessions = new Map(); // token -> { userId, email, name }

// ── Auth Middleware ──
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.user = sessions.get(token);
  next();
}

// ── Prepared Statements ──
const stmts = {
  findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  insertUser: db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'),
  getRecords: db.prepare('SELECT date, status, ot_start, ot_end, ot_hours, note FROM records WHERE user_id = ?'),
  upsertRecord: db.prepare(`
    INSERT INTO records (user_id, date, status, ot_start, ot_end, ot_hours, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      status = excluded.status,
      ot_start = excluded.ot_start,
      ot_end = excluded.ot_end,
      ot_hours = excluded.ot_hours,
      note = excluded.note
  `),
  deleteRecord: db.prepare('DELETE FROM records WHERE user_id = ? AND date = ?'),
};

// ══════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════

// ── Sign Up ──
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = stmts.findUserByEmail.get(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = stmts.insertUser.run(name.trim(), email.toLowerCase().trim(), hash);

    const token = uuidv4();
    const user = { userId: result.lastInsertRowid, email: email.toLowerCase().trim(), name: name.trim() };
    sessions.set(token, user);

    res.json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── Sign In ──
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Please enter your email.' });
    if (!password) return res.status(400).json({ error: 'Please enter your password.' });

    const user = stmts.findUserByEmail.get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'No account found with this email. Sign up first.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    const token = uuidv4();
    sessions.set(token, { userId: user.id, email: user.email, name: user.name });

    res.json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── Sign Out ──
app.post('/api/signout', authenticate, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  sessions.delete(token);
  res.json({ ok: true });
});

// ── Verify Session ──
app.get('/api/me', authenticate, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email });
});

// ── Get All Records ──
app.get('/api/records', authenticate, (req, res) => {
  try {
    const rows = stmts.getRecords.all(req.user.userId);
    const records = {};
    rows.forEach(r => {
      records[r.date] = {
        status: r.status,
        otStart: r.ot_start,
        otEnd: r.ot_end,
        otHours: r.ot_hours,
        note: r.note,
      };
    });
    res.json(records);
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ error: 'Failed to load records.' });
  }
});

// ── Save / Update Record ──
app.post('/api/records', authenticate, (req, res) => {
  try {
    const { date, status, otStart, otEnd, otHours, note } = req.body;
    if (!date || !status) return res.status(400).json({ error: 'Date and status are required.' });

    stmts.upsertRecord.run(
      req.user.userId,
      date,
      status,
      otStart || '',
      otEnd || '',
      otHours || '',
      note || ''
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Save record error:', err);
    res.status(500).json({ error: 'Failed to save record.' });
  }
});

// ── Delete Record ──
app.delete('/api/records/:date', authenticate, (req, res) => {
  try {
    stmts.deleteRecord.run(req.user.userId, req.params.date);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n  ✅ AttendX server running at http://localhost:${PORT}\n`);
});
