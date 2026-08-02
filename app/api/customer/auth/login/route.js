import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "../../../../../lib/models/user.model";
import { connectMongoDB } from "../../../../../lib/mongodb";
import { createCustomerToken } from "../../../../../lib/utils/customerAuth";
import { detectRegionFromRequest } from "../../../../../lib/utils/geolocation";
import { REGION_US, REGION_AU } from "../../../../../lib/utils/stripe";

const VALID_REGIONS = [REGION_US, REGION_AU];

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
    let user =
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

    // Prefill region from IP once if not yet set on the account
    if (!user.region || !VALID_REGIONS.includes(user.region)) {
      try {
        const detected = await detectRegionFromRequest(request);
        const region = VALID_REGIONS.includes(detected) ? detected : REGION_US;
        user = await User.findByIdAndUpdate(
          user._id,
          { region },
          { new: true }
        );
      } catch (error) {
        console.warn("Login region prefill failed:", error?.message);
        if (!user.region) {
          user = await User.findByIdAndUpdate(
            user._id,
            { region: REGION_US },
            { new: true }
          );
        }
      }
    }

    const token = await createCustomerToken(user);

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        region: user.region || REGION_US,
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
