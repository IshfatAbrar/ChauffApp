# Currency and Locale Update Summary

## Overview
All references to Australian currency (AUD) and locale (AU) have been updated to United States currency (USD) and locale (US) throughout the application.

## Files Updated

### 1. **chauff-app/app/fleet/drivers/page.js**
- **Line 74**: Changed `toLocaleDateString("en-AU")` → `toLocaleDateString("en-US")`
- **Currency Format**: Changed from AUD to USD formatting

### 2. **chauff-app/lib/controllers/payment.controller.js**
- **Line 28**: Changed Stripe account country from `"AU"` → `"US"`
- **Line 65-66**: Changed bank account from `country: "AU", currency: "aud"` → `country: "US", currency: "usd"`

### 3. **chauff-app/lib/models/fleet.model.js**
- **Line 48**: Changed default country from `"Australia"` → `"United States"`

### 4. **chauff-app/lib/controllers/fleet.stripe.controller.js**
- **Line 43**: Changed Stripe account country from `"AU"` → `"US"`
- **Line 89**: Changed another country reference from `"AU"` → `"US"`

### 5. **chauff-app/app/api/fleet/register/route.js**
- **Line 59**: Changed default country from `"Australia"` → `"United States"`

### 6. **chauff-app/lib/models/driver.model.js**
- **Line 60**: Changed field name from `bsb` (Australian BSB number) → `routingNumber` (US routing number)
- Updated comment from "Routing number in AU/US" → "US routing number"

### 7. **chauff-app/app/api/capture-payment/route.tsx**
- **Line 118**: Changed transfer currency from `"aud"` → `"usd"`

### 8. **chauff-app/app/api/create-payment-intent/route.tsx**
- Already using USD as default (confirmed)

## Summary of Changes

| Category | From | To |
|----------|------|-----|
| **Currency Code** | AUD / aud | USD / usd |
| **Country Code** | AU | US |
| **Country Name** | Australia | United States |
| **Locale** | en-AU | en-US |
| **Bank Field** | BSB | Routing Number |

## Impact

### Stripe Integration
- All Stripe accounts created will now use `country: "US"`
- Bank accounts will use USD currency
- Transfers will be processed in USD

### Date Formatting
- Dates displayed to fleet users will use US format (MM/DD/YYYY pattern)

### Currency Display
- All amounts shown as USD ($X.XX format)
- No division by 100 (amounts stored as dollars, displayed as dollars)

### Banking
- Driver bank details now use US routing numbers instead of Australian BSB codes

## Testing Recommendations

1. **Create new fleet account** - Verify Stripe account created with US settings
2. **Add bank account** - Test with US routing number format
3. **Process payment** - Confirm transfer currency is USD
4. **View fleet drivers** - Check date formatting shows US locale
5. **Check all currency displays** - Ensure showing USD correctly

## Notes

- All existing data in database remains unchanged
- New records will use US/USD settings
- Stripe test mode should use US test bank accounts
- Update any external documentation to reflect USD currency

---

**Date Updated:** 2025-11-27
**Status:** ✅ Complete

