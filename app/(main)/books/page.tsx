"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search, Filter, Bookmark } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookCard } from "./components/book-card";
import { toast } from "sonner";

export default function BooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("query") || "");
  const [selectedCategory, setSelectedCategory] = React.useState(searchParams.get("category") || "all");
  const [page, setPage] = React.useState(parseInt(searchParams.get("page") || "1", 10));
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalBooks, setTotalBooks] = React.useState(0);
  const limit = 12; // Show more books per page for browsing

  // Function to fetch books with search and filter
  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/books?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }

      const data = await response.json();
      setBooks(data.books);
      setTotalPages(data.pagination.pages);
      setTotalBooks(data.pagination.total);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load books");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Load books and categories on component mount and when search/filter changes
  React.useEffect(() => {
    fetchBooks();
  }, [page, searchQuery, selectedCategory]);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchBooks();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
    if (selectedCategory) params.append("category", selectedCategory);
    params.append("page", "1");
    
    router.push(`/books?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Library Collection</h1>
        <p className="text-muted-foreground">
          Browse our collection of {totalBooks} books
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Books Catalog</CardTitle>
              <CardDescription>
                {isLoading 
                  ? "Loading books..." 
                  : `Showing ${books.length > 0 ? (page - 1) * limit + 1 : 0}-${Math.min(page * limit, totalBooks)} of ${totalBooks} books`}
              </CardDescription>
            </div>
            
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              {/* Search Form */}
              <form
                onSubmit={handleSearch}
                className="flex space-x-2"
              >
                <Input
                  placeholder="Search by title or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Button type="submit" variant="secondary">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </form>

              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1); // Reset to first page when changing filter
                  
                  // Update URL with selected category
                  const params = new URLSearchParams();
                  if (searchQuery) params.append("query", searchQuery);
                  if (value) params.append("category", value);
                  params.append("page", "1");
                  
                  router.push(`/books?${params.toString()}`);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No books found</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-md">
                We couldn't find any books that match your search. Try adjusting your filter or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {books.length > 0 ? (page - 1) * limit + 1 : 0}-
            {Math.min(page * limit, totalBooks)} of {totalBooks} books
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    
                    // Update URL with new page
                    const params = new URLSearchParams();
                    if (searchQuery) params.append("query", searchQuery);
                    if (selectedCategory) params.append("category", selectedCategory);
                    params.append("page", newPage.toString());
                    
                    router.push(`/books?${params.toString()}`);
                  }}
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
                            onClick={() => {
                              setPage(pageNum);
                              
                              // Update URL with new page
                              const params = new URLSearchParams();
                              if (searchQuery) params.append("query", searchQuery);
                              if (selectedCategory) params.append("category", selectedCategory);
                              params.append("page", pageNum.toString());
                              
                              router.push(`/books?${params.toString()}`);
                            }}
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
                        onClick={() => {
                          setPage(pageNum);
                          
                          // Update URL with new page
                          const params = new URLSearchParams();
                          if (searchQuery) params.append("query", searchQuery);
                          if (selectedCategory) params.append("category", selectedCategory);
                          params.append("page", pageNum.toString());
                          
                          router.push(`/books?${params.toString()}`);
                        }}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    const newPage = Math.min(totalPages, page + 1);
                    setPage(newPage);
                    
                    // Update URL with new page
                    const params = new URLSearchParams();
                    if (searchQuery) params.append("query", searchQuery);
                    if (selectedCategory) params.append("category", selectedCategory);
                    params.append("page", newPage.toString());
                    
                    router.push(`/books?${params.toString()}`);
                  }}
                  disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
    </div>
  );
}