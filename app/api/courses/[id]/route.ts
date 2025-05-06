import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/courses/[id] - Get a specific course
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const course = await Course.findById(params.id);
    
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error(`Error fetching course ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a specific course
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only admins can update courses
    if ((session.user as any).role !== "Admin") {
      return NextResponse.json(
        { error: "Only administrators can update courses" },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.code) {
      return NextResponse.json(
        { error: "Course name and code are required" },
        { status: 400 }
      );
    }
    
    // Check if course with the same code already exists (not including this course)
    const existingCourse = await Course.findOne({
      code: data.code,
      _id: { $ne: params.id },
    });
    
    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this code already exists" },
        { status: 409 }
      );
    }
    
    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!updatedCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error(`Error updating course ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete a specific course
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only admins can delete courses
    if ((session.user as any).role !== "Admin") {
      return NextResponse.json(
        { error: "Only administrators can delete courses" },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Check if course has associated academic resources
    const AcademicResource = (await import("@/models/AcademicResource")).default;
    const resourcesCount = await AcademicResource.countDocuments({
      courseId: params.id,
    });
    
    if (resourcesCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete course: ${resourcesCount} academic resources are associated with this course`,
        },
        { status: 409 }
      );
    }
    
    // Delete course
    const deletedCourse = await Course.findByIdAndDelete(params.id);
    
    if (!deletedCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting course ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}