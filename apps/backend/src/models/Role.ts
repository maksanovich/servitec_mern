import mongoose, { Document, Model } from 'mongoose';

export interface IRole extends Document {
  name: string;
  slug: string;
  description: string;
  /** Assigned admin UI paths (e.g. /admin/order). Super admin ignores this in access checks. */
  pages: string[];
  state: 'active' | 'inactive';
}

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    pages: { type: [String], default: [] },
    state: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Role: Model<IRole> = mongoose.model<IRole>('Role', roleSchema);
