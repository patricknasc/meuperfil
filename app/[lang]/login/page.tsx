import { signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import LanguageSwitcher from "@/components/language-switcher";
import { hasLocale, defaultLocale, type Locale } from "../dictionaries";

export const metadata = {
  title: "Login - MeuPerfil",
  description: "Sign in to manage Instagram comment-to-DM campaigns.",
};

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
  const sParams = await searchParams;
  const checkEmail = sParams.checkEmail === "1";
  const selectedTemplate = getCampaignTemplate(sParams.template);
  const templateCallbackUrl = selectedTemplate
    ? `/${locale}/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = sParams.callbackUrl ?? templateCallbackUrl ?? `/${locale}/dashboard`;

  async function sendMagicLink(formData: FormData) {
    "use server";
    await signIn("resend", {
      email: String(formData.get("email") ?? ""),
      redirectTo: callbackUrl,
    });
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
              ? `Sign in to use the ${selectedTemplate.title} template.`
              : "Sign in by email, then connect your Instagram professional account."}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-2xl shadow-black/40">
          {selectedTemplate && !checkEmail && (
            <div className="mb-5 border border-cyan-200/20 bg-cyan-300/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
                Template selected
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {selectedTemplate.title}
              </p>
            </div>
          )}

          {checkEmail ? (
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-muted">
                We sent you a secure sign-in link. Open it on this device to
                continue.
              </p>
            </div>
          ) : (
            <form action={sendMagicLink} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Email me a magic link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
