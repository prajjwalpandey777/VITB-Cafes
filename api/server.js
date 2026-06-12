// api/server.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express        = require('express');
const compression    = require('compression');
const cors           = require('cors');
const connectDB      = require('./db/connect');
const ratingsRouter  = require('./routes/ratings');
const feedbackRouter = require('./routes/feedback');
const statsRouter    = require('./routes/stats');

const app = express();
app.use(compression());
app.set('trust proxy', 1);

// Connect to MongoDB (Mongoose caches — safe for serverless)
connectDB();

// ── Middleware ──────────────────────────────────────────────
app.use(express.json({ limit: '20kb' }));

// On Vercel, same domain = no CORS issue at all.
// This permissive setting handles local dev + any custom domain.
app.use(cors({
  origin: true,   // allow all origins (frontend is on same Vercel domain)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ── Routes ──────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({ status: 'ok', message: 'VITB Cafés API is running 🍽️' });
});

app.use('/api/ratings',  ratingsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/stats',    statsRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// Local dev
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`\n Server running on port ${PORT}\n`));
}

// Required by Vercel
module.exports = app;
