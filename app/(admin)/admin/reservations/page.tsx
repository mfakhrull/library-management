import { Metadata } from "next";
import { ReservationsList } from "@/app/(admin)/admin/reservations/components/reservations-list";

export const metadata: Metadata = {
  title: "Manage Reservations",
  description: "Manage book reservations in the library",
};

export default function ReservationsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations Management</h1>
          <p className="text-muted-foreground">
            View and manage book reservations
          </p>
        </div>
      </div>
      <ReservationsList />
    </div>
  );
}