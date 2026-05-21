import { Document, Schema, model, models } from "mongoose";

const driverSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the full name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please enter the email"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Please enter the phone"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please enter the password"],
      min: 6,
      max: 64,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleDetails: {
      make: String,
      model: String,
      year: Number,
      licensePlate: {
        type: String,
        unique: true,
      },
    },
    stripeAccountID: {
      type: String,
      required: false, // Changed from true to false as fleets now handle payments
    },
    bankAccountID: {
      type: String,
    },
    // Manual bank details for fleet payouts
    bankDetails: {
      accountName: String,
      routingNumber: String, // US routing number
      accountNumber: String,
      bankName: String,
    },
    // Link to Fleet
    fleet: {
      type: Schema.Types.ObjectId,
      ref: "Fleet",
    },
    stripeAccountVerified: {
      type: Boolean,
      default: false,
    },
    canReceivePayments: {
      type: Boolean,
      default: false,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        bookingId: {
          type: Schema.Types.ObjectId,
          ref: "Booking",
          required: true,
        },
        paymentIntentId: {
          type: String,
          required: true,
        },
        transferId: String,
        grossAmount: {
          type: Number,
          required: true,
        },
        netAmount: {
          type: Number,
          required: true,
        },
        platformFee: {
          type: Number,
          required: true,
        },
        stripeFee: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "pending",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: Map,
          of: String,
        },
      },
    ],
    paymentSettings: {
      minimumPayoutAmount: {
        type: Number,
        default: 10,
      },
      autoPayoutEnabled: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

driverSchema.index({ email: 1 });
driverSchema.index({ stripeAccountID: 1 });
driverSchema.index({ "transactions.status": 1 });

driverSchema.virtual("totalEarnings").get(function () {
  return this.transactions
    .filter((t) => t.status === "completed")
    .reduce((total, t) => total + t.netAmount, 0);
});

driverSchema.methods.canReceivePayment = function () {
  // Drivers now receive payments via their Fleet, so we check if they are active and have a fleet linked.
  // Note: Detailed fleet verification happens in the payment controller.
  return this.isActive && this.fleet;
};

driverSchema.methods.addTransaction = function (transactionData) {
  this.transactions.push(transactionData);
  return this.save();
};

const Driver = models.Driver || model("Driver", driverSchema);

export default Driver;
