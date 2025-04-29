import { Metadata } from "next";
import { BookForm } from "@/app/(admin)/admin/books/components/book-form";

export const metadata: Metadata = {
  title: "Add New Book",
  description: "Add a new book to the library",
};

export default function AddBookPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Book</h1>
        <p className="text-muted-foreground">
          Create a new book record in the library system
        </p>
      </div>
      <BookForm />
    </div>
  );
}