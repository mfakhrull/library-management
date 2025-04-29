import { Metadata } from "next";
import { CategoryManager } from "@/app/(admin)/admin/categories/components/category-manager";

export const metadata: Metadata = {
  title: "Manage Categories",
  description: "Manage book categories in the library system",
};

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories Management</h1>
          <p className="text-muted-foreground">
            Manage the categories used to organize books in the library
          </p>
        </div>
      </div>
      <CategoryManager />
    </div>
  );
}