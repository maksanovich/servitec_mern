import mongoose, { Document, Model as MongooseModel } from 'mongoose';

export type ServiceSparePartType = 'service' | 'replacement';
export type ServiceSparePartState = 'active' | 'inactive';

export interface IServiceSparePart extends Document {
  type: ServiceSparePartType;
  name: string;
  amount: number;
  price: number;
  details: string;
  state: ServiceSparePartState;
}

const serviceSparePartSchema = new mongoose.Schema<IServiceSparePart>(
  {
    type: {
      type: String,
      enum: ['service', 'replacement'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    details: {
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

serviceSparePartSchema.index({ type: 1, name: 1 }, { unique: true });

export const ServiceSparePart: MongooseModel<IServiceSparePart> =
  mongoose.model<IServiceSparePart>('ServiceSparePart', serviceSparePartSchema);

