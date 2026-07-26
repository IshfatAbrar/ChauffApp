import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "../../../../lib/models/user.model";
import { connectMongoDB } from "../../../../lib/mongodb";
import {
  getCustomerFromRequest,
  unauthorized,
} from "../../../../lib/utils/customerAuth";

export async function GET(request) {
  const customer = await getCustomerFromRequest(request);
  if (!customer) return unauthorized();
  return NextResponse.json({ user: customer });
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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update." },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const updated = await User.findByIdAndUpdate(customer.id, updates, {
      new: true,
    }).select("_id name email phone createdAt updatedAt");

    return NextResponse.json({
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
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
