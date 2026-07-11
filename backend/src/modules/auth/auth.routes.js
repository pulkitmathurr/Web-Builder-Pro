const express = require('express');
const router = express.Router();
const { login, logout, refreshToken } = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);

module.exports = router;