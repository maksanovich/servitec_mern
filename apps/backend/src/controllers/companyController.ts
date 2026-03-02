import { Request, Response } from 'express';
import { Company } from '../models/Company.js';

export async function getCompany(_req: Request, res: Response): Promise<Response | void> {
  try {
    const company = await Company.findOne().lean();
    if (!company) {
      return res.json({ company: null });
    }
    res.json({
      company: {
        id: company._id,
        ruc: company.ruc ?? '',
        companyName: company.companyName ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        address: company.address ?? '',
        state: company.state ?? 'active',
      },
    });
  } catch (err) {
    console.error('Get company error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateCompany(req: Request, res: Response): Promise<Response | void> {
  try {
    const { ruc, companyName, email, phone, address, state } = req.body as {
      ruc?: string;
      companyName?: string;
      email?: string;
      phone?: string;
      address?: string;
      state?: 'active' | 'inactive';
    };
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        ruc: ruc ?? '',
        companyName: companyName ?? '',
        email: email ?? '',
        phone: phone ?? '',
        address: address ?? '',
        state: state ?? 'active',
      });
    } else {
      if (ruc !== undefined) company.ruc = String(ruc).trim();
      if (companyName !== undefined) company.companyName = String(companyName).trim();
      if (email !== undefined) company.email = String(email).trim();
      if (phone !== undefined) company.phone = String(phone).trim();
      if (address !== undefined) company.address = String(address).trim();
      if (state !== undefined && (state === 'active' || state === 'inactive')) company.state = state;
      await company.save();
    }
    res.json({
      company: {
        id: company._id,
        ruc: company.ruc ?? '',
        companyName: company.companyName ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        address: company.address ?? '',
        state: company.state ?? 'active',
      },
    });
  } catch (err) {
    console.error('Update company error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
