import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FineSettings from "@/models/FineSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    
    // Get the latest fine settings
    const settings = await FineSettings.findOne({}).sort({ lastUpdated: -1 }).lean();
    
    // If no settings found, return default values
    if (!settings) {
      return NextResponse.json({
        settings: {
          ratePerDay: 1.00,
          gracePeriod: 0,
          maxFinePerBook: 50.00,
          currencyCode: "USD",
          lastUpdated: new Date(),
        }
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching fine settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch fine settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    const data = await request.json();
    
    // Validate required fields
    if (data.ratePerDay === undefined || data.ratePerDay < 0) {
      return NextResponse.json(
        { error: "Rate per day must be a non-negative number" },
        { status: 400 }
      );
    }
    
    // Create new fine settings
    const newSettings = new FineSettings({
      ratePerDay: data.ratePerDay,
      gracePeriod: data.gracePeriod || 0,
      maxFinePerBook: data.maxFinePerBook || 50.00,
      currencyCode: data.currencyCode || "USD",
      updatedBy: session.user.id,
      lastUpdated: new Date(),
    });
    
    await newSettings.save();
    
    return NextResponse.json({ 
      message: "Fine settings updated successfully", 
      settings: newSettings 
    });
  } catch (error) {
    console.error("Error updating fine settings:", error);
    return NextResponse.json(
      { error: "Failed to update fine settings" },
      { status: 500 }
    );
  }
}