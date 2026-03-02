import mongoose, { Document, Model } from 'mongoose';

export interface IBranch extends Document {
  branchName: string;
  email: string;
  phone: string;
  address: string;
  state: 'active' | 'inactive';
}

const branchSchema = new mongoose.Schema<IBranch>(
  {
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Branch: Model<IBranch> = mongoose.model<IBranch>('Branch', branchSchema);
