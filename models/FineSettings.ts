import mongoose, { Schema, model } from "mongoose";

export interface FineSettingsDocument {
  _id: string;
  ratePerDay: number;
  gracePeriod: number; // Number of days before fine starts applying
  maxFinePerBook: number; // Maximum fine amount per book
  currencyCode: string;
  updatedBy: mongoose.Schema.Types.ObjectId;
  lastUpdated: Date;
}

const FineSettingsSchema = new Schema<FineSettingsDocument>(
  {
    ratePerDay: {
      type: Number,
      required: [true, "Daily fine rate is required"],
      default: 1.00, // Default $1 per day
      min: 0,
    },
    gracePeriod: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxFinePerBook: {
      type: Number,
      default: 50.00, // Default maximum fine of $50 per book
      min: 0,
    },
    currencyCode: {
      type: String,
      default: "USD",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const FineSettings = mongoose.models?.FineSettings || model<FineSettingsDocument>("FineSettings", FineSettingsSchema);
export default FineSettings;