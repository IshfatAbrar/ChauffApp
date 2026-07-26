import { NextResponse } from "next/server";
import Booking from "../../../../lib/models/booking.model";
import { connectMongoDB } from "../../../../lib/mongodb";
import {
  createBooking,
  updateBookingPaymentIntent,
} from "../../../../lib/actions/booking.actions";
import {
  getCustomerFromRequest,
  unauthorized,
} from "../../../../lib/utils/customerAuth";

function serializeBooking(booking) {
  const stopover =
    booking.stopoverLocation?.map((stop) => stop?.name).filter(Boolean) || [];
  const rawId = booking._id || booking.id;

  return {
    id: rawId?.toString?.() || String(rawId),
    status: booking.status,
    pickup: booking.pickupLocation?.name,
    dropoff: booking.dropoffLocation?.name,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    stopover,
    stopoverLocation: booking.stopoverLocation || [],
    price: booking.price,
    currency: booking.currency || "USD",
    customerRegion: booking.customerRegion || "US",
    selectedCar: booking.selectedCar,
    time: booking.time,
    duration: booking.duration,
    distance: booking.distance,
    toll: booking.toll || 0,
    notes: booking.notes || "",
    detailedLocation: booking.detailedLocation || "",
    phoneNumber: booking.phoneNumber,
    paymentStatus: booking.payment?.status || "pending",
    timeline: booking.timeline || null,
    chauffeur: booking.chauffeur
      ? {
          id: booking.chauffeur._id?.toString?.() || booking.chauffeur.toString(),
          name: booking.chauffeur.name,
          phone: booking.chauffeur.phone,
        }
      : null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export async function GET(request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "upcoming";

    await connectMongoDB();

    let query = { email: customer.email };

    if (filter === "upcoming") {
      query.status = { $in: ["requested", "accepted", "in_progress"] };
    } else if (filter === "past") {
      const now = new Date();
      query.status = {
        $in: ["complete", "completed", "cancelled", "payment_failed"],
      };
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ];
    }

    const bookings = await Booking.find(query)
      .populate("chauffeur", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      bookings: bookings.map(serializeBooking),
    });
  } catch (error) {
    console.error("Customer bookings list error:", error);
    return NextResponse.json(
      { message: "Failed to fetch bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    const body = await request.json();
    const {
      detailedLocation,
      notes,
      time,
      selectedCar,
      duration,
      distance,
      toll,
      price,
      pickupLocation,
      dropoffLocation,
      stopoverLocation,
      customerRegion,
      currency,
      stripeCustomerId,
      stripePaymentMethodId,
      paymentIntentId,
    } = body;

    if (
      !time ||
      !selectedCar ||
      !price ||
      !pickupLocation?.lat ||
      !dropoffLocation?.lat ||
      !stripeCustomerId ||
      !stripePaymentMethodId
    ) {
      return NextResponse.json(
        { message: "Missing required booking fields." },
        { status: 400 }
      );
    }

    const bookingDetails = {
      detailedLocation: detailedLocation || "",
      phoneNumber: customer.phone,
      notes: notes || "",
      time: String(time),
      selectedCar,
      duration: duration || "",
      distance: distance || "",
      toll: toll || 0,
      price,
      pickupLocation,
      location: {
        type: "Point",
        coordinates: [pickupLocation.lng, pickupLocation.lat],
      },
      dropoffLocation,
      stopoverLocation: stopoverLocation || [],
      status: "requested",
      customerRegion: customerRegion || "US",
      currency: currency || "USD",
      stripeCustomerId,
      stripePaymentMethodId,
      payment: {
        status: "pending",
        ...(paymentIntentId ? { paymentIntentId } : {}),
      },
    };

    const newBooking = await createBooking(customer.email, bookingDetails);

    if (!newBooking?._id) {
      return NextResponse.json(
        { message: "Failed to create booking." },
        { status: 500 }
      );
    }

    if (paymentIntentId) {
      await updateBookingPaymentIntent(newBooking._id, paymentIntentId);
    }

    return NextResponse.json(
      { booking: serializeBooking(newBooking) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Customer create booking error:", error);
    return NextResponse.json(
      { message: "Failed to create booking." },
      { status: 500 }
    );
  }
}
