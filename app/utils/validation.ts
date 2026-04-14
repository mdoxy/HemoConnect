export const INDIAN_MOBILE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

export function isValidIndianMobile(value: string | undefined | null): boolean {
  if (!value) return false;
  const cleaned = value.replace(/[^0-9+]/g, '');
  return INDIAN_MOBILE_REGEX.test(cleaned);
}

export function normalizeIndianMobile(value: string): string | null {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return null;
}

export function getPhoneValidationErrorMessage(): string {
  return 'Please enter a valid Indian mobile number. Accepted formats: +919876543210 or 9876543210 (10 digits starting with 6-9).';
}
