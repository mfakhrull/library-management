import mongoose, { Schema, model } from "mongoose";

export interface CategoryDocument {
  _id: string;
  name: string;
  description?: string;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
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

const Category = mongoose.models?.Category || model<CategoryDocument>("Category", CategorySchema);
export default Category;