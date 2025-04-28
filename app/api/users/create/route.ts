import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, email, password, name, contact, role } = body;
    
    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    const existingUserById = await User.findOne({ userId });
    if (existingUserById) {
      return NextResponse.json(
        { message: "User ID already taken" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await User.create({
      userId,
      email,
      password: hashedPassword,
      name,
      contact,
      role,
    });
    
    // Remove password from response
    const user = newUser.toObject();
    delete user.password;
    
    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}