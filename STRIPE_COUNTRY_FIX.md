# Fix: Stripe Onboarding Showing Australian Settings

## Problem
When a fleet connects with Stripe, the onboarding form shows Australian (AU) settings instead of United States (US) settings.

## Cause
This happens if the Stripe account was created before we updated the country settings from AU to US. Stripe sets the country when the account is created and it **cannot be changed** afterward.

## Solution Options

### Option 1: Reset the Stripe Account (Recommended for Development/Testing)

If this is a test account or hasn't completed onboarding yet, you can delete and recreate the account:

**Using the Reset Script:**

```bash
cd chauff-app
node scripts/reset-fleet-stripe-account.js your-fleet-email@example.com
```

This script will:
1. Find the fleet by email
2. Check the current Stripe account country
3. Delete the old account (if AU)
4. Create a new account with US settings
5. Update the database

**Manual Method:**

1. Go to your Stripe Dashboard (test or live mode)
2. Navigate to Connected Accounts
3. Find the fleet's account
4. Delete the account
5. In your database, update the fleet:
   ```javascript
   db.fleets.updateOne(
     { email: "fleet@example.com" },
     { $set: { stripeAccountID: null, stripeAccountVerified: false } }
   )
   ```
6. Have the fleet go through the connection process again

### Option 2: Complete with Current Account (If Already in Use)

If the fleet has already completed onboarding or has received payments:

1. **Do NOT delete the account** - this would disrupt operations
2. The account will continue to work with AU settings
3. For future fleets, ensure they're created with the new US settings
4. Consider creating a new fleet account for US operations if needed

## Prevention: Verify Settings Before Onboarding

The code now includes these US-specific settings:

```javascript
{
  type: "express",
  country: "US",  // ✅ Sets account to United States
  default_currency: "usd",  // ✅ Sets default currency to USD
  // ... other settings
}
```

### How to Verify New Accounts are US-Based

1. After creating a fleet, check the Stripe dashboard
2. Look at the Connected Account details
3. Verify:
   - Country: United States
   - Default Currency: USD

## Testing the Fix

1. **Create a new test fleet account** (or reset an existing one)
2. **Go to** `/fleet/payments`
3. **Click** "Connect with Stripe" or "Complete Setup"
4. **Verify the onboarding form shows:**
   - United States address fields
   - US bank account fields (routing number + account number)
   - US SSN/EIN fields
   - USD currency

## Common Issues

### Issue: Still showing AU after reset
**Solution:** 
- Clear browser cache
- Use incognito/private browsing mode
- Check that the database was updated correctly

### Issue: Script fails with "Account not found"
**Solution:** 
- The account was already deleted
- Just create a new one through the normal flow
- Or run the script - it will create a new account if none exists

### Issue: Multiple fleets need to be updated
**Solution:**
Create a batch script or run the reset script for each fleet:
```bash
node scripts/reset-fleet-stripe-account.js fleet1@example.com
node scripts/reset-fleet-stripe-account.js fleet2@example.com
```

## For Production Environments

⚠️ **IMPORTANT:** Only reset accounts that:
- Haven't completed onboarding
- Haven't received any payments
- Are test accounts

For production accounts with payment history:
1. Contact Stripe support to discuss options
2. Consider creating a new account for US operations
3. Migrate customers/data as needed

## Verification Checklist

After fixing, verify:
- [ ] Stripe account shows `country: "US"`
- [ ] Default currency is USD
- [ ] Onboarding form displays US fields
- [ ] Bank account section asks for routing number (not BSB)
- [ ] Address fields use US format (state, zip code)
- [ ] Tax ID asks for EIN or SSN (not ABN)

## Updated Code Files

The following files have been updated to ensure US settings:

1. ✅ `lib/controllers/fleet.stripe.controller.js` - Fleet Stripe account creation
2. ✅ `lib/controllers/payment.controller.js` - Driver Stripe account creation  
3. ✅ `lib/models/fleet.model.js` - Default country in Fleet model
4. ✅ `app/api/capture-payment/route.tsx` - Transfer currency
5. ✅ `app/api/fleet/register/route.js` - Fleet registration default country

All new accounts created will automatically use US settings.

---

**Last Updated:** 2025-11-27  
**Status:** ✅ Fixed - All new accounts will use US settings



