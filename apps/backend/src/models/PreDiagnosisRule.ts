import mongoose, { Document, Model } from 'mongoose';

export interface IPreDiagnosisRule extends Document {
  device: string;
  symptom: string;
  probableIssue: string;
  estimateMin: number;
  estimateMax: number;
  etaHours: number;
  state: 'active' | 'inactive';
}

const preDiagnosisRuleSchema = new mongoose.Schema<IPreDiagnosisRule>(
  {
    device: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    symptom: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    probableIssue: {
      type: String,
      required: true,
      trim: true,
    },
    estimateMin: {
      type: Number,
      required: true,
      min: 0,
    },
    estimateMax: {
      type: Number,
      required: true,
      min: 0,
    },
    etaHours: {
      type: Number,
      required: true,
      min: 0,
    },
    state: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

preDiagnosisRuleSchema.index({ device: 1, symptom: 1 }, { unique: true });

export const PreDiagnosisRule: Model<IPreDiagnosisRule> = mongoose.model<IPreDiagnosisRule>(
  'PreDiagnosisRule',
  preDiagnosisRuleSchema
);
