# Transfer Troubleshooting Guide

## Problem: Payments Successful But Not Showing in Fleet Connect Account

### Symptoms
- Payment shows as "Succeeded" in Stripe platform account
- Money is captured from customer successfully
- BUT: Transfer doesn't appear in fleet's connected account
- Fleet balance remains $0

### Most Common Causes

#### 1. Fleet Stripe Account Not Verified ⚠️ (MOST COMMON)

**Why this happens:**
- Fleet created Stripe account but didn't complete onboarding
- Fleet account was reset (AU → US) and verification status not updated
- Required documents or information missing

**How to check:**
```bash
node scripts/check-fleet-stripe-status.js fleet@example.com
```

**Look for:**
```
- Charges Enabled: ❌ NO
- Payouts Enabled: ❌ NO
- Details Submitted: ❌ NO
```

**Fix:**
1. Go to `/fleet/payments`
2. Click "Connect with Stripe" or "Complete Setup"
3. Complete ALL required information:
   - Business details (EIN or SSN)
   - Bank account (routing + account number)
   - Identity verification documents
   - Business representative information
4. Submit and wait for Stripe approval (usually instant for test mode)

#### 2. Fleet Account Created Before Country Update

**Why this happens:**
- Old fleet accounts were created with AU settings
- Can't transfer USD to AU accounts

**How to check:**
In Stripe Dashboard → Connected Accounts → Find your fleet → Check "Country"

**Fix:**
```bash
node scripts/reset-fleet-stripe-account.js fleet@example.com
```

This will:
- Delete old AU account
- Create new US account
- Fleet must complete onboarding again

#### 3. No Fleet Associated with Booking

**Why this happens:**
- Driver not linked to any fleet
- Fleet reference missing in driver record

**How to check:**
Check your database:
```javascript
db.drivers.findOne({ email: "driver@example.com" })
// Look for: fleet: ObjectId("...")
```

**Fix:**
Update driver to link to fleet:
```javascript
db.drivers.updateOne(
  { email: "driver@example.com" },
  { $set: { fleet: ObjectId("fleet_id_here") } }
)
```

---

## Diagnostic Steps

### Step 1: Check Server Logs

When a payment is captured, look for these logs:

**✅ Good (Transfer Successful):**
```
Step 2: Creating transfer to fleet...
✅ Transfer created successfully
Transfer ID: tr_xxxxx
Transfer Amount: 90.00
```

**❌ Bad (Transfer Failed):**
```
⚠️ Fleet Stripe account not verified. Account ID: acct_xxxx
Fleet must complete Stripe onboarding first.
```

OR

```
⚠️ No fleet associated with this booking
```

### Step 2: Run Diagnostic Script

```bash
cd chauff-app
node scripts/check-fleet-stripe-status.js fleet@example.com
```

This will show:
- Database status
- Stripe account status
- What's missing for verification
- Exact steps to fix

### Step 3: Check Stripe Dashboard

1. **Platform Account** (your main Chauff account):
   - Go to Stripe Dashboard → Payments
   - Find the payment (should show as Succeeded)
   - Check amount = what customer paid

2. **Connected Account** (fleet's account):
   - Go to Stripe Dashboard → Connect → Connected Accounts
   - Find the fleet account
   - Click on it → Transfers
   - Should see 90% of payment transferred

### Step 4: Verify Fleet in Database

Check MongoDB:
```javascript
db.fleets.findOne({ email: "fleet@example.com" })
```

Look for:
```javascript
{
  stripeAccountID: "acct_xxxxx",  // Must be present
  stripeAccountVerified: true,     // Must be true
  isActive: true                   // Must be true
}
```

---

## Common Error Messages

### "Fleet Stripe account not verified"

**Meaning:** Fleet hasn't completed Stripe onboarding

**Fix:** 
1. Fleet goes to `/fleet/payments`
2. Completes Stripe Connect onboarding
3. Submits all required documents
4. Run status check script to verify

### "No fleet associated with this booking"

**Meaning:** Driver not linked to any fleet

**Fix:**
Link driver to fleet in database or through driver signup flow

### "Transfer failed: No such destination"

**Meaning:** Stripe account ID invalid or doesn't exist

**Fix:**
- Account was deleted
- Run: `node scripts/reset-fleet-stripe-account.js fleet@example.com`
- Fleet reconnects

### "Transfer failed: The destination account must have at least one verified external account"

**Meaning:** Fleet hasn't added bank account details

**Fix:**
Fleet must add bank account in Stripe onboarding

---

## Prevention

### For New Fleets:

1. **Immediate Setup Required:**
   - After fleet signs up, they MUST complete Stripe onboarding
   - No transfers will work until verification complete

2. **Set Clear Expectations:**
   - Add notice: "You must complete Stripe verification before receiving payments"
   - Show verification status prominently on dashboard

3. **Automated Checks:**
   - Webhook to auto-update verification status
   - Email fleet when verification needed
   - Block driver assignments until verified

### For Testing:

1. **Use Stripe Test Mode:**
   - Test accounts verify instantly
   - No real documents needed
   - Use test bank accounts

2. **Test Bank Account:**
   - Routing: 110000000
   - Account: 000123456789
   - Country: US

---

## Quick Fix Checklist

- [ ] Run diagnostic script: `node scripts/check-fleet-stripe-status.js fleet@example.com`
- [ ] Check `stripeAccountVerified` in database
- [ ] Verify fleet completed Stripe onboarding
- [ ] Check account country is US (not AU)
- [ ] Verify bank account added
- [ ] Check driver has fleet linked
- [ ] Review server logs for transfer errors
- [ ] Check Stripe Dashboard for account status

---

## Need Help?

1. **Check server logs** when payment is captured
2. **Run diagnostic script** to see exact issue
3. **Look at Stripe Dashboard** Connected Accounts section
4. **Verify database** has correct fleet and driver links

If transfers still not working after all checks:
- Check Stripe API logs for detailed error messages
- Verify API keys are correct (test vs live)
- Check webhook events in Stripe Dashboard

---

**Last Updated:** 2025-11-27  
**Related Files:**
- `app/api/capture-payment/route.tsx` - Transfer logic
- `scripts/check-fleet-stripe-status.js` - Diagnostic tool
- `scripts/reset-fleet-stripe-account.js` - Account reset tool



