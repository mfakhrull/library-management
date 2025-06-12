import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Bypass middleware for static assets or Next.js internals
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/register");
  const isApiRoute = pathname.startsWith("/api");
  
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
  if (token && request.nextUrl.pathname.startsWith("/admin")) {
    const role = token.role as string;
    
    // Allow lecturers to access specific academic resource pages
    if (role === "Lecturer" && (
      pathname.startsWith("/admin/academic-resources/add") || 
      pathname.startsWith("/admin/academic-resources/edit")
    )) {
      return NextResponse.next();
    }
    
    // Redirect non-admin users from other admin routes
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  
  // Role-based access control for main routes (redirect admin to admin dashboard)
  if (token && !request.nextUrl.pathname.startsWith("/admin") && 
      !isApiRoute && !isAuthRoute && token.role === "Admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  
  return NextResponse.next();
}

// Only apply middleware to application pages/routes (static assets bypass)
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ]
};