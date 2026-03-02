import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Shield, Hash, Phone, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, Card, CardHeader, CardContent, Input, Button } from '../../components/ui';
import { updateProfile } from '../../api/auth';
import { getCompany, updateCompany, type Company } from '../../api/company';
import { sampleCompany } from './company/sampleCompany';

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </div>
        <div className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white truncate">
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

const defaultCompanyForm = {
  companyName: '',
  ruc: '',
  email: '',
  phone: '',
  address: '',
};

export function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [company, setCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState(defaultCompanyForm);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    getCompany(token)
      .then(({ company: c }) => {
        if (c) {
          setCompany(c);
          setCompanyForm({
            companyName: c.companyName || '',
            ruc: c.ruc || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
          });
        } else {
          const fallback = sampleCompany[0];
          setCompanyForm({
            companyName: fallback?.companyName ?? '',
            ruc: fallback?.ruc ?? '',
            email: fallback?.email ?? '',
            phone: fallback?.phone ?? '',
            address: fallback?.address ?? '',
          });
        }
      })
      .catch(() => {
        const fallback = sampleCompany[0];
        setCompanyForm({
          companyName: fallback?.companyName ?? '',
          ruc: fallback?.ruc ?? '',
          email: fallback?.email ?? '',
          phone: fallback?.phone ?? '',
          address: fallback?.address ?? '',
        });
      });
  }, [token]);

  const handleSaveUser = async () => {
    if (!token) return;
    setUserSaving(true);
    setUserMessage(null);
    try {
      await updateProfile(token, { name: userName.trim(), phone: userPhone.trim() });
      await refreshUser();
      setUserMessage({ type: 'success', text: 'Profile updated.' });
    } catch (e) {
      setUserMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setUserSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!token) return;
    setCompanySaving(true);
    setCompanyMessage(null);
    try {
      const { company: updated } = await updateCompany(token, {
        companyName: companyForm.companyName.trim(),
        ruc: companyForm.ruc.trim(),
        email: companyForm.email.trim(),
        phone: companyForm.phone.trim(),
        address: companyForm.address.trim(),
      });
      setCompany(updated);
      setCompanyMessage({ type: 'success', text: 'Company updated.' });
    } catch (e) {
      setCompanyMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setCompanySaving(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <PageHeader title="Profile" breadcrumb={[{ label: 'Profile', icon: UserIcon }]} />
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            No user data available. Please log in again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const initial = (user.name || user.email || 'U').trim()[0].toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" breadcrumb={[{ label: 'Profile', icon: UserIcon }]} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile summary */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-600/30 flex items-center justify-center text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
                {initial}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {user.name || 'No name'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium capitalize">
                <Shield className="w-3.5 h-3.5" />
                {user.role || 'User'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account details - editable */}
        <Card className="lg:col-span-2">
          <CardHeader title="Account details" />
          <CardContent className="pt-0 space-y-4">
            <DetailRow icon={Hash} label="User ID" value={user.id} />
            <DetailRow icon={Mail} label="Email" value={user.email} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Display name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <Input
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>
            </div>
            <DetailRow
              icon={Shield}
              label="Role"
              value={user.role ? String(user.role).replace(/_/g, ' ') : '—'}
            />
            {userMessage && (
              <p
                className={
                  userMessage.type === 'success'
                    ? 'text-sm text-emerald-600 dark:text-emerald-400'
                    : 'text-sm text-red-600 dark:text-red-400'
                }
              >
                {userMessage.text}
              </p>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={Save}
              onClick={handleSaveUser}
              disabled={userSaving}
              isLoading={userSaving}
            >
              Save changes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Role info card */}
      <Card>
        <CardHeader title="Role information" />
        <CardContent className="pt-0">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your role (
            <span className="font-medium capitalize">{user.role || 'user'}</span>) determines which
            areas of the admin panel you can access. Contact an administrator to change your role
            or permissions.
          </p>
        </CardContent>
      </Card>

      {/* Company info - editable */}
      <Card>
        <CardHeader title="Company" />
        <CardContent className="pt-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Company name
              </label>
              <Input
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                RUC
              </label>
              <Input
                value={companyForm.ruc}
                onChange={(e) => setCompanyForm((f) => ({ ...f, ruc: e.target.value }))}
                placeholder="RUC"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Company email
              </label>
              <Input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Company phone
              </label>
              <Input
                value={companyForm.phone}
                onChange={(e) => setCompanyForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Address
              </label>
              <Input
                value={companyForm.address}
                onChange={(e) => setCompanyForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Address"
              />
            </div>
          </div>
          {companyMessage && (
            <p
              className={
                companyMessage.type === 'success'
                  ? 'text-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-sm text-red-600 dark:text-red-400'
              }
            >
              {companyMessage.text}
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            leftIcon={Save}
            onClick={handleSaveCompany}
            disabled={companySaving}
            isLoading={companySaving}
          >
            Save company
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
