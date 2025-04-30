import mongoose, { Schema, model } from "mongoose";

export interface UserDocument {
    _id: string;
    userId: string;
    email: string;
    password: string;
    name: string;
    contact: string;
    role: "Admin" | "Student" | "Lecturer";
    status: "Active" | "Suspended";
}

const UserSchema = new Schema<UserDocument>(
  {
    userId: {
      type: String,
      unique: true,
      required: [true, "User ID is required"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    contact: {
      type: String,
      required: [true, "Contact information is required"],
    },
    role: {
      type: String,
      enum: ["Admin", "Student", "Lecturer"],
      default: "Student",
    },
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models?.User || model<UserDocument>("User", UserSchema);
export default User;