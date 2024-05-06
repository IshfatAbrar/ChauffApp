import { createBooking } from "@/lib/actions/booking.actions";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, bookingDetails } = req.body;
    try {
      const response = await createBooking(email, bookingDetails);
      res.status(201).json({ message: response.message });
    } catch (error) {
      console.error("Error creating booking:", error);
      res
        .status(500)
        .json({ message: "An error occurred while creating booking" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
