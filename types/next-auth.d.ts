import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      _id?: string;
      userId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      contact?: string;
      role?: "Admin" | "Student" | "Lecturer";
      status?: "Active" | "Suspended";
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    _id: string;
    userId: string;
    contact?: string;
    role?: "Admin" | "Student" | "Lecturer";
    status?: "Active" | "Suspended";
  }
}