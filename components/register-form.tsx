"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  contact: z.string().min(5, { message: "Contact information is required" }),
  role: z.enum(["Student", "Lecturer", "Admin"], { 
    required_error: "Role is required" 
  }).default("Student"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

// Helper function to generate user ID from name with random numbers
const generateUserId = (name: string): string => {
  const namePart = name.trim().toLowerCase().split(' ')[0]; // Take first name
  const randomNumbers = Math.floor(1000 + Math.random() * 9000); // Generate 4 random digits
  return `${namePart}${randomNumbers}`;
}

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      contact: "",
      role: "Student",
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    
    try {
      // Generate userId from name with 4 random numbers
      const userId = generateUserId(data.name);
      
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId // Add the generated userId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to register")
      }

      toast.success("Registration successful! Please sign in.")
      router.push("/login")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to create a new account
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            type="text"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            disabled={isLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="contact" className="text-sm font-medium">
            Contact
          </label>
          <Input
            id="contact"
            type="text"
            disabled={isLoading}
            {...register("contact")}
          />
          {errors.contact && (
            <p className="text-xs text-red-500">{errors.contact.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            {...register("role")}
          >
            <option value="Student">Student</option>
            <option value="Lecturer">Lecturer</option>
            <option value="Admin">Admin</option>
          </select>
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>
        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </a>
      </div>
    </div>
  )
}