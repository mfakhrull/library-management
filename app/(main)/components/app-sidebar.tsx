"use client";

import * as React from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  History,
  Home,
  Library,
  LogOut,
  Search,
  Settings,
  User,
  Loader2,
  ClipboardList,
  Bookmark,
  Folder,
  FileUp
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = React.useState(true);
  const userRole = (session?.user as any)?.role || "Student";

  // Update loading state based on session status
  React.useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  // Get navigation items based on user role
  const getNavItems = () => {
    const commonNavItems = [
      {
        title: "Dashboard",
        url: `/dashboard`,
        icon: Home,
        isActive: pathname === "/dashboard"
      },
      {
        title: "Browse Books",
        url: `/books`,
        icon: BookOpen,
        isActive: pathname.startsWith("/books") && !pathname.includes("/borrowed")
      },
      {
        title: "Academic Resources",
        url: `/academic-resources`,
        icon: Folder,
        isActive: pathname.startsWith("/academic-resources")
      },
      {
        title: "My Borrowings",
        url: `/borrowings`,
        icon: ClipboardList,
        isActive: pathname.startsWith("/borrowings")
      },
      {
        title: "My Reservations",
        url: `/reservations`,
        icon: Bookmark,
        isActive: pathname.startsWith("/reservations")
      },
      {
        title: "Profile",
        url: `/profile`,
        icon: User,
        isActive: pathname.startsWith("/profile")
      },
    ];

    // For lecturers, add the ability to upload resources
    if (userRole === "Lecturer") {
      return commonNavItems.map(item => {
        if (item.url === "/academic-resources") {
          return {
            ...item,
            items: [
              { title: "Browse Resources", url: "/academic-resources" },
              { title: "Upload Resource", url: "/admin/academic-resources/add" }
            ]
          };
        }
        return item;
      });
    }
    
    return commonNavItems;
  };

  const navData = {
    user: {
      name: session?.user?.name || "Unknown User",
      username: session?.user?.userId || "No ID",
      avatar: session?.user?.image || "/avatars/default.jpg",
    },
    navMain: getNavItems(),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex h-14 items-center px-4">
          <Library className="h-5 w-5 text-primary mr-2" />
          <span className="font-semibold truncate group-data-[collapsible=icon]:hidden">Library System</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
