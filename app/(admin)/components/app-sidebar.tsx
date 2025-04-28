"use client";

import * as React from "react";
import {
  BookPlus,
  BarChart3,
  Database,
  Home,
  Library,
  LogOut,
  Settings,
  Users,
  BookOpen,
  ClipboardList,
  AlertCircle,
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

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = React.useState(true);

  // Update loading state based on session status
  React.useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  // Get navigation items for admin
  const getAdminNavItems = () => {
    const adminNavItems = [
      {
        title: "Dashboard",
        url: `/admin/dashboard`,
        icon: Home,
        isActive: pathname === "/admin/dashboard"
      },
      {
        title: "Manage Books",
        url: `/admin/books`,
        icon: BookOpen,
        isActive: pathname.startsWith("/admin/books")
      },
      {
        title: "Add New Book",
        url: `/admin/add-book`,
        icon: BookPlus,
        isActive: pathname.startsWith("/admin/add-book")
      },
      {
        title: "Manage Loans",
        url: `/admin/loans`,
        icon: ClipboardList,
        isActive: pathname.startsWith("/admin/loans")
      },
      {
        title: "Manage Users",
        url: `/admin/users`,
        icon: Users,
        isActive: pathname.startsWith("/admin/users")
      },
      {
        title: "Reports",
        url: `/admin/reports`,
        icon: BarChart3,
        isActive: pathname.startsWith("/admin/reports")
      },
      {
        title: "Overdue Items",
        url: `/admin/overdue`,
        icon: AlertCircle,
        isActive: pathname.startsWith("/admin/overdue")
      },
      {
        title: "Database",
        url: `/admin/database`,
        icon: Database,
        isActive: pathname.startsWith("/admin/database")
      },
      {
        title: "Settings",
        url: `/admin/settings`,
        icon: Settings,
        isActive: pathname.startsWith("/admin/settings")
      }
    ];

    return adminNavItems;
  };

  const navData = {
    user: {
      name: session?.user?.name || "Admin User",
      username: session?.user?.userId || "Admin",
      avatar: session?.user?.image || "/avatars/default.jpg",
    },
    navMain: getAdminNavItems(),
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
          <span className="font-semibold truncate group-data-[collapsible=icon]:hidden">Admin Portal</span>
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
