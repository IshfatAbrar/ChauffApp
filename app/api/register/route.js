import User from "../../../lib/models/user.model";
import { connectMongoDB } from "../../../lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, phone, password } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    await connectMongoDB();
    await User.create({ name, email, phone, password: hashedPassword });

    return NextResponse.json({ message: "User Registered." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "An error occured." }, { status: 500 });
  }
}
