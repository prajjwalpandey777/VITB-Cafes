require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db/connect');
const ratingsRouter = require('./routes/ratings');
const feedbackRouter = require('./routes/feedback');
const statsRouter = require('./routes/stats');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({
  origin(origin, callback) {
    // No origin is normal for curl, server-to-server requests, and local files.
    if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '25kb' }));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
}));

app.get('/api', (_req, res) => {
  res.json({ status: 'ok', service: 'vitb-cafes-api' });
});

async function requireDatabase(_req, _res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
}

app.use('/api/ratings', requireDatabase, ratingsRouter);
app.use('/api/feedback', requireDatabase, feedbackRouter);
app.use('/api/stats', requireDatabase, statsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ error: 'Invalid request data.' });
  if (error.message === 'This origin is not allowed by CORS.') return res.status(403).json({ error: error.message });
  res.status(500).json({ error: 'Internal server error.' });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`VITB Cafes API listening on port ${port}`));
}

module.exports = app;
