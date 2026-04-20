import { useEffect, useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import type { TableColumn } from '../../../components/datatable';
import { Loader } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { getSpareServerProductImage, type SpareServerRow } from '../../../api/spareServer';
import {
  formatSpareTariffPriceListPlain,
  spareAllTariffPrices,
  spareTariffPriceListSortKey,
} from '../../../utils/spareTariffPrice';

export function formatPrice(n: number | null) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch {
    return '—';
  }
}

/**
 * RDT only runs `onRowClicked` when the click target has `data-tag="allowRowEvents"`.
 * Custom cells nest spans/images; without this wrapper, `e.target` is a child and the row handler never runs.
 */
function RowClickWrap({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div data-tag="allowRowEvents" className={`min-w-0 w-full ${className}`.trim()}>
      <div className="pointer-events-none min-w-0">{children}</div>
    </div>
  );
}

const thumbBox =
  'flex items-center justify-center w-12 h-12 shrink-0 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80';

const modalImageBox =
  'flex items-center justify-center w-full min-h-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 p-4';

export function SparePartThumbnail({
  productosid,
  variant = 'table',
}: {
  productosid: number;
  variant?: 'table' | 'modal';
}) {
  const { token } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  const [src, setSrc] = useState<string | null>(null);
  const validId = Number.isFinite(productosid) && productosid > 0;

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setSrc(null);
    (async () => {
      if (!token || !validId) {
        if (!cancelled) setPhase('empty');
        return;
      }
      try {
        const url = await getSpareServerProductImage(token, productosid);
        if (cancelled) return;
        if (url) {
          setSrc(url);
          setPhase('ok');
        } else {
          setPhase('empty');
        }
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, productosid, validId]);

  const boxClass = variant === 'modal' ? modalImageBox : thumbBox;
  const imgClass =
    variant === 'modal'
      ? 'max-w-full max-h-[220px] w-auto h-auto object-contain'
      : 'max-w-[44px] max-h-[44px] w-auto h-auto object-contain';

  if (phase === 'loading') {
    return (
      <div className={boxClass} title="Cargando imagen">
        <Loader size="sm" />
      </div>
    );
  }
  if (phase === 'ok' && src) {
    return (
      <div className={boxClass}>
        <img
          src={src}
          alt=""
          className={imgClass}
          onError={() => {
            setSrc(null);
            setPhase('error');
          }}
        />
      </div>
    );
  }
  return (
    <div
      className={`${boxClass} text-slate-400`}
      title={phase === 'error' ? 'No se pudo cargar la imagen' : 'Sin imagen en Perseo'}
    >
      <ImageOff className={variant === 'modal' ? 'w-10 h-10 opacity-60' : 'w-5 h-5 opacity-60'} aria-hidden />
    </div>
  );
}

const sparePartsColumnsBase: TableColumn<SpareServerRow>[] = [
  {
    id: 'image',
    name: 'Imagen',
    selector: () => '',
    sortable: false,
    width: '76px',
    center: true,
    cell: (row) => (
      <RowClickWrap className="flex justify-center py-0.5">
        <SparePartThumbnail productosid={row.productosid} />
      </RowClickWrap>
    ),
  },
  {
    id: 'productocodigo',
    name: 'Código',
    selector: (row) => row.productocodigo,
    sortable: true,
    width: '120px',
    cell: (row) => (
      <RowClickWrap>
        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{row.productocodigo || '—'}</span>
      </RowClickWrap>
    ),
  },
  {
    id: 'productosid',
    name: 'ID producto',
    selector: (row) => row.productosid,
    sortable: true,
    width: '104px',
    right: true,
    cell: (row) => (
      <RowClickWrap className="flex justify-end">
        <span className="tabular-nums text-slate-700 dark:text-slate-300">{row.productosid}</span>
      </RowClickWrap>
    ),
  },
  {
    id: 'description',
    name: 'Descripción',
    selector: (row) => row.description,
    sortable: true,
    minWidth: '220px',
    cell: (row) => (
      <RowClickWrap>
        <span className="text-slate-700 dark:text-slate-300 line-clamp-2 text-left" title={row.description}>
          {row.description || '—'}
        </span>
      </RowClickWrap>
    ),
  },
  {
    id: 'tarifasPrecios',
    name: 'Precios por tarifa',
    selector: (row) => formatSpareTariffPriceListPlain(row),
    sortable: true,
    sortFunction: (a, b) => spareTariffPriceListSortKey(a) - spareTariffPriceListSortKey(b),
    minWidth: '200px',
    right: true,
    cell: (row) => {
      const list = spareAllTariffPrices(row);
      if (list.length === 0) {
        return (
          <RowClickWrap className="flex justify-end">
            <span className="tabular-nums text-slate-500">—</span>
          </RowClickWrap>
        );
      }
      return (
        <RowClickWrap className="flex justify-end">
          <div className="flex flex-row flex-wrap justify-end gap-x-2 gap-y-0.5 py-0.5 text-xs tabular-nums text-slate-700 dark:text-slate-300">
            {list.map((e, i) => (
              <span
                key={`${e.tarifasid ?? 'x'}-${i}`}
                title={e.tarifasid != null ? `Tarifa ${e.tarifasid}` : 'Tarifa'}
              >
                {e.tarifasid != null ? `T${e.tarifasid}` : 'Tarifa'}: {formatPrice(e.base)}
              </span>
            ))}
          </div>
        </RowClickWrap>
      );
    },
  },
  {
    id: 'stock',
    name: 'Stock',
    selector: (row) => row.stock ?? -Infinity,
    sortable: true,
    width: '120px',
    right: true,
    cell: (row) => (
      <RowClickWrap className="flex justify-end">
        <span className="tabular-nums text-slate-700 dark:text-slate-300">{row.stock != null ? String(row.stock) : '—'}</span>
      </RowClickWrap>
    ),
  },
  // {
  //   id: 'updatedAt',
  //   name: 'Synced',
  //   selector: (row) => row.updatedAt ?? '',
  //   sortable: true,
  //   width: '168px',
  //   cell: (row) => (
  //     <span className="text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">{formatDate(row.updatedAt)}</span>
  //   ),
  // },
];

/** Default columns: all tariff prices per row. */
export const sparePartsColumns: TableColumn<SpareServerRow>[] = sparePartsColumnsBase;

/**
 * When `tarifaId` is set, shows a single price column for that tariff and you should filter rows with
 * `spareRowHasTarifaId` from `spareTariffPrice`; otherwise same as {@link sparePartsColumns}.
 */
export function getSparePartsColumns(tarifaId: number | null): TableColumn<SpareServerRow>[] {
  const tid = tarifaId != null && tarifaId > 0 ? tarifaId : null;
  if (tid == null) return sparePartsColumnsBase;

  return sparePartsColumnsBase.map((col) => {
    if (col.id !== 'tarifasPrecios') return col;
    return {
      id: 'precioTarifa',
      name: `Precio (tarifa ${tid})`,
      selector: (row: SpareServerRow) => {
        const hit = spareAllTariffPrices(row).find((e) => e.tarifasid === tid);
        return hit?.base ?? -Infinity;
      },
      sortable: true,
      sortFunction: (a, b) => {
        const pa = spareAllTariffPrices(a).find((e) => e.tarifasid === tid)?.base ?? -Infinity;
        const pb = spareAllTariffPrices(b).find((e) => e.tarifasid === tid)?.base ?? -Infinity;
        return pa - pb;
      },
      minWidth: '140px',
      right: true,
      cell: (row: SpareServerRow) => {
        const hit = spareAllTariffPrices(row).find((e) => e.tarifasid === tid);
        return (
          <RowClickWrap className="flex justify-end">
            <span className="tabular-nums text-slate-700 dark:text-slate-300">{formatPrice(hit?.base ?? null)}</span>
          </RowClickWrap>
        );
      },
    } as TableColumn<SpareServerRow>;
  });
}
