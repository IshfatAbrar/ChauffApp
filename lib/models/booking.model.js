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
        type: String,
        coordinates: [Number],
        name: String,
        label: String,
      },
      required: true,
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
  },
  { timestamps: true }
);

const Booking = models.Booking || model("Booking", BookingSchema);

export default Booking;
