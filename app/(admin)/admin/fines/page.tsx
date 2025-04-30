import { Metadata } from "next";
import { FineManagement } from "./components/fine-management";

export const metadata: Metadata = {
  title: "Fine Management",
  description: "Manage library fines and penalties",
};

export default function FinesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fine Management</h1>
          <p className="text-muted-foreground">
            Manage fine settings, collect payments, and view fine reports
          </p>
        </div>
      </div>
      <FineManagement />
    </div>
  );
}