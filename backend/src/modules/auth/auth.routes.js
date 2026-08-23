const express = require('express');
const router = express.Router();
const { login, logout, refreshToken, forgotPassword, resetPassword } = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;