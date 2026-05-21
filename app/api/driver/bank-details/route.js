import { NextResponse } from "next/server";
import { updateDriverBankDetails } from "../../../../lib/controllers/driver.fleet.controller";

export async function POST(req) {
  try {
    const { driverId, bankDetails } = await req.json();

    if (!driverId || !bankDetails) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await updateDriverBankDetails(driverId, bankDetails);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

