// Simple in-memory cache
let cache = { data: null, time: 0 };
const CACHE_TTL = 30 * 1000; // 30 seconds

// api/routes/ratings.js
const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');
const Rating     = require('../models/Rating');

const makeKey = n => n.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many ratings. Please wait a bit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/ratings — all ratings aggregated
router.get('/', async (req, res) => {
  try {
    if (cache.data && Date.now() - cache.time < CACHE_TTL) {
  return res.json(cache.data);
}
    const aggregated = await Rating.aggregate([
      {
        $group: {
          _id: { cafeId: '$cafeId', itemKey: '$itemKey' },
          itemName: { $first: '$itemName' },
          avg:      { $avg: '$rating' },
          count:    { $sum: 1 },
          reviews:  { $push: { rating: '$rating', name: '$name', review: '$review', createdAt: '$createdAt' } },
        },
      },
      { $sort: { '_id.cafeId': 1, '_id.itemKey': 1 } },
    ]);

    const result = {};
    for (const doc of aggregated) {
      const key = `${doc._id.cafeId}__${doc._id.itemKey}`;
      result[key] = {
        avg:      Math.round(doc.avg * 100) / 100,
        count:    doc.count,
        itemName: doc.itemName,
        reviews:  doc.reviews
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 100),
      };
    }
    cache = { data: result, time: Date.now() };
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ratings.' });
  }
});

// GET /api/ratings/:cafeId/:itemKey
router.get('/:cafeId/:itemKey', async (req, res) => {
  try {
    const { cafeId, itemKey } = req.params;
    const ratings = await Rating.find({ cafeId, itemKey }).sort({ createdAt: -1 }).limit(200).lean();
    if (!ratings.length) return res.json({ avg: null, count: 0, reviews: [] });
    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
    res.json({
      avg:     Math.round(avg * 100) / 100,
      count:   ratings.length,
      reviews: ratings.slice(0, 100).map(r => ({ rating: r.rating, name: r.name, review: r.review, createdAt: r.createdAt })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item ratings.' });
  }
});

// POST /api/ratings
router.post('/', submitLimiter, async (req, res) => {
  try {
    let { cafeId, itemName, rating, name, review } = req.body;

    if (!cafeId || !itemName) return res.status(400).json({ error: 'cafeId and itemName are required.' });
    const r = parseInt(rating, 10);
    if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ error: 'rating must be 1–5.' });

    const doc = new Rating({
      cafeId:   cafeId.trim().toLowerCase().slice(0, 50),
      itemName: itemName.trim().slice(0, 150),
      itemKey:  makeKey(itemName),
      rating:   r,
      name:     (name   || '').trim().slice(0, 60)  || 'Anonymous VITian',
      review:   (review || '').trim().slice(0, 400),
    });
    await doc.save();

    // Return updated stats
    const itemKey  = makeKey(itemName);
    const all      = await Rating.find({ cafeId: doc.cafeId, itemKey }).sort({ createdAt: -1 }).limit(200).lean();
    const avg      = all.reduce((s, x) => s + x.rating, 0) / all.length;

    res.status(201).json({
      success: true,
      updated: {
        avg:     Math.round(avg * 100) / 100,
        count:   all.length,
        reviews: all.slice(0, 100).map(x => ({ rating: x.rating, name: x.name, review: x.review, createdAt: x.createdAt })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save rating.' });
  }
});

module.exports = router;
