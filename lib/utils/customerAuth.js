import { encode, decode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import User from "../models/user.model";
import { connectMongoDB } from "../mongodb";

const SECRET = process.env.NEXTAUTH_SECRET;

export async function createCustomerToken(user) {
  return encode({
    token: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: "user",
    },
    secret: SECRET,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getCustomerFromRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) return null;

  try {
    const decoded = await decode({ token, secret: SECRET });
    if (!decoded?.email || decoded.role !== "user") return null;

    await connectMongoDB();
    const user = await User.findById(decoded.id).select(
      "_id name email phone createdAt updatedAt"
    );
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("Customer auth decode failed:", error);
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
