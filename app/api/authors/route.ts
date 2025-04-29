import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Author from "@/models/Author";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const authors = await Author.find().sort({ name: 1 });
    
    return NextResponse.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json(
      { message: "Error fetching authors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Create new author
    const newAuthor = await Author.create(body);
    
    return NextResponse.json(
      { message: "Author created successfully", author: newAuthor },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating author:", error);
    
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
      { message: "Error creating author" },
      { status: 500 }
    );
  }
}