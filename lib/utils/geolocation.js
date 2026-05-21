import { REGION_US, REGION_AU, getCountryForRegion } from "./stripe";

// Cache to store IP -> Geo mappings (to avoid excessive API calls)
const geoCache = new Map();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Extract IP address from Next.js request headers
 * @param {Request} request - Next.js request object
 * @returns {string|null} IP address or null
 */
export function extractIPFromRequest(request) {
  // Try various headers in order of preference
  const headers = request.headers;
  
  // Vercel/deployment platform headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated list, take first IP
    return forwardedFor.split(",")[0].trim();
  }

  // Alternative headers
  const realIP = headers.get("x-real-ip");
  if (realIP) return realIP;

  const cfConnectingIP = headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback (may be local IP in development)
  return headers.get("x-forwarded") || null;
}

/**
 * Detect region from IP address using ipapi.co (free tier)
 * @param {string} ip - IP address
 * @returns {Promise<string>} Region code (US or AU)
 */
async function fetchGeoFromIP(ip) {
  // Check if localhost or development environment
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    console.log("⚠️ Local/private IP detected, defaulting to US region");
    return {
      region: REGION_US,
      countryCode: "US",
      countryName: getCountryForRegion(REGION_US),
    };
  }

  try {
    // Use ipapi.co free tier (150 requests/day, no API key needed)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "Chauff-App/1.0" },
    });

    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }

    const data = await response.json();
    const countryCode = data.country_code;
    const countryName = data.country_name;

    console.log(`🌍 Detected country from IP ${ip}: ${countryCode} (${countryName})`);

    // Map country code to region
    let region = REGION_US;
    if (countryCode === "US") {
      region = REGION_US;
    } else if (countryCode === "AU") {
      region = REGION_AU;
    } else {
      // Default to US for other countries
      console.log(`⚠️ Country ${countryCode} not supported, defaulting to US region`);
      region = REGION_US;
    }

    return {
      region,
      countryCode: countryCode || "US",
      countryName: countryName || getCountryForRegion(region),
    };
  } catch (error) {
    console.error("Error detecting region from IP:", error);
    // Fallback to US region on error
    return {
      region: REGION_US,
      countryCode: "US",
      countryName: getCountryForRegion(REGION_US),
    };
  }
}

/**
 * Detect geo info from IP with caching
 * @param {string} ip - IP address
 * @returns {Promise<{region: string, countryCode: string, countryName: string}>}
 */
async function detectGeoWithCache(ip) {
  if (!ip) {
    return {
      region: REGION_US,
      countryCode: "US",
      countryName: getCountryForRegion(REGION_US),
    };
  }

  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Using cached region for IP ${ip}: ${cached.region}`);
    return cached;
  }

  // Detect geo info
  const geo = await fetchGeoFromIP(ip);

  // Store in cache
  geoCache.set(ip, {
    ...geo,
    timestamp: Date.now(),
  });

  return geo;
}

/**
 * Detect region from IP with caching
 * @param {string} ip - IP address
 * @returns {Promise<string>} Region code (US or AU)
 */
export async function detectRegionWithCache(ip) {
  const geo = await detectGeoWithCache(ip);
  return geo.region;
}

/**
 * Detect region from Next.js request
 * @param {Request} request - Next.js request object
 * @returns {Promise<string>} Region code (US or AU)
 */
export async function detectRegionFromRequest(request) {
  const forcedRegion = process.env.DEV_FORCE_REGION;
  if (forcedRegion === REGION_US || forcedRegion === REGION_AU) {
    console.log(`🧪 Using forced region from env: ${forcedRegion}`);
    return forcedRegion;
  }

  const ip = extractIPFromRequest(request);
  
  if (!ip) {
    console.log("⚠️ Could not extract IP from request, defaulting to US");
    return REGION_US;
  }

  console.log(`🔍 Detecting region for IP: ${ip}`);
  return await detectRegionWithCache(ip);
}

/**
 * Detect country from Next.js request
 * @param {Request} request - Next.js request object
 * @returns {Promise<{countryCode: string, countryName: string}>}
 */
export async function detectCountryFromRequest(request) {
  const forcedCountry = process.env.DEV_FORCE_COUNTRY;
  if (forcedCountry) {
    console.log(`🧪 Using forced country from env: ${forcedCountry}`);
    return {
      countryCode: forcedCountry,
      countryName: forcedCountry === "AU" ? "Australia" : "United States",
    };
  }

  const ip = extractIPFromRequest(request);

  if (!ip) {
    console.log("⚠️ Could not extract IP from request, defaulting to US country");
    return {
      countryCode: "US",
      countryName: getCountryForRegion(REGION_US),
    };
  }

  console.log(`🔍 Detecting country for IP: ${ip}`);
  const geo = await detectGeoWithCache(ip);
  return { countryCode: geo.countryCode, countryName: geo.countryName };
}

/**
 * Clear the geolocation cache (useful for testing)
 */
export function clearGeoCache() {
  geoCache.clear();
  console.log("🗑️ Geolocation cache cleared");
}
