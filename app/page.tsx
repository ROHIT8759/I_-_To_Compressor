import { Lock, ShieldCheck, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UploadWorkspace } from "@/components/upload/upload-workspace";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-hero-glow px-4 pb-16 pt-8 dark:bg-slate-950 md:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(42,157,143,0.16),_transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,21,33,0.65),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,117,98,0.24),_transparent_30%)]" />

      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <ThemeToggle />
      </div>

      <section className="mx-auto mt-6 max-w-4xl text-center">
        <p className="inline-flex items-center rounded-full border border-brand-200/80 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-soft dark:border-brand-700/70 dark:bg-slate-900/70 dark:text-brand-200">
          Premium Secure Compressor
        </p>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100 md:text-6xl">
          Compress Files Instantly Without Losing Quality
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
          Fast and secure cloud compression for files and folders. Upload once, choose your level, and download an optimized ZIP in seconds.
        </p>

        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/65 px-4 py-3 text-sm font-medium text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <Lock className="h-4 w-4 text-brand-600" />
            256-bit encryption
          </div>
          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/65 px-4 py-3 text-sm font-medium text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <Trash2 className="h-4 w-4 text-brand-600" />
            Files auto-deleted
          </div>
          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/65 px-4 py-3 text-sm font-medium text-slate-700 shadow-soft dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            Cloud secure storage
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-6xl">
        <UploadWorkspace />
      </div>
    </main>
  );
}
