"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumbs() {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href: string }[]>([])

  useEffect(() => {
    const pathSegments = pathname
      .split("/")
      .filter((segment) => segment !== "")

    const breadcrumbItems = pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join("/")}`
      return {
        label: formatBreadcrumb(segment),
        href,
      }
    })

    setBreadcrumbs(breadcrumbItems)
  }, [pathname])

  const formatBreadcrumb = (text: string) => {
    // Handle special cases
    if (text === "admin") return "Admin"
    
    // Replace hyphens and underscores with spaces and capitalize each word
    return text
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  if (breadcrumbs.length === 0) {
    return <span>Home</span>
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <Link href="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {index === breadcrumbs.length - 1 ? (
            <span>{breadcrumb.label}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}