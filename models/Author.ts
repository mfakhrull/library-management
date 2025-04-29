import mongoose, { Schema, model } from "mongoose";

export interface AuthorDocument {
  _id: string;
  name: string;
  biography?: string;
  country?: string;
}

const AuthorSchema = new Schema<AuthorDocument>(
  {
    name: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    biography: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Author = mongoose.models?.Author || model<AuthorDocument>("Author", AuthorSchema);
export default Author;