export type ProfileTheme =
  | "MODERN_DARK"
  | "NEON_CYAN"
  | "AURORA_PURPLE"
  | "MINIMAL_LIGHT"
  | "SUNSET_ORANGE"
  | "EMERALD_CLEAN"
  | "MIDNIGHT_VELVET"
  | "OCEAN_GRADIENT";

export interface ThemeConfig {
  id: ProfileTheme;
  name: string;
  description: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  classes: {
    container: string;
    background: string;
    avatarBorder: string;
    displayName: string;
    bio: string;
    handleBadge: string;
    linkCard: string;
    linkCardHover: string;
    linkTitle: string;
    linkDescription: string;
    divider: string;
    socialIconBg: string;
    socialIconText: string;
    footerText: string;
  };
}

export const THEMES: Record<ProfileTheme, ThemeConfig> = {
  MODERN_DARK: {
    id: "MODERN_DARK",
    name: "Modern Dark",
    description: "Elegante e minimalista com acentos índigo e glassmorphism suave",
    previewBg: "bg-zinc-950",
    previewCard: "bg-zinc-900 border-zinc-800",
    previewAccent: "bg-indigo-500",
    classes: {
      container: "text-zinc-100",
      background: "bg-[#09090b]",
      avatarBorder: "border-indigo-500/40 ring-4 ring-indigo-500/10",
      displayName: "text-white font-bold tracking-tight",
      bio: "text-zinc-400",
      handleBadge: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
      linkCard: "bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-100 shadow-lg shadow-black/20 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-white font-semibold",
      linkDescription: "text-zinc-400 text-xs",
      divider: "border-white/10 text-zinc-400",
      socialIconBg: "bg-zinc-900/80 border border-white/10 hover:border-indigo-500/50 hover:bg-zinc-800",
      socialIconText: "text-zinc-300 hover:text-white",
      footerText: "text-zinc-500",
    },
  },
  NEON_CYAN: {
    id: "NEON_CYAN",
    name: "Neon Cyan",
    description: "Cyberpunk moderno com bordas ciano brilhantes e alto contraste",
    previewBg: "bg-black",
    previewCard: "bg-zinc-950 border-cyan-500/40",
    previewAccent: "bg-cyan-400",
    classes: {
      container: "text-cyan-50",
      background: "bg-[#050811]",
      avatarBorder: "border-cyan-400 ring-4 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]",
      displayName: "text-white font-black tracking-tight",
      bio: "text-cyan-100/70",
      handleBadge: "bg-cyan-500/10 text-cyan-300 border border-cyan-400/30",
      linkCard: "bg-zinc-950/90 backdrop-blur-md border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-white font-bold",
      linkDescription: "text-cyan-200/60 text-xs",
      divider: "border-cyan-500/20 text-cyan-400",
      socialIconBg: "bg-zinc-950/80 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40",
      socialIconText: "text-cyan-300 hover:text-cyan-100",
      footerText: "text-cyan-500/50",
    },
  },
  AURORA_PURPLE: {
    id: "AURORA_PURPLE",
    name: "Aurora Purple",
    description: "Gradiente exuberante com tons de violeta, fúcsia e efeito cósmico",
    previewBg: "bg-slate-950",
    previewCard: "bg-purple-950/40 border-purple-500/30",
    previewAccent: "bg-purple-500",
    classes: {
      container: "text-purple-50",
      background: "bg-gradient-to-b from-[#130722] via-[#0d0718] to-[#07030e]",
      avatarBorder: "border-purple-400/80 ring-4 ring-fuchsia-500/20 shadow-[0_0_25px_rgba(168,85,247,0.3)]",
      displayName: "text-white font-bold tracking-tight",
      bio: "text-purple-200/80",
      handleBadge: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
      linkCard: "bg-purple-950/40 backdrop-blur-xl border border-purple-500/25 text-white shadow-xl shadow-purple-950/50 hover:border-fuchsia-400 hover:bg-purple-900/40 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-white font-semibold",
      linkDescription: "text-purple-300/70 text-xs",
      divider: "border-purple-500/20 text-purple-300",
      socialIconBg: "bg-purple-950/50 border border-purple-500/30 hover:border-fuchsia-400 hover:bg-purple-900/50",
      socialIconText: "text-purple-200 hover:text-white",
      footerText: "text-purple-400/50",
    },
  },
  MINIMAL_LIGHT: {
    id: "MINIMAL_LIGHT",
    name: "Minimal Light",
    description: "Estilo nórdico editorial limpo, claro e sofisticado",
    previewBg: "bg-zinc-100",
    previewCard: "bg-white border-zinc-200",
    previewAccent: "bg-zinc-900",
    classes: {
      container: "text-zinc-900",
      background: "bg-[#f8fafc]",
      avatarBorder: "border-zinc-300 ring-4 ring-zinc-200/80 shadow-md",
      displayName: "text-zinc-950 font-bold tracking-tight",
      bio: "text-zinc-600",
      handleBadge: "bg-zinc-200/70 text-zinc-800 border border-zinc-300",
      linkCard: "bg-white border border-zinc-200/90 text-zinc-900 shadow-sm hover:shadow-md hover:border-zinc-400 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-zinc-950 font-semibold",
      linkDescription: "text-zinc-500 text-xs",
      divider: "border-zinc-200 text-zinc-500",
      socialIconBg: "bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 shadow-sm",
      socialIconText: "text-zinc-700 hover:text-zinc-950",
      footerText: "text-zinc-400",
    },
  },
  SUNSET_ORANGE: {
    id: "SUNSET_ORANGE",
    name: "Sunset Orange",
    description: "Caloroso gradiente crepuscular com destaques âmbar e dourados",
    previewBg: "bg-stone-950",
    previewCard: "bg-orange-950/40 border-orange-500/30",
    previewAccent: "bg-amber-500",
    classes: {
      container: "text-amber-50",
      background: "bg-gradient-to-b from-[#1c0d05] via-[#120703] to-[#0a0402]",
      avatarBorder: "border-amber-400 ring-4 ring-orange-500/20 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      displayName: "text-white font-bold tracking-tight",
      bio: "text-amber-200/75",
      handleBadge: "bg-orange-500/15 text-amber-300 border border-orange-500/30",
      linkCard: "bg-orange-950/35 backdrop-blur-xl border border-orange-500/25 text-white shadow-xl shadow-black/40 hover:border-amber-400 hover:bg-orange-900/40 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-amber-50 font-semibold",
      linkDescription: "text-amber-200/60 text-xs",
      divider: "border-orange-500/20 text-amber-300",
      socialIconBg: "bg-orange-950/40 border border-orange-500/30 hover:border-amber-400 hover:bg-orange-900/50",
      socialIconText: "text-amber-200 hover:text-white",
      footerText: "text-orange-400/50",
    },
  },
  EMERALD_CLEAN: {
    id: "EMERALD_CLEAN",
    name: "Emerald Luxury",
    description: "Verde esmeralda profundo de luxo com detalhes em menta",
    previewBg: "bg-zinc-950",
    previewCard: "bg-emerald-950/40 border-emerald-500/30",
    previewAccent: "bg-emerald-400",
    classes: {
      container: "text-emerald-50",
      background: "bg-gradient-to-b from-[#041910] via-[#020d08] to-[#010704]",
      avatarBorder: "border-emerald-400 ring-4 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      displayName: "text-white font-bold tracking-tight",
      bio: "text-emerald-200/75",
      handleBadge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      linkCard: "bg-emerald-950/35 backdrop-blur-xl border border-emerald-500/25 text-white shadow-xl shadow-black/40 hover:border-emerald-400 hover:bg-emerald-900/40 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-emerald-50 font-semibold",
      linkDescription: "text-emerald-200/60 text-xs",
      divider: "border-emerald-500/20 text-emerald-300",
      socialIconBg: "bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-900/50",
      socialIconText: "text-emerald-200 hover:text-white",
      footerText: "text-emerald-500/50",
    },
  },
  MIDNIGHT_VELVET: {
    id: "MIDNIGHT_VELVET",
    name: "Midnight Velvet",
    description: "Azul marinho imperial com bordas douradas e elegância premium",
    previewBg: "bg-slate-950",
    previewCard: "bg-blue-950/40 border-amber-400/40",
    previewAccent: "bg-amber-400",
    classes: {
      container: "text-amber-50",
      background: "bg-[#070b18]",
      avatarBorder: "border-amber-400/70 ring-4 ring-amber-400/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]",
      displayName: "text-white font-serif font-bold tracking-tight",
      bio: "text-slate-300",
      handleBadge: "bg-amber-400/10 text-amber-300 border border-amber-400/30",
      linkCard: "bg-slate-900/80 backdrop-blur-md border border-amber-400/25 text-white shadow-lg hover:border-amber-400/60 hover:bg-slate-900 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-white font-medium",
      linkDescription: "text-slate-400 text-xs",
      divider: "border-amber-400/20 text-amber-300/80",
      socialIconBg: "bg-slate-900/80 border border-amber-400/25 hover:border-amber-400 hover:bg-slate-800",
      socialIconText: "text-amber-200 hover:text-white",
      footerText: "text-slate-500",
    },
  },
  OCEAN_GRADIENT: {
    id: "OCEAN_GRADIENT",
    name: "Ocean Gradient",
    description: "Ondas azuis safira e turquesa com sensação fluida e refrescante",
    previewBg: "bg-sky-950",
    previewCard: "bg-blue-950/50 border-sky-400/30",
    previewAccent: "bg-sky-400",
    classes: {
      container: "text-sky-50",
      background: "bg-gradient-to-b from-[#051c2c] via-[#03111b] to-[#01080d]",
      avatarBorder: "border-sky-400 ring-4 ring-cyan-500/20 shadow-[0_0_20px_rgba(56,189,248,0.25)]",
      displayName: "text-white font-bold tracking-tight",
      bio: "text-sky-200/75",
      handleBadge: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
      linkCard: "bg-sky-950/40 backdrop-blur-xl border border-sky-500/25 text-white shadow-xl shadow-black/40 hover:border-sky-400 hover:bg-sky-900/40 transition-all duration-200",
      linkCardHover: "hover:scale-[1.015] active:scale-[0.99]",
      linkTitle: "text-sky-50 font-semibold",
      linkDescription: "text-sky-200/60 text-xs",
      divider: "border-sky-500/20 text-sky-300",
      socialIconBg: "bg-sky-950/40 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-900/50",
      socialIconText: "text-sky-200 hover:text-white",
      footerText: "text-sky-400/50",
    },
  },
};

export function getThemeConfig(themeName: ProfileTheme | string | null | undefined): ThemeConfig {
  if (themeName && themeName in THEMES) {
    return THEMES[themeName as ProfileTheme];
  }
  return THEMES.MODERN_DARK;
}
