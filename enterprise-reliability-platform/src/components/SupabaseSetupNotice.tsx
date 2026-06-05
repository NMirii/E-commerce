import Link from "next/link";

export default function SupabaseSetupNotice() {
  return (
    <div className="container-app section-padding flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full surface-elevated p-8 text-center anim-fade-up">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mx-auto mb-5">
          ⚙
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Supabase quraşdırılmayıb</h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-xs">.env.local</code>{" "}
          faylında URL və API açarını doldurun, sonra{" "}
          <code className="text-xs bg-slate-100 px-1 rounded">schema.sql</code> işlədin.
        </p>
        <ol className="text-left text-sm space-y-2 mb-6 text-slate-600">
          <li>1. supabase.com/dashboard → layihə</li>
          <li>2. Settings → API → URL + Publishable key</li>
          <li>3. SQL Editor → schema.sql → Run</li>
          <li>4. npm run dev (yenidən)</li>
        </ol>
        <Link
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          Supabase aç
        </Link>
      </div>
    </div>
  );
}
