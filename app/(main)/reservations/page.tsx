"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { BookOpen, Bookmark, Clock, CalendarX, BookX, Loader2, BadgeX, BookCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("pending");
  const [cancelReservationId, setCancelReservationId] = React.useState<string | null>(null);
  const [isCancelling, setIsCancelling] = React.useState(false);

  // Fetch user's reservations
  const fetchReservations = async () => {
    // Use the correct user ID property from the session
    const userId = (session?.user as any)?._id;
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reservations?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }
      
      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Failed to load your reservations");
    } finally {
      setIsLoading(false);
    }
  };

  // Load reservations when session is available
  React.useEffect(() => {
    // Use the correct property to check for user authentication
    const userId = (session?.user as any)?._id;
    if (status === "authenticated" && userId) {
      fetchReservations();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session]);

  // Handle reservation cancellation
  const handleCancelReservation = async () => {
    if (!cancelReservationId) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/reservations/${cancelReservationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel reservation");
      }
      
      toast.success("Reservation cancelled successfully");
      fetchReservations(); // Refresh the list
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      toast.error(error.message || "Failed to cancel reservation");
    } finally {
      setIsCancelling(false);
      setCancelReservationId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM dd, yyyy");
  };

  // Filter reservations by status
  const filteredReservations = reservations.filter(
    (reservation) => {
      if (activeTab === "pending") return reservation.status === "pending";
      if (activeTab === "history") return ["fulfilled", "cancelled", "expired"].includes(reservation.status);
      return true;
    }
  );

  // Get badge variant based on reservation status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { variant: "default" as const, icon: <Clock className="h-3 w-3 mr-1" /> };
      case "fulfilled":
        return { variant: "success" as const, icon: <BookCheck className="h-3 w-3 mr-1" /> };
      case "cancelled":
        return { variant: "secondary" as const, icon: <BadgeX className="h-3 w-3 mr-1" /> };
      case "expired":
        return { variant: "destructive" as const, icon: <CalendarX className="h-3 w-3 mr-1" /> };
      default:
        return { variant: "outline" as const, icon: null };
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Book Reservations</h1>
        <p className="text-muted-foreground">
          View and manage your book reservations
        </p>
      </div>

      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="pending">
            Pending Reservations
          </TabsTrigger>
          <TabsTrigger value="history">
            Reservation History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent className="py-2">
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No pending reservations</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md">
                You don't have any pending reservations. Browse our collection to reserve books.
              </p>
              <Button onClick={() => router.push("/books")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Books
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredReservations.map((reservation) => {
                const expiringSoon = 
                  !isPast(new Date(reservation.expiryDate)) && 
                  (new Date(reservation.expiryDate).getTime() - new Date().getTime()) < 86400000; // less than 24 hours
                  
                return (
                  <Card key={reservation._id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{reservation.bookId?.title}</CardTitle>
                        <Badge 
                          variant={getStatusBadge(reservation.status).variant}
                          className="flex items-center"
                        >
                          {getStatusBadge(reservation.status).icon}
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>Reserved on {formatDate(reservation.reservationDate)}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="py-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Expires:</span>
                          <span className={expiringSoon ? "text-destructive font-medium" : ""}>
                            {formatDate(reservation.expiryDate)}
                            {expiringSoon && " (Expiring soon)"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">ISBN:</span>
                          <span>{reservation.bookId?.isbn}</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setCancelReservationId(reservation._id)}
                      >
                        <BadgeX className="h-4 w-4 mr-2" />
                        Cancel Reservation
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent className="py-2">
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <BookX className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No reservation history</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md">
                You don't have any completed, cancelled, or expired reservations yet.
              </p>
              <Button onClick={() => router.push("/books")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Books
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredReservations.map((reservation) => (
                <Card key={reservation._id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{reservation.bookId?.title}</CardTitle>
                      <Badge 
                        variant={getStatusBadge(reservation.status).variant}
                        className="flex items-center"
                      >
                        {getStatusBadge(reservation.status).icon}
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>Reserved on {formatDate(reservation.reservationDate)}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="py-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Expired on:</span>
                        <span>{formatDate(reservation.expiryDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ISBN:</span>
                        <span>{reservation.bookId?.isbn}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!cancelReservationId} onOpenChange={(open) => !open && setCancelReservationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReservation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}