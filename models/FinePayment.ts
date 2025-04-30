import mongoose, { Schema, model } from "mongoose";

export interface FinePaymentDocument {
  _id: string;
  borrowingId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  amountPaid: number;
  totalFine: number;
  paymentDate: Date;
  paymentMethod: "cash" | "card" | "online" | "waived";
  paymentStatus: "paid" | "partial" | "pending" | "waived";
  receiptNumber: string;
  notes: string;
  processedBy: mongoose.Schema.Types.ObjectId;
}

const FinePaymentSchema = new Schema<FinePaymentDocument>(
  {
    borrowingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrowing",
      required: [true, "Borrowing reference is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    amountPaid: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },
    totalFine: {
      type: Number,
      required: [true, "Total fine amount is required"],
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "waived"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending", "waived"],
      default: "pending",
    },
    receiptNumber: {
      type: String,
      default: () => `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    notes: {
      type: String,
      default: "",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient querying
FinePaymentSchema.index({ borrowingId: 1 });
FinePaymentSchema.index({ userId: 1 });
FinePaymentSchema.index({ paymentStatus: 1 });

const FinePayment = mongoose.models?.FinePayment || model<FinePaymentDocument>("FinePayment", FinePaymentSchema);
export default FinePayment;