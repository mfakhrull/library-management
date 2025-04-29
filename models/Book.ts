import mongoose, { Schema, model } from "mongoose";

export interface BookDocument {
  _id: string;
  title: string;
  authorId: mongoose.Schema.Types.ObjectId;
  categoryId: mongoose.Schema.Types.ObjectId;
  isbn: string;
  copiesTotal: number;
  copiesAvailable: number;
  publishedDate: Date;
  tags: string[];
  description?: string;
  coverImage?: string;
}

const BookSchema = new Schema<BookDocument>(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: [true, "Author is required"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
    },
    copiesTotal: {
      type: Number,
      required: [true, "Total copies is required"],
      min: [0, "Total copies cannot be negative"],
    },
    copiesAvailable: {
      type: Number,
      required: [true, "Available copies is required"],
      min: [0, "Available copies cannot be negative"],
    },
    publishedDate: {
      type: Date,
      required: [true, "Published date is required"],
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient searching
BookSchema.index({ title: 'text', tags: 'text' });

const Book = mongoose.models?.Book || model<BookDocument>("Book", BookSchema);
export default Book;