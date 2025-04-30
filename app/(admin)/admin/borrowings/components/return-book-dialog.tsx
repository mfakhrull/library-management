"use client";

import * as React from "react";
import { format, differenceInDays } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Borrowing {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    isbn: string;
    coverImage?: string;
  };
  userId: {
    _id: string;
    name: string;
    userId: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: "borrowed" | "returned" | "overdue";
}

interface ReturnBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrowing: Borrowing | null;
  onSuccess: () => void;
}

export function ReturnBookDialog({
  open,
  onOpenChange,
  borrowing,
  onSuccess,
}: ReturnBookDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [estimatedFine, setEstimatedFine] = React.useState(0);
  const [fineSettings, setFineSettings] = React.useState({
    ratePerDay: 1.00,
    gracePeriod: 0,
    maxFinePerBook: 50.00
  });
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);

  // Fetch fine settings
  React.useEffect(() => {
    const fetchFineSettings = async () => {
      try {
        const response = await fetch('/api/fines/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setFineSettings({
              ratePerDay: data.settings.ratePerDay,
              gracePeriod: data.settings.gracePeriod,
              maxFinePerBook: data.settings.maxFinePerBook
            });
          }
        }
      } catch (error) {
        console.error("Error fetching fine settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchFineSettings();
  }, []);

  // Calculate estimated fine when borrowing changes or settings are loaded
  React.useEffect(() => {
    if (borrowing && !isLoadingSettings) {
      const dueDate = new Date(borrowing.dueDate);
      const today = new Date();
      
      if (today > dueDate) {
        const daysLate = differenceInDays(today, dueDate);
        const effectiveDaysLate = Math.max(0, daysLate - fineSettings.gracePeriod);
        const calculatedFine = effectiveDaysLate * fineSettings.ratePerDay;
        
        // Apply maximum fine cap
        setEstimatedFine(Math.min(calculatedFine, fineSettings.maxFinePerBook));
      } else {
        setEstimatedFine(0);
      }
    }
  }, [borrowing, isLoadingSettings, fineSettings]);

  // Process the book return
  const handleReturn = async () => {
    if (!borrowing) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/borrowings/${borrowing._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnDate: new Date(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process return");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error processing return:", error);
      toast.error(error.message || "Failed to process return");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  if (!borrowing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Return Book</DialogTitle>
          <DialogDescription>
            Process the return of this book and calculate any applicable fines.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{borrowing.bookId.title}</CardTitle>
              <CardDescription>ISBN: {borrowing.bookId.isbn}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Borrowed By</p>
                  <p>{borrowing.userId.name}</p>
                  <p className="text-sm text-muted-foreground">{borrowing.userId.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant={borrowing.status === "overdue" ? "destructive" : "default"}>
                    {borrowing.status === "borrowed" ? "Borrowed" : "Overdue"}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Issue Date</p>
                  <p>{formatDate(borrowing.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Due Date</p>
                  <p>{formatDate(borrowing.dueDate)}</p>
                </div>
              </div>
              
              {estimatedFine > 0 && (
                <div className="bg-destructive/10 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Overdue Notice</p>
                      <p className="text-sm">
                        This book is {differenceInDays(new Date(), new Date(borrowing.dueDate))} days overdue.
                        An estimated fine of RM{estimatedFine.toFixed(2)} will be applied.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReturn} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}