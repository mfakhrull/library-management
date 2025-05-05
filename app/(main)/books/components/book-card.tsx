"use client";

import * as React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Book, User, CalendarDays, Bookmark, AlertCircle, Clock, CheckCircle } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface BookCardProps {
  book: {
    _id: string;
    title: string;
    authorId: {
      _id: string;
      name: string;
    };
    categoryId: {
      _id: string;
      name: string;
    };
    isbn: string;
    copiesTotal: number;
    copiesAvailable: number;
    publishedDate: string;
    description?: string;
    coverImage?: string;
    tags: string[];
  };
}

export function BookCard({ book }: BookCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isReserving, setIsReserving] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [currentReservations, setCurrentReservations] = React.useState<any[]>([]);
  const [isCheckingReservations, setIsCheckingReservations] = React.useState(false);

  // Function to check user's current reservations for this book
  const checkReservations = async () => {
    if (!session?.user) return;
    
    setIsCheckingReservations(true);
    try {
      // Make sure we're using the correct ID field from the session
      const userId = (session.user as any)._id;
      
      if (!userId) {
        console.error("User ID not found in session when checking reservations");
        return;
      }
      
      const response = await fetch(`/api/reservations?userId=${userId}&bookId=${book._id}&status=pending`);
      if (response.ok) {
        const data = await response.json();
        setCurrentReservations(data.reservations || []);
      }
    } catch (error) {
      console.error("Error checking reservations:", error);
    } finally {
      setIsCheckingReservations(false);
    }
  };

  // Check for existing reservations when dialog opens
  React.useEffect(() => {
    if (isDialogOpen) {
      checkReservations();
    }
  }, [isDialogOpen, session?.user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM dd, yyyy");
  };

  // Handle book reservation
  const handleReserve = async () => {
    if (!session?.user) {
      toast.error("You need to be logged in to reserve books");
      router.push("/login");
      return;
    }

    setIsReserving(true);
    try {
      // Default reservation period is 3 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);
      
      // Make sure we're using the correct ID field from the session
      const userId = (session.user as any)._id;
      
      if (!userId) {
        throw new Error("User ID not found in session");
      }

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: book._id,
          userId: userId,
          expiryDate: expiryDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reserve book");
      }

      toast.success("Book reserved successfully");
      setIsDialogOpen(false);
      router.refresh(); // Refresh the page to update book availability
    } catch (error: any) {
      console.error("Error reserving book:", error);
      toast.error(error.message || "Failed to reserve book");
    } finally {
      setIsReserving(false);
    }
  };

  // Determine availability status and badge variant
  const getAvailabilityStatus = () => {
    if (book.copiesAvailable <= 0) {
      return {
        text: "Unavailable",
        variant: "destructive" as const,
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      };
    } else if (book.copiesAvailable < book.copiesTotal * 0.2) {
      return {
        text: "Low Availability",
        variant: "warning" as const,
        icon: <Clock className="h-3 w-3 mr-1" />,
      };
    } else {
      return {
        text: "Available",
        variant: "success" as const,
        icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
      };
    }
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="aspect-[3/4] relative bg-muted">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <Book className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <CardHeader className="p-4 pb-0">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="mb-2">
              {book.categoryId.name}
            </Badge>
            <Badge variant={availabilityStatus.variant} className="flex items-center">
              {availabilityStatus.icon}
              {availabilityStatus.text}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">{book.title}</h3>
          <p className="text-sm text-muted-foreground">by {book.authorId.name}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex-grow">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Published: {formatDate(book.publishedDate)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 mr-1.5" />
            ISBN: {book.isbn}
          </div>
          <div className="flex items-center mt-1 text-xs">
            <span className="font-medium">{book.copiesAvailable}</span>
            <span className="text-muted-foreground mx-1">of</span>
            <span className="font-medium">{book.copiesTotal}</span>
            <span className="text-muted-foreground ml-1">copies available</span>
          </div>
          
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {book.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {book.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{book.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant={book.copiesAvailable > 0 ? "default" : "outline"}
              disabled={book.copiesAvailable <= 0}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              {book.copiesAvailable > 0 ? "Reserve Book" : "Unavailable"}
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reserve Book</DialogTitle>
              <DialogDescription>
                You are about to reserve &quot;{book.title}&quot; by {book.authorId.name}.
              </DialogDescription>
            </DialogHeader>
            
            {isCheckingReservations ? (
              <div className="py-6 flex justify-center">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : currentReservations.length > 0 ? (
              <div className="py-4">
                <div className="rounded-md bg-yellow-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        You already have a reservation for this book
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Your reservation will expire on {formatDate(currentReservations[0].expiryDate)}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="py-4 space-y-4">
                  <p>
                    Reserving a book will hold it for you for 3 days. You will need to visit the library to check out the book within this period.
                  </p>
                  
                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Reservation Details
                        </h3>
                        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                          <li>Your reservation will be valid for 3 days</li>
                          <li>Currently {book.copiesAvailable} copies available</li>
                          <li>The book will be held at the library desk</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleReserve} disabled={isReserving}>
                    {isReserving ? (
                      <>
                        <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin" />
                        Reserving...
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Confirm Reservation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}