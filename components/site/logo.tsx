/** MeuPerfil mark: a profile silhouette inside a rounded square, plus the wordmark. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <circle cx="16" cy="12.5" r="4.6" className="fill-coral" />
      <path d="M7.5 25.5c1.6-4.4 4.8-6.6 8.5-6.6s6.9 2.2 8.5 6.6" className="fill-none stroke-paper" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-heading text-[1.35rem] font-bold tracking-tight text-ink">
        meuperfil<span className="text-coral">.me</span>
      </span>
    </span>
  );
}
