import Fleet from "../models/fleet.model";
import Driver from "../models/driver.model";
import { connectMongoDB } from "../mongodb";

export const listFleets = async () => {
  try {
    await connectMongoDB();
    const fleets = await Fleet.find({ isActive: true }, "businessName _id address");
    return { success: true, fleets };
  } catch (error) {
    console.error("Error listing fleets:", error);
    throw error;
  }
};

export const joinFleet = async (driverId, fleetId) => {
  try {
    await connectMongoDB();
    const driver = await Driver.findById(driverId);
    const fleet = await Fleet.findById(fleetId);

    if (!driver) throw new Error("Driver not found");
    if (!fleet) throw new Error("Fleet not found");

    driver.fleet = fleet._id;
    await driver.save();

    // Add driver to fleet's driver list if not already there
    if (!fleet.drivers.includes(driver._id)) {
      fleet.drivers.push(driver._id);
      await fleet.save();
    }

    return { success: true, message: `Successfully joined ${fleet.businessName}` };
  } catch (error) {
    console.error("Error joining fleet:", error);
    throw error;
  }
};

export const updateDriverBankDetails = async (driverId, bankDetails) => {
  try {
    await connectMongoDB();
    const driver = await Driver.findById(driverId);
    if (!driver) throw new Error("Driver not found");

    driver.bankDetails = {
        accountName: bankDetails.accountName,
        bsb: bankDetails.bsb,
        accountNumber: bankDetails.accountNumber,
        bankName: bankDetails.bankName
    };
    
    await driver.save();
    return { success: true, message: "Bank details updated" };
  } catch (error) {
    console.error("Error updating bank details:", error);
    throw error;
  }
};

