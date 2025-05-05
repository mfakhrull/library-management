"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, Check, X, CalendarDays, BookOpen, BookCheck, Calendar, User, CalendarX } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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

export function ReservationsList() {
  const router = useRouter();
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalReservations, setTotalReservations] = React.useState(0);
  const [selectedReservation, setSelectedReservation] = React.useState<any>(null);
  const [actionType, setActionType] = React.useState<"fulfill" | "cancel" | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const limit = 10;

  // Function to fetch reservations with filtering and pagination
  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/reservations?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }

      const data = await response.json();
      setReservations(data.reservations);
      setTotalPages(data.pagination.pages);
      setTotalReservations(data.pagination.total);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Failed to load reservations");
    } finally {
      setIsLoading(false);
    }
  };

  // Load reservations on component mount and when filters change
  React.useEffect(() => {
    fetchReservations();
  }, [page, statusFilter]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchReservations();
  };

  // Format date to human-readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP");
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "fulfilled":
        return "success";
      case "cancelled":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Handle fulfilling a reservation
  const handleFulfillReservation = async () => {
    if (!selectedReservation) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/reservations/${selectedReservation._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "fulfilled",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fulfill reservation");
      }
      
      toast.success("Reservation marked as fulfilled");
      fetchReservations(); // Refresh the list
    } catch (error: any) {
      console.error("Error fulfilling reservation:", error);
      toast.error(error.message || "Failed to fulfill reservation");
    } finally {
      setIsProcessing(false);
      setSelectedReservation(null);
      setActionType(null);
    }
  };

  // Handle cancelling a reservation
  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/reservations/${selectedReservation._id}`, {
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
      setIsProcessing(false);
      setSelectedReservation(null);
      setActionType(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reservation Records</CardTitle>
              <CardDescription>
                Total of {totalReservations} reservations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mb-6">
            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="flex space-x-2"
            >
              <Input
                placeholder="Search by book title or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1); // Reset to first page when changing filter
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Reserved By</TableHead>
                  <TableHead>Reserved Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No reservations found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter to find what you're looking for.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((reservation) => (
                    <TableRow key={reservation._id}>
                      <TableCell className="font-medium">
                        {reservation.bookId?.title || "Unknown Book"}
                      </TableCell>
                      <TableCell>
                        {reservation.userId?.name || "Unknown User"}
                        {reservation.userId?.userId && (
                          <span className="text-xs text-muted-foreground block">
                            ID: {reservation.userId.userId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(reservation.reservationDate)}</TableCell>
                      <TableCell>{formatDate(reservation.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(reservation.status)}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {reservation.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setActionType("fulfill");
                                }}
                                title="Fulfill Reservation"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Fulfill
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setActionType("cancel");
                                }}
                                title="Cancel Reservation"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              router.push(`/admin/books/edit/${reservation.bookId?._id}`);
                            }}
                            title="View Book Details"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {reservations.length > 0 ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, totalReservations)} of {totalReservations} reservations
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (pageNum) =>
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                )
                .map((pageNum, i, array) => {
                  // Add ellipsis when there are gaps in the sequence
                  if (i > 0 && pageNum - array[i - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${pageNum}`}>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>

      {/* Fulfill Reservation Dialog */}
      <AlertDialog 
        open={actionType === "fulfill" && !!selectedReservation} 
        onOpenChange={(open) => !open && setActionType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fulfill Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this reservation as fulfilled? This action cannot be undone.
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Book:</div>
                  <div>{selectedReservation?.bookId?.title}</div>
                  
                  <div className="font-medium">Reserved by:</div>
                  <div>{selectedReservation?.userId?.name}</div>
                  
                  <div className="font-medium">Reserved on:</div>
                  <div>{selectedReservation && formatDate(selectedReservation.reservationDate)}</div>
                  
                  <div className="font-medium">Expires on:</div>
                  <div>{selectedReservation && formatDate(selectedReservation.expiryDate)}</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFulfillReservation}
              disabled={isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? "Processing..." : "Confirm Fulfillment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Reservation Dialog */}
      <AlertDialog 
        open={actionType === "cancel" && !!selectedReservation} 
        onOpenChange={(open) => !open && setActionType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This will make the book available for others.
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Book:</div>
                  <div>{selectedReservation?.bookId?.title}</div>
                  
                  <div className="font-medium">Reserved by:</div>
                  <div>{selectedReservation?.userId?.name}</div>
                  
                  <div className="font-medium">Reserved on:</div>
                  <div>{selectedReservation && formatDate(selectedReservation.reservationDate)}</div>
                  
                  <div className="font-medium">Expires on:</div>
                  <div>{selectedReservation && formatDate(selectedReservation.expiryDate)}</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReservation}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Processing..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}