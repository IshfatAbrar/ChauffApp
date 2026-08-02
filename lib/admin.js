export const ADMIN_EMAIL = "ishfat0001abrar@gmail.com";

export function isAdminEmail(email) {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
