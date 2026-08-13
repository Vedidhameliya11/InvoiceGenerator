// Shared validation rules for shop-owner name + email, used by every form
// that creates or edits a shop account (Register, Edit Profile, Manage Shops).

export const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "yahoo.com"];

export function isValidName(name) {
  return !!name && name.trim().length >= 2;
}

export function isValidEmail(email) {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  const match = /^[^\s@]+@([^\s@]+)$/.exec(trimmed);
  if (!match) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(match[1]);
}

export const NAME_ERROR = "Name must be at least 2 characters.";
export const EMAIL_ERROR = "Email must be a gmail.com or yahoo.com address.";
