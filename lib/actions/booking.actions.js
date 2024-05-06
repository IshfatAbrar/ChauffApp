"use server";
import { connectMongoDB } from "../mongodb";
import User from "../models/user.model";
import Booking from "../models/booking.model";
import { NextResponse } from "next/server";

export async function getPhone(email) {
  try {
    await connectMongoDB();
    const user = await User.findOne({ email }).select("phone");
    return user ? user.phone : null;
  } catch (error) {
    console.error("Error fetching phone number:", error);
    throw error; // Propagate the error further
  }
}

export async function createBooking(email, bookingDetails) {
  try {
    await connectMongoDB();
    const user = await User.findOne({ email }).select("_id");
    if (!user) throw new Error("User not found");

    const emailString = email.toString();

    const newBooking = await Booking.create({
      email: emailString,
      rider: user._id,
      ...bookingDetails,
    });
    return JSON.parse(JSON.stringify(newBooking));
  } catch (error) {
    console.error("Error creating booking:", error);
  }
}

export async function getActiveBookings(email) {
  try {
    await connectMongoDB();
    const bookings = await Booking.find({ email, status: "requested" });

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found");
      return null;
    }

    const bookingObjs = bookings.map((booking) => ({
      status: booking.status,
      id: booking._id.toString(),
      pickup: booking.pickupLocation.name,
      dropoff: booking.dropoffLocation.name,
      price: booking.price,
      selectedCar: booking.selectedCar,
      time: booking.time,
    }));

    return bookingObjs; // Return an array of booking objects
  } catch (error) {
    console.error("Error outputting bookings:", error);
    throw error; // Propagate the error further
  }
}

export async function getPreviousBookings(email) {
  try {
    await connectMongoDB();
    const bookings = await Booking.find({ email, status: "complete" });

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found");
      return null;
    }

    const bookingObjs = bookings.map((booking) => ({
      status: booking.status,
      id: booking._id.toString(),
      pickup: booking.pickupLocation.name,
      dropoff: booking.dropoffLocation.name,
      price: booking.price,
      selectedCar: booking.selectedCar,
      time: booking.time,
    }));

    return bookingObjs; // Return an array of booking objects
  } catch (error) {
    console.error("Error outputting bookings:", error);
    throw error; // Propagate the error further
  }
}

export async function deleteBooking(id) {
  try {
    await connectMongoDB();
    const deletedBooking = await Booking.findByIdAndDelete(id);
    console.log(deletedBooking);
    return JSON.parse(JSON.stringify(deletedBooking));
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error; // Propagate the error further
  }
}
