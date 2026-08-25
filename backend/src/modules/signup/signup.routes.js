const express = require('express');
const router = express.Router();
const { createSignupRequest } = require('./signup.controller');

// ── Public — no auth ─────────────────────────────────
router.post('/', createSignupRequest);

module.exports = router;
