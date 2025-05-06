"use client";

import * as React from "react";
import { FileIcon, Download, Calendar, FileType, User, Tag, BookOpen } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResourceCardProps {
  resource: {
    _id: string;
    title: string;
    courseId: {
      _id: string;
      name: string;
      code: string;
    };
    year: number;
    tags: string[];
    description?: string;
    fileUrl: string;
    uploadedById: {
      _id: string;
      name: string;
      role: string;
    };
    resourceType: "lecture_slide" | "past_paper" | "other";
    downloadCount: number;
    createdAt: string;
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  // Track download click
  const handleDownload = async () => {
    try {
      // Open the file in a new tab
      window.open(resource.fileUrl, "_blank");
      
      // Update download count in the background using the special flag
      await fetch(`/api/academic-resources/${resource._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incrementDownload: true
        }),
      });
      
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  // Get appropriate icon based on resource type
  const getResourceTypeIcon = () => {
    switch (resource.resourceType) {
      case "lecture_slide":
        return <FileType className="h-4 w-4 mr-1.5" />;
      case "past_paper":
        return <BookOpen className="h-4 w-4 mr-1.5" />;
      default:
        return <FileIcon className="h-4 w-4 mr-1.5" />;
    }
  };

  // Format resource type for display
  const formatResourceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM dd, yyyy");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="mb-2">
              {resource.courseId.code}
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              {getResourceTypeIcon()}
              {formatResourceType(resource.resourceType)}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {resource.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {resource.courseId.name}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex-grow">
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {resource.description}
          </p>
        )}
        
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Year: {resource.year}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 mr-1.5" />
            Uploaded by: {resource.uploadedById.name}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Added: {formatDate(resource.createdAt)}
          </div>
          
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {resource.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{resource.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleDownload}
          className="w-full"
          variant="default"
        >
          <Download className="h-4 w-4 mr-2" />
          Download ({resource.downloadCount})
        </Button>
      </CardFooter>
    </Card>
  );
}