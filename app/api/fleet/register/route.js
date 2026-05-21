import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "../../../../lib/mongodb";
import Fleet from "../../../../lib/models/fleet.model";
import { detectRegionFromRequest } from "../../../../lib/utils/geolocation";
import { getCurrencyForRegion, getCountryForRegion } from "../../../../lib/utils/stripe";

export async function POST(req) {
  try {
    const {
      contactName,
      businessName,
      email,
      phone,
      password,
      companyRegistrationNumber,
      street,
      city,
      state,
      postcode,
      country,
      website,
      estimatedFleetSize,
      notes,
    } = await req.json();

    if (!contactName || !businessName || !email || !phone || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const existingFleet = await Fleet.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingFleet) {
      return NextResponse.json(
        { message: "A fleet with this email or phone already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Detect fleet's region from IP address
    const region = await detectRegionFromRequest(req);
    const currency = getCurrencyForRegion(region);
    const detectedCountry = getCountryForRegion(region);

    console.log(`🌍 Fleet registering from region: ${region} (${currency})`);

    await Fleet.create({
      contactName,
      businessName,
      email,
      phone,
      password: hashedPassword,
      companyRegistrationNumber,
      address: {
        street,
        city,
        state,
        postcode,
        country: country || detectedCountry,
      },
      region, // Store detected region
      currency, // Store corresponding currency
      website,
      estimatedFleetSize: estimatedFleetSize ? Number(estimatedFleetSize) : undefined,
      notes,
    });

    return NextResponse.json(
      {
        message:
          "Fleet account created successfully. You can now manage your business and drivers with Chauff.",
        region,
        currency,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering fleet:", error);
    return NextResponse.json(
      { message: "An error occurred while registering the fleet." },
      { status: 500 }
    );
  }
}


