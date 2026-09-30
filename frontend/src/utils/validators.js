// Shared validation rules for shop-owner name + email, used by every form
// that creates or edits a shop account (Register, Edit Profile, Manage Shops).

export const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "yahoo.com"];

export function isValidName(name) {
  return typeof name === "string" && name.trim().length >= 2;
}

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  // Standard email structure check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  const match = /^[^\s@]+@([^\s@]+)$/.exec(trimmed);
  if (!match) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(match[1]);
}

export function isValidContact(contact) {
  if (!contact || typeof contact !== "string") return false;
  const digits = contact.replace(/[\s\-+()]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(digits.slice(2));
  }
  return digits.length === 10 && /^\d{10}$/.test(digits);
}

export const NAME_ERROR = "Owner name should have at least 2 characters";
export const EMAIL_ERROR = "Email format invalid";

