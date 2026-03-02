import { useState, useEffect, useRef } from 'react';
import { FileText, Globe, Phone, Mail, MapPin, Map, MessageCircle, Upload, X, Save } from 'lucide-react';
import { Modal, Input, Button } from '../../../components/ui';
import type { Company } from './types';
import defaultLogo from '../../../assets/logo.svg';

const MAX_LOGO_BYTES = 500 * 1024;
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

interface CompanyFormModalProps {
  open: boolean;
  onClose: () => void;
  company: Company | null;
  onSuccess: () => void;
  onSubmit: (data: {
    companyName: string;
    ruc: string;
    web: string;
    phone: string;
    email: string;
    address: string;
    googleMaps: string;
    companyInformation: string;
    logo?: string;
  }) => Promise<void>;
}

export function CompanyFormModal({
  open,
  onClose,
  company,
  onSuccess,
  onSubmit,
}: CompanyFormModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [ruc, setRuc] = useState('');
  const [web, setWeb] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [googleMaps, setGoogleMaps] = useState('');
  const [companyInformation, setCompanyInformation] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (company) {
        setCompanyName(company.companyName ?? '');
        setRuc(company.ruc ?? '');
        setWeb(company.web ?? '');
        setPhone(company.phone ?? '');
        setEmail(company.email ?? '');
        setAddress(company.address ?? '');
        setGoogleMaps(company.googleMaps ?? '');
        setCompanyInformation(company.companyInformation ?? '');
        setLogo(company.logo?.trim() || null);
      } else {
        setCompanyName('');
        setRuc('');
        setWeb('');
        setPhone('');
        setEmail('');
        setAddress('');
        setGoogleMaps('');
        setCompanyInformation('');
        setLogo(null);
      }
      setError(null);
      setLogoError(null);
    }
  }, [open, company]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image (JPEG, PNG, WebP or GIF).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(`Image must be under ${MAX_LOGO_BYTES / 1024}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.onerror = () => setLogoError('Failed to read file.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearLogo = () => {
    setLogo(null);
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = companyName.trim();
    const trimmedRuc = ruc.trim();
    const trimmedWeb = web.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedAddress = address.trim();
    const trimmedGoogleMaps = googleMaps.trim();
    if (!trimmedName) {
      setError('Company Name is required.');
      return;
    }
    if (!trimmedRuc) {
      setError('RUC is required.');
      return;
    }
    if (!trimmedWeb) {
      setError('WEB is required.');
      return;
    }
    if (!trimmedPhone) {
      setError('Phone is required.');
      return;
    }
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (!trimmedAddress) {
      setError('Address is required.');
      return;
    }
    if (!trimmedGoogleMaps) {
      setError('Google Maps is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        companyName: trimmedName,
        ruc: trimmedRuc,
        web: trimmedWeb,
        phone: trimmedPhone,
        email: trimmedEmail,
        address: trimmedAddress,
        googleMaps: trimmedGoogleMaps,
        companyInformation: companyInformation.trim(),
        logo: logo ?? '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400';

  return (
    <Modal open={open} onClose={onClose} title="Update Company" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          COMPANY DETAILS
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Company Name (*)</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              required
            />
          </div>

          <div>
            <label className={labelClass}>RUC (*)</label>
            <div className="relative">
              <FileText className={iconClass} aria-hidden />
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="RUC"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>WEB (*)</label>
            <div className="relative">
              <Globe className={iconClass} aria-hidden />
              <input
                type="url"
                value={web}
                onChange={(e) => setWeb(e.target.value)}
                placeholder="https://..."
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone (*)</label>
            <div className="relative">
              <Phone className={iconClass} aria-hidden />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email (*)</label>
            <div className="relative">
              <Mail className={iconClass} aria-hidden />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address (*)</label>
            <div className="relative">
              <MapPin className={iconClass} aria-hidden />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Google Maps (*)</label>
            <div className="relative">
              <Map className={iconClass} aria-hidden />
              <input
                type="url"
                value={googleMaps}
                onChange={(e) => setGoogleMaps(e.target.value)}
                placeholder="https://maps.google.com/..."
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Company Information</label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" aria-hidden />
            <textarea
              value={companyInformation}
              onChange={(e) => setCompanyInformation(e.target.value)}
              placeholder="Company information..."
              rows={4}
              className={`${inputClass} pl-10 resize-y`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Company Logo</label>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1">
              <img
                src={logo && logo.trim() ? logo : defaultLogo}
                alt=""
                width={80}
                height={80}
                className="object-contain bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">Company Logo</span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_IMAGES}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload logo"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                Drop the files here or click to upload
              </Button>
              {logo && (
                <Button type="button" variant="secondary" size="sm" onClick={clearLogo}>
                  Remove logo
                </Button>
              )}
              {logoError && (
                <p className="text-xs text-red-600 dark:text-red-400">{logoError}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} leftIcon={X}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={Save}
            disabled={saving}
            isLoading={saving}
          >
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
