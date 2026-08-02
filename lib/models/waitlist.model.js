import mongoose, { Schema } from "mongoose";

const waitlistSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Drop cached model so schema changes (email-only) apply in hot reload.
if (mongoose.models.Waitlist) {
  delete mongoose.models.Waitlist;
  delete mongoose.connection.models.Waitlist;
}

const Waitlist = mongoose.model("Waitlist", waitlistSchema);

export default Waitlist;
