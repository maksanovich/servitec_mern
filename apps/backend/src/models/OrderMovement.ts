import mongoose, { Document, Model } from 'mongoose';
import type { OrderWorkflow } from './Order.js';

export interface IOrderMovement extends Omit<Document, 'model'> {
  orderId: mongoose.Types.ObjectId;
  orderNo: string;
  orderCode: string;
  orderedByUserId: string;
  orderedByName: string;
  orderedByEmail: string;
  beforeStageKey: string;
  afterStageKey: string;
  beforeStageLabel: string;
  afterStageLabel: string;
  workflow: OrderWorkflow;
}

const orderMovementSchema = new mongoose.Schema<IOrderMovement>(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNo: { type: String, required: true, trim: true, index: true },
    orderCode: { type: String, required: true, trim: true, index: true },
    orderedByUserId: { type: String, default: '', trim: true },
    orderedByName: { type: String, default: '', trim: true },
    orderedByEmail: { type: String, default: '', trim: true },
    beforeStageKey: { type: String, default: '' },
    afterStageKey: { type: String, default: '' },
    beforeStageLabel: { type: String, default: '' },
    afterStageLabel: { type: String, default: '' },
    workflow: { type: String, enum: ['standard', 'warranty'], default: 'standard' },
  },
  { timestamps: true }
);

orderMovementSchema.index({ createdAt: -1 });

export const OrderMovement: Model<IOrderMovement> = mongoose.model<IOrderMovement>(
  'OrderMovement',
  orderMovementSchema
);
