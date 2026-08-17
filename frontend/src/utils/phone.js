// Shared phone-number rules used by every phone input across School Admin,
// Super Admin, and the public enquiry forms: digits only, capped at 10 chars
// as the user types, and exactly-10-digits required for a value to be valid.

export const sanitizePhoneDigits = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

export const isValidPhone = (value) => /^\d{10}$/.test(value);
