import { Metadata } from "next";
import { AuthorManager } from "@/app/(admin)/admin/authors/components/author-manager";

export const metadata: Metadata = {
  title: "Manage Authors",
  description: "Manage book authors in the library system",
};

export default function AuthorsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authors Management</h1>
          <p className="text-muted-foreground">
            Manage the authors of books in the library
          </p>
        </div>
      </div>
      <AuthorManager />
    </div>
  );
}