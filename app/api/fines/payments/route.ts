import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FinePayment from "@/models/FinePayment";
import Borrowing from "@/models/Borrowing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { calculateFineAmount } from "@/lib/fine-calculator";

// Get all payments or filter by user or status
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }
    if (status) {
      query.paymentStatus = status;
    }
    
    // Get total count
    const total = await FinePayment.countDocuments(query);
    
    // Execute query with pagination
    const payments = await FinePayment.find(query)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("borrowingId", "bookId dueDate returnDate status")
      .populate("userId", "name userId email")
      .populate("processedBy", "name userId")
      .populate({
        path: "borrowingId",
        populate: {
          path: "bookId",
          select: "title isbn coverImage"
        }
      })
      .lean();
    
    return NextResponse.json({
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching fine payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch fine payments" },
      { status: 500 }
    );
  }
}

// Process a payment for a fine
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    const data = await request.json();
    
    // Validate required fields
    if (!data.borrowingId) {
      return NextResponse.json(
        { error: "Borrowing ID is required" },
        { status: 400 }
      );
    }
    
    if (!data.amountPaid && data.paymentMethod !== "waived") {
      return NextResponse.json(
        { error: "Payment amount is required" },
        { status: 400 }
      );
    }
    
    // Get the borrowing record
    const borrowing = await Borrowing.findById(data.borrowingId);
    if (!borrowing) {
      return NextResponse.json(
        { error: "Borrowing record not found" },
        { status: 404 }
      );
    }
    
    // Recalculate the fine to ensure it's up to date with current settings
    const currentFine = await calculateFineAmount(borrowing.dueDate, borrowing.returnDate || new Date());
    
    // Update the borrowing record with the fresh calculation
    if (borrowing.fine !== currentFine) {
      console.log(`Updated fine amount for borrowing ${borrowing._id} from ${borrowing.fine} to ${currentFine}`);
      borrowing.fine = currentFine;
      await borrowing.save();
    }
    
    // Check if there's a fine to pay
    if (borrowing.fine <= 0) {
      return NextResponse.json(
        { error: "No fine to pay for this borrowing" },
        { status: 400 }
      );
    }
    
    // Determine payment status
    let paymentStatus;
    if (data.paymentMethod === "waived") {
      paymentStatus = "waived";
      data.amountPaid = borrowing.fine; // Set amount to full fine if waived
    } else if (data.amountPaid >= borrowing.fine) {
      paymentStatus = "paid";
      data.amountPaid = borrowing.fine; // Cap payment at the fine amount
    } else {
      paymentStatus = "partial";
    }
    
    // Create payment record
    const payment = new FinePayment({
      borrowingId: data.borrowingId,
      userId: borrowing.userId,
      amountPaid: data.amountPaid,
      totalFine: borrowing.fine,
      paymentMethod: data.paymentMethod || "cash",
      paymentStatus,
      notes: data.notes || "",
      processedBy: session.user.id
    });
    
    await payment.save();
    
    // Update borrowing record's fine status
    borrowing.fineStatus = paymentStatus;
    await borrowing.save();
    
    return NextResponse.json({
      message: "Payment processed successfully",
      payment,
      borrowing
    });
  } catch (error) {
    console.error("Error processing fine payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}