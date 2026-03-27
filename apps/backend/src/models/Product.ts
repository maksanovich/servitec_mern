import mongoose, { Document, Model as MongooseModel } from 'mongoose';

export type ProductState = 'active' | 'inactive';

export interface IProduct extends Document {
  product: string;
  state: ProductState;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    product: { type: String, required: true, trim: true },
    state: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

productSchema.index({ product: 1 }, { unique: true });

export const Product: MongooseModel<IProduct> = mongoose.model<IProduct>('Product', productSchema);

