import { Document, Schema, model, models } from "mongoose";

const BookingSchema = new Schema(
  {
    chauffeur: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    type: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    pickupLocation: {
      type: {
        lat: Number,
        lng: Number,
        name: String,
        label: String,
      },
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    dropoffLocation: {
      type: {
        lat: Number,
        lng: Number,
        name: String,
        label: String,
      },
      required: true,
    },
    stopoverLocation: [
      {
        type: {
          lat: Number,
          lng: Number,
          name: String,
          label: String,
        },
      },
    ],
    duration: {
      type: String,
    },
    distance: {
      type: String,
    },
    toll: {
      type: Number,
      default: 0,
    },
    detailedLocation: {
      type: String,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    selectedCar: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    
    // Multi-region support - customer's region determines payment processing
    customerRegion: {
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
    
    stripeCustomerId: {
      type: String,
      required: true,
    },
    stripePaymentMethodId: {
      type: String,
      required: true,
    },
    payment: {
      paymentIntentId: String,
      penaltyPaymentIntentId: String, // Separate payment intent for penalties if charged separately
      transferId: String,
      penaltyTransferId: String, // Separate transfer for penalty payment
      transferStatus: {
        type: String,
        enum: ["completed", "failed"],
      },
      transferFailureReason: String,
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded"],
        default: "pending",
      },
      processedAt: Date,
      failureReason: String,
      refundAmount: Number,
      refundedAt: Date,
      stripeFee: Number,
      platformFee: {
        type: Number,
        default: function () {
          return this.price * 0.1; // 10% platform fee
        },
      },
      driverAmount: {
        type: Number,
        default: function () {
          return this.price * 0.9; // 90% to fleet (connected account)
        },
      },
      priceBreakdown: {
        baseFare: Number,
        timeCharge: Number,
        distanceCharge: Number,
        tollCharge: Number,
        penaltyCharge: Number,
        minutes: Number,
        miles: Number,
        carType: String,
        penalties: {
          arrivalPenalty: {
            penaltyMinutes: Number,
            penaltyCharge: Number,
            totalWaitMinutes: Number,
          },
          stopoverPenalties: {
            totalPenaltyMinutes: Number,
            totalPenaltyCharge: Number,
            waypointPenalties: Array,
          },
        },
        penaltyChargedSeparately: Boolean, // Whether penalty was charged as separate payment
      },
    },

    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "payment_failed",
      ],
      default: "requested",
      required: true,
    },
    // When the booking is marked completed, we set completedAt and expiresAt.
    // expiresAt is used by a MongoDB TTL index to automatically delete old completed bookings.
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: String,
        reason: String,
      },
    ],
    timeline: {
      type: {
        arrive: String,
        start: String,
        stop: String,
        waypoints: [
          {
            arrival: String,
            departure: String,
            waitingTime: String,
          },
        ],
      },
      default: {},
    },
    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["customer", "driver", "admin"],
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },
    rating: {
      customerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      customerFeedback: String,
      driverRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      driverFeedback: String,
    },
    // Fleet payout tracking
    fleetPaidToDriver: {
      type: Boolean,
      default: false,
    },
    fleetPaidAt: {
      type: Date,
    },
    fleetPaidAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);

BookingSchema.index({ location: "2dsphere" });
BookingSchema.index({ email: 1 });
BookingSchema.index({ chauffeur: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ "payment.status": 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ fleetPaidToDriver: 1 });
// TTL index: once expiresAt is in the past, MongoDB will delete the document.
// Note: TTL cleanup is not instant; Mongo's TTL monitor runs periodically.
BookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

BookingSchema.virtual("totalFees").get(function () {
  return (this.payment.stripeFee || 0) + (this.payment.platformFee || 0);
});

BookingSchema.methods.updateStatus = function (newStatus, updatedBy, reason) {
  this.statusHistory.push({
    status: this.status,
    timestamp: new Date(),
    updatedBy,
    reason,
  });
  this.status = newStatus;

  // If this booking is being marked complete(d), start its expiry timer.
  if (["complete", "completed"].includes(newStatus)) {
    const now = new Date();
    if (!this.completedAt) this.completedAt = now;
    // 30 days from completion
    this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (this.expiresAt) {
    // If status changes away from completed, don't let TTL delete it.
    this.expiresAt = undefined;
  }

  return this.save();
};

BookingSchema.methods.canBeCancelled = function () {
  return ["requested", "accepted"].includes(this.status);
};

BookingSchema.methods.canProcessPayment = function () {
  return this.status === "completed" && this.payment.status === "pending";
};

BookingSchema.pre("save", function (next) {
  if (this.isModified("price")) {
    this.payment.platformFee = this.price * 0.1;
    this.payment.driverAmount = this.price * 0.9;
  }
  next();
});

const Booking = models.Booking || model("Booking", BookingSchema);

export default Booking;
