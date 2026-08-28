const express = require('express');
const router = express.Router();
const { createSignupRequest } = require('./signup.controller');
const { signupLimiter } = require('../../middlewares/rateLimit.middleware');

// ── Public — no auth ─────────────────────────────────
router.post('/', signupLimiter, createSignupRequest);

module.exports = router;
