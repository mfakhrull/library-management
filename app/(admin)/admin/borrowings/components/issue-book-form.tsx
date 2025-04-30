"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

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

// Form schema for issuing a book
const formSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  userId: z.string().min(1, "Member is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

interface IssueBookFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function IssueBookForm({ onSuccess, onCancel }: IssueBookFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [books, setBooks] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookId: "",
      userId: "",
      dueDate: addDays(new Date(), 14), // Default due date is 14 days from today
    },
  });

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
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load books and members data");
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/borrowings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          issueDate: new Date(), // Set issue date to current date
        }),
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
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Member Selection */}
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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