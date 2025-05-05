"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Form validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  contact: z.string().min(3, "Contact information is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  contact: string;
  role: string;
  status: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Set up form with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      contact: "",
    },
  });

  // Fetch user data from the API
  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setUserData(data);
      
      // Update form with fetched data
      form.reset({
        name: data.name || "",
        email: data.email || "",
        contact: data.contact || "",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load your profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data when session is available
  useEffect(() => {
    if (status === "authenticated" && session?.user?._id) {
      fetchUserData(session.user._id);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    if (!session?.user?._id) {
      toast.error("User ID not found. Please log out and log in again.");
      return;
    }

    setIsSaving(true);
    try {
      // Send update request to the API
      const response = await fetch(`/api/users/${session.user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          contact: data.contact,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Fetch updated user data
      await fetchUserData(session.user._id);

      // Update the session with new data (for nav display)
      await update({
        ...session,
        user: {
          ...session.user,
          name: data.name,
          email: data.email,
          contact: data.contact,
        },
      });

      toast.success("Profile updated successfully");
    } catch (error: Error | unknown) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container p-8 max-w-2xl">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || "/avatars/default.jpg"} alt={userData?.name || "User"} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number or alternative contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          <div className="flex flex-col space-y-1">
            <p>User ID: {userData?.userId || "Not available"}</p>
            <p>Role: {userData?.role || "Not available"}</p>
            <p>Status: {userData?.status || "Not available"}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}