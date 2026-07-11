const { loginService, logoutService, refreshTokenService } = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response.utils');

const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validation
        if (!email || !password || !role) {
            return sendError(res, 'Email, password aur role required hai', 400);
        }

        if (!['super_admin', 'admin'].includes(role)) {
            return sendError(res, 'Invalid role', 400);
        }

        const { accessToken, refreshToken, user } = await loginService(email, password, role);

        // Refresh token cookie 
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 din milliseconds mein
        });

        return sendSuccess(res, 'Login successful', {
            accessToken,
            user
        });

    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await logoutService(refreshToken);

        // Cookie clear karo
        res.clearCookie('refreshToken');

        return sendSuccess(res, 'Logout successful');

    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        const { accessToken } = await refreshTokenService(refreshToken);

        return sendSuccess(res, 'Token refreshed', { accessToken });

    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

module.exports = { login, logout, refreshToken };