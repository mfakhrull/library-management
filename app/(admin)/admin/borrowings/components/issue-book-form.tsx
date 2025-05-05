"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2, Bookmark, AlertCircle, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Form schema for issuing a book
const formSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  userId: z.string().min(1, "Member is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  handleReservation: z.enum(["fulfill", "ignore"]).optional(),
});

interface IssueBookFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function IssueBookForm({ onSuccess, onCancel }: IssueBookFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [books, setBooks] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [pendingReservations, setPendingReservations] = React.useState<any[]>([]);
  const [selectedBookReservations, setSelectedBookReservations] = React.useState<any[]>([]);
  const [checkingReservations, setCheckingReservations] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [isReservationMatch, setIsReservationMatch] = React.useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookId: "",
      userId: "",
      dueDate: addDays(new Date(), 14), // Default due date is 14 days from today
      handleReservation: "fulfill",
    },
  });

  // Watch for book and user selection changes
  const watchBookId = form.watch("bookId");
  const watchUserId = form.watch("userId");

  // Fetch books and users data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch books with available copies
        const booksResponse = await fetch("/api/books?page=1&limit=100");
        if (!booksResponse.ok) throw new Error("Failed to fetch books");
        const booksData = await booksResponse.json();
        
        // Set all books including those with zero copies
        setBooks(booksData.books);

        // Fetch users (non-admin)
        const usersResponse = await fetch("/api/users/get");
        if (!usersResponse.ok) throw new Error("Failed to fetch users");
        const usersData = await usersResponse.json();
        
        // Filter to only show non-admin users
        const members = usersData.filter((user: any) => user.role !== "Admin");
        setUsers(members);

        // Fetch all pending reservations
        const reservationsResponse = await fetch("/api/reservations?status=pending");
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          setPendingReservations(reservationsData.reservations || []);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load books and members data");
      }
    };

    fetchData();
  }, []);

  // Check for reservations when book selection changes
  React.useEffect(() => {
    if (watchBookId) {
      setCheckingReservations(true);
      const bookReservations = pendingReservations.filter(
        (res) => res.bookId?._id === watchBookId
      );
      
      setSelectedBookReservations(bookReservations);
      setCheckingReservations(false);
      
      // Check if selected user matches any reservation
      if (watchUserId && bookReservations.length > 0) {
        const matchingReservation = bookReservations.find(
          (res) => res.userId?._id === watchUserId
        );
        
        setIsReservationMatch(!!matchingReservation);
        
        if (matchingReservation) {
          form.setValue("handleReservation", "fulfill");
        }
      } else {
        setIsReservationMatch(false);
      }
    } else {
      setSelectedBookReservations([]);
      setIsReservationMatch(false);
    }
  }, [watchBookId, watchUserId, pendingReservations, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Check if there's a matching reservation that should be fulfilled
      const matchingReservation = selectedBookReservations.find(
        (res) => res.userId?._id === values.userId
      );
      
      // Include reservation information in the request if it exists and should be fulfilled
      const requestBody: any = {
        ...values,
        issueDate: new Date(), // Set issue date to current date
      };
      
      // Add reservation handling information if needed
      if (matchingReservation && values.handleReservation === "fulfill") {
        requestBody.reservationId = matchingReservation._id;
        requestBody.fulfillReservation = true;
      }

      const response = await fetch("/api/borrowings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to issue book");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error issuing book:", error);
      toast.error(error.message || "Failed to issue book");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        {/* Book Selection */}
        <FormField
          control={form.control}
          name="bookId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Book</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {books.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      No books available
                    </SelectItem>
                  ) : (
                    books.map((book) => (
                      <SelectItem 
                        key={book._id} 
                        value={book._id}
                        disabled={book.copiesAvailable <= 0}
                      >
                        {book.title} 
                        {book.copiesAvailable <= 0 
                          ? " (No copies available)" 
                          : ` (${book.copiesAvailable} available)`}
                        {pendingReservations.some(r => r.bookId?._id === book._id) && " 🔖"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show reservation information for selected book */}
        {selectedBookReservations.length > 0 && (
          <Alert className="bg-blue-50 text-blue-800 border border-blue-200">
            <Bookmark className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-800">
              Reservation Alert
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-2">
                This book has {selectedBookReservations.length} active 
                {selectedBookReservations.length === 1 ? " reservation" : " reservations"}. 
                The first reservation was made by {selectedBookReservations[0].userId?.name} 
                on {formatDate(selectedBookReservations[0].reservationDate)}.
              </p>
              <div className="text-xs text-blue-600 mt-1">
                <strong>Note:</strong> If you select this member, the reservation will be fulfilled automatically.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Member Selection */}
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedUser(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      Loading members...
                    </SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.userId})
                        {selectedBookReservations.some(r => r.userId?._id === user._id) && " 🔖"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reservation match alert */}
        {isReservationMatch && (
          <Alert className="bg-green-50 text-green-800 border border-green-200">
            <Info className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-800">Reservation Match Found</AlertTitle>
            <AlertDescription className="text-green-700">
              This member has an active reservation for this book. The reservation will be fulfilled when you issue this book.
            </AlertDescription>
          </Alert>
        )}

        {/* Reservation handling options - only show if there are reservations but selected user isn't the one with reservation */}
        {selectedBookReservations.length > 0 && selectedUser && !isReservationMatch && (
          <FormField
            control={form.control}
            name="handleReservation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reservation Handling</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="How to handle existing reservations" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ignore">
                      Issue to selected member (ignore reservations)
                    </SelectItem>
                    <SelectItem value="fulfill" disabled>
                      Fulfill reservation (select the member with the reservation)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Due Date */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value ? "text-muted-foreground" : ""
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a due date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Book
          </Button>
        </div>
      </form>
    </Form>
  );
}