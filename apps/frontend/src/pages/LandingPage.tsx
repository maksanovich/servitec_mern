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

const SLIDER_ITEMS = [
  {
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200',
    title: 'Professional Repair Services',
    subtitle: 'Expert technicians for all your equipment needs',
  },
  {
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200',
    title: 'Quality You Can Trust',
    subtitle: 'Comprehensive warranty and after-service support',
  },
  {
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200',
    title: 'Fast & Reliable',
    subtitle: 'Track your order status anytime, anywhere',
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

  return (
    <section className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[240px] max-h-[420px] bg-slate-800">
      {SLIDER_ITEMS.map((item, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-20">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{item.title}</h2>
            <p className="text-lg text-white/90">{item.subtitle}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {SLIDER_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
        <button
          onClick={() => setIndex((i) => (i - 1 + SLIDER_ITEMS.length) % SLIDER_ITEMS.length)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % SLIDER_ITEMS.length)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
          aria-label="Next slide"
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
      <h2 className="text-2xl font-bold text-slate-900 mb-6">About Us</h2>
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-600 leading-relaxed mb-4">
          <strong>Servitec</strong> provides professional technical service and warranty management
          for your equipment. Our experienced technicians handle repairs with precision, and we
          maintain full transparency throughout the process.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          From intake to delivery, we keep you informed. Use your tracking code to check status,
          view before and after photos, and read technical notes at any time.
        </p>
        <p className="text-slate-600 leading-relaxed">
          We offer a wide range of repair solutions for various equipment types. Your satisfaction
          and equipment longevity are our priorities.
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
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Products & Services</h2>
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
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Products & Services</h2>
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
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Completed Work</h2>
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
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Completed Work</h2>
      <p className="text-slate-500 mb-6">
        See before & after results and technical notes from our finished repairs.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <Link
            key={order.code}
            to={`/blog/${encodeURIComponent(order.code)}`}
            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow block text-left"
          >
            <div className="grid grid-cols-2 gap-0 border-b border-slate-100">
              <div className="p-2 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Before</p>
                <OrderPhotoSlider
                  images={normalizeOrderPhotoListFromApi(order.photoBeforeRepair)}
                  emptySrc={noImageUrl}
                  alt="Before repair"
                  imageClassName="w-full aspect-square object-contain rounded border-0 bg-white max-h-none"
                />
              </div>
              <div className="p-2 bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">After</p>
                <OrderPhotoSlider
                  images={normalizeOrderPhotoListFromApi(order.photoAfterRepair)}
                  emptySrc={noImageUrl}
                  alt="After repair"
                  imageClassName="w-full aspect-square object-contain rounded border-0 bg-white max-h-none"
                />
              </div>
            </div>
            <div className="p-4">
              <p className="font-mono text-sm font-semibold text-slate-900 mb-1">
                {order.brand} / {order.model}
              </p>
              <p className="text-xs text-slate-500 mb-3">{order.type}</p>
              <span className="text-sm text-[var(--color-accent)] font-medium">
                View full story →
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
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Smart Pre-Diagnosis</h2>
      <p className="text-slate-500 mb-6">
        These rules are managed by our admin team and updated in real time.
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
          Open Smart Pre-Diagnosis
        </Link>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="max-w-[1120px] mx-auto">
      <div className="mb-10">
        <HeroSlider />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight leading-tight mb-4 text-slate-900">
          Technical Service & Warranty
        </h1>
        <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
          Professional repair and warranty management for your equipment. Track your order status
          anytime.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/diagnosis"
            className="inline-block px-6 py-3 border border-emerald-200 text-emerald-700 font-semibold rounded-lg hover:border-emerald-300 transition-colors"
          >
            Smart Pre-Diagnosis
          </Link>
          <Link
            to="/track"
            className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white font-semibold rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Track Order
          </Link>
          <Link
            to="/blog"
            className="inline-block px-6 py-3 border border-slate-200 text-slate-900 font-medium rounded-lg hover:border-slate-300 transition-colors"
          >
            Browse Solutions
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
