import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AcademicResource from "@/models/AcademicResource";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/academic-resources/[id] - Get a specific academic resource
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const id = await params.id;
    const resource = await AcademicResource.findById(id)
      .populate("courseId", "name code")
      .populate("uploadedById", "name role");
    
    if (!resource) {
      return NextResponse.json(
        { error: "Academic resource not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(resource);
  } catch (error) {
    console.error(`Error fetching academic resource ${await params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch academic resource" },
      { status: 500 }
    );
  }
}

// PUT /api/academic-resources/[id] - Update a specific academic resource
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
    
    await connectDB();
    
    // First check if the resource exists and get uploader info
    const paramsData = await params;
    const id = paramsData.id;
    const existingResource = await AcademicResource.findById(id);
    if (!existingResource) {
      return NextResponse.json(
        { error: "Academic resource not found" },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Special case for download counter - allow any authenticated user to increment it
    if (data.incrementDownload === true) {
      const updatedResource = await AcademicResource.findByIdAndUpdate(
        id,
        { $inc: { downloadCount: 1 } },
        { new: true }
      )
        .populate("courseId", "name code")
        .populate("uploadedById", "name role");
      
      return NextResponse.json(updatedResource);
    }
    
    // For regular updates, enforce stricter permissions
    // Only allow the original uploader (if lecturer) or admin to update
    const userRole = (session.user as any).role;
    const userId = (session.user as any)._id;
    const isAdmin = userRole === "Admin";
    const isUploader = existingResource.uploadedById.toString() === userId;
    
    if (!isAdmin && !isUploader) {
      return NextResponse.json(
        { error: "You don't have permission to update this resource" },
        { status: 403 }
      );
    }
    
    // Validate required fields for full updates
    if (!data.title || !data.courseId || !data.year) {
      return NextResponse.json(
        { error: "Title, course, and year are required" },
        { status: 400 }
      );
    }
    
    // Update academic resource
    const updatedResource = await AcademicResource.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate("courseId", "name code")
      .populate("uploadedById", "name role");
    
    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error(`Error updating academic resource ${await params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update academic resource" },
      { status: 500 }
    );
  }
}

// DELETE /api/academic-resources/[id] - Delete a specific academic resource
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
    
    await connectDB();
    
    // First check if the resource exists and get uploader info
    const id = await params.id;
    const existingResource = await AcademicResource.findById(id);
    if (!existingResource) {
      return NextResponse.json(
        { error: "Academic resource not found" },
        { status: 404 }
      );
    }
    
    // Only allow the original uploader (if lecturer) or admin to delete
    const userRole = (session.user as any).role;
    const userId = (session.user as any)._id;
    const isAdmin = userRole === "Admin";
    const isUploader = existingResource.uploadedById.toString() === userId;
    
    if (!isAdmin && !isUploader) {
      return NextResponse.json(
        { error: "You don't have permission to delete this resource" },
        { status: 403 }
      );
    }
    
    // Delete the academic resource
    await AcademicResource.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: "Academic resource deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting academic resource ${await params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete academic resource" },
      { status: 500 }
    );
  }
}