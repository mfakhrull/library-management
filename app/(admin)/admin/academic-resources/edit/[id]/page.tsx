"use client";

import { ResourceForm } from "../../components/resource-form";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditResourcePageProps {
  params: {
    id: string;
  };
}

export default function EditResourcePage({ params }: EditResourcePageProps) {
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/academic-resources/${params.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch resource");
        }
        
        const data = await response.json();
        setResource(data);
      } catch (error: any) {
        console.error("Error fetching resource:", error);
        setError(error.message || "Failed to load resource");
        toast.error("Failed to load resource");
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading resource...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-destructive font-medium mb-2">Error</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return <ResourceForm resourceId={params.id} initialData={resource} />;
}