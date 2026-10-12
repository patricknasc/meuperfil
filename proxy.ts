import { NextResponse, type NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const LOCALES = ["pt", "en", "es"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "pt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profiles",
  "/scheduler",
  "/automations",
  "/campaigns",
  "/leads",
  "/logs",
  "/settings",
  "/diagnostics",
];

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token")
  );
}

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check cookie preference
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Negotiate from Accept-Language header
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  try {
    const headers = { "accept-language": acceptLanguage };
    const languages = new Negotiator({ headers }).languages();
    const matched = match(languages, [...LOCALES], DEFAULT_LOCALE) as Locale;
    return matched;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip static assets, APIs, and direct tracking redirects
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/p/") ||
    pathname === "/favicon.ico" ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if pathname starts with a supported locale
  const pathnameLocale = LOCALES.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in pathname, redirect to the preferred locale path
  if (!pathnameLocale) {
    const locale = getPreferredLocale(request);
    const targetPath = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const url = new URL(`${targetPath}${search}`, request.url);
    return NextResponse.redirect(url);
  }

  // Pathname has a locale. Strip the locale prefix for route/auth checks.
  const subPath = pathname.slice(pathnameLocale.length + 1) || "/";
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => subPath === prefix || subPath.startsWith(`${prefix}/`)
  );
  const isLogin = subPath === "/login";
  const isAuthenticated = hasSessionCookie(request);

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${pathnameLocale}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

