import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "../../../../../lib/models/user.model";
import { connectMongoDB } from "../../../../../lib/mongodb";
import { createCustomerToken } from "../../../../../lib/utils/customerAuth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const normalizedEmail = email.toLowerCase().trim();
    // Match exact lowercase first, then case-insensitive for older accounts
    const user =
      (await User.findOne({ email: normalizedEmail })) ||
      (await User.findOne({
        email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      }));

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createCustomerToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
