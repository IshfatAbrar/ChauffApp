# Multi-Region Stripe Setup Guide

## Overview

The Chauff platform now supports multiple regions (US and Australia) with separate Stripe accounts for each region. This guide explains how to set up and configure the multi-region functionality.

## Architecture

### Region Detection

- **Fleet Registration**: Region is detected from the fleet's IP address during signup and stored permanently
- **Customer Bookings**: Region is detected from the customer's IP address each time they visit the booking page
- **Payment Processing**: Customer's region determines which Stripe account processes the payment
- **Currency**: USD for US region, AUD for Australian region

### Data Flow

```
Customer Visits Booking Page
    ↓
Detect IP → Determine Region (US/AU)
    ↓
Load Region-Specific Stripe Publishable Key
    ↓
Customer Creates Payment Method (stored in region's Stripe account)
    ↓
Booking Created (with customerRegion and currency)
    ↓
System Assigns to Nearest Fleet
    ↓
Payment Processed via Customer's Regional Stripe Account
    ↓
Funds Transferred to Fleet's Stripe Connect Account
```

## Environment Variables Setup

### Step 1: Create/Update `.env.local`

Create a file named `.env.local` in the `chauff-app` directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Platform Fee (10% = 0.10)
PLATFORM_FEE_PERCENTAGE=0.10

# ===== US STRIPE ACCOUNT (PRIMARY) =====
STRIPE_US_PUBLISHABLE_KEY=pk_test_your_us_publishable_key
STRIPE_US_SECRET_KEY=sk_test_your_us_secret_key
NEXT_PUBLIC_STRIPE_US_PUBLISHABLE_KEY=pk_test_your_us_publishable_key

# ===== AUSTRALIAN STRIPE ACCOUNT (SECONDARY) =====
STRIPE_AU_PUBLISHABLE_KEY=pk_test_your_au_publishable_key
STRIPE_AU_SECRET_KEY=sk_test_your_au_secret_key
NEXT_PUBLIC_STRIPE_AU_PUBLISHABLE_KEY=pk_test_your_au_publishable_key

# ===== LEGACY (BACKWARD COMPATIBILITY) =====
# These default to US Stripe account
STRIPE_PUBLISHABLE_KEY=pk_test_your_us_publishable_key
STRIPE_SECRET_KEY=sk_test_your_us_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_us_publishable_key

# ===== IP GEOLOCATION (OPTIONAL) =====
# Leave empty to use free ipapi.co service (150 requests/day)
IPGEOLOCATION_API_KEY=

# Default region fallback
DEFAULT_REGION=US
```

### Step 2: Get Your Stripe Credentials

#### US Stripe Account

1. Go to https://dashboard.stripe.com
2. Switch to your US Stripe account
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`) and **Secret key** (starts with `sk_test_`)
5. Paste them into the `STRIPE_US_*` variables

#### Australian Stripe Account

1. Create a new Stripe account with Australia as the country
   - Or switch to your existing Australian Stripe account
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. Paste them into the `STRIPE_AU_*` variables

### Step 3: Enable Stripe Connect (Both Accounts)

For each Stripe account (US and AU):

1. Go to **Connect** in the left sidebar
2. Click **Get Started**
3. Choose **Platform or marketplace** as your business model
4. Fill in the form and enable Connect
5. This allows fleet accounts to receive payments via Stripe Connect

## Database Migration

After setting up the environment variables, run the migration script to update existing data:

```bash
cd chauff-app
node scripts/migrate-add-regions.js
```

This script will:
- Add `region: "US"` and `currency: "USD"` to all existing fleet documents
- Add `customerRegion: "US"` and `currency: "USD"` to all existing booking documents
- Verify the migration was successful

## Testing

### Test Region Detection

1. **US Region Testing**:
   - Access the site from a US IP address (or use VPN)
   - Check browser console for: `🌍 Customer region detected: US (USD)`

2. **Australian Region Testing**:
   - Access the site from an Australian IP address (or use VPN)
   - Check browser console for: `🌍 Customer region detected: AU (AUD)`

3. **Local Development**:
   - Local IPs (127.0.0.1, localhost) default to US region
   - You can override by modifying the `detectRegionFromRequest` function in development

### Test Fleet Registration

1. Sign up as a new fleet
2. Check the console logs for region detection
3. Verify in MongoDB that the fleet has:
   - `region`: "US" or "AU"
   - `currency`: "USD" or "AUD"

### Test Payment Flow

1. Create a booking as a customer
2. Verify the correct Stripe publishable key is loaded
3. Add a payment method
4. Complete the booking
5. Check that:
   - Payment is processed in the correct region's Stripe account
   - Booking has `customerRegion` and `currency` fields
   - Fleet receives the transfer via Stripe Connect

## Key Files Modified

### Backend
- `lib/utils/stripe.js` - Region-aware Stripe utility
- `lib/utils/geolocation.js` - IP geolocation service
- `lib/models/fleet.model.js` - Added region and currency fields
- `lib/models/booking.model.js` - Added customerRegion and currency fields
- `lib/controllers/fleet.stripe.controller.js` - Updated for regional Stripe accounts
- `app/api/detect-region/route.js` - New endpoint for customer region detection
- `app/api/fleet/register/route.js` - Added region detection
- `app/api/create-payment-intent/route.tsx` - Uses customer's regional Stripe
- `app/api/capture-payment/route.tsx` - Uses customer's regional Stripe
- `app/api/create-setup-intent/route.tsx` - Uses customer's regional Stripe
- `app/api/get-customer-id/route.tsx` - Uses customer's regional Stripe
- `app/api/get-payment-method/route.tsx` - Uses customer's regional Stripe

### Frontend
- `app/book/page.js` - Detects customer region on load
- `components/Booking/Booking.js` - Passes region to child components
- `components/Booking/CarListOptions.js` - Passes region to confirmation
- `components/Booking/ConfirmationForm.js` - Includes region in booking creation
- `components/Booking/PaymentModal.js` - Loads region-specific Stripe key

## Important Notes

### Cross-Region Scenarios

If a US customer is assigned an Australian fleet (or vice versa), the payment is processed in the **customer's region**, but the fleet receives transfers in **their region**. This works because:

1. Payment is charged in customer's currency via their regional Stripe account
2. Fleet's Stripe Connect account is in their regional Stripe account
3. Stripe handles the cross-border transfer automatically

However, for best practice, consider matching customers with fleets in the same region when possible.

### Currency Display

- US customers see prices in USD ($)
- Australian customers see prices in AUD ($)
- Ensure your pricing logic accounts for currency differences if needed

### IP Geolocation Service

The system uses `ipapi.co` (free tier: 150 requests/day). For production with higher traffic:

1. Sign up for a paid IP geolocation service (ipgeolocation.io, ipapi.com, etc.)
2. Add your API key to `IPGEOLOCATION_API_KEY` in `.env.local`
3. Update `lib/utils/geolocation.js` to use your service's API

### Fallback Behavior

- If IP detection fails: Defaults to US region
- If environment variables are missing: Falls back to legacy variables or US account
- If geolocation API is unavailable: Defaults to US region

## Troubleshooting

### Issue: Region always shows as "US" in development

**Solution**: Local IPs default to US. Use a VPN or modify the `detectRegionFromRequest` function to return a hardcoded region for testing.

### Issue: "Stripe publishable key not found for region AU"

**Solution**: Ensure `STRIPE_AU_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_AU_PUBLISHABLE_KEY` are set in `.env.local`.

### Issue: Payment fails with "No such customer"

**Solution**: Customer was created in a different regional Stripe account. Ensure `region` parameter is passed consistently to all Stripe API calls.

### Issue: Fleet onboarding shows wrong country

**Solution**: Fleet's `region` field doesn't match their Stripe Connect account. Reset the fleet's Stripe account or update the `region` field in MongoDB to match.

## Support

For questions or issues:
1. Check the console logs for region detection messages
2. Verify all environment variables are set correctly
3. Ensure the migration script ran successfully
4. Check MongoDB documents have region/currency fields
