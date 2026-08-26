/**
 * Verifies a reCAPTCHA v3 token by calling Google's siteverify endpoint.
 * reCAPTCHA v3 returns a score from 0.0 (very likely a bot) to 1.0
 * (very likely a real human) instead of a pass/fail challenge.
 *
 * Requires RECAPTCHA_SECRET_KEY to be set in the environment (.env / Render
 * dashboard). This is the PRIVATE key — never expose it in frontend code.
 */

const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE) || 0.5;

async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('⚠️  RECAPTCHA_SECRET_KEY is not configured — rejecting submission to be safe.');
    return { success: false, score: 0, reason: 'not_configured' };
  }
  if (!token) {
    return { success: false, score: 0, reason: 'missing_token' };
  }

  try {
    const params = new URLSearchParams({ secret: secretKey, response: token });
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await res.json();

    return {
      success: !!data.success,
      score: typeof data.score === 'number' ? data.score : 0,
      action: data.action,
      reason: data.success ? null : (data['error-codes'] || []).join(', ')
    };
  } catch (err) {
    console.error('reCAPTCHA verification request failed:', err.message);
    return { success: false, score: 0, reason: 'request_failed' };
  }
}

module.exports = { verifyRecaptcha, MIN_SCORE };
