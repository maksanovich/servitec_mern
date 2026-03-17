import mongoose, { Document, Model } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  state: 'active' | 'inactive';
}

const brandSchema = new mongoose.Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    state: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Brand: Model<IBrand> = mongoose.model<IBrand>('Brand', brandSchema);

