import { NextResponse } from "next/server";
import { detectRegionFromRequest } from "../../../lib/utils/geolocation";
import {
  getCurrencyForRegion,
  getCountryForRegion,
  getStripePublishableKey,
} from "../../../lib/utils/stripe";

/**
 * API endpoint to detect customer's region from their IP address
 * Returns region, currency, and Stripe publishable key
 */
export async function GET(request) {
  try {
    // Detect region from IP address
    const region = await detectRegionFromRequest(request);
    const currency = getCurrencyForRegion(region);
    const country = getCountryForRegion(region);
    const stripePublishableKey = getStripePublishableKey(region);

    console.log(`✅ Region detected: ${region} (${currency})`);

    return NextResponse.json({
      success: true,
      region,
      currency,
      country,
      stripePublishableKey,
    });
  } catch (error) {
    console.error("Error detecting region:", error);
    
    // Return US as fallback
    return NextResponse.json({
      success: true,
      region: "US",
      currency: "USD",
      country: "United States",
      stripePublishableKey: getStripePublishableKey("US"),
      fallback: true,
    });
  }
}

export async function POST(request) {
  // Support both GET and POST for flexibility
  return GET(request);
}
