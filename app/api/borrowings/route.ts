import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Borrowing from "@/models/Borrowing";
import Book from "@/models/Book";
import User from "@/models/User";
import Reservation from "@/models/Reservation";
import mongoose from "mongoose";
import Author from "@/models/Author";
import Category from "@/models/Category";

// Get all borrowings with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const bookId = searchParams.get("bookId");
    const status = searchParams.get("status");
    const query = searchParams.get("query"); // <-- add this line
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    
    // Build filter
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (bookId) filter.bookId = bookId;
    if (status) filter.status = status;

    // If searching, find matching userIds and bookIds
    let userIds: string[] = [];
    let bookIds: string[] = [];
    if (query) {
      // Find users matching query
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { userId: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
        ]
      }).select("_id");
      userIds = users.map((u: any) => u._id.toString());

      // Find books matching query
      const books = await Book.find({
        title: { $regex: query, $options: "i" }
      }).select("_id");
      bookIds = books.map((b: any) => b._id.toString());

      // Add $or to filter if any matches found
      filter.$or = [];
      if (userIds.length > 0) {
        filter.$or.push({ userId: { $in: userIds } });
      }
      if (bookIds.length > 0) {
        filter.$or.push({ bookId: { $in: bookIds } });
      }
      // If no matches, force empty result
      if (filter.$or.length === 0) {
        filter.$or.push({ _id: null });
      }
    }
    
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

    // Handle reservations if present
    if (body.reservationId && body.fulfillReservation) {
      // Check if reservation exists and is valid
      const reservation = await Reservation.findById(body.reservationId);
      
      if (!reservation) {
        return NextResponse.json(
          { message: "Reservation not found" },
          { status: 404 }
        );
      }

      if (reservation.status !== "pending") {
        return NextResponse.json(
          { message: `Cannot fulfill a reservation with status: ${reservation.status}` },
          { status: 400 }
        );
      }

      if (reservation.bookId.toString() !== body.bookId || reservation.userId.toString() !== body.userId) {
        return NextResponse.json(
          { message: "Reservation details do not match the borrowing request" },
          { status: 400 }
        );
      }

      // Update reservation to fulfilled
      reservation.status = "fulfilled";
      await reservation.save();
    } else {
      // If not fulfilling a specific reservation, check if there are pending reservations for this book
      const pendingReservations = await Reservation.find({
        bookId: body.bookId,
        status: "pending"
      }).sort({ reservationDate: 1 });  // Sort by oldest first

      // If there are pending reservations and the first one is not for this user, warn about priority
      if (pendingReservations.length > 0 && 
          pendingReservations[0].userId.toString() !== body.userId && 
          !body.ignoreReservationWarning) {
            
        // If explicitly ignoring reservations, log but continue
        if (body.handleReservation === "ignore") {
          console.log(`Admin is issuing book ${body.bookId} to user ${body.userId} despite existing reservation for user ${pendingReservations[0].userId}`);
        } else {
          return NextResponse.json(
            { 
              message: "This book has pending reservations. The first reservation is for a different user.",
              reservationDetails: {
                reservationId: pendingReservations[0]._id,
                userId: pendingReservations[0].userId
              },
              needsConfirmation: true
            },
            { status: 409 }  // Conflict status code
          );
        }
      }
    }
    
    // Set due date if not provided (default 14 days from now)
    if (!body.dueDate) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      body.dueDate = dueDate;
    }
    
    // Create borrowing record - remove any reservation fields not needed in borrowing
    const borrowingData = { ...body };
    delete borrowingData.reservationId;
    delete borrowingData.fulfillReservation;
    delete borrowingData.handleReservation;
    delete borrowingData.ignoreReservationWarning;
    
    const newBorrowing = await Borrowing.create(borrowingData);
    
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