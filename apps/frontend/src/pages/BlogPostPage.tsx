import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { trackOrderByCode } from '../api/orders';
import type { OrderTrackPublic } from '../api/orders';
import { BlogShowcaseArticle } from '../components/BlogShowcaseArticle';

export function BlogPostPage() {
  const { code } = useParams<{ code: string }>();
  const [order, setOrder] = useState<OrderTrackPublic | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setOrder(null);
      return;
    }
    let cancelled = false;
    setOrder(undefined);
    setError(null);
    trackOrderByCode(code)
      .then((r) => {
        if (!cancelled) setOrder(r?.order ?? null);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message || 'Error al cargar');
          setOrder(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (order === undefined) {
    return (
      <div className="max-w-[720px]">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al blog
        </Link>
        <div className="h-80 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[720px]">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al blog
        </Link>
        <p className="text-slate-600 py-8">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-[720px]">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al blog
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight mb-2 text-slate-900">No encontrado</h1>
        <p className="text-slate-500 mb-6">Esta historia de reparación no está disponible o ya no se muestra.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[720px]">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al blog
      </Link>
      <BlogShowcaseArticle order={order} />
    </div>
  );
}
