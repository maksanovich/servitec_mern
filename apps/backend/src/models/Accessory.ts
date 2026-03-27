import mongoose, { Document, Model as MongooseModel } from 'mongoose';

export interface IAccessory extends Document {
  artifact: string;
  state: 'active' | 'inactive';
}

const accessorySchema = new mongoose.Schema<IAccessory>(
  {
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

accessorySchema.index({ artifact: 1 }, { unique: true });

export const Accessory: MongooseModel<IAccessory> = mongoose.model<IAccessory>(
  'Accessory',
  accessorySchema
);

