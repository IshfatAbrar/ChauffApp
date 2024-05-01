import User from "@/lib/models/user.model";
import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoDB();
    const { email, phone } = await req.json();
    const user = await User.findOne({ $or: [{ email }, { phone }] }).select(
      "_id"
    );
    console.log("user: ", user);
    return NextResponse.json({ user });
  } catch (error) {
    console.log(error);
  }
}
