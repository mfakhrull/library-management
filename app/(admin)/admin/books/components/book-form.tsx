"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authorId: z.string().min(1, "Author is required"),
  categoryId: z.string().min(1, "Category is required"),
  isbn: z.string().min(1, "ISBN is required"),
  copiesTotal: z.coerce
    .number()
    .min(1, "Total copies must be at least 1"),
  copiesAvailable: z.coerce
    .number()
    .min(0, "Available copies cannot be negative"),
  publishedDate: z.date({
    required_error: "Published date is required",
  }),
  tags: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
});

// Define props for the component
interface BookFormProps {
  bookId?: string;
  initialData?: any;
}

// Format tags from array to comma-separated string
const formatTagsToString = (tags: string[] = []) => {
  return tags.join(", ");
};

// Parse tags from comma-separated string to array
const parseTagsToArray = (tagsString: string = "") => {
  return tagsString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
};

export function BookForm({ bookId, initialData }: BookFormProps = {}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [authors, setAuthors] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const isEditing = !!bookId;

  // Process initialData to extract the correct IDs from nested objects
  const processedInitialData = React.useMemo(() => {
    if (!initialData) return undefined;
    
    return {
      ...initialData,
      // Extract authorId string from object if needed
      authorId: typeof initialData.authorId === 'object' && initialData.authorId?._id 
        ? initialData.authorId._id 
        : initialData.authorId,
      // Extract categoryId string from object if needed
      categoryId: typeof initialData.categoryId === 'object' && initialData.categoryId?._id 
        ? initialData.categoryId._id 
        : initialData.categoryId,
      publishedDate: new Date(initialData.publishedDate),
      tags: formatTagsToString(initialData.tags),
    };
  }, [initialData]);

  // Initialize form with default values or fetched data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: processedInitialData || {
      title: "",
      authorId: "",
      categoryId: "",
      isbn: "",
      copiesTotal: 1,
      copiesAvailable: 1,
      publishedDate: new Date(),
      tags: "",
      description: "",
      coverImage: "",
    },
  });

  // Fetch authors and categories on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/authors"),
          fetch("/api/categories"),
        ]);

        if (!authorsResponse.ok || !categoriesResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const authorsData = await authorsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setAuthors(authorsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load authors and categories");
      }
    };

    fetchData();
  }, []);

  // Add a useEffect to properly update form values when initialData changes
  React.useEffect(() => {
    if (processedInitialData && isEditing) {
      // Reset the form with processed initial data
      form.reset(processedInitialData);
    }
  }, [form, processedInitialData, isEditing]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Format data for API
      const formData = {
        ...values,
        tags: parseTagsToArray(values.tags),
      };

      const response = await fetch(
        isEditing ? `/api/books/${bookId}` : "/api/books",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save book");
      }

      toast.success(
        isEditing ? "Book updated successfully" : "Book added successfully"
      );
      router.push("/admin/books");
      router.refresh(); // Refresh the books list
    } catch (error: any) {
      console.error("Error saving book:", error);
      toast.error(error.message || "Failed to save book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Book" : "Add New Book"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the book information in the library system"
            : "Add a new book to the library collection"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter book title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Author */}
            <FormField
              control={form.control}
              name="authorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {authors.map((author) => (
                        <SelectItem key={author._id} value={author._id}>
                          {author.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ISBN */}
            <FormField
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ISBN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ISBN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Copies */}
              <FormField
                control={form.control}
                name="copiesTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Copies</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Available Copies */}
              <FormField
                control={form.control}
                name="copiesAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Copies</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Published Date */}
            <FormField
              control={form.control}
              name="publishedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Published Date</FormLabel>
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
                            <span>Pick a date</span>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="science, fiction, classic, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter book description"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image URL */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/books")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Book" : "Add Book"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}