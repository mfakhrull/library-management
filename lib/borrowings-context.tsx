"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from "sonner";

// Define Borrowing types
interface BookInfo {
  _id: string;
  title: string;
  isbn: string;
  coverImage?: string;
}

interface UserInfo {
  _id: string;
  name: string;
  userId: string;
  email: string;
}

export interface Borrowing {
  _id: string;
  bookId: BookInfo;
  userId: UserInfo;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: "borrowed" | "returned" | "overdue";
}

// Create a context to store borrowing data
interface BorrowingContextType {
  borrowings: Borrowing[];
  loading: boolean;
  error: string | null;
  refetchBorrowings: () => Promise<void>;
}

const BorrowingContext = createContext<BorrowingContextType>({
  borrowings: [],
  loading: true,
  error: null,
  refetchBorrowings: async () => {},
});

export const useBorrowings = () => useContext(BorrowingContext);

export function BorrowingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchBorrowings = async (force = false) => {
    // Prevent excessive fetching by implementing a cooldown (5 seconds)
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000 && borrowings.length > 0) {
      return;
    }

    if (status === "loading") return;
    
    setLoading(true);
    try {
      // Use session.user._id or session.user.id (whichever is available)
      const userId = session?.user?._id || session?.user?.id;
      
      if (!userId) {
        console.log("User ID not found in session, skipping borrowings fetch");
        setLoading(false);
        return;
      }
      
      console.log("Fetching borrowings for user ID:", userId);
      const response = await fetch(`/api/borrowings?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch borrowings: ${response.status}`);
      }
      
      const data = await response.json();
      setBorrowings(data.borrowings || []);
      setLastFetchTime(now);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching borrowings:", error);
      setError("Failed to load your borrowings. Please try again later.");
      
      // Only show toast on first error
      if (!error) {
        toast.error("Failed to load borrowings");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch borrowings when session changes
  useEffect(() => {
    if (session?.user && (session.user?._id || session.user?.id)) {
      fetchBorrowings(true);
    }
  }, [session, status]);

  const contextValue = {
    borrowings,
    loading,
    error,
    refetchBorrowings: () => fetchBorrowings(true)
  };

  return (
    <BorrowingContext.Provider value={contextValue}>
      {children}
    </BorrowingContext.Provider>
  );
}