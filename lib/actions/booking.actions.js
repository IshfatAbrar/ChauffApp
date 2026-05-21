"use server";
import { connectMongoDB } from "../mongodb";
import User from "../models/user.model";
import Booking from "../models/booking.model";
import Driver from "../models/driver.model";
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

    // Ensure a chauffeur (driver) is assigned so we can route payments to a Fleet
    // via Stripe destination charges at authorization time.
    // If a chauffeur was not provided, pick the first active driver whose fleet is
    // connected + verified with Stripe.
    let resolvedBookingDetails = { ...bookingDetails };
    if (!resolvedBookingDetails.chauffeur) {
      const candidateDrivers = await Driver.find({
        isActive: true,
        fleet: { $ne: null },
      })
        .populate("fleet")
        .limit(25);

      const selectedDriver = candidateDrivers.find(
        (d) => d.fleet?.stripeAccountID && d.fleet?.stripeAccountVerified
      );

      if (selectedDriver) {
        resolvedBookingDetails.chauffeur = selectedDriver._id;
      }
    }

    const newBooking = await Booking.create({
      email: emailString,
      ...resolvedBookingDetails,
    });
    return JSON.parse(JSON.stringify(newBooking));
  } catch (error) {
    console.error("Error creating booking:", error);
  }
}

export async function updateBookingPaymentIntent(bookingId, paymentIntentId) {
  try {
    await connectMongoDB();
    const updated = await Booking.findByIdAndUpdate(
      bookingId,
      {
        "payment.paymentIntentId": paymentIntentId,
        "payment.status": "processing",
      },
      { new: true }
    );
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    console.error("Error updating booking payment intent:", error);
    throw error;
  }
}

export async function getOngoingBookings(email) {
  try {
    await connectMongoDB();
    const bookings = await Booking.find({ email, status: "accepted" });

    if (!bookings || bookings.length === 0) {
      console.log("No ongoing bookings found");
      return null;
    }

    const bookingObjs = bookings.map((booking) => {
      const stopover = booking.stopoverLocation?.map((stop) => stop.name) || [];

      return {
        status: booking.status,
        id: booking._id.toString(),
        pickup: booking.pickupLocation.name,
        dropoff: booking.dropoffLocation.name,
        stopover,
        price: booking.price,
        customerRegion: booking.customerRegion,
        selectedCar: booking.selectedCar,
        timeline: {
          arrive: booking.timeline?.arrive,
          start: booking.timeline.start,
          waypoints:
            booking.timeline.waypoints?.map((waypoint) => ({
              arrival: waypoint?.arrival || null, // Ensure waypoints always include arrival
              name: waypoint?.name || "Unknown",
            })) || [],
          stop: booking.timeline.stop,
        },
        time: booking.time,
      };
    });

    return bookingObjs;
  } catch (error) {
    console.error("Error outputting bookings:", error);
    throw error;
  }
}

export async function getRequestedBookings(email) {
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
      customerRegion: booking.customerRegion,
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
    // Historical data may use either "complete" or "completed"
    const now = new Date();
    const bookings = await Booking.find({
      email,
      status: { $in: ["complete", "completed"] },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    });

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
      customerRegion: booking.customerRegion,
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
