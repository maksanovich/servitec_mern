import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, Card, Button, Select, Loader, Modal, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { getOrderProgressStagesPublic, type OrderProgressStage } from '../../api/orderProgressStages';
import type { OrderWorkflow } from '../../api/orders';
import {
  listOrderStageEmailTemplates,
  previewOrderStageEmailTemplate,
  upsertOrderStageEmailTemplate,
  type OrderEmailPlaceholder,
  type OrderStageEmailTemplateRow,
} from '../../api/orderStageEmailTemplates';

const WORKFLOW_OPTIONS: Array<{ value: OrderWorkflow; label: string }> = [
  { value: 'standard', label: 'Reparación estándar' },
  { value: 'warranty', label: 'Garantía' },
];

export function MailConfigurationPage() {
  const { token } = useAuth();
  const [workflow, setWorkflow] = useState<OrderWorkflow>('standard');
  const [stages, setStages] = useState<OrderProgressStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [placeholders, setPlaceholders] = useState<OrderEmailPlaceholder[]>([]);
  const [templateRows, setTemplateRows] = useState<OrderStageEmailTemplateRow[]>([]);
  const [stageKey, setStageKey] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const templateByKey = useMemo(() => {
    const m = new Map<string, OrderStageEmailTemplateRow>();
    for (const t of templateRows) {
      m.set(t.stageKey, t);
    }
    return m;
  }, [templateRows]);

  const fetchStages = useCallback(async () => {
    if (!token) return;
    setStagesLoading(true);
    try {
      const { stages: list } = await getOrderProgressStagesPublic(workflow);
      setStages(list);
    } catch {
      setStages([]);
    } finally {
      setStagesLoading(false);
    }
  }, [token, workflow]);

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    setTemplatesLoading(true);
    try {
      const data = await listOrderStageEmailTemplates(token);
      setPlaceholders(data.placeholders ?? []);
      setTemplateRows(data.templates ?? []);
    } catch {
      setPlaceholders([]);
      setTemplateRows([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (!stages.length) {
      setStageKey('');
      return;
    }
    setStageKey((prev) => {
      if (prev && stages.some((s) => s.key === prev)) return prev;
      return stages[0].key;
    });
  }, [stages]);

  useEffect(() => {
    if (!stageKey) {
      setSubject('');
      setBody('');
      return;
    }
    const row = templateByKey.get(stageKey);
    setSubject(row?.subjectTemplate ?? '');
    setBody(row?.bodyTemplate ?? '');
  }, [stageKey, templateByKey]);

  const stageOptions = useMemo(
    () => stages.map((s) => ({ value: s.key, label: `${s.label} (${s.key})` })),
    [stages]
  );

  const insertTag = (key: string) => {
    const tokenStr = `{${key}}`;
    setBody((prev) => (prev ? `${prev}\n${tokenStr}` : tokenStr));
  };

  const handleSave = async () => {
    if (!token || !stageKey) return;
    setSaving(true);
    try {
      const { template } = await upsertOrderStageEmailTemplate(token, stageKey, {
        subjectTemplate: subject,
        bodyTemplate: body,
      });
      setTemplateRows((rows) => {
        const next = rows.filter((r) => r.stageKey !== template.stageKey);
        next.push(template);
        return next.sort((a, b) => a.stageKey.localeCompare(b.stageKey));
      });
      toast.success('Plantilla guardada');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!token || !stageKey) return;
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const { subject: s, text } = await previewOrderStageEmailTemplate(token, {
        stageKey,
        subjectTemplate: subject,
        bodyTemplate: body,
      });
      setPreviewSubject(s);
      setPreviewText(text);
    } catch (e) {
      setPreviewSubject('');
      setPreviewText((e as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const loading = stagesLoading || templatesLoading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Configuración de correo"
        breadcrumb={[{ label: 'Sistema', icon: Home }, { label: 'Correo' }]}
      />

      <Card className="p-2">
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400" aria-hidden />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Personalice el correo al cliente cuando un pedido entra en cada etapa. Use marcadores como{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                {'{customer_name}'}
              </code>
              .
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Flujo
                  </label>
                  <Select
                    value={workflow}
                    onChange={(e) => setWorkflow(e.target.value as OrderWorkflow)}
                    options={WORKFLOW_OPTIONS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Etapa de reparación
                  </label>
                  <Select
                    value={stageKey}
                    onChange={(e) => setStageKey(e.target.value)}
                    options={stageOptions}
                    placeholder="Seleccionar etapa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Asunto (opcional — vacío para el predeterminado)
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="p. ej. Actualización de su pedido {order_number}"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Cuerpo del mensaje (opcional — vacío para el predeterminado)
                </label>
                <textarea
                  rows={12}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Hola {customer_name},\n\nSu pedido {order_number} está ahora en la etapa: {stage_label}.\n\nSeguimiento: {tracking_code}`}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Insertar marcador</p>
                <div className="flex flex-wrap gap-2">
                  {placeholders.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => insertTag(p.key)}
                      title={p.description}
                      className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    >
                      {`{${p.key}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={handlePreview} disabled={!stageKey}>
                  Vista previa
                </Button>
                <Button type="button" onClick={handleSave} disabled={!stageKey || saving}>
                  {saving ? 'Guardando…' : 'Guardar plantilla'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Vista previa del correo">
        <div className="space-y-3 max-w-lg">
          {previewLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Asunto</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{previewSubject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cuerpo</p>
                <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm font-sans bg-slate-50 dark:bg-slate-900/80 rounded-lg p-3 border border-slate-200 dark:border-slate-600 max-h-80 overflow-auto">
                  {previewText}
                </pre>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
