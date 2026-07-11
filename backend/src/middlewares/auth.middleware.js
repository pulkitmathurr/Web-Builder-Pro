const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');

const protect = (req, res, next) => {
    try {
        // Header se token nikalo
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Access denied. No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        // Token verify karo
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return sendError(res, 'Invalid or expired token', 401);
        }

        // Token valid hai — user ki info request mein daal do
        req.user = decoded;
        next();

    } catch (error) {
        return sendError(res, 'Authentication failed', 401);
    }
};

const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return sendError(res, 'Access denied. Super Admin only', 403);
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return sendError(res, 'Access denied. Admin only', 403);
    }
    next();
};

module.exports = { protect, isSuperAdmin, isAdmin };