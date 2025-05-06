import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reservation from "@/models/Reservation";
import Book from "@/models/Book";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get a specific reservation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid reservation ID format" },
        { status: 400 }
      );
    }

    const reservation = await Reservation.findById(id)
      .populate("bookId", "title isbn coverImage")
      .populate("userId", "name userId email");

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if reservation is expired but status hasn't been updated
    if (
      reservation.status === "pending" &&
      reservation.expiryDate < new Date()
    ) {
      reservation.status = "expired";
      await reservation.save();
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { message: "Error fetching reservation" },
      { status: 500 }
    );
  }
}

// Update reservation (cancel or fulfill)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    // Verify user is authenticated and authorized
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. You must be logged in." },
        { status: 401 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid reservation ID format" },
        { status: 400 }
      );
    }

    // Find the reservation
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Only allow cancellation or fulfillment of pending reservations
    if (reservation.status !== "pending") {
      return NextResponse.json(
        { message: `Cannot update a reservation with status: ${reservation.status}` },
        { status: 400 }
      );
    }

    // Check if the user is the owner or an admin
    if (session.user.role !== "Admin" && session.user._id !== reservation.userId.toString()) {
      return NextResponse.json(
        { message: "Unauthorized. You can only manage your own reservations." },
        { status: 403 }
      );
    }

    // Handle cancellation
    if (body.status === "cancelled") {
      reservation.status = "cancelled";
      
      // Increase book available copies
      const book = await Book.findById(reservation.bookId);
      if (book) {
        book.copiesAvailable += 1;
        await book.save();
      }
      
      await reservation.save();
      
      return NextResponse.json({
        message: "Reservation cancelled successfully",
        reservation
      });
    }
    
    // Handle fulfillment (admin only)
    if (body.status === "fulfilled" && session.user.role === "Admin") {
      reservation.status = "fulfilled";
      
      // Increase book available copies when the reservation is fulfilled
      // This allows the book to be manually issued to the user afterward
      const book = await Book.findById(reservation.bookId);
      if (book) {
        book.copiesAvailable += 1;
        await book.save();
      }
      
      await reservation.save();
      
      return NextResponse.json({
        message: "Reservation marked as fulfilled",
        reservation
      });
    }

    return NextResponse.json(
      { message: "Invalid operation" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { message: "Error updating reservation" },
      { status: 500 }
    );
  }
}