import mongoose, { Schema, model } from "mongoose";

export interface ReservationDocument {
  _id: string;
  bookId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  reservationDate: Date;
  expiryDate: Date;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
}

const ReservationSchema = new Schema<ReservationDocument>(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    reservationDate: {
      type: Date,
      required: [true, "Reservation date is required"],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled", "cancelled", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient querying
ReservationSchema.index({ bookId: 1, status: 1 });
ReservationSchema.index({ userId: 1, status: 1 });
ReservationSchema.index({ expiryDate: 1, status: 1 });

const Reservation = mongoose.models?.Reservation || model<ReservationDocument>("Reservation", ReservationSchema);
export default Reservation;