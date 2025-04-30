import mongoose, { Schema, model } from "mongoose";

export interface BorrowingDocument {
  _id: string;
  bookId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fine: number;
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

// Static method to calculate fine for overdue books
BorrowingSchema.statics.calculateFine = function(dueDate: Date, returnDate: Date = new Date()): number {
  const FINE_RATE_PER_DAY = 1.00; // $1 per day
  
  if (returnDate <= dueDate) return 0;
  
  const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return overdueDays * FINE_RATE_PER_DAY;
};

// Auto-update status to 'overdue' if past due date
BorrowingSchema.pre('save', function(next) {
  if (this.status === 'borrowed' && this.dueDate < new Date() && !this.returnDate) {
    this.status = 'overdue';
  }
  next();
});

const Borrowing = mongoose.models?.Borrowing || model<BorrowingDocument>("Borrowing", BorrowingSchema);
export default Borrowing;