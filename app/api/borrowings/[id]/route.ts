import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Borrowing from "@/models/Borrowing";
import Book from "@/models/Book";
import mongoose from "mongoose";
import Author from "@/models/Author"; // <-- Add this line
import Category from "@/models/Category"; // <-- Add this line

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid borrowing ID format" },
        { status: 400 }
      );
    }

    const borrowing = await Borrowing.findById(id)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email");

    if (!borrowing) {
      return NextResponse.json(
        { message: "Borrowing record not found" },
        { status: 404 }
      );
    }

    // Update status if overdue
    if (borrowing.status === 'borrowed' && borrowing.dueDate < new Date() && !borrowing.returnDate) {
      borrowing.status = 'overdue';
      await borrowing.save();
    }

    return NextResponse.json(borrowing);
  } catch (error) {
    console.error("Error fetching borrowing:", error);
    return NextResponse.json(
      { message: "Error fetching borrowing details" },
      { status: 500 }
    );
  }
}

// Process book return
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid borrowing ID format" },
        { status: 400 }
      );
    }

    // Find the borrowing record
    const borrowing = await Borrowing.findById(id);
    if (!borrowing) {
      return NextResponse.json(
        { message: "Borrowing record not found" },
        { status: 404 }
      );
    }

    // If already returned, return error
    if (borrowing.status === 'returned') {
      return NextResponse.json(
        { message: "This book has already been returned" },
        { status: 400 }
      );
    }

    // Set return date if not provided
    const returnDate = body.returnDate ? new Date(body.returnDate) : new Date();
    
    // Calculate fine if returned after due date
    let fine = 0;
    if (returnDate > borrowing.dueDate) {
      // Use the static method from the model and await it
      // @ts-ignore
      fine = await (Borrowing as any).calculateFine(borrowing.dueDate, returnDate);
    }

    // Update the borrowing record
    borrowing.returnDate = returnDate;
    borrowing.status = 'returned';
    borrowing.fine = fine;
    await borrowing.save();

    // Increase book available copies
    const book = await Book.findById(borrowing.bookId);
    if (book) {
      book.copiesAvailable += 1;
      await book.save();
    }

    // Return the updated borrowing with populated data
    const updatedBorrowing = await Borrowing.findById(id)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email");

    return NextResponse.json({
      message: "Book returned successfully",
      borrowing: updatedBorrowing,
    });
  } catch (error: any) {
    console.error("Error processing return:", error);
    return NextResponse.json(
      { message: "Error processing book return" },
      { status: 500 }
    );
  }
}