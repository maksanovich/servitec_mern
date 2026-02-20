import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="text-center max-w-[640px] mx-auto">
      <h1 className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight leading-tight mb-4 text-slate-900">
        Technical Service & Warranty
      </h1>
      <p className="text-lg text-slate-500 mb-8 leading-relaxed">
        Professional repair and warranty management for your equipment. Track your order status anytime.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
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
  );
}
