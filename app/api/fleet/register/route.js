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
      partnerType: requestedPartnerType,
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
        { message: "A partner with this email or phone already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Detect partner's region from IP address
    const region = await detectRegionFromRequest(req);
    const currency = getCurrencyForRegion(region);
    const detectedCountry = getCountryForRegion(region);
    const partnerType =
      requestedPartnerType === "solo" || requestedPartnerType === "fleet"
        ? requestedPartnerType
        : estimatedFleetSize && Number(estimatedFleetSize) > 1
          ? "fleet"
          : "solo";
    const size =
      partnerType === "solo"
        ? 1
        : estimatedFleetSize
          ? Number(estimatedFleetSize)
          : 2;

    console.log(
      `🌍 Partner registering (${partnerType}) from region: ${region} (${currency})`
    );

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
      region,
      currency,
      website,
      estimatedFleetSize: size,
      notes,
      // Allow new partners (solo or fleet) to use the platform immediately
      status: "approved",
      isActive: true,
      tags: [partnerType === "solo" ? "solo" : "fleet"],
    });

    return NextResponse.json(
      {
        message:
          "Partner account created successfully. Sign in to open your partner dashboard.",
        region,
        currency,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering partner:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the partner account." },
      { status: 500 }
    );
  }
}


