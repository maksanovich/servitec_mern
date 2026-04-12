import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  evaluatePreDiagnosis,
  getPreDiagnosisRulesPublic,
  type PreDiagnosisDevice,
  type PreDiagnosisResult,
  type PreDiagnosisRule,
  type PreDiagnosisSymptom,
} from '../api/preDiagnosis';

export function PreDiagnosisPage() {
  const [rules, setRules] = useState<PreDiagnosisRule[]>([]);
  const [device, setDevice] = useState<PreDiagnosisDevice>('');
  const [symptom, setSymptom] = useState<PreDiagnosisSymptom>('');
  const [rulesLoading, setRulesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreDiagnosisResult | null>(null);

  useEffect(() => {
    getPreDiagnosisRulesPublic()
      .then(({ rules: list }) => {
        setRules(list);
        const firstDevice = list[0]?.device ?? '';
        setDevice(firstDevice);
        const firstSymptom = list.find((r) => r.device === firstDevice)?.symptom ?? '';
        setSymptom(firstSymptom);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar las reglas de diagnóstico');
      })
      .finally(() => setRulesLoading(false));
  }, []);

  const deviceOptions = useMemo(
    () => Array.from(new Set(rules.map((r) => r.device))),
    [rules]
  );

  const symptomOptions = useMemo(
    () => Array.from(new Set(rules.filter((r) => r.device === device).map((r) => r.symptom))),
    [rules, device]
  );

  useEffect(() => {
    if (!deviceOptions.includes(device)) {
      setDevice(deviceOptions[0] ?? '');
      return;
    }
    if (!symptomOptions.includes(symptom)) {
      setSymptom(symptomOptions[0] ?? '');
    }
  }, [device, symptom, deviceOptions, symptomOptions]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!device || !symptom) {
      setError('Seleccione un equipo y un síntoma');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await evaluatePreDiagnosis({ device, symptom });
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[1.9rem] font-bold tracking-tight mb-2 text-slate-900">Pre-diagnóstico inteligente</h1>
      <p className="text-base text-slate-500 mb-6">
        Seleccione su equipo y el síntoma para obtener una estimación de reparación antes de crear un pedido.
      </p>

      <form onSubmit={onSubmit} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-4">
        {!rulesLoading && rules.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Aún no hay reglas de diagnóstico configuradas. Contacte a soporte o inténtelo más tarde.
          </p>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Equipo</label>
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value as PreDiagnosisDevice)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 bg-white"
          >
            {deviceOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Síntoma principal</label>
          <select
            value={symptom}
            onChange={(e) => setSymptom(e.target.value as PreDiagnosisSymptom)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 bg-white"
          >
            {symptomOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || rulesLoading || !device || !symptom}
          className="px-6 py-3 bg-[var(--color-accent)] text-white border-none rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-70"
        >
          {rulesLoading ? 'Cargando reglas...' : loading ? 'Analizando...' : 'Obtener estimación'}
        </button>
      </form>

      {error && (
        <p className="mt-5 text-red-600" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 border border-emerald-200 rounded-xl p-6 bg-emerald-50">
          <p className="text-xs uppercase tracking-wide font-semibold text-emerald-700 mb-1">Diagnóstico estimado</p>
          <p className="text-lg font-semibold text-emerald-900 mb-4">{result.probableIssue}</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white border border-emerald-100 p-3">
              <p className="text-emerald-700 font-semibold">Price Range</p>
              <p className="text-slate-900">${result.estimateMin} - ${result.estimateMax}</p>
            </div>
            <div className="rounded-lg bg-white border border-emerald-100 p-3">
              <p className="text-emerald-700 font-semibold">Tiempo estimado</p>
              <p className="text-slate-900">{result.etaHours} h</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
