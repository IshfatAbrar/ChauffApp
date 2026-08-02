import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "../../../../lib/models/user.model";
import { connectMongoDB } from "../../../../lib/mongodb";
import {
  getCustomerFromRequest,
  unauthorized,
} from "../../../../lib/utils/customerAuth";
import { detectRegionFromRequest } from "../../../../lib/utils/geolocation";
import {
  REGION_US,
  REGION_AU,
  getCurrencyForRegion,
  getStripePublishableKey,
} from "../../../../lib/utils/stripe";

const VALID_REGIONS = [REGION_US, REGION_AU];

function enrichUser(user) {
  const region = user.region || REGION_US;
  let stripePublishableKey = "";
  try {
    stripePublishableKey = getStripePublishableKey(region);
  } catch (error) {
    console.warn("Stripe publishable key unavailable:", error.message);
  }
  return {
    user: {
      id: user.id || user._id?.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      region,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    currency: getCurrencyForRegion(region),
    stripePublishableKey,
  };
}

async function ensureRegion(customer, request) {
  if (customer.region && VALID_REGIONS.includes(customer.region)) {
    return customer;
  }

  await connectMongoDB();
  const detected = await detectRegionFromRequest(request);
  const region = VALID_REGIONS.includes(detected) ? detected : REGION_US;

  const updated = await User.findByIdAndUpdate(
    customer.id,
    { region },
    { new: true }
  ).select("_id name email phone region createdAt updatedAt");

  return {
    id: updated._id.toString(),
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    region: updated.region,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function GET(request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    const withRegion = await ensureRegion(customer, request);
    return NextResponse.json(enrichUser(withRegion));
  } catch (error) {
    console.error("Customer profile get error:", error);
    return NextResponse.json(
      { message: "Failed to load profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) return unauthorized();

    const body = await request.json();
    const updates = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.phone === "string" && body.phone.trim()) {
      updates.phone = String(body.phone).trim();
    }
    if (typeof body.password === "string" && body.password.length >= 6) {
      updates.password = await bcrypt.hash(body.password, 10);
    }
    if (typeof body.region === "string") {
      const region = body.region.toUpperCase();
      if (!VALID_REGIONS.includes(region)) {
        return NextResponse.json(
          { message: "Region must be US or AU." },
          { status: 400 }
        );
      }
      updates.region = region;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update." },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const updated = await User.findByIdAndUpdate(customer.id, updates, {
      new: true,
    }).select("_id name email phone region createdAt updatedAt");

    // If region was never set and wasn't in this patch, prefill once
    let finalUser = {
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      region: updated.region || null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    if (!finalUser.region) {
      finalUser = await ensureRegion(finalUser, request);
    }

    return NextResponse.json(enrichUser(finalUser));
  } catch (error) {
    console.error("Customer profile update error:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Phone number already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Failed to update profile." },
      { status: 500 }
    );
  }
}
