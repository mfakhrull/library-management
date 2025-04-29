"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { BookForm } from "@/app/(admin)/admin/books/components/book-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";

interface EditBookPageProps {}

export default function EditBookPage({}: EditBookPageProps) {
  const params = useParams();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/books/${bookId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            return notFound();
          }
          throw new Error("Failed to fetch book");
        }

        const data = await response.json();
        setBook(data);
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("Failed to load book information");
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="w-full max-w-3xl mx-auto">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
        <p className="text-muted-foreground">
          Update information for "{book.title}"
        </p>
      </div>
      <BookForm bookId={bookId} initialData={book} />
    </div>
  );
}