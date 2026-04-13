import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Plus, Save, SquarePen, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, CardContent, CardHeader, PageHeader } from '../../components/ui';
import {
  createPreDiagnosisRule,
  deletePreDiagnosisRule,
  getPreDiagnosisRulesAdmin,
  updatePreDiagnosisRule,
  type PreDiagnosisRule,
} from '../../api/preDiagnosis';

type FormState = Omit<PreDiagnosisRule, 'id'>;

const EMPTY_FORM: FormState = {
  device: '',
  symptom: '',
  probableIssue: '',
  estimateMin: 0,
  estimateMax: 0,
  etaHours: 0,
  state: 'active',
};

export function PreDiagnosisRulesPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<PreDiagnosisRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const editingRule = useMemo(
    () => (editingId ? rules.find((r) => r.id === editingId) ?? null : null),
    [editingId, rules]
  );
  const activeRulesCount = useMemo(
    () => rules.filter((rule) => rule.state === 'active').length,
    [rules]
  );

  const loadRules = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { rules: list } = await getPreDiagnosisRulesAdmin(token);
      setRules(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    if (!editingRule) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      device: editingRule.device,
      symptom: editingRule.symptom,
      probableIssue: editingRule.probableIssue,
      estimateMin: editingRule.estimateMin,
      estimateMax: editingRule.estimateMax,
      etaHours: editingRule.etaHours,
      state: editingRule.state,
    });
  }, [editingRule]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload: FormState = {
        device: form.device.trim().toLowerCase(),
        symptom: form.symptom.trim().toLowerCase(),
        probableIssue: form.probableIssue.trim(),
        estimateMin: Number(form.estimateMin),
        estimateMax: Number(form.estimateMax),
        etaHours: Number(form.etaHours),
        state: form.state,
      };
      if (editingId) {
        await updatePreDiagnosisRule(token, editingId, payload);
      } else {
        await createPreDiagnosisRule(token, payload);
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la regla');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    const confirmed = window.confirm('¿Eliminar esta regla?');
    if (!confirmed) return;
    setError(null);
    try {
      await deletePreDiagnosisRule(token, id);
      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la regla');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Reglas de pre-diagnóstico — Servicio técnico DIGITALSERVER"
          breadcrumb={[{ label: 'Taller', icon: Home }, { label: 'Pre-diagnóstico' }]}
        />
        <div className="flex gap-2 sm:ml-auto">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Reglas activas</p>
            <p className="text-base font-semibold text-slate-900 dark:text-white">{activeRulesCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Total de reglas</p>
            <p className="text-base font-semibold text-slate-900 dark:text-white">{rules.length}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader title={editingId ? 'Editar regla' : 'Nueva regla'} />
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestione las reglas de diagnóstico usadas en la página pública de pre-diagnóstico.
          </p>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Dispositivo
              </label>
              <input
                value={form.device}
                onChange={(e) => setForm((prev) => ({ ...prev, device: e.target.value }))}
                placeholder="p. ej. teléfono"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Síntoma
              </label>
              <input
                value={form.symptom}
                onChange={(e) => setForm((prev) => ({ ...prev, symptom: e.target.value }))}
                placeholder="p. ej. pantalla"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Problema probable
              </label>
              <input
                value={form.probableIssue}
                onChange={(e) => setForm((prev) => ({ ...prev, probableIssue: e.target.value }))}
                placeholder="Describa el problema probable"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Estimación mín.
              </label>
              <input
                type="number"
                min={0}
                value={form.estimateMin}
                onChange={(e) => setForm((prev) => ({ ...prev, estimateMin: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Estimación máx.
              </label>
              <input
                type="number"
                min={0}
                value={form.estimateMax}
                onChange={(e) => setForm((prev) => ({ ...prev, estimateMax: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tiempo estimado (h)
              </label>
              <input
                type="number"
                min={0}
                value={form.etaHours}
                onChange={(e) => setForm((prev) => ({ ...prev, etaHours: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Estado
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value as 'active' | 'inactive' }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="active">activo</option>
                <option value="inactive">inactivo</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
              <Button
                type="submit"
                disabled={saving}
                variant={editingId ? 'amber' : 'emerald'}
                leftIcon={editingId ? Save : Plus}
              >
                {saving ? 'Guardando…' : editingId ? 'Actualizar regla' : 'Crear regla'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div
          className="px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader title="Reglas configuradas" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/40">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Dispositivo
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Síntoma
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Problema
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Estimación
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Tiempo est.
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Estado
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={7}>
                    Cargando reglas…
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={7}>
                    No hay reglas configuradas.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{rule.device}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{rule.symptom}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{rule.probableIssue}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      ${rule.estimateMin} - ${rule.estimateMax}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{rule.etaHours}h</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          rule.state === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {rule.state === 'active' ? 'activo' : 'inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          leftIcon={SquarePen}
                          onClick={() => setEditingId(rule.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          leftIcon={Trash2}
                          onClick={() => onDelete(rule.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
