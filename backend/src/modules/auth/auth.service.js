const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt.utils");
const AppError = require("../../utils/error.utils");

const loginService = async (email, password, role) => {
  // Step 1 — Email se user dhundo
  let user;
  let table = role === "super_admin" ? "tbl_super_admins" : "tbl_admins";

  const [rows] = await pool.query(
    role === 'admin'
        ? `SELECT id, uuid, school_id, name, email, password, phone, profile_photo, status, last_login, created_at, updated_at FROM tbl_admins WHERE email = ?`
        : `SELECT id, uuid, name, email, password, is_active, last_login, created_at, updated_at FROM tbl_super_admins WHERE email = ?`,
    [email]
);

  if (rows.length === 0) {
    throw new AppError("Invalid email or password", 401);
  }

  user = rows[0];

  // Step 2 — Password check karo
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Step 3 — Admin ke liye school check karo
  if (role === "admin") {
    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403);
    }

    // School bhi active hai ya nahi check karo
    const [schoolRows] = await pool.query(
      `SELECT status FROM tbl_schools WHERE id = ?`,
      [user.school_id],
    );

    if (schoolRows[0].status === "suspended") {
      throw new AppError("Your school account has been suspended", 403);
    }
  }

  // Step 4 — Tokens banao
 const payload = {
    id: parseInt(user.id),
    role: role,
};

if (role === 'admin') {
    payload.schoolId = parseInt(user.school_id);
}
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Step 5 — Refresh token database mein save karo
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `INSERT INTO tbl_refresh_tokens 
        (token, admin_id, super_admin_id, expires_at) 
        VALUES (?, ?, ?, ?)`,
    [
      refreshToken,
      role === "admin" ? user.id : null,
      role === "super_admin" ? user.id : null,
      expiresAt,
    ],
  );

  // Step 6 — Last login update karo
  await pool.query(`UPDATE ${table} SET last_login = NOW() WHERE id = ?`, [
    user.id,
  ]);

  // Step 7 — Safe user data return karo (password nahi)
  const { password: _, ...safeUser } = user;

  return { accessToken, refreshToken, user: safeUser };
};

const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No token provided", 400);
  }

  await pool.query(
    `UPDATE tbl_refresh_tokens SET is_revoked = 1 WHERE token = ?`,
    [refreshToken],
  );
};

const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No refresh token provided", 401);
  }

  // Database mein check karo
  const [rows] = await pool.query(
    `SELECT * FROM tbl_refresh_tokens 
        WHERE token = ? AND is_revoked = 0 AND expires_at > NOW()`,
    [refreshToken],
  );

  if (rows.length === 0) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenData = rows[0];

  // Role aur id determine karo
  const role = tokenData.super_admin_id ? "super_admin" : "admin";
  const userId = tokenData.super_admin_id || tokenData.admin_id;

  // Naya access token banao
  const payload = {
    id: parseInt(userId),
    role,
  };

  if (role === "admin") {
    payload.schoolId = parseInt(tokenData.admin_id);
  }

  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
};

module.exports = { loginService, logoutService, refreshTokenService };
