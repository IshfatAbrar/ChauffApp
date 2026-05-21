import mongoose, { Schema, models } from "mongoose";

const fleetSchema = new Schema(
  {
    // Account credentials
    contactName: {
      type: String,
      required: [true, "Please enter a primary contact name"],
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, "Please enter your business / fleet name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Please enter a phone number"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please set a password"],
      minlength: 6,
      maxlength: 64,
    },

    // Business details
    companyRegistrationNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postcode: String,
      country: {
        type: String,
        default: "United States",
      },
    },
    
    // Multi-region support
    region: {
      type: String,
      enum: ["US", "AU"],
      required: true,
      default: "US",
    },
    currency: {
      type: String,
      enum: ["USD", "AUD"],
      required: true,
      default: "USD",
    },
    
    website: {
      type: String,
      trim: true,
    },
    estimatedFleetSize: {
      type: Number,
      min: 1,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },

    // Stripe Connect Account for Fleet
    stripeAccountID: {
      type: String,
    },
    stripeAccountVerified: {
      type: Boolean,
      default: false,
    },

    // Relationship to drivers
    drivers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],

    // Operational / status flags
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    // For internal tagging / segmentation later
    tags: [String],

    // Booking policy settings
    bookingSettings: {
      /**
       * When true  → drivers can self-accept / self-assign rides via the mobile app.
       * When false → only fleet managers can assign bookings through the dashboard;
       *              the driver app should check this flag and hide/disable the
       *              accept action accordingly.
       */
      driversCanAccept: {
        type: Boolean,
        default: true,
      },
      /**
       * When true  → drivers can cancel / release an accepted booking from the app.
       * When false → only fleet managers can release bookings via the dashboard.
       */
      driversCanCancel: {
        type: Boolean,
        default: true,
      },
    },

    // Driver Payment Settings
    driverPaymentSettings: {
      paymentType: {
        type: String,
        enum: ["fixed_monthly", "fixed_per_ride", "percentage_per_ride"],
        default: "percentage_per_ride",
      },
      // For fixed_monthly: amount per month
      fixedMonthlyAmount: {
        type: Number,
        min: 0,
      },
      // For fixed_per_ride: amount per ride
      fixedPerRideAmount: {
        type: Number,
        min: 0,
      },
      // For percentage_per_ride: percentage of ride price
      percentagePerRide: {
        type: Number,
        min: 0,
        max: 100,
        default: 90, // 90% to driver, 10% to platform
      },
    },
  },
  {
    timestamps: true,
  }
);

fleetSchema.index({ email: 1 }, { unique: true });
fleetSchema.index({ phone: 1 }, { unique: true });
fleetSchema.index({ businessName: 1 });
fleetSchema.index({ status: 1 });

// Force model re-registration to ensure schema changes are picked up
if (models.Fleet) {
  delete models.Fleet;
}

const Fleet = mongoose.model("Fleet", fleetSchema);

export default Fleet;
