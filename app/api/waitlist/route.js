import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { isAdminEmail } from "../../../lib/admin";
import { connectMongoDB } from "../../../lib/mongodb";
import Waitlist from "../../../lib/models/waitlist.model";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const existing = await Waitlist.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "You're already on the waitlist." },
        { status: 409 }
      );
    }

    const entry = await Waitlist.create({ email });

    return NextResponse.json(
      {
        message: "You're on the waitlist.",
        entry: {
          id: entry._id.toString(),
          email: entry.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "You're already on the waitlist." },
        { status: 409 }
      );
    }
    console.log("Waitlist POST error:", error);
    return NextResponse.json(
      { message: "Could not join the waitlist." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    await connectMongoDB();
    const entries = await Waitlist.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      entries: entries.map((entry) => ({
        id: entry._id.toString(),
        email: entry.email,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    console.log("Waitlist GET error:", error);
    return NextResponse.json(
      { message: "Could not load waitlist." },
      { status: 500 }
    );
  }
}
