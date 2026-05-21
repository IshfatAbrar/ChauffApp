const stripe = require("stripe")(process.env.STRIPE_SECRET);
const Driver = require("../models/driver.model");
const Booking = require("../models/booking.model");

// CREATE STRIPE ACCOUNT FOR DRIVER
const createStripeAccountController = async (req, res) => {
  const { email } = req.body;

  try {
    const driver = await Driver.findOne({ email: email });

    if (!driver) {
      return res
        .status(404)
        .send({ success: false, message: "Driver not found" });
    }

    // Check if the driver already has a Stripe account
    if (driver.stripeAccountID) {
      return res.status(400).send({
        success: false,
        message: "Stripe account already exists for this driver",
      });
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: email,
      capabilities: {
        transfers: { requested: true },
      },
      default_currency: "usd",
    });

    driver.stripeAccountID = account.id;
    await driver.save();

    res.status(200).send({
      success: true,
      message: "Successfully created Stripe account",
      accountId: account.id,
    });
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// CREATE BANK ACCOUNT FOR DRIVER
const createBankController = async (req, res) => {
  const { accountNumber, routingNumber, name, email } = req.body;

  try {
    const driver = await Driver.findOne({ email: email });
    if (!driver || !driver.stripeAccountID) {
      return res.status(404).send({
        success: false,
        message: "Driver or Stripe account not found",
      });
    }

    // Create a bank token
    const bankAccountToken = await stripe.tokens.create({
      bank_account: {
        country: "US",
        currency: "usd",
        account_holder_name: name,
        account_holder_type: "individual",
        routing_number: routingNumber,
        account_number: accountNumber,
      },
    });

    // Attach the bank account to the Stripe account
    const externalAccount = await stripe.accounts.createExternalAccount(
      driver.stripeAccountID,
      { external_account: bankAccountToken.id }
    );

    driver.bankAccountID = externalAccount.id;
    await driver.save();

    res.status(200).send({
      success: true,
      message: "Successfully created and attached bank account",
    });
  } catch (error) {
    console.error("Error creating bank account:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// GET BANK DETAILS
const getBankDetailsController = async (req, res) => {
  try {
    const { driverId } = req.body;
    const driver = await Driver.findById(driverId);

    if (driver && driver.bankAccountID) {
      const bankAccount = await stripe.accounts.retrieveExternalAccount(
        driver.stripeAccountID,
        driver.bankAccountID
      );

      res.status(200).send({
        success: true,
        bankName: bankAccount.bank_name,
        last4: bankAccount.last4,
        account_holder_name: bankAccount.account_holder_name,
      });
    } else {
      return res
        .status(404)
        .send({ success: false, message: "No bank account found." });
    }
  } catch (error) {
    console.error("Error getting bank account:", error);
    return res.status(500).send({ success: false, error: error.message });
  }
};

// OLD PAYMENT SYSTEM REMOVED
// The app now uses authorization-capture flow via /api/capture-payment
// Payments go to Fleet, not individual drivers

// CREATE ACCOUNT LINK FOR DRIVER ONBOARDING
const createAccountLinkController = async (req, res) => {
  const { driverId } = req.body;

  try {
    const driver = await Driver.findById(driverId);

    if (!driver || !driver.stripeAccountID) {
      return res.status(404).send({
        success: false,
        message: "Driver or Stripe account not found",
      });
    }

    // Create an onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: driver.stripeAccountID,
      refresh_url: process.env.FRONTEND_URL + "/driver/reauth",
      return_url: process.env.FRONTEND_URL + "/driver/dashboard",
      type: "account_onboarding",
    });

    res.status(200).send({
      success: true,
      url: accountLink.url,
    });
  } catch (error) {
    console.error("Error creating account link:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// CHECK STRIPE ACCOUNT STATUS
const checkStripeAccountCreatedController = async (req, res) => {
  const { driverId } = req.body;

  try {
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res
        .status(404)
        .send({ success: false, message: "Driver not found" });
    }

    res.status(200).send({
      success: true,
      stripeAccountCreated: !!driver.stripeAccountID,
      accountId: driver.stripeAccountID,
    });
  } catch (error) {
    console.error("Error checking Stripe account:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// CHECK STRIPE ACCOUNT VERIFICATION
const checkStripeAccountVerifiedController = async (req, res) => {
  const { driverId } = req.body;

  try {
    const driver = await Driver.findById(driverId);

    if (!driver || !driver.stripeAccountID) {
      return res.status(404).send({
        success: false,
        message: "Driver or Stripe account not found",
      });
    }

    const account = await stripe.accounts.retrieve(driver.stripeAccountID);

    // Update driver verification status
    driver.stripeAccountVerified = account.details_submitted;
    driver.canReceivePayments = account.charges_enabled;
    await driver.save();

    res.status(200).send({
      success: true,
      stripeAccountVerified: account.details_submitted,
      canReceivePayments: account.charges_enabled,
      requiresAction: account.requirements?.currently_due?.length > 0,
    });
  } catch (error) {
    console.error("Error checking Stripe account verification:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// GET DRIVER PAYMENT HISTORY
const getPaymentHistoryController = async (req, res) => {
  const { driverId } = req.body;

  try {
    const driver = await Driver.findById(driverId).populate({
      path: "transactions.bookingId",
      select: "pickupLocation dropoffLocation selectedCar createdAt",
    });

    if (!driver) {
      return res.status(404).send({
        success: false,
        message: "Driver not found",
      });
    }

    const transactions = driver.transactions.sort((a, b) => b.date - a.date);

    res.status(200).send({
      success: true,
      transactions,
      totalEarnings: driver.totalEarnings,
      balance: driver.balance,
      pendingBalance: driver.pendingBalance,
    });
  } catch (error) {
    console.error("Error getting payment history:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

module.exports = {
  createBankController,
  createStripeAccountController,
  getBankDetailsController,
  // processPaymentController removed - using authorization-capture flow instead
  createAccountLinkController,
  checkStripeAccountCreatedController,
  checkStripeAccountVerifiedController,
  getPaymentHistoryController,
};
