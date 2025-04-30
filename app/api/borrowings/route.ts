import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Borrowing from "@/models/Borrowing";
import Book from "@/models/Book";
import User from "@/models/User";
import mongoose from "mongoose";
import Author from "@/models/Author"; // <-- Add this line
import Category from "@/models/Category"; // <-- Add this line

// Get all borrowings with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const bookId = searchParams.get("bookId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    
    // Build filter
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (bookId) filter.bookId = bookId;
    if (status) filter.status = status;
    
    // Execute query with pagination
    const totalBorrowings = await Borrowing.countDocuments(filter);
    const borrowings = await Borrowing.find(filter)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Update status for any overdue items
    const today = new Date();
    for (const borrowing of borrowings) {
      if (borrowing.status === 'borrowed' && borrowing.dueDate < today && !borrowing.returnDate) {
        borrowing.status = 'overdue';
        await borrowing.save();
      }
    }
    
    return NextResponse.json({
      borrowings,
      pagination: {
        total: totalBorrowings,
        page,
        limit,
        pages: Math.ceil(totalBorrowings / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching borrowings:", error);
    return NextResponse.json(
      { message: "Error fetching borrowings" },
      { status: 500 }
    );
  }
}

// Create a new borrowing (issue a book)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate user exists
    const user = await User.findById(body.userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Validate book exists and has available copies
    const book = await Book.findById(body.bookId);
    if (!book) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404 }
      );
    }
    
    if (book.copiesAvailable <= 0) {
      return NextResponse.json(
        { message: "No copies available for borrowing" },
        { status: 400 }
      );
    }
    
    // Check if user already has this book borrowed
    const existingBorrowing = await Borrowing.findOne({
      userId: body.userId,
      bookId: body.bookId,
      status: { $in: ["borrowed", "overdue"] }
    });
    
    if (existingBorrowing) {
      return NextResponse.json(
        { message: "User already has this book borrowed" },
        { status: 400 }
      );
    }
    
    // Set due date if not provided (default 14 days from now)
    if (!body.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      body.dueDate = dueDate;
    }
    
    // Create borrowing record
    const newBorrowing = await Borrowing.create(body);
    
    // Update book available copies
    book.copiesAvailable -= 1;
    await book.save();
    
    // Populate response data
    const populatedBorrowing = await Borrowing.findById(newBorrowing._id)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email");
    
    return NextResponse.json(
      { message: "Book issued successfully", borrowing: populatedBorrowing },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating borrowing:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors: Record<string, string> = {};
      
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return NextResponse.json(
        { message: "Validation error", errors: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Error issuing book" },
      { status: 500 }
    );
  }
}