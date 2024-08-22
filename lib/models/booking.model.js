import { Document, Schema, model, models } from "mongoose";

const BookingSchema = new Schema(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    stripeId: {
      type: String,
    },
    status: {
      type: String,
      default: "requested",
      required: true,
    },
    timeline: {
      type: {
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
  },
  { timestamps: true }
);

BookingSchema.index({ location: "2dsphere" });

const Booking = models.Booking || model("Booking", BookingSchema);

export default Booking;
