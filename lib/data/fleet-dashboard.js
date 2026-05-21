import mongoose from "mongoose";
import { connectMongoDB } from "../mongodb";
import Fleet from "../models/fleet.model";
import Driver from "../models/driver.model";
import Booking from "../models/booking.model";

/**
 * Aggregates fleet KPIs, recent drivers, bookings, and revenue for the dashboard.
 */
export async function getFleetDashboardSnapshot(fleetId) {
  if (!fleetId) return null;

  await connectMongoDB();

  let fid;
  try {
    fid = new mongoose.Types.ObjectId(fleetId);
  } catch {
    return null;
  }

  const fleet = await Fleet.findById(fid)
    .select(
      "businessName region currency stripeAccountID stripeAccountVerified driverPaymentSettings status isActive",
    )
    .lean();

  if (!fleet) return null;

  const drivers = await Driver.find({ fleet: fid })
    .select("name email isActive isVerified canReceivePayments createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const driverIds = drivers.map((d) => d._id);

  const emptyTrips = {
    byStatus: {},
    live: 0,
    recent: [],
  };

  if (driverIds.length === 0) {
    return {
      fleet,
      drivers: {
        total: 0,
        active: 0,
        verified: 0,
        payoutReady: 0,
        recent: [],
      },
      trips: emptyTrips,
      revenue: { allTime: 0, thisMonth: 0 },
    };
  }

  const statusAgg = await Booking.aggregate([
    { $match: { chauffeur: { $in: driverIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const byStatus = {};
  statusAgg.forEach((s) => {
    if (s._id) byStatus[s._id] = s.count;
  });

  const live =
    (byStatus.accepted || 0) +
    (byStatus.in_progress || 0) +
    (byStatus.requested || 0);

  const recentBookings = await Booking.find({ chauffeur: { $in: driverIds } })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("chauffeur", "name")
    .select(
      "status price currency time pickupLocation dropoffLocation createdAt selectedCar payment.status",
    )
    .lean();

  const revAll = await Booking.aggregate([
    {
      $match: {
        chauffeur: { $in: driverIds },
        status: "completed",
      },
    },
    { $group: { _id: null, total: { $sum: "$price" } } },
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const revMonth = await Booking.aggregate([
    {
      $match: {
        chauffeur: { $in: driverIds },
        status: "completed",
      },
    },
    {
      $addFields: {
        effectiveDate: { $ifNull: ["$completedAt", "$updatedAt"] },
      },
    },
    {
      $match: {
        effectiveDate: { $gte: startOfMonth },
      },
    },
    { $group: { _id: null, total: { $sum: "$price" } } },
  ]);

  const activeDrivers = drivers.filter((d) => d.isActive).length;
  const verifiedDrivers = drivers.filter((d) => d.isVerified).length;
  const payoutReady = drivers.filter((d) => d.canReceivePayments).length;

  return {
    fleet,
    drivers: {
      total: drivers.length,
      active: activeDrivers,
      verified: verifiedDrivers,
      payoutReady,
      recent: drivers.slice(0, 5),
    },
    trips: {
      byStatus,
      live,
      recent: recentBookings,
    },
    revenue: {
      allTime: revAll[0]?.total || 0,
      thisMonth: revMonth[0]?.total || 0,
    },
  };
}
