"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { profileTranslator } from "@/lib/i18n/profiles";
import { useParams, useRouter } from "next/navigation";
import { THEMES, getThemeConfig, type ProfileTheme } from "@/lib/profiles/themes";

interface ProfileItem {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: ProfileTheme;
  isPublished: boolean;
  createdAt: string;
  _count: {
    blocks: number;
    visits: number;
    clicks: number;
  };
}

export default function ProfilesPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";
  const t = profileTranslator(lang);

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form fields
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ProfileTheme>("MODERN_DARK");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/profiles")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setProfiles(data.data);
      })
      .catch((err) => console.error("Failed to fetch profiles:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function openCreateModal() {
    setFormError(null);
    setHandle("");
    setDisplayName("");
    setBio("");
    setShowCreateModal(true);
    try {
      const res = await fetch("/api/profiles/handle-suggestion");
      const json = await res.json();
      if (json.success && json.data?.handle) {
        setHandle((current) => current || json.data.handle);
      }
    } catch {
      // Suggestion is optional; the person can type a handle.
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          displayName,
          bio: bio || null,
          theme: selectedTheme,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t("Erro ao criar perfil"));
      }

      setShowCreateModal(false);
      // Navigate straight to the new profile studio
      router.push(`/${lang}/profiles/${data.data.id}`);
    } catch (err) {
      setFormError((err instanceof Error && err.message) || t("Erro ao criar perfil"));
    } finally {
      setCreating(false);
    }
  }

  function handleCopyLink(profileHandle: string, id: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${profileHandle}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t("Link na Bio")}</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {t("Crie e personalize sua página pública com links, temas premium e rastreamento de conversão.")}
          </p>
        </div>
        <button
          onClick={() => void openCreateModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("Criar Novo Perfil")}
        </button>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 h-56 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-24" />
                  <div className="h-3 bg-zinc-850 rounded w-36" />
                </div>
              </div>
              <div className="h-10 bg-zinc-800/40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t("Nenhum perfil criado ainda")}</h2>
            <p className="text-sm text-zinc-400 mt-2">
              {t("Comece agora criando seu primeiro Link na Bio. Compartilhe seu link exclusivo no Instagram, TikTok, WhatsApp e onde quiser.")}
            </p>
          </div>
          <button
            onClick={() => void openCreateModal()}
            className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition shadow-lg shadow-indigo-500/20"
          >
            {t("Criar meu primeiro perfil")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
          {profiles.map((profile) => {
            const themeConfig = getThemeConfig(profile.theme);
            const ctr = profile._count.visits > 0
              ? ((profile._count.clicks / profile._count.visits) * 100).toFixed(1)
              : "0";

            return (
              <div
                key={profile.id}
                className="glass rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group"
              >
                <div>
                  {/* Top bar with handle and status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      @{profile.handle}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        profile.isPublished
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {profile.isPublished ? t("Publicado") : t("Rascunho")}
                    </span>
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-center gap-3.5 mb-4">
                    {profile.avatarUrl ? (
                      <Image unoptimized width={48} height={48}
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                        {profile.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-white truncate">
                        {profile.displayName}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">
                        {t("Tema:")} {t(themeConfig.name)}
                      </p>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  {profile.bio && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4">
                      {profile.bio}
                    </p>
                  )}

                  {/* Metrics preview */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-zinc-950/40 border border-white/5 text-center mb-5">
                    <div>
                      <p className="text-xs text-zinc-400">{t("Blocos")}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{profile._count.blocks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">{t("Visitas")}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{profile._count.visits}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">CTR</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">{ctr}%</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <Link
                    href={`/${lang}/profiles/${profile.id}`}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-center text-xs font-semibold text-white transition border border-white/10"
                  >
                    {t("Editar no Studio")}
                  </Link>
                  <button
                    onClick={() => handleCopyLink(profile.handle, profile.id)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-200 transition border border-zinc-700 flex items-center gap-1.5"
                    title={t("Copiar link")}
                  >
                    {copiedId === profile.id ? (
                      <span className="text-emerald-400">{t("Copiado!")}</span>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9 9.06 9.06 0 0 0-1.5.124m7.5 10.376h-3.375a1.125 1.125 0 0 1-1.125-1.125V7.875m-7.5 0V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.375m-9.75 0h9.75" />
                        </svg>
                        {t("Link")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="glass-strong rounded-2xl w-full max-w-lg p-6 space-y-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t("Criar Novo Perfil")}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white transition p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {t("Handle (Link exclusivo)")}
                </label>
                <div className="flex items-center rounded-xl bg-zinc-950 border border-white/10 px-3.5 py-2.5 focus-within:border-accent transition">
                  <span className="text-sm text-zinc-500 font-mono select-none">meuperfil.me/</span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().trim())}
                    placeholder={t("seunome")}
                    className="flex-1 bg-transparent text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none ml-1"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {t("Mínimo 3 caracteres (letras, números, '.', '_' e '-')")}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {t("Sugerimos um endereço a partir do seu Instagram conectado ou do seu e-mail. Você pode trocar.")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {t("Nome de Exibição")}
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("Ex: João Silva ou Minha Marca")}
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {t("Bio (Opcional)")}
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("Ex: Criador de conteúdo | Dicas diárias de design e tecnologia")}
                  className="w-full rounded-xl bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  {t("Escolha o Tema Inicial")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(THEMES).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setSelectedTheme(th.id)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        selectedTheme === th.id
                          ? "border-accent bg-accent/10 text-white shadow-md shadow-indigo-500/20"
                          : "border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <div className={`w-full h-7 rounded-lg ${th.previewBg} border border-white/10 flex items-center justify-center`}>
                        <div className={`w-3 h-3 rounded-full ${th.previewAccent}`} />
                      </div>
                      <span className="text-[11px] font-medium truncate w-full">{th.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {creating ? t("Criando...") : t("Criar e Abrir Studio")}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
