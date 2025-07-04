// server/src/utils/stringUtils.ts

/**
 * Normalizes an Indian mobile number to its 10-digit form.
 * Removes "+91", spaces, hyphens, parentheses.
 * @param mobileNumber The mobile number string to normalize.
 * @returns The normalized 10-digit mobile number or null if not a valid 10-digit format after cleaning.
 */
export const normalizeIndianMobileNumber = (mobileNumber: string | null | undefined): string | null => {
  if (!mobileNumber || typeof mobileNumber !== 'string') {
    return null;
  }
  // Remove all non-digit characters first, except for a leading '+'
  let cleaned = mobileNumber.replace(/[^\d+]/g, '');

  // If it starts with +91, remove it
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } 
  // If it starts with 91 (without +) and is longer than 10 digits, remove 91
  else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  // If it starts with 0 and is longer than 10 digits (common for STD codes sometimes mistakenly added)
  else if (cleaned.startsWith('0') && cleaned.length > 10) {
     cleaned = cleaned.substring(1);
  }

// Final check: must be exactly 10 digits
  if (/^\d{10}$/.test(cleaned)) {
    return cleaned;
  }
  
  // console.log(`[NormalizeMobile] Original: '${mobileNumber}', Cleaned: '${cleaned}', Final Result: null (does not match 10 digits)`);
  return null;
};