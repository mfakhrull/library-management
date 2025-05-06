"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Edit, ExternalLink, FileUp, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10,
  });
  
  // Resource type options
  const resourceTypes = [
    { value: "all", label: "All Types" },
    { value: "lecture_slide", label: "Lecture Slides" },
    { value: "past_paper", label: "Past Papers" },
    { value: "other", label: "Other Resources" },
  ];

  // Fetch resources on initial load and when filters or pagination changes
  useEffect(() => {
    fetchResources();
  }, [pagination.page, searchQuery, courseFilter, resourceTypeFilter]);

  // Fetch courses for filtering
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/courses`);
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    
    fetchCourses();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      let url = `/api/academic-resources?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (searchQuery) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }
      
      if (courseFilter && courseFilter !== "all") {
        url += `&courseId=${encodeURIComponent(courseFilter)}`;
      }
      
      if (resourceTypeFilter && resourceTypeFilter !== "all") {
        url += `&resourceType=${encodeURIComponent(resourceTypeFilter)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      
      const data = await response.json();
      setResources(data.resources || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/academic-resources/${resourceId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete resource");
      }
      
      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      toast.error(error.message || "Failed to delete resource");
    }
  };

  const handleEditResource = (resourceId: string) => {
    router.push(`/admin/academic-resources/edit/${resourceId}`);
  };

  const handleChangePage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const handleAddResource = () => {
    router.push("/admin/academic-resources/add");
  };

  const handleViewResource = (url: string) => {
    window.open(url, "_blank");
  };

  // Format resource type for display
  const formatResourceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy");
  };

  return (
    <div className="container p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Resources</h1>
          <p className="text-muted-foreground">
            Manage lecture slides, past papers, and other academic materials
          </p>
        </div>
        
        <Button onClick={handleAddResource}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 py-4">
        <div className="relative w-full md:w-auto md:flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        
        <Select
          value={courseFilter}
          onValueChange={(value) => {
            setCourseFilter(value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={resourceTypeFilter}
          onValueChange={(value) => {
            setResourceTypeFilter(value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery("");
            setCourseFilter("all");
            setResourceTypeFilter("all");
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        >
          Reset
        </Button>
      </div>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Uploaded Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading resources...
                </TableCell>
              </TableRow>
            ) : resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No resources found.
                  {(searchQuery || courseFilter || resourceTypeFilter) && " Try adjusting your filters."}
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
                <TableRow key={resource._id}>
                  <TableCell className="font-medium truncate max-w-[200px]">
                    {resource.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {resource.courseId.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatResourceType(resource.resourceType)}
                  </TableCell>
                  <TableCell>{resource.year}</TableCell>
                  <TableCell>{resource.uploadedById.name}</TableCell>
                  <TableCell>{formatDate(resource.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewResource(resource.fileUrl)}
                      title="View File"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditResource(resource._id)}
                      title="Edit Resource"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteResource(resource._id)}
                      title="Delete Resource"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center py-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handleChangePage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}