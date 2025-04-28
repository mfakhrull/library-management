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
  Loader2
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

  // Update loading state based on session status
  React.useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  // Get navigation items based on user role
  const getNavItems = () => {
    const allNavItems = [
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
        isActive: pathname.startsWith("/books")
      },
      {
        title: "Search Catalog",
        url: `/search`,
        icon: Search,
        isActive: pathname.startsWith("/search")
      },
      {
        title: "Currently Borrowed",
        url: `/borrowed`,
        icon: Clock,
        isActive: pathname.startsWith("/borrowed")
      },
      {
        title: "Reservations",
        url: `/reservations`,
        icon: Calendar,
        isActive: pathname.startsWith("/reservations")
      },
      {
        title: "Borrowing History",
        url: `/history`,
        icon: History,
        isActive: pathname.startsWith("/history")
      },
      {
        title: "Profile",
        url: `/profile`,
        icon: User,
        isActive: pathname.startsWith("/profile")
      },
      {
        title: "Settings",
        url: `/settings`,
        icon: Settings,
        isActive: pathname.startsWith("/settings")
      }
    ];

    return allNavItems;
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
