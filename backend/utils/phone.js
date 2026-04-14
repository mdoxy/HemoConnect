export function isValidIndianMobile(value) {
  if (!value) return false;
  const cleaned = String(value).replace(/[^0-9+]/g, '');
  return /^(?:\+91|91)?[6-9]\d{9}$/.test(cleaned);
}

export function normalizeIndianMobile(value) {
  if (!value) return null;
  const digits = String(value).replace(/[^0-9]/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return `+${digits}`;
  }
  return null;
}
