import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Borrowing from "@/models/Borrowing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateFineAmount } from "@/lib/fine-calculator";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized access. Admin privileges required." },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Find all borrowed and overdue books
    const borrowings = await Borrowing.find({
      status: { $in: ["borrowed", "overdue"] },
      returnDate: null
    });
    
    let updated = 0;
    const now = new Date();
    console.log(`Processing ${borrowings.length} borrowings for fine recalculation`);
    
    // Loop through each borrowing and update status and fine
    for (const borrowing of borrowings) {
      const previousStatus = borrowing.status;
      const previousFine = borrowing.fine;
      
      // Check if overdue
      if (borrowing.dueDate < now) {
        borrowing.status = "overdue";
        
        // Calculate fine using the centralized utility
        const newFine = await calculateFineAmount(borrowing.dueDate, now);
        console.log(`Borrowing ID ${borrowing._id}: Previous fine: ${previousFine}, New fine: ${newFine}`);
        borrowing.fine = newFine;
        
        // Update fine status if needed
        if (borrowing.fine > 0 && borrowing.fineStatus === "none") {
          borrowing.fineStatus = "pending";
        }
        
        // Save only if something changed
        if (previousStatus !== borrowing.status || previousFine !== borrowing.fine) {
          await borrowing.save();
          updated++;
        }
      }
    }
    
    return NextResponse.json({
      message: `Successfully updated ${updated} overdue borrowings`,
      updated
    });
  } catch (error) {
    console.error("Error recalculating fines:", error);
    return NextResponse.json(
      { error: "Failed to recalculate fines", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}