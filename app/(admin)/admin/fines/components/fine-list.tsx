"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  BadgeAlert, 
  Calculator, 
  CreditCard, 
  DollarSign, 
  Loader2, 
  Search,
  Filter,
  Calendar,
  UserCheck,
  BadgeCheck,
  MoreHorizontal,
  RefreshCw,
  FileText
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Define types for our fine data
interface Fine {
  _id: string;
  borrowingId: {
    _id: string;
    bookId: {
      _id: string;
      title: string;
      isbn: string;
      coverImage?: string;
    };
    dueDate: string;
    returnDate?: string;
    status: string;
  };
  userId: {
    _id: string;
    name: string;
    userId: string;
    email: string;
  };
  amountPaid: number;
  totalFine: number;
  paymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  receiptNumber: string;
  notes: string;
  processedBy?: {
    _id: string;
    name: string;
    userId: string;
  };
}

interface OverdueBorrowing {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    isbn: string;
    coverImage?: string;
  };
  userId: {
    _id: string;
    name: string;
    userId: string;
    email: string;
  };
  dueDate: string;
  returnDate?: string;
  fine: number;
  fineStatus: string;
  status: string;
}

const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-600">Paid</Badge>;
    case "partial":
      return <Badge className="bg-amber-600">Partial</Badge>;
    case "pending":
      return <Badge className="bg-red-600">Pending</Badge>;
    case "waived":
      return <Badge className="bg-blue-600">Waived</Badge>;
    default:
      return <Badge className="bg-gray-600">Unknown</Badge>;
  }
};

export function FineList() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [fines, setFines] = React.useState<Fine[]>([]);
  const [overdueBorrowings, setOverdueBorrowings] = React.useState<OverdueBorrowing[]>([]);
  const [selectedBorrowing, setSelectedBorrowing] = React.useState<OverdueBorrowing | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [paymentMethod, setPaymentMethod] = React.useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = React.useState<string>("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [isRecalculating, setIsRecalculating] = React.useState(false);
  
  // Pagination state
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  // Filtering state
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Load fines and overdue borrowings
  React.useEffect(() => {
    async function fetchFines() {
      try {
        // Fetch fine payments
        const response = await fetch(`/api/fines/payments?page=${page}&limit=${limit}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`);
        if (!response.ok) {
          throw new Error('Failed to fetch fine payments');
        }
        const data = await response.json();
        setFines(data.payments);
        setTotal(data.pagination.total);
        
        // Fetch overdue borrowings with pending fines
        const overdueResponse = await fetch('/api/borrowings?status=overdue&fineStatus=pending');
        if (!overdueResponse.ok) {
          throw new Error('Failed to fetch overdue borrowings');
        }
        const overdueData = await overdueResponse.json();
        setOverdueBorrowings(overdueData.borrowings);
      } catch (error) {
        console.error('Error fetching fines data:', error);
        toast.error('Failed to load fines data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchFines();
  }, [page, limit, statusFilter]);

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedBorrowing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/fines/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          borrowingId: selectedBorrowing._id,
          amountPaid: paymentMethod === 'waived' ? selectedBorrowing.fine : parseFloat(paymentAmount),
          paymentMethod,
          notes: paymentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      toast.success('Payment processed successfully');
      
      // Reset form and close dialog
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentNotes("");
      setSelectedBorrowing(null);
      
      // Reload data
      setPage(1);
      setIsLoading(true);
      const updatedResponse = await fetch(`/api/fines/payments?page=1&limit=${limit}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`);
      const updatedData = await updatedResponse.json();
      setFines(updatedData.payments);
      setTotal(updatedData.pagination.total);
      
      // Refresh overdue borrowings
      const overdueResponse = await fetch('/api/borrowings?status=overdue&fineStatus=pending');
      const overdueData = await overdueResponse.json();
      setOverdueBorrowings(overdueData.borrowings);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Recalculate all fines
  const handleRecalculateFines = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch('/api/fines/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recalculate fines');
      }

      const data = await response.json();
      toast.success(`Successfully updated ${data.updated} overdue borrowings with new fine calculations`);
      
      // Refresh the data after recalculation
      setIsLoading(true);
      const overdueResponse = await fetch('/api/borrowings?status=overdue&fineStatus=pending');
      const overdueData = await overdueResponse.json();
      setOverdueBorrowings(overdueData.borrowings);
      
      const finesResponse = await fetch(`/api/fines/payments?page=${page}&limit=${limit}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`);
      const finesData = await finesResponse.json();
      setFines(finesData.payments);
      setTotal(finesData.pagination.total);
      
    } catch (error) {
      console.error('Error recalculating fines:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recalculate fines');
    } finally {
      setIsRecalculating(false);
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div>
              <CardTitle>Fine Management</CardTitle>
              <CardDescription>Loading fine data...</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue borrowings with pending fines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BadgeAlert className="mr-2 h-5 w-5 text-red-500" />
              <div>
                <CardTitle>Overdue Books with Pending Fines</CardTitle>
                <CardDescription>
                  Process payments for overdue books with pending fines
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleRecalculateFines}
                  disabled={isRecalculating}
                  className="cursor-pointer"
                >
                  {isRecalculating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Recalculate All Fines
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => toast.info("Export feature will be available soon!")}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export Overdue List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {overdueBorrowings.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No overdue books with pending fines
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Borrowed By</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Fine Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueBorrowings.map((borrowing) => (
                    <TableRow key={borrowing._id}>
                      <TableCell className="font-medium">
                        {borrowing.bookId.title}
                      </TableCell>
                      <TableCell>{borrowing.userId.name}</TableCell>
                      <TableCell>{formatDate(borrowing.dueDate)}</TableCell>
                      <TableCell className="font-semibold text-red-500">
                        {formatCurrency(borrowing.fine)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-600">Overdue</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBorrowing(borrowing);
                            setIsPaymentDialogOpen(true);
                          }}
                        >
                          <DollarSign className="mr-1 h-4 w-4" />
                          Process Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fine payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Fine Payment History
          </CardTitle>
          <CardDescription>
            View and manage fine payment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or book..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {fines.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No fine payment records found
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fines.map((fine) => (
                      <TableRow key={fine._id}>
                        <TableCell className="font-mono text-xs">
                          {fine.receiptNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fine.borrowingId.bookId.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{fine.userId.name}</span>
                            <span className="text-xs text-muted-foreground">{fine.userId.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(fine.paymentDate)}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{formatCurrency(fine.amountPaid)}</span>
                            {fine.amountPaid < fine.totalFine && (
                              <span className="text-xs text-muted-foreground">
                                of {formatCurrency(fine.totalFine)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {fine.paymentMethod === "cash" && (
                            <span className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4" />
                              Cash
                            </span>
                          )}
                          {fine.paymentMethod === "card" && (
                            <span className="flex items-center">
                              <CreditCard className="mr-1 h-4 w-4" />
                              Card
                            </span>
                          )}
                          {fine.paymentMethod === "online" && (
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              Online
                            </span>
                          )}
                          {fine.paymentMethod === "waived" && (
                            <span className="flex items-center">
                              <UserCheck className="mr-1 h-4 w-4" />
                              Waived
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={fine.paymentStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Pagination>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">
                        Page {page} of {Math.max(1, Math.ceil(total / limit))}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
                        disabled={page >= Math.ceil(total / limit)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Processing Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Process Fine Payment</DialogTitle>
            <DialogDescription>
              {selectedBorrowing ? (
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="font-semibold">Book:</span> {selectedBorrowing.bookId.title}
                  </div>
                  <div>
                    <span className="font-semibold">User:</span> {selectedBorrowing.userId.name}
                  </div>
                  <div>
                    <span className="font-semibold">Due Date:</span> {formatDate(selectedBorrowing.dueDate)}
                  </div>
                  <div className="font-semibold text-red-500">
                    <span>Fine Amount:</span> {formatCurrency(selectedBorrowing.fine)}
                  </div>
                </div>
              ) : (
                "Loading borrowing details..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="waived">Waived (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod !== "waived" && (
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">
                  Payment Amount ({formatCurrency(selectedBorrowing?.fine || 0)})
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    RM
                  </span>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedBorrowing?.fine}
                    className="pl-7"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Add any additional notes about this payment"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayment} 
              disabled={isProcessing || (paymentMethod !== "waived" && (!paymentAmount || parseFloat(paymentAmount) <= 0))}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  {paymentMethod === "waived" ? "Waive Fine" : "Process Payment"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}