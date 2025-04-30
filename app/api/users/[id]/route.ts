import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// PATCH - Update a user by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = params.id;
    const body = await request.json();
    const { email, name, contact, role, status, password } = body;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Update user data
    const updateData: any = {};
    
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (contact) updateData.contact = contact;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: error.message || "Error updating user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = params.id;
    
    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: "User deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: error.message || "Error deleting user" },
      { status: 500 }
    );
  }
}

// GET - Get a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const userId = params.id;
    
    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: error.message || "Error fetching user" },
      { status: 500 }
    );
  }
}