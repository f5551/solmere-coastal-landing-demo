'use strict';

const { createHash } = require('node:crypto');

const MAX_BODY_BYTES = 8192;
const ALLOWED_SOURCES = new Set([
  'Online search',
  'Social media',
  'Word of mouth',
  'Press or publication',
  'Other'
]);
const RATE_LIMIT_SCRIPT = [
  'local count = redis.call("INCR", KEYS[1])',
  'if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end',
  'return count'
].join('\n');

function json(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
  res.end(JSON.stringify(body));
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, '') : '';
}

function validSubmission(body) {
  const firstName = cleanText(body.firstName);
  const surname = cleanText(body.surname);
  const phone = cleanText(body.phone);
  const email = cleanText(body.email);
  const source = cleanText(body.source);
  const digits = phone.replace(/\D/g, '').length;
  const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]{1,79}$/u;
  const normalizedEmail = email.toLowerCase();

  if (!namePattern.test(firstName) || !namePattern.test(surname)) return null;
  if (phone.length > 32 || !/^\+?[\d\s().-]+$/.test(phone) || digits < 7 || digits > 15) return null;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!ALLOWED_SOURCES.has(source)) return null;

  return { firstName, surname, phone, email: normalizedEmail, source };
}

async function consumeRateLimit({ env, fetchImpl, ip }) {
  const digest = createHash('sha256').update(`${env.RATE_LIMIT_HASH_SECRET}:${ip}`).digest('hex');
  const response = await fetchImpl(env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['EVAL', RATE_LIMIT_SCRIPT, '1', `solmere:enquiry:${digest}`, '3600'])
  });
  if (!response.ok) throw new Error('rate_limit_unavailable');
  const result = await response.json();
  const count = Number(result.result);
  if (!Number.isFinite(count)) throw new Error('rate_limit_unavailable');
  return count <= 5;
}

async function verifyTurnstile({ env, fetchImpl, token, hostname }) {
  const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token })
  });
  if (!response.ok) throw new Error('captcha_unavailable');
  const result = await response.json();
  return result.success === true && result.action === 'enquiry' && result.hostname === hostname;
}

async function sendWithResend({ env, fetchImpl, fields, requestId }) {
  const text = [
    'New Solmere website enquiry',
    '',
    `First name: ${fields.firstName}`,
    `Surname: ${fields.surname}`,
    `Phone: ${fields.phone}`,
    `Email: ${fields.email}`,
    `How they heard about us: ${fields.source}`
  ].join('\n');
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': requestId
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [env.ENQUIRY_TO],
      reply_to: fields.email,
      subject: 'New website enquiry',
      text
    })
  });
  if (!response.ok) throw new Error('email_provider_rejected');
  const result = await response.json();
  if (typeof result.id !== 'string' || !result.id) throw new Error('email_provider_rejected');
  return result.id;
}

function createEnquiryHandler({
  env = process.env,
  fetchImpl = globalThis.fetch,
  rateLimiter = consumeRateLimit,
  captchaVerifier = verifyTurnstile,
  emailSender = sendWithResend
} = {}) {
  return async function enquiryHandler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { accepted: false, error: 'method_not_allowed' }, { Allow: 'POST' });
    if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return json(res, 415, { accepted: false, error: 'unsupported_media_type' });
    }
    const declaredLength = Number(req.headers['content-length'] || 0);
    if (declaredLength > MAX_BODY_BYTES) return json(res, 413, { accepted: false, error: 'request_too_large' });

    let body = req.body;
    if (typeof body === 'string') {
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) return json(res, 413, { accepted: false, error: 'request_too_large' });
      try { body = JSON.parse(body); } catch { return json(res, 400, { accepted: false, error: 'invalid_request' }); }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json(res, 400, { accepted: false, error: 'invalid_request' });
    }
    if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) {
      return json(res, 413, { accepted: false, error: 'request_too_large' });
    }
    const fields = validSubmission(body);
    const captchaToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
    const requestId = typeof body.requestId === 'string' ? body.requestId : '';
    if (!fields || captchaToken.length < 1 || captchaToken.length > 2048
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return json(res, 400, { accepted: false, error: 'invalid_submission' });
    }
    if (cleanText(body.website)) return json(res, 400, { accepted: false, error: 'invalid_submission' });

    let origin;
    try { origin = new URL(req.headers.origin || ''); } catch { return json(res, 403, { accepted: false, error: 'origin_not_allowed' }); }
    const allowedOrigins = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!allowedOrigins.includes(origin.origin) || (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname))) {
      return json(res, 403, { accepted: false, error: 'origin_not_allowed' });
    }

    const required = [
      'EMAIL_PROVIDER', 'RESEND_API_KEY', 'ENQUIRY_TO', 'EMAIL_FROM', 'TURNSTILE_SECRET_KEY',
      'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_HASH_SECRET', 'ALLOWED_ORIGINS'
    ];
    if (required.some(key => !String(env[key] || '').trim()) || env.EMAIL_PROVIDER !== 'resend'
      || env.RATE_LIMIT_HASH_SECRET.length < 32) {
      return json(res, 503, { accepted: false, error: 'delivery_not_configured' });
    }
    try {
      if (new URL(env.UPSTASH_REDIS_REST_URL).protocol !== 'https:') {
        return json(res, 503, { accepted: false, error: 'delivery_not_configured' });
      }
    } catch { return json(res, 503, { accepted: false, error: 'delivery_not_configured' }); }

    const ip = cleanText(req.headers['x-real-ip'] || '');
    if (!ip || ip.length > 128) return json(res, 400, { accepted: false, error: 'invalid_request' });
    try {
      if (!await rateLimiter({ env, fetchImpl, ip })) {
        return json(res, 429, { accepted: false, error: 'rate_limited' }, { 'Retry-After': '3600' });
      }
      if (!await captchaVerifier({ env, fetchImpl, token: captchaToken, hostname: origin.hostname })) {
        return json(res, 400, { accepted: false, error: 'spam_check_failed' });
      }
      await emailSender({ env, fetchImpl, fields, requestId });
      return json(res, 202, { accepted: true });
    } catch {
      return json(res, 503, { accepted: false, error: 'submission_unavailable' });
    }
  };
}

module.exports = createEnquiryHandler();
module.exports.createEnquiryHandler = createEnquiryHandler;
