import { Metadata } from "next";
import { BookList } from "@/app/(admin)/admin/books/components/book-list";

export const metadata: Metadata = {
  title: "Manage Books",
  description: "Manage the library book collection",
};

export default function BooksPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books Management</h1>
          <p className="text-muted-foreground">
            View, add, edit and delete books in the library
          </p>
        </div>
      </div>
      <BookList />
    </div>
  );
}