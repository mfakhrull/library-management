"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Book, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, differenceInDays } from "date-fns";
import { toast } from "sonner";

interface Borrowing {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    isbn: string;
    coverImage?: string;
  };
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: "borrowed" | "returned" | "overdue";
}

export default function MyBorrowingsPage() {
  const { data: session, status } = useSession();
  const [borrowings, setBorrowings] = React.useState<Borrowing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Fetch member's borrowings
  React.useEffect(() => {
    const fetchBorrowings = async () => {
      if (status === "loading") return;
      
      setLoading(true);
      try {
        // Use session.user._id if session.user.id is not available
        const userId = session?.user?.id || session?.user?._id;
        
        if (!userId) {
          console.error("User ID not found in session:", session?.user);
          setError("User ID not found in session. Please log in again.");
          setLoading(false);
          return;
        }
        
        console.log("Fetching borrowings for user ID:", userId);
        const response = await fetch(`/api/borrowings?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch borrowings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Borrowings data:", data);
        setBorrowings(data.borrowings || []);
      } catch (error) {
        console.error("Error fetching borrowings:", error);
        setError("Failed to load your borrowings. Please try again later.");
        toast.error("Failed to load your borrowings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBorrowings();
  }, [session, status]);
  
  // Filter borrowings by status
  const activeBorrowings = borrowings.filter(
    (b) => b.status === "borrowed" || b.status === "overdue"
  );
  const returnedBorrowings = borrowings.filter(
    (b) => b.status === "returned"
  );
  
  // Get borrowings that are due soon (within 3 days)
  const dueSoonBorrowings = activeBorrowings.filter((b) => {
    const dueDate = new Date(b.dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);
    return daysUntilDue >= 0 && daysUntilDue <= 3;
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };
  
  // Get status badge variant
  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    
    if (status === "returned") {
      return "success";
    } else if (status === "overdue" || isAfter(today, dueDateObj)) {
      return "destructive";
    } else {
      const daysRemaining = differenceInDays(dueDateObj, today);
      return daysRemaining <= 3 ? "warning" : "default";
    }
  };
  
  // Calculate days remaining or overdue
  const getDaysMessage = (dueDate: string) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    
    if (isAfter(today, dueDateObj)) {
      const daysOverdue = differenceInDays(today, dueDateObj);
      return `${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`;
    } else {
      const daysRemaining = differenceInDays(dueDateObj, today);
      return `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">My Borrowings</h1>
        <div className="mt-6">
          <Skeleton className="h-36 w-full" />
          <div className="mt-4">
            <Skeleton className="h-10 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">My Borrowings</h1>
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error Loading Borrowings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This might be a temporary issue. Please try refreshing the page or logging in again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Borrowings</h1>
        <p className="text-muted-foreground">
          View your current books, due dates, and borrowing history
        </p>
      </div>
      
      {/* Due Soon Alert */}
      {dueSoonBorrowings.length > 0 && (
        <Card className="bg-warning/10 border-warning">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-warning">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Books Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dueSoonBorrowings.map((borrowing) => (
                <li key={borrowing._id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{borrowing.bookId.title}</span>
                    <span className="ml-2 text-muted-foreground text-sm">
                      Due on {formatDate(borrowing.dueDate)}
                    </span>
                  </div>
                  <Badge variant="warning">
                    {getDaysMessage(borrowing.dueDate)}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">
            Current Borrowings ({activeBorrowings.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Borrowing History ({returnedBorrowings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="mt-4">
          {activeBorrowings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Book className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">No Active Borrowings</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any books checked out at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeBorrowings.map((borrowing) => (
                <Card key={borrowing._id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="line-clamp-1">{borrowing.bookId.title}</CardTitle>
                        <CardDescription>ISBN: {borrowing.bookId.isbn}</CardDescription>
                      </div>
                      <Badge variant={getStatusBadge(borrowing.status, borrowing.dueDate)}>
                        {borrowing.status === "overdue" || isAfter(new Date(), new Date(borrowing.dueDate))
                          ? "Overdue"
                          : "Borrowed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Issued Date</p>
                        <p className="text-sm">{formatDate(borrowing.issueDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Due Date</p>
                        <p className="text-sm">{formatDate(borrowing.dueDate)}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm">
                        {isAfter(new Date(), new Date(borrowing.dueDate)) ? (
                          <span className="text-destructive font-medium">
                            {getDaysMessage(borrowing.dueDate)}
                          </span>
                        ) : (
                          getDaysMessage(borrowing.dueDate)
                        )}
                      </span>
                      
                      {borrowing.status === "overdue" && (
                        <span className="text-destructive text-sm font-medium">
                          Estimated fine: ${(differenceInDays(new Date(), new Date(borrowing.dueDate)) * 1.0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          {returnedBorrowings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium">No Borrowing History</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven't returned any books yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {returnedBorrowings.map((borrowing) => (
                <Card key={borrowing._id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="line-clamp-1">{borrowing.bookId.title}</CardTitle>
                        <CardDescription>ISBN: {borrowing.bookId.isbn}</CardDescription>
                      </div>
                      <Badge variant="success">Returned</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Borrowed</p>
                        <p className="text-sm">{formatDate(borrowing.issueDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Returned</p>
                        <p className="text-sm">{borrowing.returnDate ? formatDate(borrowing.returnDate) : 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-2">
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-success" />
                        Completed
                      </span>
                      
                      {borrowing.fine > 0 && (
                        <span className="text-destructive text-sm font-medium">
                          Fine paid: ${borrowing.fine.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}