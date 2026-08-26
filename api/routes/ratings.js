const express = require('express');
const rateLimit = require('express-rate-limit');
const Rating = require('../models/Rating');
const { cleanText, makeItemKey, validateReviewText } = require('../utils/text');
const { isRealMenuItem } = require('../utils/menu');
const { verifyRecaptcha, MIN_SCORE } = require('../utils/recaptcha');

const router = express.Router();
const CACHE_TTL_MS = 20_000;
let cache = { value: null, expiresAt: 0 };

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many ratings submitted. Please try again later.' }
});

function invalidateCache() {
  cache = { value: null, expiresAt: 0 };
}

function reviewDto(rating) {
  return {
    rating: rating.rating,
    name: rating.name,
    review: rating.review,
    createdAt: rating.createdAt
  };
}

async function getItemSummary(cafeId, itemKey) {
  const ratings = await Rating.find({ cafeId, itemKey })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  if (!ratings.length) return { avg: null, count: 0, reviews: [] };
  const avg = ratings.reduce((sum, entry) => sum + entry.rating, 0) / ratings.length;
  return {
    avg: Math.round(avg * 100) / 100,
    count: ratings.length,
    reviews: ratings.slice(0, 100).map(reviewDto)
  };
}

// GET /api/ratings - shape consumed directly by the current frontend.
router.get('/', async (_req, res, next) => {
  try {
    if (cache.value && cache.expiresAt > Date.now()) return res.json(cache.value);

    const rows = await Rating.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { cafeId: '$cafeId', itemKey: '$itemKey' },
          itemName: { $first: '$itemName' },
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
          reviews: {
            $push: {
              rating: '$rating',
              name: '$name',
              review: '$review',
              createdAt: '$createdAt'
            }
          }
        }
      }
    ]);

    const payload = {};
    for (const row of rows) {
      const key = `${row._id.cafeId}__${row._id.itemKey}`;
      payload[key] = {
        avg: Math.round(row.avg * 100) / 100,
        count: row.count,
        itemName: row.itemName,
        reviews: row.reviews.slice(0, 100)
      };
    }

    cache = { value: payload, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// GET /api/ratings/:cafeId/:itemKey
router.get('/:cafeId/:itemKey', async (req, res, next) => {
  try {
    const cafeId = cleanText(req.params.cafeId, 50).toLowerCase();
    const itemKey = cleanText(req.params.itemKey, 150).toLowerCase();
    if (!cafeId || !itemKey) return res.status(400).json({ error: 'Invalid dish identifier.' });
    res.json(await getItemSummary(cafeId, itemKey));
  } catch (error) {
    next(error);
  }
});

// POST /api/ratings
router.post('/', submitLimiter, async (req, res, next) => {
  try {
    const cafeId = cleanText(req.body.cafeId, 50).toLowerCase();
    const itemName = cleanText(req.body.itemName, 150);
    const rating = Number(req.body.rating);

    if (!cafeId || !itemName) {
      return res.status(400).json({ error: 'cafeId and itemName are required.' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be an integer from 1 to 5.' });
    }

    // Verify this submission actually came from a real browser, not a script/bot.
    // Checked early, before any database work, so bots fail fast and cheaply.
    const recaptchaResult = await verifyRecaptcha(req.body.recaptchaToken);
    if (!recaptchaResult.success || recaptchaResult.score < MIN_SCORE) {
      return res.status(403).json({ error: 'Automated submission detected. Please try again from a normal browser.' });
    }

    // Reject ratings for cafés/dishes that don't actually exist on the menu.
    // This is what stops garbage/spam/stress-test data from ever reaching the database.
    if (!isRealMenuItem(cafeId, itemName)) {
      return res.status(400).json({ error: 'This dish or café does not exist on the menu.' });
    }

    const itemKey = makeItemKey(itemName);
    if (!itemKey) return res.status(400).json({ error: 'Invalid itemName.' });

    const review = cleanText(req.body.review, 400);
    const reviewError = validateReviewText(review);
    if (reviewError) return res.status(400).json({ error: reviewError });

    // Per-device+IP cooldown: the same phone/browser on the same network
    // can rate a dish at most twice in 24 hours. Requiring BOTH clientId
    // and IP to match (not either alone) avoids falsely blocking other
    // students who share the same IP on campus WiFi.
    const clientId = cleanText(req.body.clientId, 100);
    const ip = cleanText(req.ip, 100);
    const MAX_RATINGS_PER_DISH_PER_DAY = 2;

    if (clientId && ip) {
      const cooldownStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await Rating.countDocuments({
        cafeId,
        itemKey,
        clientId,
        ip,
        createdAt: { $gte: cooldownStart }
      });

      if (recentCount >= MAX_RATINGS_PER_DISH_PER_DAY) {
        return res.status(429).json({
          error: 'You have already rated this dish the maximum number of times today. Please try again tomorrow.'
        });
      }
    }

    await Rating.create({
      cafeId,
      itemName,
      itemKey,
      rating,
      name: cleanText(req.body.name, 60, 'Anonymous VITian'),
      review,
      clientId,
      ip
    });

    invalidateCache();
    res.status(201).json({
      success: true,
      updated: await getItemSummary(cafeId, itemKey)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
