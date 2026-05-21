# Complete Stripe Account Setup Guide

## Step-by-Step: Switching to Your New US Stripe Account

### Phase 1: Enable Required Stripe Services

#### 1.1 Log into Your New Stripe Account
- Go to https://dashboard.stripe.com
- Make sure you're in **Test Mode** (toggle in top right)
- Verify country shows **United States**

#### 1.2 Enable Stripe Connect
This allows fleet accounts to receive payments.

**Steps:**
1. In Stripe Dashboard, go to **Connect** (left sidebar)
2. Click **Get Started** if prompted
3. Choose **Platform or marketplace** as your business model
4. Fill in the form:
   - **Platform name:** Chauff
   - **Platform type:** Ride-sharing/Transportation
   - **Expected volume:** Select appropriate range
5. Click **Enable Connect**

**What this does:**
- Allows you to create connected accounts for fleets
- Enables you to transfer funds to fleet accounts (90% split)
- Provides onboarding flows for fleet account verification

#### 1.3 Enable Payment Methods
1. Go to **Settings** → **Payment methods**
2. Enable:
   - ✅ **Cards** (already enabled by default)
   - ✅ **Apple Pay** (optional, recommended)
   - ✅ **Google Pay** (optional, recommended)
3. Save changes

#### 1.4 Configure Checkout Settings
1. Go to **Settings** → **Checkout and Payment Links**
2. Set:
   - Currency: **USD**
   - Collect billing address: **Automatically**
3. Save

---

### Phase 2: Get Your API Keys

#### 2.1 Navigate to API Keys
1. Go to **Developers** → **API keys** (left sidebar)
2. Make sure you're in **Test mode** (toggle at top)

#### 2.2 Copy Your Keys

You'll see two keys:

**Publishable Key** (starts with `pk_test_`):
```
pk_test_51...your_key_here
```

**Secret Key** (starts with `sk_test_`):
```
sk_test_51...your_key_here
```

⚠️ **IMPORTANT:** 
- Keep Secret Key private - never commit to Git
- Publishable Key can be exposed in frontend code

---

### Phase 3: Update Your App Configuration

#### 3.1 Update Environment Variables

**File:** `chauff-app/.env.local` (create if doesn't exist)

```env
# Stripe Keys - TEST MODE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# MongoDB (keep existing)
MONGODB_URI=your_existing_mongodb_uri

# NextAuth (keep existing)
NEXTAUTH_SECRET=your_existing_secret
NEXTAUTH_URL=http://localhost:3000

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000

# Platform Fee (10% = 0.10)
PLATFORM_FEE_PERCENTAGE=0.10
```

**How to add them:**

1. Open `chauff-app/.env.local` (or create it)
2. Replace the Stripe keys with your new ones
3. Save the file
4. Restart your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

#### 3.2 Verify .gitignore

Make sure `.env.local` is in `.gitignore`:

**File:** `chauff-app/.gitignore`

Should contain:
```
.env*.local
.env
```

---

### Phase 4: Reset Existing Fleet Accounts

Your existing fleet ("Jane Travels") still has an AU Stripe account. You need to reset it.

#### 4.1 Option A: Use the Reset API (Easiest)

**In your browser console (while logged in as fleet):**

```javascript
fetch('http://localhost:3000/api/fleet/reset-stripe', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Reset Result:', data);
  if (data.success) {
    alert('Account reset! Go to /fleet/payments to reconnect');
    window.location.href = '/fleet/payments';
  }
})
```

#### 4.2 Option B: Manual Database Reset

**Using MongoDB Compass or CLI:**

```javascript
db.fleets.updateOne(
  { email: "jane@gmail.com" },
  { 
    $set: { 
      stripeAccountID: null,
      stripeAccountVerified: false 
    } 
  }
)
```

Then go to `/fleet/payments` and click "Connect with Stripe"

---

### Phase 5: Complete Fleet Onboarding

#### 5.1 Access Fleet Dashboard
1. Log in as fleet: `jane@gmail.com`
2. Go to `http://localhost:3000/fleet/payments`
3. Click **"Connect with Stripe"** or **"Complete Setup"**

#### 5.2 Fill Stripe Connect Form

You'll be redirected to Stripe's onboarding form. Fill in:

**Business Information:**
- Business name: `Jane Travels` (or your company name)
- Business type: `Company`
- Country: `United States` ✅
- Industry: `Transportation` or `Technology`

**Business Representative:**
- First name: Your name
- Last name: Your last name
- Date of birth: Any valid date (for test mode)
- Email: Your email
- Phone: Any US format number (e.g., +1 555-123-4567)

**Business Address:**
- Address: `123 Test Street`
- City: `New York`
- State: `New York`
- ZIP: `10001`

**Tax ID (EIN or SSN):**
For **test mode**, use:
- EIN: `000000000` (9 zeros)
OR
- SSN: `000000000` (for sole proprietor)

**Bank Account:**
For **test mode**, use these test credentials:
- **Routing number:** `110000000`
- **Account number:** `000123456789`
- **Account holder name:** Your name

**Identity Verification:**
For test mode, you may be asked for documents:
- Skip this step if possible (click "Verify later")
- Or upload any placeholder image

#### 5.3 Complete and Verify

1. Review all information
2. Check the terms and conditions
3. Click **"Submit"**
4. You'll be redirected back to `/fleet/payments`

**Expected Result:**
- ✅ Green status showing "Verified"
- ✅ Bank account information displayed
- ✅ Ready to receive transfers

---

### Phase 6: Test the Complete Flow

#### 6.1 Test Customer Payment

1. **Log in as customer** (or use existing account)
2. **Go to** `http://localhost:3000/book`
3. **Create a booking:**
   - Enter pickup/dropoff locations
   - Select car type
   - Choose date/time
4. **Add payment method** (if not already added):
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `10001`)
5. **Confirm booking**

**Expected Result:**
- ✅ Booking created
- ✅ Payment authorized (not charged yet)
- ✅ Shows "Authorization hold" message

#### 6.2 Test Payment Capture (Simulating Ride Completion)

**In your browser console or Postman:**

```javascript
// Get the booking ID from your trips page or database
const bookingId = "your_booking_id_here";
const paymentIntentId = "pi_..."; // From booking.payment.paymentIntentId

fetch('http://localhost:3000/api/capture-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bookingId: bookingId,
    paymentIntentId: paymentIntentId,
    finalAmount: 50.00  // Actual fare amount
  })
})
.then(r => r.json())
.then(data => {
  console.log('Capture Result:', data);
  if (data.success) {
    console.log('✅ Payment captured:', data.amountCaptured);
    console.log('✅ Platform fee:', data.platformFee);
    console.log('✅ Fleet amount:', data.fleetAmount);
    console.log('✅ Transfer ID:', data.transferId);
  }
})
```

**Expected Console Output:**
```
=== CAPTURE PAYMENT START ===
Payment Intent ID: pi_xxxxx
Capturing amount: 50.00
Platform Fee (10%): 5.00
Fleet Amount (90%): 45.00
Step 2: Creating transfer to fleet...
✅ Transfer created successfully
Transfer ID: tr_xxxxx
Transfer Amount: 45.00
```

#### 6.3 Verify in Stripe Dashboard

**Check Platform Account:**
1. Go to Stripe Dashboard → **Payments**
2. Find the payment (should show `$50.00` Succeeded)
3. Click on it to see details
4. Verify platform kept `$5.00` (10%)

**Check Fleet Connected Account:**
1. Go to **Connect** → **Accounts**
2. Click on "Jane Travels"
3. Go to **Transfers** tab
4. Should see transfer of `$45.00` (90%)
5. Status should be **Paid**

---

### Phase 7: Verify Everything Works

#### 7.1 Check Fleet Status

Access while logged in as fleet:
```
http://localhost:3000/api/fleet/check-status
```

**Should show:**
```json
{
  "canReceiveTransfers": true,
  "stripe": {
    "country": "US",
    "currency": "usd",
    "chargesEnabled": true,
    "payoutsEnabled": true
  },
  "issues": []
}
```

#### 7.2 Check Driver List

1. Go to `http://localhost:3000/fleet/drivers`
2. Should see your driver listed
3. Verify "Completed Trips" count updates after capture

---

### Phase 8: Production Checklist (When Ready)

When you're ready to go live, repeat these steps with **Live mode**:

#### 8.1 Switch to Live Mode

1. In Stripe Dashboard, toggle to **Live mode**
2. Complete **business verification**:
   - Real business information
   - Real bank account
   - Real identity documents
   - Business registration documents

#### 8.2 Get Live API Keys

1. Go to **Developers** → **API keys** (in Live mode)
2. Copy **Live keys**:
   - `pk_live_...`
   - `sk_live_...`

#### 8.3 Update Production Environment

**File:** `.env.production` or Vercel/deployment settings

```env
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET
```

#### 8.4 Re-verify Connect Settings

In **Live mode**:
1. Ensure Stripe Connect is enabled
2. Set platform URLs:
   - **Return URL:** `https://yourdomain.com/fleet/payments`
   - **Refresh URL:** `https://yourdomain.com/fleet/payments?refresh=true`
3. Configure webhooks (for advanced features):
   - **Endpoint:** `https://yourdomain.com/api/webhooks/stripe`
   - **Events:** `payment_intent.succeeded`, `transfer.created`, `account.updated`

---

## Common Issues & Solutions

### Issue 1: "Invalid API Key"
**Solution:** 
- Verify you copied the entire key
- Check you're using test key for test mode
- Restart dev server after changing `.env.local`

### Issue 2: "Connect not enabled"
**Solution:**
- Go to Stripe Dashboard → Connect
- Click "Get Started" and complete setup

### Issue 3: "Transfer failed: Invalid destination"
**Solution:**
- Fleet hasn't completed onboarding
- Check fleet status at `/api/fleet/check-status`
- Complete onboarding at `/fleet/payments`

### Issue 4: "Currency mismatch"
**Solution:**
- Ensure Stripe account country is US
- Verify test bank account is US-based
- Check fleet account shows `country: "US"`

### Issue 5: "Charges not enabled"
**Solution:**
- Complete business verification
- Add bank account
- Submit identity documents
- Wait for Stripe approval (instant in test mode)

---

## Test Card Numbers

For testing payments:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0341` | Declined (generic) |

**For all cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits (US cards)

---

## Summary Checklist

- [ ] Created new US Stripe account
- [ ] Enabled Stripe Connect
- [ ] Copied test API keys
- [ ] Updated `.env.local` with new keys
- [ ] Restarted dev server
- [ ] Reset fleet Stripe account (AU → US)
- [ ] Completed fleet onboarding with US details
- [ ] Verified fleet status shows `canReceiveTransfers: true`
- [ ] Tested customer payment flow
- [ ] Tested payment capture
- [ ] Verified transfer appears in fleet account
- [ ] Checked Stripe Dashboard shows correct amounts

---

## Need Help?

- **Stripe Documentation:** https://stripe.com/docs/connect
- **Test Mode Guide:** https://stripe.com/docs/testing
- **Connect Onboarding:** https://stripe.com/docs/connect/onboarding

**Your app is now configured to:**
- Accept payments from customers in USD
- Keep 10% platform fee automatically
- Transfer 90% to fleet accounts
- Handle fleet/driver management
- Process payments securely through Stripe

🎉 **You're all set!**





