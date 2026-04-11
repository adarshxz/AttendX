const express = require('express');
const Record = require('../models/Record');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ── GET all records for authenticated user ──
router.get('/', async (req, res) => {
  try {
    const records = await Record.find({ userId: req.userId }).lean();

    // Convert array to { date: record } map for frontend
    const recordMap = {};
    records.forEach(r => {
      recordMap[r.date] = {
        status: r.status,
        otStart: r.otStart,
        otEnd: r.otEnd,
        otHours: r.otHours,
        note: r.note
      };
    });

    res.json(recordMap);
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ error: 'Failed to fetch records.' });
  }
});

// ── POST create/update a record ──
router.post('/', async (req, res) => {
  try {
    const { date, status, otStart, otEnd, otHours, note } = req.body;

    if (!date || !status) {
      return res.status(400).json({ error: 'Date and status are required.' });
    }

    const record = await Record.findOneAndUpdate(
      { userId: req.userId, date },
      { status, otStart: otStart || '', otEnd: otEnd || '', otHours: otHours || '', note: note || '' },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ ok: true, record });
  } catch (err) {
    console.error('Save record error:', err);
    res.status(500).json({ error: 'Failed to save record.' });
  }
});

// ── DELETE a record ──
router.delete('/:date', async (req, res) => {
  try {
    await Record.findOneAndDelete({ userId: req.userId, date: req.params.date });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

module.exports = router;
