import { redirect } from "next/navigation";
import { publicTranslator } from "@/lib/i18n/public";
import { signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import LanguageSwitcher from "@/components/language-switcher";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = publicTranslator(lang);
  return {
  title: "Login - MeuPerfil",
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
    <div className="relative min-h-screen flex items-center justify-center gradient-mesh overflow-hidden px-6">
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher currentLocale={locale} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-5">
            <span className="text-xl font-black text-cyan-100">MP</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            MeuPerfil
          </h1>
          <p className="text-muted text-sm leading-relaxed mt-2">
            {selectedTemplate
              ? t("Sign in or create your account to use the {template} template.", { template: selectedTemplate.title })
              : t("Sign in or create your account with your email. Then connect your Instagram professional account.")}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-2xl shadow-black/40">
          {selectedTemplate && !checkEmail && (
            <div className="mb-5 border border-cyan-200/20 bg-cyan-300/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">{t("Template selected")}</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {selectedTemplate.title}
              </p>
            </div>
          )}

          {checkEmail ? (
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold mb-2">{t("Check your email")}</h2>
              <p className="text-sm text-muted">{t("We sent you a secure sign-in link. Open it on this device to continue.")}</p>
            </div>
          ) : (
            <form action={sendMagicLink} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >{t("Your email")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("you@email.com")}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
              >{t("Email me a sign-in link")}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
