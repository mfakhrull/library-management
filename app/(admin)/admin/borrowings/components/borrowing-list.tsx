"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Book, UserRound, CalendarClock, ArrowLeftRight, AlertCircle, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, isAfter } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IssueBookForm } from "./issue-book-form";
import { ReturnBookDialog } from "./return-book-dialog";

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

export function BorrowingList() {
  const router = useRouter();
  const [borrowings, setBorrowings] = React.useState<Borrowing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalBorrowings, setTotalBorrowings] = React.useState(0);
  const [issueDialogOpen, setIssueDialogOpen] = React.useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = React.useState<Borrowing | null>(null);
  const limit = 10;

  // Function to fetch borrowings with filtering and pagination
  const fetchBorrowings = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/borrowings?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch borrowings");
      }

      const data = await response.json();
      setBorrowings(data.borrowings);
      setTotalPages(data.pagination.pages);
      setTotalBorrowings(data.pagination.total);
    } catch (error) {
      console.error("Error fetching borrowings:", error);
      toast.error("Failed to load borrowings");
    } finally {
      setIsLoading(false);
    }
  };

  // Load borrowings on component mount and when filters change
  React.useEffect(() => {
    fetchBorrowings();
  }, [page, statusFilter]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchBorrowings();
  };

  // Format date to YYYY-MM-DD
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PP");
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const dueDateObj = new Date(dueDate);
    
    if (status === "returned") {
      return "success";
    } else if (status === "overdue" || isAfter(today, dueDateObj)) {
      return "destructive";
    } else {
      return "default";
    }
  };

  // Handle successful book issue
  const handleBookIssued = () => {
    setIssueDialogOpen(false);
    fetchBorrowings();
    toast.success("Book issued successfully");
  };

  // Handle successful book return
  const handleBookReturned = () => {
    setReturnDialogOpen(false);
    setSelectedBorrowing(null);
    fetchBorrowings();
    toast.success("Book returned successfully");
  };

  // Open return dialog with selected borrowing
  const openReturnDialog = (borrowing: Borrowing) => {
    setSelectedBorrowing(borrowing);
    setReturnDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Borrowing Records</CardTitle>
              <CardDescription>
                Total of {totalBorrowings} borrowing records
              </CardDescription>
            </div>
            <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Issue Book
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Issue Book to Member</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to issue a book to a library member.
                  </DialogDescription>
                </DialogHeader>
                <IssueBookForm onSuccess={handleBookIssued} onCancel={() => setIssueDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="flex flex-1 items-center space-x-2"
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
                  <SelectItem value="borrowed">Borrowed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Borrowings Table */}
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fine</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <Skeleton className="h-6 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : borrowings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Book className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No borrowing records found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter to find what you're looking for.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowings.map((borrowing) => (
                    <TableRow key={borrowing._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {borrowing.bookId.coverImage ? (
                            <img
                              src={borrowing.bookId.coverImage}
                              alt={borrowing.bookId.title}
                              className="h-10 w-8 object-cover rounded-sm"
                            />
                          ) : (
                            <Book className="h-10 w-8 p-1" />
                          )}
                          <div className="font-medium line-clamp-1">
                            {borrowing.bookId.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{borrowing.userId.name}</span>
                          <span className="text-xs text-muted-foreground">{borrowing.userId.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(borrowing.issueDate)}</TableCell>
                      <TableCell>{formatDate(borrowing.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(borrowing.status, borrowing.dueDate)}>
                          {borrowing.status === "borrowed" ? "Borrowed" : 
                           borrowing.status === "returned" ? "Returned" : "Overdue"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {borrowing.fine > 0 ? (
                          <span className="text-destructive font-medium">
                            RM{borrowing.fine.toFixed(2)}
                          </span>
                        ) : (
                          <span>RM0.00</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {borrowing.status !== "returned" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openReturnDialog(borrowing)}
                          >
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            Return
                          </Button>
                        ) : (
                          <Badge variant="outline">Completed</Badge>
                        )}
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
            Showing {borrowings.length > 0 ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, totalBorrowings)} of {totalBorrowings} records
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

      {/* Return Book Dialog */}
      <ReturnBookDialog 
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        borrowing={selectedBorrowing}
        onSuccess={handleBookReturned}
      />
    </div>
  );
}