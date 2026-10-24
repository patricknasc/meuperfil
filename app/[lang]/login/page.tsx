import { redirect } from "next/navigation";
import { publicTranslator } from "@/lib/i18n/public";
import { signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import Link from "next/link";
import LanguageSwitcher from "@/components/language-switcher";
import { Logo } from "@/components/site/logo";
import { siteFontVariables } from "@/lib/site/fonts";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/content";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: t("Sign in or create your account") + " — MeuPerfil",
  description: t("Sign in to manage Instagram comment-to-DM campaigns."),
};
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    checkEmail?: string;
    callbackUrl?: string;
    template?: string;
  }>;
}) {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? lang : defaultLocale;
  const t = publicTranslator(locale);
  const sParams = await searchParams;
  const checkEmail = sParams.checkEmail === "1";
  const selectedTemplate = getCampaignTemplate(sParams.template);
  const templateCallbackUrl = selectedTemplate
    ? `/${locale}/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = sParams.callbackUrl ?? templateCallbackUrl ?? `/${locale}/dashboard`;

  async function sendMagicLink(formData: FormData) {
    "use server";
    // redirect: false sends the email without following Auth.js' redirect to
    // /api/auth/verify-request, which the client router cannot render; we go
    // straight to the localized "check your email" state instead.
    const resultUrl = await signIn("resend", {
      email: String(formData.get("email") ?? ""),
      redirectTo: callbackUrl,
      redirect: false,
    });
    if (new URL(resultUrl, "http://localhost").searchParams.has("error")) {
      redirect(resultUrl);
    }
    redirect(`/${locale}/login?checkEmail=1`);
  }

  return (
    <div className={`${siteFontVariables} flex min-h-screen flex-col bg-paper font-site text-ink`}>
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} aria-label="meuperfil.me">
          <Logo />
        </Link>
        <LanguageSwitcher currentLocale={locale} tone="light" />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-[2rem] bg-white p-8 ring-1 ring-line shadow-[0_30px_60px_-40px_rgba(22,18,15,.45)] sm:p-10">
            {checkEmail ? (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral-soft text-coral-dark">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight">{t("Check your email")}</h1>
                <p className="mt-3 leading-7 text-ink-soft">{t("We sent you a secure sign-in link. Open it on this device to continue.")}</p>
                <Link href={`/${locale}/login`} className="mt-6 inline-block text-sm font-semibold text-coral-dark hover:underline">
                  {t("Use another email")}
                </Link>
              </div>
            ) : (
              <>
                <h1 className="font-heading text-3xl font-bold tracking-tight">{t("Sign in or create your account")}</h1>
                <p className="mt-3 leading-7 text-ink-soft">
                  {selectedTemplate
                    ? t("Sign in or create your account to use the {template} template.", { template: selectedTemplate.title })
                    : t("Enter your email and we send you an access link. If you are new, your account is created right away, free.")}
                </p>
                {selectedTemplate && (
                  <div className="mt-5 rounded-2xl bg-coral-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-coral-dark">{t("Template selected")}</p>
                    <p className="mt-1 font-semibold">{selectedTemplate.title}</p>
                  </div>
                )}
                <form action={sendMagicLink} className="mt-7 space-y-4">
                  <label htmlFor="email" className="block text-sm font-semibold">{t("Your email")}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t("you@email.com")}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-3.5 text-ink outline-none transition placeholder:text-ink-muted focus:border-coral"
                  />
                  <button type="submit" className="w-full rounded-full bg-coral px-6 py-3.5 font-semibold text-white transition hover:bg-coral-dark">
                    {t("Continue with email")}
                  </button>
                </form>
                <p className="mt-6 text-center text-xs leading-5 text-ink-muted">
                  {t("No password needed.")}{" "}
                  {t("By continuing you agree to the")}{" "}
                  <Link href={`/${locale}/terms`} className="underline hover:text-ink">{t("Terms of Use")}</Link>{" "}
                  {t("and the")}{" "}
                  <Link href={`/${locale}/privacy`} className="underline hover:text-ink">{t("Privacy Policy")}</Link>.
                </p>
              </>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-ink-muted">
            {t("Need help?")} <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="underline hover:text-ink">{LEGAL_CONTACT_EMAIL}</a>
          </p>
        </div>
      </main>
    </div>
  );
}
