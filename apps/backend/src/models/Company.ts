import mongoose, { Document, Model } from 'mongoose';

export interface ICompany extends Document {
  ruc: string;
  companyName: string;
  web: string;
  email: string;
  phone: string;
  address: string;
  googleMaps: string;
  companyInformation: string;
  logo: string;
  state: 'active' | 'inactive';
}

const companySchema = new mongoose.Schema<ICompany>(
  {
    ruc: { type: String, default: '' },
    companyName: { type: String, default: '' },
    web: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    googleMaps: { type: String, default: '' },
    companyInformation: { type: String, default: '' },
    logo: { type: String, default: '' },
    state: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);
