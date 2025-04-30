import { 
  BookOpen, 
  Users, 
  AlertCircle, 
  Clock
} from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb";
// Register Author model schema
import "@/models/Author";
import type { AuthorDocument } from "@/models/Author";
import Book, { BookDocument } from "@/models/Book";
import Borrowing from "@/models/Borrowing";
import User, { UserDocument } from "@/models/User";
import { differenceInHours, differenceInDays, formatDistanceToNow } from "date-fns";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  // connect to database and fetch dashboard stats
  await connectDB();
  // Most popular books based on borrowing frequency
  const popularRaw = await Borrowing.aggregate([
    { $match: {} },
    { $group: { _id: '$bookId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  const books = await Book.find({ _id: { $in: popularRaw.map(r => r._id) } })
    .populate('authorId', 'name');
  const popularBooks = popularRaw.map(r => {
    const b = books.find(bk => bk._id.toString() === r._id.toString());
    return {
      title: b?.title ?? 'Unknown',
      author: (b?.authorId as AuthorDocument)?.name ?? 'Unknown',
      checkouts: r.count
    };
  });
  // Upcoming returns in next 2 days
  const now = new Date();
  const upcomingThreshold = new Date(now);
  upcomingThreshold.setDate(now.getDate() + 2);
  const upcomingBorrowings = await Borrowing.find({
    dueDate: { $gte: now, $lte: upcomingThreshold },
    status: 'borrowed'
  })
    .sort({ dueDate: 1 })
    .limit(5)
    .populate('bookId', 'title')
    .populate('userId', 'name userId');
  const upcomingReturns = upcomingBorrowings.map(b => {
    const hrs = differenceInHours(b.dueDate, now);
    const days = differenceInDays(b.dueDate, now);
    const dueIn = hrs < 24 ? `${hrs} hours` : `${days} days`;
    return {
      title: (b.bookId as BookDocument).title,
      student: `${(b.userId as UserDocument).name} (${(b.userId as UserDocument).userId})`,
      dueIn
    };
  });

  // Recent Activity - latest 5 transactions
  const recentRaw = await Borrowing.find({})
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('bookId', 'title')
    .populate('userId', 'name userId');
  const recentActivity = recentRaw.map(b => ({
    title: (b.bookId as BookDocument).title,
    user: `${(b.userId as UserDocument).name} (${(b.userId as UserDocument).userId})`,
    status: b.status,
    timeAgo: formatDistanceToNow(b.updatedAt, { addSuffix: true }),
  }));

  // System Stats calculations
  const totalBooks = await Book.countDocuments();
  const totalUsers = await User.countDocuments();
  const activeLoans = await Borrowing.countDocuments({ status: 'borrowed' });
  const totalBorrowings = await Borrowing.countDocuments();
  const returnedCount = await Borrowing.countDocuments({ status: 'returned' });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: monthStart, $lte: now } });
  const booksInCirculationPercent = totalBooks ? Math.round((activeLoans / totalBooks) * 100) : 0;
  const spacesOccupiedPercent = totalUsers ? Math.round((activeLoans / totalUsers) * 100) : 0;
  const returnRatePercent = totalBorrowings ? Math.round((returnedCount / totalBorrowings) * 100) : 0;
  // Overdue Returns count
  const overdueReturns = await Borrowing.countDocuments({
    status: 'overdue',
    dueDate: { $lt: now }
  });

  return (
    <main className="flex-1 p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.name}. Here&apos;s an overview of the library system.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <h3 className="text-2xl font-semibold">{totalBooks}</h3>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered Users</p>
                <h3 className="text-2xl font-semibold">{totalUsers}</h3>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <h3 className="text-2xl font-semibold">{activeLoans}</h3>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Returns</p>
                <h3 className="text-2xl font-semibold">{overdueReturns}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest transactions in the system</p>
            </div>
            <div className="p-0">
              {recentActivity.map((item, index) => (
                <div key={index} className="border-t px-6 py-3">
                  <div className="flex justify-between">
                    <p className="font-medium">{item.title}</p>
                    <p className={`text-sm ${item.status === 'returned' ? 'text-green-500' : item.status === 'borrowed' ? 'text-blue-500' : 'text-red-500'}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.user} • {item.timeAgo}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">System Stats</h3>
              <p className="text-sm text-muted-foreground">Library performance metrics</p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {/* Books in Circulation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Books in Circulation</p>
                    <p className="text-sm text-muted-foreground">{booksInCirculationPercent}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${booksInCirculationPercent}%` }}></div>
                  </div>
                </div>
                {/* Spaces Occupied */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Spaces Occupied</p>
                    <p className="text-sm text-muted-foreground">{spacesOccupiedPercent}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${spacesOccupiedPercent}%` }}></div>
                  </div>
                </div>
                {/* New Users (This Month) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">New Users (This Month)</p>
                    <p className="text-sm text-muted-foreground">+{newUsersThisMonth}</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${newUsersThisMonth}%` }}></div>
                  </div>
                </div>
                {/* Return Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Return Rate</p>
                    <p className="text-sm text-muted-foreground">{returnRatePercent}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${returnRatePercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Most Popular Books</h3>
            <p className="text-sm text-muted-foreground mb-4">Based on borrowing frequency</p>
            
            <div className="space-y-4">
              {popularBooks.map((book, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{book.checkouts}</span>
                    <span className="text-xs text-muted-foreground">checkouts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Upcoming Returns</h3>
            <p className="text-sm text-muted-foreground mb-4">Books due in the next 48 hours</p>
            
            <div className="space-y-4">
              {upcomingReturns.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.student}</p>
                  </div>
                  <div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      Due in {item.dueIn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}