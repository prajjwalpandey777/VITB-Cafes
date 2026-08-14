const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Feedback = require('../models/Feedback');
const { cleanText, escapeHtml } = require('../utils/text');

const router = express.Router();
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many feedback submissions. Please try again later.' }
});

//Create Gmail transporter

let transporter;
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || !process.env.FEEDBACK_TO) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });
  }
  return transporter;
}

//Sends Gmail in background 
async function sendFeedbackEmail(feedback) {
  const mailer = getTransporter();
  if (!mailer) return false;

  const name = escapeHtml(feedback.name);
  const cafe = escapeHtml(feedback.cafe);
  const type = escapeHtml(feedback.type);
  const message = escapeHtml(feedback.message).replace(/\n/g, '<br>');

  await mailer.sendMail({
    from: `"VITB Cafes" <${process.env.GMAIL_USER}>`,
    to: process.env.FEEDBACK_TO,
    subject: `[VITB Cafes] ${feedback.type} - ${feedback.cafe}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2>New VITB Cafes feedback</h2><p><b>From:</b> ${name}</p><p><b>Cafe:</b> ${cafe}</p><p><b>Type:</b> ${type}</p><p><b>Message:</b><br>${message}</p></div>`
  });
  return true;
}

// POST /api/feedback
router.post('/', feedbackLimiter, async (req, res, next) => {
  try {
    const message = cleanText(req.body.message, 800);
    if (!message) return res.status(400).json({ error: 'message is required.' });

    const feedback = await Feedback.create({
      name: cleanText(req.body.name, 60, 'Anonymous VITian'),
      cafe: cleanText(req.body.cafe, 60, 'General'),
      type: cleanText(req.body.type, 80, 'General Feedback'),
      message
    });

    let emailSent = false;
    try {
      emailSent = await sendFeedbackEmail(feedback);
    } catch (emailError) {
      console.error('Feedback email was not sent:', emailError.message);
    }

    res.status(201).json({ success: true, emailSent });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
