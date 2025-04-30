import mongoose, { Schema, model } from "mongoose";
import { calculateFineAmount } from "@/lib/fine-calculator";

export interface BorrowingDocument {
  _id: string;
  bookId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fine: number;
  fineStatus: "none" | "pending" | "partial" | "paid" | "waived";
  status: "borrowed" | "returned" | "overdue";
}

const BorrowingSchema = new Schema<BorrowingDocument>(
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
    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    fine: {
      type: Number,
      default: 0,
    },
    fineStatus: {
      type: String,
      enum: ["none", "pending", "partial", "paid", "waived"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue"],
      default: "borrowed",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient querying
BorrowingSchema.index({ bookId: 1, status: 1 });
BorrowingSchema.index({ userId: 1, status: 1 });
BorrowingSchema.index({ dueDate: 1, status: 1 });
BorrowingSchema.index({ fine: 1, fineStatus: 1 });

// Auto-update status to 'overdue' if past due date and calculate fine
BorrowingSchema.pre('save', async function(next) {
  const now = new Date();
  
  // Update status to overdue if applicable
  if (this.status === 'borrowed' && this.dueDate < now && !this.returnDate) {
    this.status = 'overdue';
    
    // Calculate and update the fine amount using the centralized utility
    try {
      this.fine = await calculateFineAmount(this.dueDate, now);
      if (this.fine > 0 && this.fineStatus === 'none') {
        this.fineStatus = 'pending';
      }
    } catch (error) {
      console.error('Error calculating fine:', error);
    }
  }
  
  next();
});

const Borrowing = mongoose.models?.Borrowing || model<BorrowingDocument>("Borrowing", BorrowingSchema);
export default Borrowing;