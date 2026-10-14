import { getSocialPlatform } from "@/lib/profiles/social-platforms";
import type { IconStyle, ThemeConfig } from "@/lib/profiles/themes";

export function SocialGlyph({ platform, className = "w-5 h-5" }: { platform: string; className?: string }) {
  const { icon } = getSocialPlatform(platform);
  return icon.stroke ? (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}

/** Classes and inline style for one round social button in a given icon style. */
export function socialButtonProps(platform: string, style: IconStyle, theme: ThemeConfig) {
  const base = "w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95";
  switch (style) {
    case "brand": {
      const { hex } = getSocialPlatform(platform);
      return { className: `${base} shadow-md text-white`, style: { backgroundColor: hex } };
    }
    case "outline":
      return { className: `${base} border-2 border-current opacity-90 hover:opacity-100`, style: undefined };
    case "plain":
      return { className: `${base} opacity-90 hover:opacity-100`, style: undefined };
    default:
      return {
        className: `${base} shadow-md ${theme.classes.socialIconBg} ${theme.classes.socialIconText}`,
        style: undefined,
      };
  }
}
