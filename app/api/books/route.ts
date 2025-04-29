import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Book from "@/models/Book";
import Author from "@/models/Author"; // <-- Add this line
import Category from "@/models/Category"; // <-- Add this line

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    
    // Build filter
    const filter: any = {};
    if (query) {
      filter.$text = { $search: query };
    }
    if (category) {
      filter.categoryId = category;
    }
    
    // Execute query with pagination
    const totalBooks = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .populate("authorId", "name")
      .populate("categoryId", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      books,
      pagination: {
        total: totalBooks,
        page,
        limit,
        pages: Math.ceil(totalBooks / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { message: "Error fetching books" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Check if a book with the same ISBN already exists
    const existingBook = await Book.findOne({ isbn: body.isbn });
    if (existingBook) {
      return NextResponse.json(
        { message: "A book with this ISBN already exists" },
        { status: 400 }
      );
    }
    
    // Initialize copiesAvailable to match copiesTotal if not provided
    if (!body.copiesAvailable && body.copiesTotal) {
      body.copiesAvailable = body.copiesTotal;
    }
    
    // Create new book
    const newBook = await Book.create(body);
    
    // Populate author and category information for the response
    const populatedBook = await Book.findById(newBook._id)
      .populate("authorId", "name")
      .populate("categoryId", "name");
    
    return NextResponse.json(
      { message: "Book created successfully", book: populatedBook },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating book:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors: Record<string, string> = {};
      
      // Extract validation error messages
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return NextResponse.json(
        { message: "Validation error", errors: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Error creating book" },
      { status: 500 }
    );
  }
}