"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/app/[lang]/dictionaries";

// Remembers the choice for proxy.ts locale negotiation (1 year).
function persistLocale(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

interface LanguageSwitcherProps {
  currentLocale: Locale;
  variant?: "header" | "footer" | "compact";
}

const languages: { code: Locale; label: string; name: string; flag: string }[] = [
  { code: "pt", label: "PT", name: "Português", flag: "🇧🇷" },
  { code: "en", label: "EN", name: "English", flag: "🇺🇸" },
  { code: "es", label: "ES", name: "Español", flag: "🇪🇸" },
];

export default function LanguageSwitcher({
  currentLocale,
  variant = "header",
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    persistLocale(newLocale);

    // Compute new pathname
    let newPathname = pathname;
    if (pathname.startsWith(`/${currentLocale}/`)) {
      newPathname = pathname.replace(`/${currentLocale}/`, `/${newLocale}/`);
    } else if (pathname === `/${currentLocale}`) {
      newPathname = `/${newLocale}`;
    } else {
      newPathname = `/${newLocale}${pathname}`;
    }

    setIsOpen(false);
    router.push(newPathname);
  };

  const currentLang =
    languages.find((l) => l.code === currentLocale) || languages[0];

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 text-xs">
        {languages.map((lang, idx) => (
          <span key={lang.code} className="flex items-center gap-1">
            <button
              onClick={() => handleLanguageChange(lang.code)}
              className={`font-semibold transition ${
                currentLocale === lang.code
                  ? "text-cyan-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {lang.label}
            </button>
            {idx < languages.length - 1 && (
              <span className="text-zinc-600">|</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <svg
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-lg border border-white/10 bg-zinc-900/95 p-1 shadow-xl backdrop-blur-md focus:outline-none">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                currentLocale === lang.code
                  ? "bg-cyan-300/10 text-cyan-200"
                  : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span>{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {currentLocale === lang.code && (
                <span className="text-cyan-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
