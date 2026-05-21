# Payment Authorization and Capture Flow

## Overview

This app implements a two-step payment process for ride bookings:

1. **Authorization Hold** - When customer confirms booking, funds are authorized (held) but not charged
2. **Capture Payment** - When ride is completed, the actual amount is charged and transferred to Fleet

**Important:** All payments are processed in **USD** and transferred to the Fleet account. Individual drivers do NOT receive direct payments - the Fleet manages driver compensation internally.

---

## Flow Diagram

```
Customer Books Ride
        ↓
Authorization Hold Created ($50 estimated USD)
        ↓
    Ride Status: "requested"
    Payment Status: "processing"
        ↓
Driver Accepts & Completes Ride
        ↓
Driver App Captures Payment ($48 actual USD)
        ↓
Platform Fee (10%) deducted → $4.80
Fleet Receives Transfer (90%) → $43.20
        ↓
    Ride Status: "completed"
    Payment Status: "completed"
```

---

## API Endpoints

### 1. Create Payment Authorization (Customer App - Automatic)

**Endpoint:** `POST /api/create-payment-intent`

**When:** Called automatically when customer clicks "Confirm Ride"

**Request Body:**

```json
{
  "amount": 50.0,
  "customerId": "cus_xxx",
  "paymentMethodId": "pm_xxx",
  "metadata": {
    "selectedCar": "Luxury Sedan",
    "pickupLocation": "123 Main St",
    "dropoffLocation": "456 Oak Ave"
  }
}
```

**Response (Success):**

```json
{
  "success": true,
  "paymentIntentId": "pi_xxx",
  "status": "requires_capture",
  "amount": 50.0,
  "message": "Payment authorization successful. Funds are on hold."
}
```

**What Happens:**

- Customer's card is authorized for $50
- No money is actually charged yet
- Funds are held for 7 days (Stripe default)
- Booking is created with `paymentIntentId`

---

### 2. Capture Payment (Driver App - When Ride Completes)

**Endpoint:** `POST /api/capture-payment`

**When:** Called by driver app when marking ride as "completed"

**Request Body:**

```json
{
  "paymentIntentId": "pi_xxx",
  "finalAmount": 48.5,
  "bookingId": "booking_id_from_mongodb"
}
```

**Parameters:**

- `paymentIntentId` (required) - From booking.payment.paymentIntentId
- `finalAmount` (optional) - Actual charge amount. If not provided, charges authorized amount
- `bookingId` (optional but recommended) - Updates booking status in database

**Response (Success):**

```json
{
  "success": true,
  "paymentIntentId": "pi_xxx",
  "status": "succeeded",
  "amountCaptured": 48.5,
  "message": "Payment captured successfully"
}
```

**Important Notes:**

- Can only capture ≤ authorized amount
- If actual fare is $48 but authorization was $50, you can capture $48
- Cannot capture more than authorized amount
- After capture, money is transferred to platform account

**Example Driver App Integration:**

```javascript
// In driver app when completing ride
async function completeRide(booking, actualFare) {
  try {
    const response = await fetch("/api/capture-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: booking.payment.paymentIntentId,
        finalAmount: actualFare,
        bookingId: booking._id,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert(`Payment of $${data.amountCaptured} captured successfully!`);
      // Update UI to show ride completed
    } else {
      alert(`Payment failed: ${data.error}`);
      // Handle error - maybe retry or contact support
    }
  } catch (error) {
    console.error("Error capturing payment:", error);
  }
}
```

---

### 3. Cancel Payment Hold (Driver/Customer App - When Ride Cancelled)

**Endpoint:** `POST /api/cancel-payment`

**When:** Called when ride is cancelled before completion

**Request Body:**

```json
{
  "paymentIntentId": "pi_xxx",
  "bookingId": "booking_id_from_mongodb",
  "cancelReason": "Customer cancelled - found alternative ride"
}
```

**Response (Success - Hold Released):**

```json
{
  "success": true,
  "paymentIntentId": "pi_xxx",
  "status": "canceled",
  "message": "Payment authorization released successfully"
}
```

**Response (Success - Refund Issued):**
If payment was already captured, a refund is issued instead:

```json
{
  "success": true,
  "refundId": "re_xxx",
  "status": "succeeded",
  "amountRefunded": 48.5,
  "message": "Payment refunded successfully"
}
```

**Example Integration:**

```javascript
async function cancelRide(booking, reason) {
  const response = await fetch("/api/cancel-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentIntentId: booking.payment.paymentIntentId,
      bookingId: booking._id,
      cancelReason: reason,
    }),
  });

  const data = await response.json();

  if (data.success) {
    if (data.status === "canceled") {
      alert("Ride cancelled. Authorization hold released.");
    } else {
      alert(`Ride cancelled. $${data.amountRefunded} refunded to customer.`);
    }
  }
}
```

---

## Database Schema

The booking model stores payment information:

```javascript
{
  payment: {
    paymentIntentId: "pi_xxx",        // Stripe Payment Intent ID
    transferId: "tr_xxx",             // Stripe Transfer ID (for fleet payments)
    status: "processing",              // pending | processing | completed | failed | refunded
    processedAt: Date,                 // When payment was captured
    failureReason: String,             // If payment failed
    refundAmount: Number,              // If partially refunded
    refundedAt: Date,                  // When refunded
    stripeFee: Number,                 // Stripe's fee
    platformFee: Number,               // Your platform fee (default 10%)
    driverAmount: Number               // Amount driver receives (default 90%)
  }
}
```

---

## Payment Statuses

| Status       | Description                             | Actions Available    |
| ------------ | --------------------------------------- | -------------------- |
| `pending`    | Booking created, no payment initiated   | Create authorization |
| `processing` | Authorization hold active               | Capture or Cancel    |
| `completed`  | Payment captured successfully           | Refund only          |
| `failed`     | Payment authorization or capture failed | Retry payment        |
| `refunded`   | Payment refunded to customer            | None                 |

---

## Error Handling

### Common Errors

**Authorization Failed:**

```json
{
  "success": false,
  "error": "Your card was declined. Insufficient funds."
}
```

**Action:** Ask customer for different payment method

**Capture Failed:**

```json
{
  "success": false,
  "error": "Payment cannot be captured. Current status: canceled"
}
```

**Action:** Authorization expired or was cancelled. Cannot capture.

**Amount Too High:**

```json
{
  "success": false,
  "error": "Final amount ($55) exceeds authorized amount ($50)"
}
```

**Action:** Cannot charge more than authorized. Create new authorization.

---

## Testing

### Test Card Numbers (Stripe Test Mode)

| Card Number         | Scenario                              |
| ------------------- | ------------------------------------- |
| 4242 4242 4242 4242 | Successful authorization & capture    |
| 4000 0025 0000 3155 | Requires 3D Secure authentication     |
| 4000 0000 0000 9995 | Insufficient funds - declined         |
| 4000 0000 0000 0341 | Attaching fails (test error handling) |

### Test Flow

1. **Create Booking** (as customer)

   - Select ride and confirm
   - Check console for `paymentIntentId`
   - Verify payment status: "processing"

2. **Complete Ride** (as driver)

   - Call capture API with booking's `paymentIntentId`
   - Use actual fare (can be less than authorized)
   - Verify payment status: "completed"

3. **Cancel Ride** (before completion)
   - Call cancel API
   - Verify hold is released
   - Customer should see no charge

---

## Security Best Practices

1. ✅ **Never expose Secret Key** - Keep `STRIPE_SECRET_KEY` in environment variables
2. ✅ **Validate amounts server-side** - Don't trust client-provided amounts
3. ✅ **Use payment intents** - More secure than direct charges
4. ✅ **Store payment IDs** - Never store full card numbers
5. ✅ **Implement idempotency** - Use unique keys for retries
6. ✅ **Log all transactions** - Audit trail for disputes

---

## Next Steps for Driver App

To integrate this payment flow in your driver app:

1. **Display Pending Rides**

   - Show rides with `status: "requested"` or `"accepted"`
   - Show authorized amount from `booking.price`

2. **Complete Ride Button**

   - Calculate actual fare (with any adjustments)
   - Call `/api/capture-payment` endpoint
   - Update UI based on response

3. **Cancel Ride Button**

   - Call `/api/cancel-payment` endpoint
   - Show confirmation to driver

4. **Handle Errors**
   - Show user-friendly error messages
   - Provide retry option for network errors
   - Log errors for support team

---

## Support & Monitoring

Monitor payments in Stripe Dashboard:

- Live: https://dashboard.stripe.com/payments
- Test: https://dashboard.stripe.com/test/payments

Look for:

- Uncaptured authorizations (expire after 7 days)
- Failed captures (may need refund)
- Disputed charges (customer complaints)

---

## Questions?

Common scenarios:

**Q: What if ride takes longer and costs more than authorized amount?**
A: You can only capture up to the authorized amount. Consider:

- Authorizing 20-30% more than estimate
- Creating new authorization for additional amount
- Discussing with customer before completing

**Q: What happens if authorization expires (7 days)?**
A: Cannot capture expired authorization. Must create new one.

**Q: Can I partially refund after capture?**
A: Yes, use Stripe's refund API with specific amount.

**Q: What about tips?**
A: Implement separate payment flow for tips after ride completion.
