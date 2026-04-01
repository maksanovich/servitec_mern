import mongoose, { Document, Model as MongooseModel } from 'mongoose';

/** Full Perseo `productos_consulta` row stored as JSON (tarifas, ubicaciones, etc.). */
export interface ISpareServer extends Document {
  productosid: number;
  productocodigo: string;
  /** Entire API object for this product */
  payload: Record<string, unknown>;
}

const spareServerSchema = new mongoose.Schema<ISpareServer>(
  {
    productosid: { type: Number, required: true, unique: true },
    productocodigo: { type: String, default: '' },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

spareServerSchema.index({ productocodigo: 1 });

export const SpareServer: MongooseModel<ISpareServer> = mongoose.model<ISpareServer>(
  'SpareServer',
  spareServerSchema
);
