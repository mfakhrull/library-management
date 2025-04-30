import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reservation from "@/models/Reservation";
import Book from "@/models/Book";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get all reservations or filter by user/book/status
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
    
    // Auto-expire pending reservations that have passed their expiry date
    await Reservation.updateMany(
      { status: "pending", expiryDate: { $lt: new Date() } },
      { $set: { status: "expired" } }
    );
    
    // Execute query with pagination
    const totalReservations = await Reservation.countDocuments(filter);
    const reservations = await Reservation.find(filter)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      reservations,
      pagination: {
        total: totalReservations,
        page,
        limit,
        pages: Math.ceil(totalReservations / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { message: "Error fetching reservations" },
      { status: 500 }
    );
  }
}

// Create a new reservation
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. You must be logged in to reserve books." },
        { status: 401 }
      );
    }
    
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
        { message: "No copies available for reservation" },
        { status: 400 }
      );
    }
    
    // Check if user already has a pending reservation for this book
    const existingReservation = await Reservation.findOne({
      userId: body.userId,
      bookId: body.bookId,
      status: "pending"
    });
    
    if (existingReservation) {
      return NextResponse.json(
        { message: "You already have a pending reservation for this book" },
        { status: 400 }
      );
    }
    
    // Set reservation expiry date if not provided (default 3 days from now)
    if (!body.expiryDate) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);
      body.expiryDate = expiryDate;
    }
    
    // Create reservation
    const newReservation = await Reservation.create(body);
    
    // Decrease book available copies
    book.copiesAvailable -= 1;
    await book.save();
    
    // Populate response data
    const populatedReservation = await Reservation.findById(newReservation._id)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email");
    
    return NextResponse.json(
      { message: "Book reserved successfully", reservation: populatedReservation },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating reservation:", error);
    
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
      { message: "Error reserving book" },
      { status: 500 }
    );
  }
}