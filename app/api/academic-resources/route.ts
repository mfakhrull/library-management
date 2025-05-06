import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AcademicResource from "@/models/AcademicResource";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/academic-resources - Get all academic resources with pagination and search
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const courseId = searchParams.get("courseId") || "";
    const resourceType = searchParams.get("resourceType") || "";
    const year = searchParams.get("year") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    let filter: any = {};
    
    // Add search filter if query exists
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ];
    }
    
    // Add course filter
    if (courseId) {
      filter.courseId = courseId;
    }
    
    // Add resource type filter
    if (resourceType) {
      filter.resourceType = resourceType;
    }
    
    // Add year filter
    if (year) {
      filter.year = parseInt(year);
    }
    
    // Get total count for pagination
    const total = await AcademicResource.countDocuments(filter);
    
    // Get resources with populated course and user data
    const resources = await AcademicResource.find(filter)
      .populate("courseId", "name code")
      .populate("uploadedById", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      resources,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching academic resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch academic resources" },
      { status: 500 }
    );
  }
}

// POST /api/academic-resources - Create a new academic resource
export async function POST(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only admins and lecturers can create resources
    const userRole = (session.user as any).role;
    if (userRole !== "Admin" && userRole !== "Lecturer") {
      return NextResponse.json(
        { error: "Only administrators and lecturers can create academic resources" },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.courseId || !data.fileUrl || !data.year) {
      return NextResponse.json(
        { error: "Title, course, file URL, and year are required" },
        { status: 400 }
      );
    }
    
    // Add the user ID of the uploader
    data.uploadedById = (session.user as any)._id;
    
    // Create new academic resource
    const resource = await AcademicResource.create(data);
    
    // Populate course and user information before returning
    await resource.populate("courseId", "name code");
    await resource.populate("uploadedById", "name role");
    
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Error creating academic resource:", error);
    return NextResponse.json(
      { error: "Failed to create academic resource" },
      { status: 500 }
    );
  }
}