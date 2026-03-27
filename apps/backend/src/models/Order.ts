import mongoose, { Document, Model } from 'mongoose';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type OrderArea = 'entrance' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting-parts';
export type OrderState = 'income' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting' | 'no_solution' | 'finished';

export interface IOrderBudgetLine {
  serviceId: string;
  name: string;
  price: number;
  amount: number;
  total: number;
}

export interface IOrder extends Omit<Document, 'model'> {
  no: string;
  code: string;
  priority: OrderPriority;
  area: OrderArea;
  state: OrderState;
  type: string;

  clientId: number;
  clientName: string;
  clientIdentification: string;

  brand: string;
  model: string;
  series: string;

  technician: string;

  equipmentCondition: string;
  technicalReport: string;
  diagnosis: boolean;
  warranty: boolean;
  password?: string;
  fianceeDate?: string;
  advancement: number;

  accessories: string[];
  budgetLines: IOrderBudgetLine[];
  total: number;

  /** Data URL (e.g. image/jpeg;base64,...) — intake photo */
  photoBeforeRepair: string;
  /** Data URL — photo after repair */
  photoAfterRepair: string;

  /** Set when the order first enters `state: delivery` (equipment at delivery area). */
  deliveryArrivedAt?: Date | null;
  pickupReminder30dSentAt?: Date | null;
  /** Second notice at 30 + 60 days from arrival (abandonment warning). */
  pickupReminder90dSentAt?: Date | null;
}

const orderBudgetLineSchema = new mongoose.Schema<IOrderBudgetLine>(
  {
    serviceId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    no: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    area: { type: String, enum: ['entrance', 'maintenance', 'warehouse', 'delivery', 'waiting-parts'], required: true },
    state: {
      type: String,
      enum: ['income', 'maintenance', 'warehouse', 'delivery', 'waiting', 'no_solution', 'finished'],
      required: true,
    },
    type: { type: String, required: true, trim: true },

    clientId: { type: Number, required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    clientIdentification: { type: String, default: '', trim: true },

    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    series: { type: String, required: true, trim: true },

    technician: { type: String, required: true, trim: true },

    equipmentCondition: { type: String, default: '', trim: true },
    technicalReport: { type: String, default: '', trim: true },
    diagnosis: { type: Boolean, default: false },
    warranty: { type: Boolean, default: false },
    password: { type: String, default: '' },
    fianceeDate: { type: String, default: '' },
    advancement: { type: Number, default: 0 },

    accessories: { type: [String], default: [] },
    budgetLines: { type: [orderBudgetLineSchema], default: [] },
    total: { type: Number, default: 0 },

    photoBeforeRepair: { type: String, default: '' },
    photoAfterRepair: { type: String, default: '' },

    deliveryArrivedAt: { type: Date },
    pickupReminder30dSentAt: { type: Date },
    pickupReminder90dSentAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ no: 1 }, { unique: true });
orderSchema.index({ state: 1, deliveryArrivedAt: 1 });
orderSchema.index({ code: 1 }, { unique: true });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

