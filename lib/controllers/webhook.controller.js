const stripe = require("stripe")(process.env.STRIPE_SECRET);
const Driver = require("../models/driver.model");
const Booking = require("../models/booking.model");
const { sendNotification } = require("../utils/notifications");

// Stripe webhook endpoint
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object);
        break;

      case "transfer.paid":
        await handleTransferPaid(event.data.object);
        break;

      case "transfer.failed":
        await handleTransferFailed(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      case "payout.created":
        await handlePayoutCreated(event.data.object);
        break;

      case "payout.paid":
        await handlePayoutPaid(event.data.object);
        break;

      case "payout.failed":
        await handlePayoutFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Webhook processing failed");
  }
};

// Handle successful payment intent
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error("Booking not found for payment intent:", paymentIntent.id);
      return;
    }

    // Update booking payment status
    booking.payment.status = "completed";
    booking.payment.processedAt = new Date();
    booking.payment.stripeFee =
      paymentIntent.charges.data[0]?.outcome?.seller_message || 0;
    await booking.updateStatus(
      "completed",
      "system",
      "Payment processed successfully"
    );

    // Update driver transaction
    const driver = await Driver.findById(paymentIntent.metadata.driverId);
    if (driver) {
      const transaction = driver.transactions.find(
        (t) => t.paymentIntentId === paymentIntent.id
      );

      if (transaction) {
        transaction.status = "completed";
        transaction.transferId = paymentIntent.transfer_data?.destination;
        await driver.save();
      }

      // Send notifications
      await sendNotification(booking.email, "payment_success", {
        bookingId: booking._id,
        amount: booking.price,
        receiptUrl: paymentIntent.charges.data[0]?.receipt_url,
      });

      await sendNotification(driver.email, "payment_received", {
        bookingId: booking._id,
        amount: booking.payment.driverAmount / 100,
      });
    }

    console.log("Payment processed successfully for booking:", bookingId);
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
  }
};

// Handle failed payment intent
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error("Booking not found for payment intent:", paymentIntent.id);
      return;
    }

    // Update booking payment status
    booking.payment.status = "failed";
    booking.payment.failureReason =
      paymentIntent.last_payment_error?.message || "Payment failed";
    await booking.updateStatus(
      "payment_failed",
      "system",
      "Payment processing failed"
    );

    // Update driver transaction
    const driver = await Driver.findById(paymentIntent.metadata.driverId);
    if (driver) {
      const transaction = driver.transactions.find(
        (t) => t.paymentIntentId === paymentIntent.id
      );

      if (transaction) {
        transaction.status = "failed";
        await driver.save();
      }

      // Send failure notifications
      await sendNotification(booking.email, "payment_failed", {
        bookingId: booking._id,
        amount: booking.price,
        reason: booking.payment.failureReason,
      });

      await sendNotification(driver.email, "payment_failed_driver", {
        bookingId: booking._id,
        reason: booking.payment.failureReason,
      });
    }

    console.log("Payment failed for booking:", bookingId);
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
  }
};

// Handle transfer created (money moved to driver account)
const handleTransferCreated = async (transfer) => {
  try {
    const driver = await Driver.findOne({
      stripeAccountID: transfer.destination,
    });

    if (driver) {
      const transaction = driver.transactions.find(
        (t) => t.transferId === transfer.id
      );

      if (transaction) {
        transaction.transferId = transfer.id;
        transaction.status = "completed";
        await driver.save();
      }

      // Update driver balance
      driver.pendingBalance += transfer.amount / 100;
      await driver.save();

      console.log("Transfer created for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling transfer created:", error);
  }
};

// Handle transfer paid (money available to driver)
const handleTransferPaid = async (transfer) => {
  try {
    const driver = await Driver.findOne({
      stripeAccountID: transfer.destination,
    });

    if (driver) {
      // Move from pending to available balance
      driver.pendingBalance -= transfer.amount / 100;
      driver.balance += transfer.amount / 100;
      await driver.save();

      // Send notification
      await sendNotification(driver.email, "transfer_completed", {
        amount: transfer.amount / 100,
        availableBalance: driver.balance,
      });

      console.log("Transfer paid for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling transfer paid:", error);
  }
};

// Handle transfer failed
const handleTransferFailed = async (transfer) => {
  try {
    const driver = await Driver.findOne({
      stripeAccountID: transfer.destination,
    });

    if (driver) {
      const transaction = driver.transactions.find(
        (t) => t.transferId === transfer.id
      );

      if (transaction) {
        transaction.status = "failed";
        await driver.save();
      }

      // Send failure notification
      await sendNotification(driver.email, "transfer_failed", {
        amount: transfer.amount / 100,
        reason: transfer.failure_message || "Transfer failed",
      });

      console.log("Transfer failed for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling transfer failed:", error);
  }
};

// Handle account updated (driver verification status)
const handleAccountUpdated = async (account) => {
  try {
    const driver = await Driver.findOne({ stripeAccountID: account.id });

    if (driver) {
      // Update driver verification status
      driver.stripeAccountVerified = account.details_submitted;
      driver.canReceivePayments = account.charges_enabled;
      await driver.save();

      // Send verification status notification
      if (account.details_submitted) {
        await sendNotification(driver.email, "account_verified", {
          canReceivePayments: account.charges_enabled,
        });
      }

      console.log("Account updated for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling account updated:", error);
  }
};

// Handle payout created (withdrawal initiated)
const handlePayoutCreated = async (payout) => {
  try {
    const driver = await Driver.findOne({
      stripeAccountID: payout.destination,
    });

    if (driver) {
      // Deduct from available balance
      driver.balance -= payout.amount / 100;
      await driver.save();

      // Send notification
      await sendNotification(driver.email, "payout_initiated", {
        amount: payout.amount / 100,
        arrivalDate: new Date(payout.arrival_date * 1000),
      });

      console.log("Payout created for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling payout created:", error);
  }
};

// Handle payout paid (money sent to bank)
const handlePayoutPaid = async (payout) => {
  try {
    const driver = await Driver.findOne({
      stripeAccountID: payout.destination,
    });

    if (driver) {
      // Send confirmation notification
      await sendNotification(driver.email, "payout_completed", {
        amount: payout.amount / 100,
        bankLast4: payout.destination_bank_account?.last4,
      });

      console.log("Payout paid for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling payout paid:", error);
  }
};

// Handle payout failed
const handlePayoutFailed = async (payout) => {
  try {
    const driver = await Driver.findOne({
      stripeAccountID: payout.destination,
    });

    if (driver) {
      // Return money to available balance
      driver.balance += payout.amount / 100;
      await driver.save();

      // Send failure notification
      await sendNotification(driver.email, "payout_failed", {
        amount: payout.amount / 100,
        reason: payout.failure_message || "Payout failed",
      });

      console.log("Payout failed for driver:", driver._id);
    }
  } catch (error) {
    console.error("Error handling payout failed:", error);
  }
};

module.exports = {
  handleStripeWebhook,
};
