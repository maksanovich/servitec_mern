import mongoose, { Document, Model as MongooseModel } from 'mongoose';

export interface IEquipmentModel extends Omit<Document, 'model'> {
  brand: string;
  model: string;
  state: 'active' | 'inactive';
}

const equipmentModelSchema = new mongoose.Schema<IEquipmentModel>(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    state: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const EquipmentModel: MongooseModel<IEquipmentModel> = mongoose.model<IEquipmentModel>(
  'EquipmentModel',
  equipmentModelSchema
);

