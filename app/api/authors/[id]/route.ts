import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Author from "@/models/Author";
import Book from "@/models/Book";
import mongoose from "mongoose";

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
        { message: "Invalid author ID format" },
        { status: 400 }
      );
    }

    const author = await Author.findById(id);

    if (!author) {
      return NextResponse.json(
        { message: "Author not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(author);
  } catch (error) {
    console.error("Error fetching author:", error);
    return NextResponse.json(
      { message: "Error fetching author" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid author ID format" },
        { status: 400 }
      );
    }

    // Find and update the author
    const updatedAuthor = await Author.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedAuthor) {
      return NextResponse.json(
        { message: "Author not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Author updated successfully",
      author: updatedAuthor,
    });
  } catch (error: any) {
    console.error("Error updating author:", error);

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
      { message: "Error updating author" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid author ID format" },
        { status: 400 }
      );
    }

    // Check if any books are using this author
    const booksWithAuthor = await Book.countDocuments({ authorId: id });
    
    if (booksWithAuthor > 0) {
      return NextResponse.json(
        { 
          message: "Cannot delete author that is in use", 
          booksCount: booksWithAuthor 
        },
        { status: 400 }
      );
    }

    const deletedAuthor = await Author.findByIdAndDelete(id);

    if (!deletedAuthor) {
      return NextResponse.json(
        { message: "Author not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Author deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting author:", error);
    return NextResponse.json(
      { message: "Error deleting author" },
      { status: 500 }
    );
  }
}