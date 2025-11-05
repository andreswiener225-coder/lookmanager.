/**
 * Input Validation Utilities
 * Provides validation helpers for request data
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Côte d'Ivoire format)
 * Accepts: +225 XX XX XX XX XX, 225XXXXXXXXXX, 0XXXXXXXXX
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+225|225|0)[0-9]{8,10}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Normalize phone number to international format
 */
export function normalizePhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Already has +225
  if (cleanPhone.startsWith('+225')) {
    return cleanPhone;
  }
  
  // Has 225 prefix
  if (cleanPhone.startsWith('225')) {
    return '+' + cleanPhone;
  }
  
  // Starts with 0 (local format)
  if (cleanPhone.startsWith('0')) {
    return '+225' + cleanPhone.substring(1);
  }
  
  // No prefix (assume CI)
  return '+225' + cleanPhone;
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Validate amount (positive number)
 */
export function isValidAmount(amount: any): boolean {
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(
  value: string,
  enumValues: readonly T[]
): value is T {
  return enumValues.includes(value as T);
}

/**
 * Sanitize string input (remove HTML tags, trim)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
}

/**
 * Validate required fields in object
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validate property type
 */
export function isValidPropertyType(type: string): boolean {
  const validTypes = ['villa', 'appartement', 'studio', 'bureau', 'commerce'];
  return validTypes.includes(type);
}

/**
 * Validate payment method
 */
export function isValidPaymentMethod(method: string): boolean {
  const validMethods = ['orange_money', 'mtn_money', 'moov_money', 'wave', 'cash', 'bank_transfer'];
  return validMethods.includes(method);
}

/**
 * Validate subscription tier
 */
export function isValidSubscriptionTier(tier: string): boolean {
  const validTiers = ['free', 'starter', 'pro', 'enterprise'];
  return validTiers.includes(tier);
}
