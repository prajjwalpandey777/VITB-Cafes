const express = require('express');
const Rating = require('../models/Rating');

const router = express.Router();

// GET /api/stats
router.get('/', async (_req, res, next) => {
  try {
    const [totalRatings, uniqueDishes] = await Promise.all([
      Rating.countDocuments(),
      Rating.distinct('itemKey')
    ]);
    res.json({ totalRatings, totalDishesRated: uniqueDishes.length });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
