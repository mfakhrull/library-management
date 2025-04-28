import { BookOpen, Clock, History, Calendar } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  return (
    <main className="flex-1 p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your library activities
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currently Borrowed</p>
                <h3 className="text-2xl font-semibold">3</h3>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Reservations</p>
                <h3 className="text-2xl font-semibold">2</h3>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <h3 className="text-2xl font-semibold">1</h3>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
                <h3 className="text-2xl font-semibold">24</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Recently Borrowed</h3>
              <p className="text-sm text-muted-foreground">Your most recent checkouts</p>
            </div>
            <div className="p-0">
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">The Design of Everyday Things</p>
                  <p className="text-sm text-muted-foreground">Due in 7 days</p>
                </div>
                <p className="text-sm text-muted-foreground">Don Norman</p>
              </div>
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">Clean Code</p>
                  <p className="text-sm text-muted-foreground">Due in 14 days</p>
                </div>
                <p className="text-sm text-muted-foreground">Robert C. Martin</p>
              </div>
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">Atomic Habits</p>
                  <p className="text-sm text-muted-foreground">Due in 21 days</p>
                </div>
                <p className="text-sm text-muted-foreground">James Clear</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold">Upcoming Reservations</h3>
              <p className="text-sm text-muted-foreground">Books you've reserved</p>
            </div>
            <div className="p-0">
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">Thinking, Fast and Slow</p>
                  <p className="text-sm text-muted-foreground">Available in 2 days</p>
                </div>
                <p className="text-sm text-muted-foreground">Daniel Kahneman</p>
              </div>
              <div className="border-t px-6 py-3">
                <div className="flex justify-between">
                  <p className="font-medium">The Pragmatic Programmer</p>
                  <p className="text-sm text-muted-foreground">Available in 5 days</p>
                </div>
                <p className="text-sm text-muted-foreground">Andrew Hunt & David Thomas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Popular in Your Field</h3>
          <p className="text-sm text-muted-foreground mb-4">Top borrowed books in your area of interest</p>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Fundamentals of Database Systems",
                author: "Ramez Elmasri",
                category: "Computer Science",
                availability: "Available"
              },
              {
                title: "Artificial Intelligence: A Modern Approach",
                author: "Stuart Russell",
                category: "Computer Science",
                availability: "2 copies available"
              },
              {
                title: "Introduction to Algorithms",
                author: "Thomas H. Cormen",
                category: "Computer Science",
                availability: "Reserved"
              },
              {
                title: "Data Science for Business",
                author: "Foster Provost",
                category: "Business",
                availability: "3 copies available"
              }
            ].map((book, index) => (
              <div key={index} className="rounded-lg border bg-card p-4 shadow-sm">
                <h4 className="font-medium">{book.title}</h4>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{book.category}</span>
                  <span className="text-xs font-medium text-green-500">{book.availability}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}