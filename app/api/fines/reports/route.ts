import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FinePayment from "@/models/FinePayment";
import Borrowing from "@/models/Borrowing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "summary";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    // Set default date range if not provided (last 30 days)
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    if (!startDateParam) {
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Set start date to beginning of day and end date to end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Report data will be stored here
    let reportData: any = {};
    
    // Different report types
    switch (reportType) {
      case "summary": {
        // Total fines, collected amount, pending amount
        const overdueCount = await Borrowing.countDocuments({ 
          status: "overdue", 
          fine: { $gt: 0 } 
        });
        
        const totalFinesAmount = await Borrowing.aggregate([
          { $match: { fine: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$fine" } } }
        ]);
        
        const totalCollected = await FinePayment.aggregate([
          { 
            $match: { 
              paymentDate: { $gte: startDate, $lte: endDate },
              paymentStatus: { $in: ["paid", "partial"] }
            } 
          },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } }
        ]);
        
        const totalWaived = await FinePayment.aggregate([
          { 
            $match: { 
              paymentDate: { $gte: startDate, $lte: endDate },
              paymentStatus: "waived"
            } 
          },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } }
        ]);
        
        const paymentsByMethod = await FinePayment.aggregate([
          { 
            $match: { 
              paymentDate: { $gte: startDate, $lte: endDate },
              paymentStatus: { $in: ["paid", "partial"] }
            } 
          },
          { 
            $group: { 
              _id: "$paymentMethod", 
              count: { $sum: 1 },
              total: { $sum: "$amountPaid" }
            } 
          },
          { $sort: { total: -1 } }
        ]);
        
        // Get counts by status
        const pendingCount = await Borrowing.countDocuments({ 
          fineStatus: "pending", 
          fine: { $gt: 0 } 
        });
        
        const partialCount = await Borrowing.countDocuments({ 
          fineStatus: "partial", 
          fine: { $gt: 0 } 
        });
        
        const paidCount = await Borrowing.countDocuments({ 
          fineStatus: "paid", 
          fine: { $gt: 0 } 
        });
        
        const waivedCount = await Borrowing.countDocuments({ 
          fineStatus: "waived", 
          fine: { $gt: 0 } 
        });
        
        reportData = {
          timeRange: {
            start: startDate,
            end: endDate
          },
          overview: {
            overdueCount,
            totalFinesAmount: totalFinesAmount[0]?.total || 0,
            totalCollected: totalCollected[0]?.total || 0,
            totalWaived: totalWaived[0]?.total || 0,
            pendingAmount: (totalFinesAmount[0]?.total || 0) - 
                          (totalCollected[0]?.total || 0) - 
                          (totalWaived[0]?.total || 0)
          },
          statusCounts: {
            pending: pendingCount,
            partial: partialCount,
            paid: paidCount,
            waived: waivedCount
          },
          paymentMethods: paymentsByMethod
        };
        break;
      }
      
      case "daily": {
        // Aggregate payments by day
        const dailyPayments = await FinePayment.aggregate([
          { 
            $match: { 
              paymentDate: { $gte: startDate, $lte: endDate },
              paymentStatus: { $in: ["paid", "partial"] }
            } 
          },
          {
            $group: {
              _id: { 
                $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" }
              },
              amount: { $sum: "$amountPaid" },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        
        reportData = {
          timeRange: {
            start: startDate,
            end: endDate
          },
          dailyData: dailyPayments
        };
        break;
      }
      
      case "user": {
        // Top users with highest fines
        const usersFines = await Borrowing.aggregate([
          { $match: { fine: { $gt: 0 } } },
          { 
            $group: { 
              _id: "$userId", 
              totalFine: { $sum: "$fine" },
              count: { $sum: 1 }
            } 
          },
          { $sort: { totalFine: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user"
            }
          },
          {
            $project: {
              _id: 1,
              totalFine: 1,
              count: 1,
              "user.name": 1,
              "user.userId": 1,
              "user.email": 1
            }
          }
        ]);
        
        reportData = {
          topUsers: usersFines
        };
        break;
      }
      
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ reportData });
  } catch (error) {
    console.error("Error generating fine report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}