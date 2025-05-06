"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Book, Search, Filter, CalendarIcon, GraduationCap } from "lucide-react";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResourceCard } from "./components/resource-card";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcademicResourcesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for resources and filters
  const [resources, setResources] = React.useState<any[]>([]);
  const [courses, setCourses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 12,
  });
  
  // Get current filter values from URL or defaults
  const query = searchParams.get("query") || "";
  const courseId = searchParams.get("courseId") || "";
  const resourceType = searchParams.get("resourceType") || "";
  const year = searchParams.get("year") || "";
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
  
  // Years selection options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  // Resource type options
  const resourceTypes = [
    { value: "lecture_slide", label: "Lecture Slides" },
    { value: "past_paper", label: "Past Papers" },
    { value: "other", label: "Other Resources" },
  ];

  // Fetch courses for filtering
  React.useEffect(() => {
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

  // Fetch resources with filters
  React.useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      
      try {
        let url = `/api/academic-resources?page=${page}&limit=${pagination.limit}`;
        
        if (query) {
          url += `&query=${encodeURIComponent(query)}`;
        }
        
        if (courseId && courseId !== "all") {
          url += `&courseId=${encodeURIComponent(courseId)}`;
        }
        
        if (resourceType && resourceType !== "all") {
          url += `&resourceType=${encodeURIComponent(resourceType)}`;
        }
        
        if (year && year !== "all") {
          url += `&year=${encodeURIComponent(year)}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setResources(data.resources || []);
          setPagination(data.pagination || pagination);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [page, query, courseId, resourceType, year, pagination.limit]);

  // Update URL params for filtering
  const updateFilters = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Update or remove params
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change
    if (Object.keys(params).some(param => param !== 'page')) {
      newParams.set('page', '1');
    }
    
    router.push(`/academic-resources?${newParams.toString()}`);
  };

  return (
    <div className="container p-8 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Resources</h1>
          <p className="text-muted-foreground">
            Browse lecture slides, past papers, and other academic materials
          </p>
        </div>
      </div>

      {/* Filters */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Search & Filter</CardTitle>
        <CardDescription>
        Find resources by course, type, or keyword
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
            placeholder="Search resources..."
            value={query}
            onChange={(e) => updateFilters({ query: e.target.value || null })}
            className="w-full pl-10"
            />
          </div>
        </div>

        {/* Course filter */}
        <div className="flex-1">
          <Select
            value={courseId}
            onValueChange={(value) => updateFilters({ courseId: value || null })}
          >
            <SelectTrigger className="w-full">
            <Book className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.code} - {course.name}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resource type filter */}
        <div className="flex-1">
          <Select
            value={resourceType}
            onValueChange={(value) => updateFilters({ resourceType: value || null })}
          >
            <SelectTrigger className="w-full">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {resourceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year filter */}
        <div className="flex-1">
          <Select
            value={year}
            onValueChange={(value) => updateFilters({ year: value || null })}
          >
            <SelectTrigger className="w-full">
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
        </div>
        
        <div className="flex justify-end mt-4">
        <Button
          variant="outline"
          onClick={() => {
            // Clear all filters
            updateFilters({
            query: null,
            courseId: null,
            resourceType: null,
            year: null,
            page: null,
            });
          }}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Reset Filters
        </Button>
        </div>
      </CardContent>
    </Card>

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="h-64">
              <CardContent className="p-0"></CardContent>
            </Card>
          ))}
        </div>
      ) : resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(page) => updateFilters({ page: page.toString() })}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No resources found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}