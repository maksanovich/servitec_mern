import mongoose, { Document, Model } from 'mongoose';
import type { OrderArea } from './Order.js';

/** Standard repair pipeline vs warranty handling pipeline (different ordered stages). */
export type OrderProgressStageWorkflow = 'standard' | 'warranty';

export interface IOrderProgressStage extends Omit<Document, 'model'> {
  /** Stable identifier used by orders (e.g. "inbound-receiving"). */
  key: string;
  label: string;
  description?: string;
  /** Display/order sequence within the same `workflow`. */
  sortOrder: number;
  /** Which order pipeline this stage belongs to. */
  workflow: OrderProgressStageWorkflow;
  /** Legacy coarse area bucket used by the existing order workflow. */
  legacyArea: OrderArea;
}

const orderProgressStageSchema = new mongoose.Schema<IOrderProgressStage>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    workflow: {
      type: String,
      required: true,
      enum: ['standard', 'warranty'],
      default: 'standard',
    },
    legacyArea: {
      type: String,
      required: true,
      enum: ['entrance', 'maintenance', 'warehouse', 'delivery', 'waiting-parts'],
    },
  },
  { timestamps: true }
);

orderProgressStageSchema.index({ workflow: 1, sortOrder: 1 });

export const OrderProgressStage: Model<IOrderProgressStage> = mongoose.model<IOrderProgressStage>(
  'OrderProgressStage',
  orderProgressStageSchema
);

