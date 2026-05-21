import Stripe from "stripe";

// Region constants
export const REGION_US = "US";
export const REGION_AU = "AU";

// Currency mapping
export const REGION_CURRENCY_MAP = {
  [REGION_US]: "USD",
  [REGION_AU]: "AUD",
};

// Country mapping
export const REGION_COUNTRY_MAP = {
  [REGION_US]: "United States",
  [REGION_AU]: "Australia",
};

// Stripe country code mapping
export const REGION_STRIPE_COUNTRY_MAP = {
  [REGION_US]: "US",
  [REGION_AU]: "AU",
};

// Initialize Stripe instances for each region
const stripeInstances = {
  [REGION_US]: null,
  [REGION_AU]: null,
};

/**
 * Get Stripe instance for a specific region
 * @param {string} region - Region code (US or AU)
 * @returns {Stripe} Stripe instance
 */
export function getStripeInstance(region = REGION_US) {
  // Validate region
  if (region !== REGION_US && region !== REGION_AU) {
    console.warn(`Invalid region "${region}", defaulting to US`);
    region = REGION_US;
  }

  // Return cached instance if available
  if (stripeInstances[region]) {
    return stripeInstances[region];
  }

  // Get appropriate secret key
  const secretKey =
    region === REGION_US
      ? process.env.STRIPE_US_SECRET_KEY || process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_AU_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      `Stripe secret key not found for region ${region}. Please check environment variables.`
    );
  }

  // Create and cache Stripe instance
  stripeInstances[region] = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    typescript: true,
  });

  console.log(`✅ Initialized Stripe instance for region: ${region}`);
  return stripeInstances[region];
}

/**
 * Get Stripe publishable key for a specific region (server-side)
 * @param {string} region - Region code (US or AU)
 * @returns {string} Publishable key
 */
export function getStripePublishableKey(region = REGION_US) {
  // Validate region
  if (region !== REGION_US && region !== REGION_AU) {
    console.warn(`Invalid region "${region}", defaulting to US`);
    region = REGION_US;
  }

  const publishableKey =
    region === REGION_US
      ? process.env.STRIPE_US_PUBLISHABLE_KEY ||
        process.env.STRIPE_PUBLISHABLE_KEY
      : process.env.STRIPE_AU_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      `Stripe publishable key not found for region ${region}. Please check environment variables.`
    );
  }

  return publishableKey;
}

/**
 * Get currency for a specific region
 * @param {string} region - Region code (US or AU)
 * @returns {string} Currency code (USD or AUD)
 */
export function getCurrencyForRegion(region = REGION_US) {
  return REGION_CURRENCY_MAP[region] || REGION_CURRENCY_MAP[REGION_US];
}

/**
 * Get country name for a specific region
 * @param {string} region - Region code (US or AU)
 * @returns {string} Country name
 */
export function getCountryForRegion(region = REGION_US) {
  return REGION_COUNTRY_MAP[region] || REGION_COUNTRY_MAP[REGION_US];
}

/**
 * Get Stripe country code for a specific region
 * @param {string} region - Region code (US or AU)
 * @returns {string} Stripe country code
 */
export function getStripeCountryCode(region = REGION_US) {
  return REGION_STRIPE_COUNTRY_MAP[region] || REGION_STRIPE_COUNTRY_MAP[REGION_US];
}

/**
 * Validate if a region is supported
 * @param {string} region - Region code to validate
 * @returns {boolean} True if region is supported
 */
export function isValidRegion(region) {
  return region === REGION_US || region === REGION_AU;
}

/**
 * Get default region (fallback)
 * @returns {string} Default region code
 */
export function getDefaultRegion() {
  return process.env.DEFAULT_REGION || REGION_US;
}
