import Fleet from "../models/fleet.model";
import { connectMongoDB } from "../mongodb";
import {
  getStripeInstance,
  getCurrencyForRegion,
  getStripeCountryCode,
} from "../utils/stripe";

// Helper function to clean and validate URL
const cleanUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  let cleaned = url.trim();
  
  // Remove duplicate protocols (e.g., https://https://example.com -> https://example.com)
  cleaned = cleaned.replace(/^(https?:\/\/)+(https?:\/\/)+/i, '$1');
  
  // Check if it starts with http:// or https://
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    return null;
  }
  
  return cleaned;
};

export const createFleetStripeAccount = async (fleetId) => {
  try {
    await connectMongoDB();
    const fleet = await Fleet.findById(fleetId);

    if (!fleet) {
      throw new Error("Fleet not found");
    }

    if (fleet.stripeAccountID) {
      return {
        success: true,
        stripeAccountID: fleet.stripeAccountID,
        message: "Stripe account already exists",
      };
    }

    // Get region-specific Stripe instance and configuration
    const region = fleet.region || "US";
    const stripe = getStripeInstance(region);
    const currency = getCurrencyForRegion(region);
    const country = getStripeCountryCode(region);

    console.log(`Creating Stripe Connect account for fleet in region: ${region} (${currency})`);

    const accountData = {
      type: "express",
      country,
      email: fleet.email,
      business_type: "company",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_profile: {
        name: fleet.businessName,
      },
      default_currency: currency.toLowerCase(),
    };

    const cleanedUrl = cleanUrl(fleet.website);
    if (cleanedUrl) {
      accountData.business_profile.url = cleanedUrl;
    }

    const account = await stripe.accounts.create(accountData);

    fleet.stripeAccountID = account.id;
    await fleet.save();

    return {
      success: true,
      stripeAccountID: account.id,
      message: "Stripe account created successfully",
    };
  } catch (error) {
    console.error("Error creating fleet stripe account:", error);
    throw error;
  }
};

export const createFleetAccountLink = async (fleetId, returnUrl, refreshUrl) => {
  try {
    await connectMongoDB();
    const fleet = await Fleet.findById(fleetId);

    if (!fleet) {
        throw new Error("Fleet not found");
    }

    // Get region-specific Stripe instance
    const region = fleet.region || "US";
    const stripe = getStripeInstance(region);
    const currency = getCurrencyForRegion(region);
    const country = getStripeCountryCode(region);

    if (!fleet.stripeAccountID) {
        // If no stripe account, create one first
        console.log(`Creating Stripe Connect account for fleet in region: ${region} (${currency})`);
        
        const accountData = {
            type: "express",
            country,
            email: fleet.email,
            business_type: "company",
            capabilities: {
                transfers: { requested: true },
                card_payments: { requested: true },
            },
            business_profile: {
                name: fleet.businessName,
            },
            default_currency: currency.toLowerCase(),
        };

        const cleanedUrl = cleanUrl(fleet.website);
        console.log("Original URL:", fleet.website);
        console.log("Cleaned URL:", cleanedUrl);
        
        if (cleanedUrl) {
            accountData.business_profile.url = cleanedUrl;
        }

        console.log("Creating Stripe account for fleet:", fleet._id);
        const account = await stripe.accounts.create(accountData);
        console.log("Stripe account created:", account.id);
        
        fleet.stripeAccountID = account.id;
        const savedFleet = await fleet.save();
        console.log("Fleet saved with stripeAccountID:", savedFleet.stripeAccountID);
    }

    const accountLink = await stripe.accountLinks.create({
      account: fleet.stripeAccountID,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error) {
    console.error("Error creating account link:", error);
    throw error;
  }
};

export const checkFleetStripeStatus = async (fleetId) => {
  try {
    await connectMongoDB();
    // Don't use lean() here since we need to save
    const fleet = await Fleet.findById(fleetId);

    if (!fleet || !fleet.stripeAccountID) {
      console.log("Fleet or stripeAccountID not found. Fleet exists:", !!fleet, "Has stripeAccountID:", !!fleet?.stripeAccountID);
      return {
        success: false,
        isVerified: false,
        details_submitted: false,
      };
    }

    // Get region-specific Stripe instance
    const region = fleet.region || "US";
    const stripe = getStripeInstance(region);

    const account = await stripe.accounts.retrieve(fleet.stripeAccountID);
    
    console.log("=== STRIPE ACCOUNT STATUS DEBUG ===");
    console.log("Account ID:", account.id);
    console.log("charges_enabled:", account.charges_enabled);
    console.log("payouts_enabled:", account.payouts_enabled);
    console.log("details_submitted:", account.details_submitted);
    console.log("requirements.currently_due:", account.requirements?.currently_due);
    console.log("requirements.eventually_due:", account.requirements?.eventually_due);
    console.log("requirements.past_due:", account.requirements?.past_due);
    console.log("===================================");
    
    const isVerified = account.charges_enabled && account.payouts_enabled;
    
    if (fleet.stripeAccountVerified !== isVerified) {
        fleet.stripeAccountVerified = isVerified;
        await fleet.save();
        console.log("Fleet verification status updated to:", isVerified);
    }

    return {
      success: true,
      isVerified: isVerified,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    };
  } catch (error) {
    console.error("Error checking stripe status:", error);
    throw error;
  }
};

export const getFleetBankDetails = async (fleetId) => {
  try {
    await connectMongoDB();
    const fleet = await Fleet.findById(fleetId);

    if (!fleet || !fleet.stripeAccountID) {
      return {
        success: false,
        message: "Fleet or Stripe account not found",
      };
    }

    // Get region-specific Stripe instance
    const region = fleet.region || "US";
    const stripe = getStripeInstance(region);

    // Get external accounts (bank accounts)
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      fleet.stripeAccountID,
      { object: 'bank_account', limit: 10 }
    );

    const bankAccounts = externalAccounts.data.map(account => ({
      id: account.id,
      bankName: account.bank_name,
      last4: account.last4,
      currency: account.currency,
      country: account.country,
      accountHolderName: account.account_holder_name,
      accountHolderType: account.account_holder_type,
      status: account.status,
      defaultForCurrency: account.default_for_currency,
    }));

    return {
      success: true,
      bankAccounts: bankAccounts,
      defaultBankAccount: bankAccounts.find(acc => acc.defaultForCurrency) || bankAccounts[0],
    };
  } catch (error) {
    console.error("Error getting fleet bank details:", error);
    throw error;
  }
};
