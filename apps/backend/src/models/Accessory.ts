import mongoose, { Document, Model as MongooseModel } from 'mongoose';

export interface IAccessory extends Document {
  branch: string;
  artifact: string;
  state: 'active' | 'inactive';
}

const accessorySchema = new mongoose.Schema<IAccessory>(
  {
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    artifact: {
      type: String,
      required: true,
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

// Prevent duplicate artifacts per branch (case-insensitive-ish via trimming; app logic should also normalize)
accessorySchema.index({ branch: 1, artifact: 1 }, { unique: true });

export const Accessory: MongooseModel<IAccessory> = mongoose.model<IAccessory>(
  'Accessory',
  accessorySchema
);

