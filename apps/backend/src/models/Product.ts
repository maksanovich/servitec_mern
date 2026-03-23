import mongoose, { Document, Model as MongooseModel } from 'mongoose';

export type ProductState = 'active' | 'inactive';

export interface IProduct extends Document {
  branch: string;
  product: string;
  state: ProductState;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    branch: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    state: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

// Prevent duplicates per branch+product (case-sensitive; app should normalize strings)
productSchema.index({ branch: 1, product: 1 }, { unique: true });

export const Product: MongooseModel<IProduct> = mongoose.model<IProduct>('Product', productSchema);

