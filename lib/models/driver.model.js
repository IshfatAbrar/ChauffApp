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
      //   required: true,
      //unique: true,
    },
    vehicleDetails: {
      make: String,
      model: String,
      year: Number,
      licensePlate: {
        type: String,
        //unique: true,
      },
    },
    stripeAccountID: {
      type: String,
    },
    bankAccountID: {
      type: String,
    },
    balance: Number,
    transactions: [
      {
        amount: Number,
        date: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Driver = models.Driver || model("Driver", driverSchema);

export default Driver;
