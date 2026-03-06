import mongoose, { Document, Model } from 'mongoose';

export interface IClient extends Document {
  clientesid: number;
  clientescodigo: string;
  codigocontable: string;
  clientes_gruposid: number;
  provinciasid: string;
  provincia: string;
  ciudadesid: string;
  ciudad: string;
  razonsocial: string;
  parroquiasid: string;
  clientes_zonasid: number;
  nombrecomercial: string;
  direccion: string;
  identificacion: string;
  tipoidentificacion: string;
  email: string;
  telefono1: string;
  telefono2: string;
  telefono3: string;
  vendedoresid: number;
  cobradoresid: number;
  creditocupo: number;
  creditodias: number;
  fechamodificacion: string;
  fechacreacion: string;
}

const clientSchema = new mongoose.Schema<IClient>(
  {
    clientesid: { type: Number, required: true, unique: true },
    clientescodigo: { type: String, default: '' },
    codigocontable: { type: String, default: '' },
    clientes_gruposid: { type: Number, default: 0 },
    provinciasid: { type: String, default: '' },
    provincia: { type: String, default: '' },
    ciudadesid: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    razonsocial: { type: String, default: '' },
    parroquiasid: { type: String, default: '' },
    clientes_zonasid: { type: Number, default: 0 },
    nombrecomercial: { type: String, default: '' },
    direccion: { type: String, default: '' },
    identificacion: { type: String, default: '' },
    tipoidentificacion: { type: String, default: '' },
    email: { type: String, default: '' },
    telefono1: { type: String, default: '' },
    telefono2: { type: String, default: '' },
    telefono3: { type: String, default: '' },
    vendedoresid: { type: Number, default: 0 },
    cobradoresid: { type: Number, default: 0 },
    creditocupo: { type: Number, default: 0 },
    creditodias: { type: Number, default: 0 },
    fechamodificacion: { type: String, default: '' },
    fechacreacion: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Client: Model<IClient> = mongoose.model<IClient>('Client', clientSchema);
