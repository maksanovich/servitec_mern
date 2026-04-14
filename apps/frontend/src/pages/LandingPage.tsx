import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProductsPublic } from '../api/products';
import { getOrdersShowcase } from '../api/orders';
import { getPreDiagnosisRulesPublic, type PreDiagnosisRule } from '../api/preDiagnosis';
import type { Product } from '../api/products';
import type { OrderShowcaseItem } from '../api/orders';
import noImageUrl from '../assets/images/noimage.png';
import { normalizeOrderPhotoListFromApi } from '../utils/orderPhotos';
import { OrderPhotoSlider } from '../components/OrderPhotoSlider';
import { buildBlogPostSlug } from '../utils/blogSlug';

import image1 from '../assets/images/slider/1.png';
import image2 from '../assets/images/slider/2.png';
import image3 from '../assets/images/slider/3.png';

const SLIDER_ITEMS = [
  {
    image: image1,
    title: 'Servicio de reparación profesional',
    subtitle: 'Técnicos expertos para todas sus necesidades de equipos',
  },
  {
    image: image2,
    title: 'Calidad en la que puede confiar',
    subtitle: 'Garantía integral y soporte posterior al servicio',
  },
  {
    image: image3,
    title: 'Rápido y confiable',
    subtitle: 'Consulte el estado de su orden en cualquier momento y lugar',
  },
];

function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDER_ITEMS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const item = SLIDER_ITEMS[index];

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-slate-800">
      <img
        key={index}
        src={item.image}
        alt=""
        className="block w-full h-auto max-w-full min-w-0 align-top"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-6 text-white md:p-8">
        <h2 className="text-2xl font-bold md:text-3xl mb-2">{item.title}</h2>
        <p className="text-lg text-white/90">{item.subtitle}</p>
      </div>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {SLIDER_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Ir a la diapositiva ${i + 1}`}
          />
        ))}
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
        <button
          onClick={() => setIndex((i) => (i - 1 + SLIDER_ITEMS.length) % SLIDER_ITEMS.length)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
          aria-label="Diapositiva anterior"
        >
          ‹
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % SLIDER_ITEMS.length)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
          aria-label="Diapositiva siguiente"
        >
          ›
        </button>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="py-12 md:py-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Sobre nosotros</h2>
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-600 leading-relaxed mb-4">
          <strong>Servitec</strong> ofrece servicio técnico profesional y gestión de garantías para
          su equipo. Nuestros técnicos experimentados realizan reparaciones con precisión y
          mantenemos la transparencia en todo el proceso.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Desde el ingreso hasta la entrega, le mantenemos informado. Use su código de seguimiento
          para ver el estado, fotos del antes y después y notas técnicas en cualquier momento.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Ofrecemos soluciones de reparación para distintos tipos de equipos. Su satisfacción y la
          durabilidad de su equipo son nuestras prioridades.
        </p>
      </div>
    </section>
  );
}

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductsPublic()
      .then((r) => setProducts(r.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Nuestros productos y servicios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-200 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Nuestros productos y servicios</h2>
      <div className="flex flex-wrap gap-3">
        {products.map((p) => (
          <span
            key={p.id}
            className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg font-medium"
          >
            {p.product}
          </span>
        ))}
      </div>
    </section>
  );
}

function OrderShowcaseSection() {
  const [orders, setOrders] = useState<OrderShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersShowcase(6)
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Trabajos realizados</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (orders.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Trabajos realizados</h2>
      <p className="text-slate-500 mb-6">
        Vea resultados de antes y después y notas técnicas de nuestras reparaciones finalizadas.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <Link
            key={order.code}
            to={`/blog/${encodeURIComponent(buildBlogPostSlug(order))}`}
            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow block text-left"
          >
            <div className="grid grid-cols-2 gap-0 border-b border-slate-100">
              <div className="p-2 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Antes</p>
                <OrderPhotoSlider
                  images={normalizeOrderPhotoListFromApi(order.photoBeforeRepair)}
                  emptySrc={noImageUrl}
                  alt="Antes de la reparación"
                  frameClassName="relative w-full aspect-square overflow-hidden rounded border-0 bg-white"
                />
              </div>
              <div className="p-2 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Después</p>
                <OrderPhotoSlider
                  images={normalizeOrderPhotoListFromApi(order.photoAfterRepair)}
                  emptySrc={noImageUrl}
                  alt="Después de la reparación"
                  frameClassName="relative w-full aspect-square overflow-hidden rounded border-0 bg-white"
                />
              </div>
            </div>
            <div className="p-4">
              <p className="font-mono text-sm font-semibold text-slate-900 mb-1">
                {order.brand} / {order.model}
              </p>
              <p className="text-xs text-slate-500 mb-3">{order.type}</p>
              <span className="text-sm text-[var(--color-accent)] font-medium">
                Ver historia completa →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PreDiagnosisPreviewSection() {
  const [rules, setRules] = useState<PreDiagnosisRule[]>([]);

  useEffect(() => {
    getPreDiagnosisRulesPublic()
      .then((r) => setRules(r.rules.slice(0, 6)))
      .catch(() => setRules([]));
  }, []);

  if (rules.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Pre-diagnóstico inteligente</h2>
      <p className="text-slate-500 mb-6">
        Estas reglas las gestiona nuestro equipo y se actualizan en tiempo real.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              {rule.device} / {rule.symptom}
            </p>
            <p className="font-medium text-slate-900">{rule.probableIssue}</p>
            <p className="text-sm text-slate-600 mt-2">
              ${rule.estimateMin} - ${rule.estimateMax} · {rule.etaHours}h
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Link
          to="/diagnosis"
          className="inline-block px-5 py-2.5 border border-emerald-200 text-emerald-700 font-semibold rounded-lg hover:border-emerald-300 transition-colors"
        >
          Abrir pre-diagnóstico inteligente
        </Link>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1120px]">
      <div className="mb-10">
        <HeroSlider />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight leading-tight mb-4 text-slate-900">
          Servicio técnico y garantía
        </h1>
        <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
          Reparación profesional y gestión de garantías para su equipo. Consulte el estado de su
          orden en cualquier momento.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/diagnosis"
            className="inline-block px-6 py-3 border border-emerald-200 text-emerald-700 font-semibold rounded-lg hover:border-emerald-300 transition-colors"
          >
            Pre-diagnóstico inteligente
          </Link>
          <Link
            to="/track"
            className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Seguir orden
          </Link>
          <Link
            to="/blog"
            className="inline-block px-6 py-3 border border-slate-200 text-slate-900 font-medium rounded-lg hover:border-slate-300 transition-colors"
          >
            Ver soluciones
          </Link>
        </div>
      </div>

      <AboutSection />
      <ProductsSection />
      <PreDiagnosisPreviewSection />
      <OrderShowcaseSection />
    </div>
  );
}
