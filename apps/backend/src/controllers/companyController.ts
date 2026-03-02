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
        web: company.web ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        address: company.address ?? '',
        googleMaps: company.googleMaps ?? '',
        companyInformation: company.companyInformation ?? '',
        logo: company.logo ?? '',
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
    const {
      ruc,
      companyName,
      web,
      email,
      phone,
      address,
      googleMaps,
      companyInformation,
      logo,
      state,
    } = req.body as {
      ruc?: string;
      companyName?: string;
      web?: string;
      email?: string;
      phone?: string;
      address?: string;
      googleMaps?: string;
      companyInformation?: string;
      logo?: string;
      state?: 'active' | 'inactive';
    };
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ error: 'No company to update' });
    }
    if (ruc !== undefined) company.ruc = String(ruc).trim();
    if (companyName !== undefined) company.companyName = String(companyName).trim();
    if (web !== undefined) company.web = String(web).trim();
    if (email !== undefined) company.email = String(email).trim();
    if (phone !== undefined) company.phone = String(phone).trim();
    if (address !== undefined) company.address = String(address).trim();
    if (googleMaps !== undefined) company.googleMaps = String(googleMaps).trim();
    if (companyInformation !== undefined) company.companyInformation = String(companyInformation).trim();
    if (logo !== undefined) company.logo = String(logo).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) company.state = state;
    await company.save();
    res.json({
      company: {
        id: company._id,
        ruc: company.ruc ?? '',
        companyName: company.companyName ?? '',
        web: company.web ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        address: company.address ?? '',
        googleMaps: company.googleMaps ?? '',
        companyInformation: company.companyInformation ?? '',
        logo: company.logo ?? '',
        state: company.state ?? 'active',
      },
    });
  } catch (err) {
    console.error('Update company error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
