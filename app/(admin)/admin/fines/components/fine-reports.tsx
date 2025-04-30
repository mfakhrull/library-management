"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  BarChart3, 
  Calendar, 
  ChevronDown, 
  Download,
  FileText, 
  Loader2, 
  PieChart, 
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface SummaryData {
  overview: {
    overdueCount: number;
    totalFinesAmount: number;
    totalCollected: number;
    totalWaived: number;
    pendingAmount: number;
  };
  statusCounts: {
    pending: number;
    partial: number;
    paid: number;
    waived: number;
  };
  paymentMethods: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

interface DailyData {
  dailyData: Array<{
    _id: string;
    amount: number;
    count: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

interface UserData {
  topUsers: Array<{
    _id: string;
    totalFine: number;
    count: number;
    user: Array<{
      name: string;
      userId: string;
      email: string;
    }>;
  }>;
}

export function FineReports() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [reportType, setReportType] = React.useState<string>("summary");
  const [reportData, setReportData] = React.useState<any>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = React.useState(false);

  // Fetch report data when report type or date range changes
  React.useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      try {
        const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

        const response = await fetch(
          `/api/fines/reports?type=${reportType}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data = await response.json();
        setReportData(data.reportData);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error("Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReportData();
  }, [reportType, dateRange]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);
  };

  // Handle exporting report data
  const handleExportReport = () => {
    setIsExporting(true);
    try {
      // Convert report data to CSV or PDF format
      let csvContent = "data:text/csv;charset=utf-8,";

      if (reportType === "summary") {
        const summaryData = reportData as SummaryData;
        csvContent += "Report Type,Summary\r\n";
        csvContent += `Date Range,${new Date(summaryData.timeRange?.start || '').toLocaleDateString()} to ${new Date(summaryData.timeRange?.end || '').toLocaleDateString()}\r\n\r\n`;
        
        csvContent += "OVERVIEW\r\n";
        csvContent += `Overdue Books,${summaryData.overview?.overdueCount || 0}\r\n`;
        csvContent += `Total Fines Amount,${formatCurrency(summaryData.overview?.totalFinesAmount || 0)}\r\n`;
        csvContent += `Total Collected,${formatCurrency(summaryData.overview?.totalCollected || 0)}\r\n`;
        csvContent += `Total Waived,${formatCurrency(summaryData.overview?.totalWaived || 0)}\r\n`;
        csvContent += `Pending Amount,${formatCurrency(summaryData.overview?.pendingAmount || 0)}\r\n\r\n`;
        
        csvContent += "STATUS COUNTS\r\n";
        csvContent += `Pending,${summaryData.statusCounts?.pending || 0}\r\n`;
        csvContent += `Partial,${summaryData.statusCounts?.partial || 0}\r\n`;
        csvContent += `Paid,${summaryData.statusCounts?.paid || 0}\r\n`;
        csvContent += `Waived,${summaryData.statusCounts?.waived || 0}\r\n\r\n`;
        
        csvContent += "PAYMENT METHODS\r\n";
        csvContent += "Method,Count,Total\r\n";
        if (summaryData.paymentMethods && summaryData.paymentMethods.length > 0) {
          summaryData.paymentMethods.forEach(method => {
            csvContent += `${method._id},${method.count},${formatCurrency(method.total)}\r\n`;
          });
        }
      } else if (reportType === "daily") {
        const dailyData = reportData as DailyData;
        csvContent += "Report Type,Daily\r\n";
        csvContent += `Date Range,${new Date(dailyData.timeRange?.start || '').toLocaleDateString()} to ${new Date(dailyData.timeRange?.end || '').toLocaleDateString()}\r\n\r\n`;
        
        csvContent += "DAILY PAYMENTS\r\n";
        csvContent += "Date,Amount,Count\r\n";
        if (dailyData.dailyData && dailyData.dailyData.length > 0) {
          dailyData.dailyData.forEach(day => {
            csvContent += `${day._id},${formatCurrency(day.amount)},${day.count}\r\n`;
          });
        }
      } else if (reportType === "user") {
        const userData = reportData as UserData;
        csvContent += "Report Type,User\r\n\r\n";
        
        csvContent += "TOP USERS WITH HIGHEST FINES\r\n";
        csvContent += "Name,User ID,Email,Total Fine,Number of Books\r\n";
        if (userData.topUsers && userData.topUsers.length > 0) {
          userData.topUsers.forEach(user => {
            if (user.user && user.user.length > 0) {
              csvContent += `${user.user[0].name},${user.user[0].userId},${user.user[0].email},${formatCurrency(user.totalFine)},${user.count}\r\n`;
            }
          });
        }
      }

      // Create a download link and trigger the download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `fine-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div>
              <CardTitle>Fine Reports</CardTitle>
              <CardDescription>Loading report data...</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Fine Reports</CardTitle>
              <CardDescription>
                Generate and analyze fine payment reports
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center space-x-2">
                <Select
                  value={reportType}
                  onValueChange={setReportType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">
                      <span className="flex items-center">
                        <PieChart className="mr-2 h-4 w-4" />
                        Summary
                      </span>
                    </SelectItem>
                    {/* <SelectItem value="daily">
                      <span className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Daily Trends
                      </span>
                    </SelectItem> */}
                    <SelectItem value="user">
                      <span className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        User Analysis
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                onClick={handleExportReport}
                disabled={isExporting || !reportData}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {reportType === "summary" && reportData && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Fines
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportData.overview?.totalFinesAmount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reportData.overview?.overdueCount || 0} overdue books
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Collected
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.overview?.totalCollected || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(((reportData.overview?.totalCollected || 0) / (reportData.overview?.totalFinesAmount || 1)) * 100) || 0}% of total fines
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.overview?.pendingAmount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(((reportData.overview?.pendingAmount || 0) / (reportData.overview?.totalFinesAmount || 1)) * 100) || 0}% of total fines
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Waived
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(reportData.overview?.totalWaived || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(((reportData.overview?.totalWaived || 0) / (reportData.overview?.totalFinesAmount || 1)) * 100) || 0}% of total fines
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-red-500" />
                        <div className="ml-2 flex w-full items-center justify-between">
                          <span className="text-sm font-medium">Pending</span>
                          <span className="font-semibold">
                            {reportData.statusCounts?.pending || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-amber-500" />
                        <div className="ml-2 flex w-full items-center justify-between">
                          <span className="text-sm font-medium">Partial</span>
                          <span className="font-semibold">
                            {reportData.statusCounts?.partial || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-green-500" />
                        <div className="ml-2 flex w-full items-center justify-between">
                          <span className="text-sm font-medium">Paid</span>
                          <span className="font-semibold">
                            {reportData.statusCounts?.paid || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full bg-blue-500" />
                        <div className="ml-2 flex w-full items-center justify-between">
                          <span className="text-sm font-medium">Waived</span>
                          <span className="font-semibold">
                            {reportData.statusCounts?.waived || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {!reportData.paymentMethods || reportData.paymentMethods.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No payment data available for this period
                        </p>
                      ) : (
                        reportData.paymentMethods.map((method: any) => (
                          <div key={method._id} className="flex items-center">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{
                                backgroundColor:
                                  method._id === "cash"
                                    ? "#84cc16"
                                    : method._id === "card"
                                    ? "#3b82f6"
                                    : method._id === "online"
                                    ? "#6366f1"
                                    : "#9333ea",
                              }}
                            />
                            <div className="ml-2 flex w-full items-center justify-between">
                              <span className="text-sm font-medium capitalize">
                                {method._id} ({method.count})
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(method.total)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {reportType === "daily" && reportData && reportData.dailyData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Fine Collection</CardTitle>
                  <CardDescription>
                    Fine payments collected per day for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.dailyData.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      No daily data available for the selected period
                    </div>
                  ) : (
                    <div className="relative h-80">
                      <div className="flex h-full flex-col">
                        <div className="flex-1">
                          <div className="relative h-full">
                            <div className="absolute inset-0 flex items-end">
                              {reportData.dailyData.map(
                                (day: { _id: string; amount: number; count: number }, i: number) => {
                                  const maxAmount = Math.max(
                                    ...reportData.dailyData.map((d: any) => d.amount)
                                  );
                                  const height = (day.amount / maxAmount) * 100;
                                  return (
                                    <div
                                      key={day._id}
                                      className="group relative flex h-full w-full flex-col items-center justify-end"
                                    >
                                      <div
                                        className="relative w-full flex-1 bg-primary/10"
                                        style={{ height: `${height}%` }}
                                      >
                                        <div
                                          className="absolute bottom-0 left-0 right-0 bg-primary"
                                          style={{ height: `${height}%` }}
                                        ></div>

                                        <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-md bg-black px-2 py-1 text-xs text-white group-hover:block">
                                          {formatCurrency(day.amount)} ({day.count}{" "}
                                          {day.count === 1 ? "payment" : "payments"})
                                        </div>
                                      </div>
                                      <div className="mt-2 w-full truncate text-center text-xs">
                                        {new Date(day._id).toLocaleDateString(undefined, {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === "user" && reportData && reportData.topUsers && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Users with Highest Fines</CardTitle>
                  <CardDescription>
                    Users with the highest accumulated fine amounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.topUsers.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      No user data available
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border shadow">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              ID
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium">
                              Books
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium">
                              Total Fine
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.topUsers.map((user: any) => (
                            <tr
                              key={user._id}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">
                                    {user.user && user.user.length > 0 ? user.user[0].name : "Unknown"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.user && user.user.length > 0 ? user.user[0].email : ""}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {user.user && user.user.length > 0 ? user.user[0].userId : "Unknown"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {user.count}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(user.totalFine)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}