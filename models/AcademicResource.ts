import mongoose, { Schema, model } from "mongoose";

export interface AcademicResourceDocument {
  _id: string;
  title: string;
  courseId: mongoose.Schema.Types.ObjectId;
  year: number;
  tags: string[];
  description?: string;
  fileUrl: string;
  uploadedById: mongoose.Schema.Types.ObjectId;
  resourceType: "lecture_slide" | "past_paper" | "other";
  downloadCount: number;
}

const AcademicResourceSchema = new Schema<AcademicResourceDocument>(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1900, "Year must be at least 1900"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader information is required"],
    },
    resourceType: {
      type: String,
      enum: ["lecture_slide", "past_paper", "other"],
      default: "other",
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient searching
AcademicResourceSchema.index({ title: 'text', tags: 'text' });

const AcademicResource = mongoose.models?.AcademicResource || 
  model<AcademicResourceDocument>("AcademicResource", AcademicResourceSchema);
export default AcademicResource;