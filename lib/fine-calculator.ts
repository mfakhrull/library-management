import { connectDB } from "@/lib/mongodb";
import FineSettings from "@/models/FineSettings";
import { differenceInCalendarDays, addDays } from "date-fns";

/**
 * Calculate fine amount for an overdue book
 * 
 * @param dueDate The date when the book was due
 * @param returnDate The date when the book was returned (or current date if not returned)
 * @returns The calculated fine amount
 */
export async function calculateFineAmount(dueDate: Date, returnDate: Date = new Date()): Promise<number> {
  // Ensure database connection
  await connectDB();
  
  // Get latest fine settings
  const settings = await FineSettings.findOne({}).sort({ lastUpdated: -1 }).lean();
  
  // Use default settings if none found
  const ratePerDay = settings?.ratePerDay ?? 1.00;
  const gracePeriod = settings?.gracePeriod ?? 0;
  const maxFinePerBook = settings?.maxFinePerBook ?? 50.00;
  
  // Log settings being used
  console.log("Fine calculation using settings:", { 
    ratePerDay, 
    gracePeriod, 
    maxFinePerBook,
    settingsId: settings?._id || "using defaults" 
  });
  
  // No fine if returned before or on due date
  if (returnDate <= dueDate) return 0;
  
  // Calculate overdue days - starting from the DAY AFTER the due date
  // This ensures we don't count the due date itself as overdue
  const dayAfterDueDate = addDays(new Date(dueDate), 1);
  
  // Use differenceInCalendarDays to include the current day in the calculation
  // This counts today as a full day even if it's not complete
  const overdueDays = differenceInCalendarDays(returnDate, dayAfterDueDate) + 1;
  
  // Ensure we don't get negative days
  const adjustedOverdueDays = Math.max(0, overdueDays);
  
  // Apply grace period
  const effectiveOverdueDays = Math.max(0, adjustedOverdueDays - gracePeriod);
  
  // Calculate fine with the rate per day and cap it at the maximum fine per book
  const calculatedFine = effectiveOverdueDays * ratePerDay;
  const finalFine = Math.min(calculatedFine, maxFinePerBook);
  
  // Log calculation details
  console.log(`Fine calculation details:
    - Due date: ${dueDate.toISOString()}
    - Day after due date: ${dayAfterDueDate.toISOString()}
    - Return/Current date: ${returnDate.toISOString()}
    - Calendar days overdue (including today): ${overdueDays} days
    - Adjusted overdue days: ${adjustedOverdueDays} days
    - Effective overdue days (after grace period): ${effectiveOverdueDays} days
    - Rate per day: $${ratePerDay}
    - Calculated fine (before max cap): $${calculatedFine}
    - Final fine amount: $${finalFine}
  `);
  
  return finalFine;
}