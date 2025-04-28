import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || 
                      request.nextUrl.pathname.startsWith("/register");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  
  // If trying to access auth pages while logged in, redirect based on role
  if (isAuthRoute && token) {
    const role = token.role as string;
    if (role === "Admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  
  // If not logged in and trying to access protected routes
  if (!token && !isAuthRoute && !isApiRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Role-based access control for admin routes
  if (token && request.nextUrl.pathname.startsWith("/admin") && token.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Role-based access control for main routes (redirect admin to admin dashboard)
  if (token && !request.nextUrl.pathname.startsWith("/admin") && 
      !isApiRoute && !isAuthRoute && token.role === "Admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  
  return NextResponse.next();
}

// Match all routes except for public assets and API routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};