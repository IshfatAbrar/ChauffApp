import Driver from "../models/driver.model";
import Fleet from "../models/fleet.model";
import { connectMongoDB } from "../mongodb";

export const getFleetDrivers = async (fleetId) => {
  try {
    await connectMongoDB();
    
    const fleet = await Fleet.findById(fleetId);
    if (!fleet) {
      throw new Error("Fleet not found");
    }

    // Fetch all drivers belonging to this fleet with populated data
    const drivers = await Driver.find({ fleet: fleetId })
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 }); // Most recent first

    // Note: Drivers don't receive individual payments - all payments go to Fleet
    // We only track transaction count for statistics
    const driversWithStats = drivers.map(driver => {
      const driverObj = driver.toObject();
      
      // Count completed trips from transactions array
      const completedTrips = driver.transactions.filter(
        t => t.status === 'completed'
      ).length;
      
      // Get pending transactions
      const pendingTransactions = driver.transactions.filter(
        t => t.status === 'pending'
      ).length;

      return {
        ...driverObj,
        stats: {
          completedTrips,
          pendingTransactions,
        }
      };
    });

    return { 
      success: true, 
      drivers: driversWithStats,
      totalDrivers: driversWithStats.length
    };
  } catch (error) {
    console.error("Error fetching fleet drivers:", error);
    throw error;
  }
};

export const getDriverDetails = async (driverId, fleetId) => {
  try {
    await connectMongoDB();
    
    const driver = await Driver.findOne({ 
      _id: driverId, 
      fleet: fleetId 
    }).select('-password');
    
    if (!driver) {
      throw new Error("Driver not found or doesn't belong to this fleet");
    }

    return { success: true, driver: driver.toObject() };
  } catch (error) {
    console.error("Error fetching driver details:", error);
    throw error;
  }
};

export const updateDriverStatus = async (driverId, fleetId, isActive) => {
  try {
    await connectMongoDB();
    
    const driver = await Driver.findOne({ 
      _id: driverId, 
      fleet: fleetId 
    });
    
    if (!driver) {
      throw new Error("Driver not found or doesn't belong to this fleet");
    }

    driver.isActive = isActive;
    await driver.save();

    return { 
      success: true, 
      message: `Driver ${isActive ? 'activated' : 'deactivated'} successfully`,
      driver: driver.toObject()
    };
  } catch (error) {
    console.error("Error updating driver status:", error);
    throw error;
  }
};

