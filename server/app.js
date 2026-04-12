require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);

// ── Connect to MongoDB ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('\n  ✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('\n  ❌ MongoDB connection failed:', err.message);
  });

module.exports = app;

// ── Start Server Locally ──
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`  ✅ AttendX server running at http://localhost:${PORT}\n`);
  });
}
