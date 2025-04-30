import { Metadata } from "next";
import { BorrowingList } from "./components/borrowing-list";

export const metadata: Metadata = {
  title: "Manage Borrowings",
  description: "Manage book borrowings and returns",
};

export default function BorrowingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowings Management</h1>
          <p className="text-muted-foreground">
            Issue books to members, process returns, and manage overdue items
          </p>
        </div>
      </div>
      <BorrowingList />
    </div>
  );
}