import { connectMongoDB } from "../mongodb";
import Fleet from "../models/fleet.model";
import Driver from "../models/driver.model";
import Booking from "../models/booking.model";

// How long the first fleet in the queue gets to accept exclusively.
export const FIRST_WINDOW_MS = 8 * 60 * 1000; // 8 minutes

// How long each subsequent fleet gets before escalating further.
export const NEXT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Maximum number of fleets pre-ranked per booking.
const MAX_QUEUE_SIZE = 5;

/**
 * Scores all eligible fleets for a given booking and returns an ordered array
 * of fleet ObjectIds (best fit first).
 *
 * Scoring factors:
 *   40% — free driver capacity  (more idle drivers = better)
 *   35% — today's workload      (fewer rides today = fairer share)
 *   25% — historical acceptance rate (penalises fleets that regularly time out)
 */
export async function buildFleetQueue(booking) {
  await connectMongoDB();

  const fleets = await Fleet.find({
    status: "approved",
    isActive: true,
    stripeAccountVerified: true,
  }).lean();

  if (fleets.length === 0) return [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const scored = await Promise.all(
    fleets.map(async (fleet) => {
      const drivers = await Driver.find({ fleet: fleet._id, isActive: true }).lean();
      if (drivers.length === 0) return null;

      const driverIds = drivers.map((d) => d._id);

      const [activeCount, todayCount, totalAssigned, acceptedCount] =
        await Promise.all([
          // Drivers currently occupied
          Booking.countDocuments({
            chauffeur: { $in: driverIds },
            status: { $in: ["accepted", "in_progress"] },
          }),
          // Rides this fleet has handled today
          Booking.countDocuments({
            chauffeur: { $in: driverIds },
            status: { $nin: ["cancelled", "payment_failed"] },
            createdAt: { $gte: todayStart, $lte: todayEnd },
          }),
          // All times this fleet was ever given a priority window
          Booking.countDocuments({
            "fleetAssignmentHistory.fleet": fleet._id,
          }),
          // Times this fleet actually accepted within their window
          Booking.countDocuments({
            fleetAssignmentHistory: {
              $elemMatch: { fleet: fleet._id, reason: "accepted" },
            },
          }),
        ]);

      // Ratio of free drivers (0–1, higher is better)
      const freeRatio = Math.max(0, (drivers.length - activeCount) / drivers.length);

      // Workload penalty: exponential decay so heavy fleets score much lower
      const workloadScore = 1 / (1 + todayCount * 0.15);

      // Historical acceptance rate; default 0.75 for new fleets with no history
      const acceptanceRate = totalAssigned > 0 ? acceptedCount / totalAssigned : 0.75;

      const composite =
        0.40 * freeRatio +
        0.35 * workloadScore +
        0.25 * acceptanceRate;

      return { fleetId: fleet._id, score: composite };
    })
  );

  return scored
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_QUEUE_SIZE)
    .map((s) => s.fleetId);
}

/**
 * Advances a booking's assignment to the next untried fleet in its queue.
 * If the queue is exhausted, clears assignedFleet/assignedFleetExpiry so the
 * booking becomes visible to all fleets.
 *
 * Mutates the booking document in-place; caller must call booking.save().
 */
export function advanceFleetAssignment(booking) {
  const queue = (booking.fleetAssignmentQueue || []).map((id) => id.toString());
  const tried = new Set(
    (booking.fleetAssignmentHistory || []).map((h) => h.fleet.toString())
  );

  const nextId = queue.find((id) => !tried.has(id));

  if (nextId) {
    booking.assignedFleet = nextId;
    booking.assignedFleetExpiry = new Date(Date.now() + NEXT_WINDOW_MS);
  } else {
    // All ranked fleets exhausted — open the booking to everyone
    booking.assignedFleet = null;
    booking.assignedFleetExpiry = null;
  }
}
