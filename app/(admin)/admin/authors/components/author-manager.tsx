"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash2, Save, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Author {
  _id: string;
  name: string;
  biography?: string;
  country?: string;
}

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Author name is required"),
  biography: z.string().optional(),
  country: z.string().optional(),
});

export function AuthorManager() {
  const [authors, setAuthors] = React.useState<Author[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      biography: "",
      country: "",
    },
  });

  // Fetch authors
  const fetchAuthors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/authors");
      if (!response.ok) {
        throw new Error("Failed to fetch authors");
      }
      const data = await response.json();
      setAuthors(data);
    } catch (error) {
      console.error("Error fetching authors:", error);
      toast.error("Failed to load authors");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAuthors();
  }, []);

  // Handle create form submission
  const onCreateSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create author");
      }

      toast.success("Author created successfully");
      setIsCreating(false);
      form.reset();
      fetchAuthors(); // Refresh authors list
    } catch (error: any) {
      console.error("Error creating author:", error);
      toast.error(error.message || "Failed to create author");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit form submission
  const onUpdateSubmit = async (id: string, values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update author");
      }

      toast.success("Author updated successfully");
      setEditingId(null);
      fetchAuthors(); // Refresh authors list
    } catch (error: any) {
      console.error("Error updating author:", error);
      toast.error(error.message || "Failed to update author");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete author
  const deleteAuthor = async (id: string) => {
    try {
      const response = await fetch(`/api/authors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete author");
      }

      toast.success("Author deleted successfully");
      fetchAuthors(); // Refresh authors list
    } catch (error: any) {
      console.error("Error deleting author:", error);
      toast.error(error.message || "Failed to delete author");
    }
  };

  // Start editing an author
  const startEditing = (author: Author) => {
    form.setValue("name", author.name);
    form.setValue("biography", author.biography || "");
    form.setValue("country", author.country || "");
    setEditingId(author._id);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Book Authors</CardTitle>
              <CardDescription>
                Manage the authors of books in the library
              </CardDescription>
            </div>
            {!isCreating ? (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Author
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {/* Create Author Form */}
          {isCreating && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle>Add New Author</CardTitle>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter author name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter author's country"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="biography"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter author biography"
                              rows={3}
                              {...field}
                            />
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
                      onClick={() => {
                        setIsCreating(false);
                        form.reset();
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Author"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          )}

          {/* Authors Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Biography</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <Skeleton className="h-6 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : authors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No authors found</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first author to start adding books.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  authors.map((author) => (
                    <TableRow key={author._id}>
                      <TableCell className="font-medium">
                        {editingId === author._id ? (
                          <Input
                            {...form.register("name")}
                            className="max-w-xs"
                            defaultValue={author.name}
                          />
                        ) : (
                          author.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === author._id ? (
                          <Input
                            {...form.register("country")}
                            className="max-w-xs"
                            defaultValue={author.country || ""}
                          />
                        ) : (
                          author.country || "Not specified"
                        )}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {editingId === author._id ? (
                          <Textarea
                            {...form.register("biography")}
                            className="min-h-[80px]"
                            defaultValue={author.biography || ""}
                          />
                        ) : (
                          <div className="max-h-20 overflow-hidden">
                            {author.biography || "No biography available"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === author._id ? (
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={cancelEditing}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => {
                                const values = form.getValues();
                                onUpdateSubmit(author._id, values);
                              }}
                              disabled={isSubmitting}
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(author)}
                              title="Edit Author"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete Author"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Author: {author.name}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this author? 
                                    This action cannot be undone. Books written by 
                                    this author will need to be reassigned.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAuthor(author._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}