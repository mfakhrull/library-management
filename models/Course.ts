import mongoose, { Schema, model } from "mongoose";

export interface CourseDocument {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

const CourseSchema = new Schema<CourseDocument>(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient searching
CourseSchema.index({ name: 'text', code: 'text' });

const Course = mongoose.models?.Course || model<CourseDocument>("Course", CourseSchema);
export default Course;