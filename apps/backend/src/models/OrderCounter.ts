import mongoose, { Model, Schema } from 'mongoose';

/** Singleton `{ _id: 'orderNo', seq }` — advanced atomically for each new order `no`. */
export type OrderCounterDoc = {
  _id: string;
  seq: number;
};

const orderCounterSchema = new Schema<OrderCounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { collection: 'ordercounters' }
);

export const OrderCounter: Model<OrderCounterDoc> =
  (mongoose.models.OrderCounter as Model<OrderCounterDoc>) ??
  mongoose.model<OrderCounterDoc>('OrderCounter', orderCounterSchema);
