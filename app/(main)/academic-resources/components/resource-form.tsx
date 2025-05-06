"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, FileUp, Loader2 } from "lucide-react";

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

// Define resource types
const resourceTypes = [
  { value: "lecture_slide", label: "Lecture Slides" },
  { value: "past_paper", label: "Past Paper" },
  { value: "other", label: "Other Resource" },
];

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  courseId: z.string().min(1, "Course is required"),
  year: z.coerce.number().min(1900, "Year must be after 1900").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  resourceType: z.enum(["lecture_slide", "past_paper", "other"]),
  tags: z.string().optional(),
  description: z.string().optional(),
  fileUrl: z.string().min(1, "File is required"),
});

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

// Define props for the component
interface ResourceFormProps {
  resourceId?: string;
  initialData?: any;
}

export function ResourceForm({ resourceId, initialData }: ResourceFormProps = {}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [fileUploading, setFileUploading] = React.useState(false);
  const [courses, setCourses] = React.useState<any[]>([]);
  const isEditing = !!resourceId;

  // Process initialData
  const processedInitialData = React.useMemo(() => {
    if (!initialData) return undefined;
    
    return {
      ...initialData,
      // Extract courseId string from object if needed
      courseId: typeof initialData.courseId === 'object' && initialData.courseId?._id 
        ? initialData.courseId._id 
        : initialData.courseId,
      tags: formatTagsToString(initialData.tags),
    };
  }, [initialData]);

  // Initialize form with default values or fetched data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: processedInitialData || {
      title: "",
      courseId: "",
      year: new Date().getFullYear(),
      resourceType: "other",
      tags: "",
      description: "",
      fileUrl: "",
    },
  });

  // Fetch courses on component mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
      }
    };

    fetchCourses();
  }, []);

  // Update form values when initialData changes
  React.useEffect(() => {
    if (processedInitialData && isEditing) {
      form.reset(processedInitialData);
    }
  }, [form, processedInitialData, isEditing]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error("Only PDF files are supported");
      return;
    }
    
    setFileUploading(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add a header to indicate this is a PDF upload for academic resources
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-Resource-Type': 'pdf',
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      
      // Update form field with the Cloudinary URL
      form.setValue("fileUrl", data.secure_url);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setFileUploading(false);
    }
  };

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
        isEditing ? `/api/academic-resources/${resourceId}` : "/api/academic-resources",
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
        throw new Error(errorData.error || "Failed to save resource");
      }

      toast.success(
        isEditing ? "Resource updated successfully" : "Resource added successfully"
      );
      router.push("/admin/academic-resources/resources");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving resource:", error);
      toast.error(error.message || "Failed to save resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Resource" : "Add Academic Resource"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the resource information"
            : "Upload lecture slides, past papers, or other academic materials"}
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter resource title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course */}
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.length === 0 ? (
                        <SelectItem value="no-courses" disabled>
                          No courses available
                        </SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resource Type */}
            <FormField
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resourceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() + 1}
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="midterm, final, semester1, etc."
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
                      placeholder="Enter resource description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF File</FormLabel>
                  <div className="space-y-4">
                    {/* File upload input */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="file" 
                          accept="application/pdf"
                          onChange={handleFileUpload}
                          disabled={fileUploading}
                        />
                        {fileUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload a PDF file (lecture slides, past paper, etc.)
                      </p>
                    </div>
                    
                    {/* Manual URL input */}
                    <FormControl>
                      <Input 
                        placeholder="Or enter file URL manually" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    
                    {/* File preview */}
                    {field.value && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <div className="relative w-full h-24 overflow-hidden rounded-md border border-input p-2 flex items-center">
                          <FileUp className="h-6 w-6 mr-2 text-muted-foreground" />
                          <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate">{field.value.split('/').pop()}</p>
                            <a 
                              href={field.value} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-blue-500 hover:underline truncate block"
                            >
                              {field.value}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/academic-resources/resources")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fileUploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Resource" : "Add Resource"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}