import mongoose, { Document, Model } from 'mongoose';

export interface IOrderStageEmailTemplate extends Document {
  /** Matches `OrderProgressStage.key` */
  stageKey: string;
  /** Supports `{customer_name}`, `{order_number}`, etc. */
  subjectTemplate: string;
  bodyTemplate: string;
}

const orderStageEmailTemplateSchema = new mongoose.Schema<IOrderStageEmailTemplate>(
  {
    stageKey: { type: String, required: true, unique: true, trim: true, index: true },
    subjectTemplate: { type: String, default: '', trim: true },
    bodyTemplate: { type: String, default: '' },
  },
  { timestamps: true }
);

export const OrderStageEmailTemplate: Model<IOrderStageEmailTemplate> =
  mongoose.model<IOrderStageEmailTemplate>('OrderStageEmailTemplate', orderStageEmailTemplateSchema);
