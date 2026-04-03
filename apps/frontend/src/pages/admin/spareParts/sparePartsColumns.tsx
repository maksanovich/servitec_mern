import { useEffect, useState } from 'react';
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
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
      <div className={boxClass} title="Loading image">
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
      title={phase === 'error' ? 'Image failed to load' : 'No image in Perseo'}
    >
      <ImageOff className={variant === 'modal' ? 'w-10 h-10 opacity-60' : 'w-5 h-5 opacity-60'} aria-hidden />
    </div>
  );
}

export const sparePartsColumns: TableColumn<SpareServerRow>[] = [
  {
    id: 'image',
    name: 'Image',
    selector: () => '',
    sortable: false,
    width: '76px',
    center: true,
    cell: (row) => (
      <div className="flex justify-center py-0.5">
        <SparePartThumbnail productosid={row.productosid} />
      </div>
    ),
  },
  {
    id: 'productocodigo',
    name: 'Code',
    selector: (row) => row.productocodigo,
    sortable: true,
    width: '120px',
    cell: (row) => (
      <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{row.productocodigo || '—'}</span>
    ),
  },
  {
    id: 'productosid',
    name: 'Product ID',
    selector: (row) => row.productosid,
    sortable: true,
    width: '104px',
    right: true,
    cell: (row) => (
      <span className="tabular-nums text-slate-700 dark:text-slate-300">{row.productosid}</span>
    ),
  },
  {
    id: 'description',
    name: 'Description',
    selector: (row) => row.description,
    sortable: true,
    minWidth: '220px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300 line-clamp-2 text-left" title={row.description}>
        {row.description || '—'}
      </span>
    ),
  },
  {
    id: 'tarifasPrecios',
    name: 'Tariff prices',
    selector: (row) => formatSpareTariffPriceListPlain(row),
    sortable: true,
    sortFunction: (a, b) => spareTariffPriceListSortKey(a) - spareTariffPriceListSortKey(b),
    minWidth: '200px',
    right: true,
    cell: (row) => {
      const list = spareAllTariffPrices(row);
      if (list.length === 0) {
        return <span className="tabular-nums text-slate-500">—</span>;
      }
      return (
        <div className="flex flex-row flex-wrap justify-end gap-x-2 gap-y-0.5 py-0.5 text-xs tabular-nums text-slate-700 dark:text-slate-300">
          {list.map((e, i) => (
            <span
              key={`${e.tarifasid ?? 'x'}-${i}`}
              title={e.tarifasid != null ? `Tariff id ${e.tarifasid}` : 'Tariff'}
            >
              {e.tarifasid != null ? `T${e.tarifasid}` : 'Tariff'}: {formatPrice(e.base)}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    id: 'stock',
    name: 'Stock',
    selector: (row) => row.stock ?? -Infinity,
    sortable: true,
    width: '88px',
    right: true,
    cell: (row) => (
      <span className="tabular-nums text-slate-700 dark:text-slate-300">{row.stock != null ? String(row.stock) : '—'}</span>
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
