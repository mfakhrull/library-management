import { 
  BookOpen, 
  Users, 
  AlertCircle, 
  BarChart3, 
  Calendar, 
  Clock
} from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  return (
    <main className="flex-1 p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.name}. Here's an overview of the library system.
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
                <h3 className="text-2xl font-semibold">2,584</h3>
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
                <h3 className="text-2xl font-semibold">468</h3>
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
                <h3 className="text-2xl font-semibold">127</h3>
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
                <h3 className="text-2xl font-semibold">23</h3>
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
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">The Pragmatic Programmer</p>
                  <p className="text-sm text-green-500">Returned</p>
                </div>
                <p className="text-sm text-muted-foreground">Student ID: S10234 • Just now</p>
              </div>
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">Clean Architecture</p>
                  <p className="text-sm text-blue-500">Borrowed</p>
                </div>
                <p className="text-sm text-muted-foreground">Lecturer ID: L00981 • 2 hours ago</p>
              </div>
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">Design Patterns</p>
                  <p className="text-sm text-amber-500">Reserved</p>
                </div>
                <p className="text-sm text-muted-foreground">Student ID: S20348 • 3 hours ago</p>
              </div>
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">Introduction to Algorithms</p>
                  <p className="text-sm text-red-500">Overdue</p>
                </div>
                <p className="text-sm text-muted-foreground">Student ID: S30129 • 1 day ago</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">System Stats</h3>
              <p className="text-sm text-muted-foreground">Library performance metrics</p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Books in Circulation</p>
                    <p className="text-sm text-muted-foreground">32%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-[32%] rounded-full bg-primary"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Spaces Occupied</p>
                    <p className="text-sm text-muted-foreground">78%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-[78%] rounded-full bg-primary"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">New Users (This Month)</p>
                    <p className="text-sm text-muted-foreground">+24</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-[24%] rounded-full bg-primary"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Return Rate</p>
                    <p className="text-sm text-muted-foreground">96%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-[96%] rounded-full bg-primary"></div>
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
              {[
                { title: "Clean Code", author: "Robert C. Martin", checkouts: 48 },
                { title: "Design Patterns", author: "Erich Gamma et al", checkouts: 42 },
                { title: "The Pragmatic Programmer", author: "Andrew Hunt & David Thomas", checkouts: 36 },
                { title: "Refactoring", author: "Martin Fowler", checkouts: 31 },
                { title: "Domain-Driven Design", author: "Eric Evans", checkouts: 28 }
              ].map((book, index) => (
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
              {[
                { title: "Software Engineering", student: "Ahmed Ali (S10234)", dueIn: "3 hours" },
                { title: "Artificial Intelligence", student: "Sarah Johnson (S20348)", dueIn: "6 hours" },
                { title: "Database Systems", student: "Michael Chen (S30129)", dueIn: "12 hours" },
                { title: "Computer Networks", student: "Jessica Williams (S40583)", dueIn: "1 day" },
                { title: "Operating Systems", student: "David Lee (S50294)", dueIn: "2 days" }
              ].map((return_item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{return_item.title}</p>
                    <p className="text-sm text-muted-foreground">{return_item.student}</p>
                  </div>
                  <div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      Due in {return_item.dueIn}
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