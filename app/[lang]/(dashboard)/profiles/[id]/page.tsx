"use client";
import { useDialogs } from "@/components/app-dialogs";
import { useFlowTranslation } from "@/lib/i18n/use-flow-translation";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { profileTranslator } from "@/lib/i18n/profiles";
import {
  THEMES,
  DEFAULT_CUSTOM_THEME,
  customThemeStyle,
  getThemeConfig,
  parseCustomTheme,
  PROFILE_FONTS,
  type ButtonShape,
  type CustomThemeSettings,
  type IconStyle,
  type ProfileFont,
  type TextSize,
  type ProfileTheme,
} from "@/lib/profiles/themes";
import type { ProfileAnalyticsSummary } from "@/lib/profiles/analytics";
import { normalizeSocialLink, normalizeWebUrl, type LinkResult } from "@/lib/profiles/links";
import { SOCIAL_PLATFORMS, getSocialPlatform } from "@/lib/profiles/social-platforms";
import { profileFontVariables } from "@/lib/profiles/fonts";
import { SocialGlyph, socialButtonProps } from "@/components/social-icon";
import { ModalScrollLock } from "@/components/modal-scroll-lock";

export const ProfileBlockType = {
  LINK: "LINK",
  TEXT_DIVIDER: "TEXT_DIVIDER",
  SOCIAL_LINKS: "SOCIAL_LINKS",
  INSTAGRAM_POST: "INSTAGRAM_POST",
} as const;

export type ProfileBlockType = (typeof ProfileBlockType)[keyof typeof ProfileBlockType];

interface ProfileBlockItem {
  id: string;
  type: ProfileBlockType;
  title: string | null;
  url: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  config?: Record<string, unknown>;
  _count?: { clicks: number };
}

interface ProfileData {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: ProfileTheme;
  themeSettings?: unknown;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: ProfileBlockItem[];
}

export default function ProfileStudioPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "pt";
  const t = profileTranslator(lang);
  const dialogs = useDialogs();
  const ft = useFlowTranslation();
  const profileId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [analytics, setAnalytics] = useState<ProfileAnalyticsSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"blocks" | "appearance" | "analytics">("blocks");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");

  // Local draft state for live preview
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<ProfileTheme>("MODERN_DARK");
  const [customTheme, setCustomTheme] = useState<CustomThemeSettings>(DEFAULT_CUSTOM_THEME);
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<ProfileBlockItem[]>([]);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmCampaign, setUtmCampaign] = useState("");

  // New Block Modal
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [newBlockType, setNewBlockType] = useState<ProfileBlockType>(ProfileBlockType.LINK);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockUrl, setNewBlockUrl] = useState("");
  const [newBlockDescription, setNewBlockDescription] = useState("");
  const [newBlockImageUrl, setNewBlockImageUrl] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);

  // Edit Block Modal
  const [editingBlock, setEditingBlock] = useState<ProfileBlockItem | null>(null);
  const [savingBlock, setSavingBlock] = useState(false);

  // Social Links state inside add/edit
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([
    { platform: "instagram", url: "" },
    { platform: "whatsapp", url: "" },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;

    fetch(`/api/profiles/${profileId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || t("Perfil não encontrado"));
        }
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        const p: ProfileData = json.data.profile;
        setProfile(p);
        setAnalytics(json.data.analytics);

        // Populate local editing state
        setDisplayName(p.displayName);
        setHandle(p.handle);
        setBio(p.bio || "");
        setAvatarUrl(p.avatarUrl);
        setTheme(p.theme);
        setCustomTheme(parseCustomTheme(p.themeSettings));
        setIsPublished(p.isPublished);
        setBlocks(p.blocks || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage((err instanceof Error && err.message) || t("Erro ao carregar perfil"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profileId, t]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  async function handleSaveProfile() {
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          handle,
          bio: bio || null,
          avatarUrl,
          theme,
          themeSettings: theme === "CUSTOM" ? customTheme : undefined,
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t("Erro ao salvar perfil"));
      }

      showToast(t("Alterações salvas com sucesso!"));
      setProfile((prev) => prev ? { ...prev, displayName, handle, bio, avatarUrl, theme, isPublished } : null);
    } catch (err) {
      setErrorMessage((err instanceof Error && err.message) || t("Erro ao salvar perfil"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(t("A imagem deve ter no máximo 2MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      setAvatarUrl(base64);

      try {
        const res = await fetch("/api/profiles/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64 }),
        });
        const json = await res.json();
        if (json.success) {
          showToast(t("Avatar atualizado!"));
        }
      } catch (err) {
        console.error("Avatar upload failed:", err);
      }
    };
    reader.readAsDataURL(file);
  }

  function socialLabel(platform: string) {
    return t(getSocialPlatform(platform).label);
  }

  function socialPlaceholder(platform: string) {
    switch (getSocialPlatform(platform).kind) {
      case "phone":
        return t("+55 11 99999-8888 (com + e código do país)");
      case "email":
        return t("contato@seusite.com.br");
      case "web":
        return t("seusite.com.br");
      case "site-url":
        return t("Cole o link completo");
      default:
        return t("@seuperfil ou link do perfil");
    }
  }

  function openAddBlockModal() {
    setModalError(null);
    setSocialLinks([
      { platform: "instagram", url: "" },
      { platform: "whatsapp", url: "" },
    ]);
    setShowAddBlockModal(true);
  }

  function linkErrorText(result: LinkResult, field: string): string {
    if (result.ok) return "";
    switch (result.error) {
      case "empty":
        return t("Preencha o campo {field}.").replace("{field}", field);
      case "invalid_phone":
        return t("Número de WhatsApp inválido. Use + e o código do país, ex.: +55 11 99999-8888 ou +66 93 417 8294.");
      case "invalid_handle":
        return t("{field}: usuário inválido. Use só letras, números, '.', '_' ou '-' (ex.: @seuperfil).").replace("{field}", field);
      case "invalid_email":
        return t("{field}: e-mail inválido. Ex.: contato@seusite.com.br").replace("{field}", field);
      case "wrong_site":
        return t("{field}: esse link não é dessa rede. Cole o link do seu perfil ou só o @usuário.").replace("{field}", field);
      default:
        return t("{field}: endereço inválido. Ex.: seusite.com.br ou https://seusite.com.br/oferta").replace("{field}", field);
    }
  }

  function buildSocialLinks(): { links: Array<{ platform: string; url: string }> } | { error: string } {
    const filled = socialLinks.filter((s) => s.url.trim().length > 0);
    if (filled.length === 0) return { error: t("Adicione ao menos um link de rede social") };
    const links: Array<{ platform: string; url: string }> = [];
    for (const s of filled) {
      const result = normalizeSocialLink(s.platform, s.url);
      if (!result.ok) return { error: linkErrorText(result, socialLabel(s.platform)) };
      links.push({ platform: s.platform, url: result.url });
    }
    return { links };
  }

  function linkPreview(result: LinkResult, raw: string) {
    if (!raw.trim()) return null;
    if (result.ok) {
      if (result.url === raw.trim()) return null;
      return (
        <>
          <p className="mt-1.5 text-[11px] text-success break-all">
            {t("Será salvo como:")} <span className="font-mono">{result.url}</span>
          </p>
          {result.assumedBrazil && (
            <p className="mt-1 text-[11px] text-warning">
              {t("Sem o + consideramos um número do Brasil (+55). Se for de outro país, comece com + e o código do país, ex.: +66 93 417 8294.")}
            </p>
          )}
        </>
      );
    }
    if (result.error === "empty") return null;
    return <p className="mt-1.5 text-[11px] text-warning">{linkErrorText(result, "")
      .replace(/^:\s*/, "")}</p>;
  }

  async function handleAddBlock(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    let configPayload: { links: Array<{ platform: string; url: string }> } | null = null;
    let finalUrl: string | null = null;
    let finalImageUrl: string | null = null;

    if (newBlockType === ProfileBlockType.LINK) {
      const url = normalizeWebUrl(newBlockUrl);
      if (!url.ok) return setModalError(linkErrorText(url, t("URL de Destino")));
      finalUrl = url.url;
      if (newBlockImageUrl.trim()) {
        const image = normalizeWebUrl(newBlockImageUrl);
        if (!image.ok) return setModalError(linkErrorText(image, t("URL do Ícone ou Imagem (Opcional)")));
        finalImageUrl = image.url;
      }
    }

    if (newBlockType === ProfileBlockType.SOCIAL_LINKS) {
      const socials = buildSocialLinks();
      if ("error" in socials) return setModalError(socials.error);
      configPayload = { links: socials.links };
      finalUrl = socials.links[0].url;
    }

    setAddingBlock(true);

    try {
      const res = await fetch(`/api/profiles/${profileId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newBlockType,
          title: newBlockTitle,
          url: finalUrl,
          description: newBlockDescription.trim() || null,
          imageUrl: finalImageUrl,
          config: configPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t("Erro ao adicionar bloco"));
      }

      setBlocks((prev) => [...prev, json.data]);
      setShowAddBlockModal(false);
      setNewBlockTitle("");
      setNewBlockUrl("");
      setNewBlockDescription("");
      setNewBlockImageUrl("");
      showToast(t("Bloco adicionado!"));
    } catch (err) {
      setModalError((err instanceof Error && err.message) || t("Erro ao criar bloco"));
    } finally {
      setAddingBlock(false);
    }
  }

  async function handleUpdateBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBlock) return;
    setModalError(null);

    let configPayload = editingBlock.config;
    let finalUrl = editingBlock.url;
    let finalImageUrl = editingBlock.imageUrl;

    if (editingBlock.type === ProfileBlockType.LINK) {
      const url = normalizeWebUrl(editingBlock.url ?? "");
      if (!url.ok) return setModalError(linkErrorText(url, t("URL de Destino")));
      finalUrl = url.url;
      if (editingBlock.imageUrl?.trim()) {
        const image = normalizeWebUrl(editingBlock.imageUrl);
        if (!image.ok) return setModalError(linkErrorText(image, t("URL do Ícone / Thumbnail")));
        finalImageUrl = image.url;
      } else {
        finalImageUrl = null;
      }
    }

    if (editingBlock.type === ProfileBlockType.SOCIAL_LINKS) {
      const socials = buildSocialLinks();
      if ("error" in socials) return setModalError(socials.error);
      configPayload = { links: socials.links };
      finalUrl = socials.links[0].url;
    }

    setSavingBlock(true);

    try {
      const res = await fetch(`/api/profiles/${profileId}/blocks/${editingBlock.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingBlock.title,
          url: finalUrl,
          description: editingBlock.description,
          imageUrl: finalImageUrl,
          isActive: editingBlock.isActive,
          config: configPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t("Erro ao atualizar bloco"));
      }

      setBlocks((prev) =>
        prev.map((b) => (b.id === editingBlock.id ? { ...b, ...json.data } : b))
      );
      setEditingBlock(null);
      showToast(t("Bloco atualizado!"));
    } catch (err) {
      setModalError((err instanceof Error && err.message) || t("Erro ao atualizar bloco"));
    } finally {
      setSavingBlock(false);
    }
  }

  async function handleToggleBlockActive(block: ProfileBlockItem) {
    const updatedStatus = !block.isActive;
    // Optimistic update
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, isActive: updatedStatus } : b))
    );

    try {
      await fetch(`/api/profiles/${profileId}/blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
    } catch (err) {
      console.error("Toggle block active error:", err);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!(await dialogs.confirm({ title: ft("Delete block?"), message: ft("The block is removed from your public page."), confirmLabel: ft("Delete"), tone: "danger" }))) return;
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));

    try {
      await fetch(`/api/profiles/${profileId}/blocks/${blockId}`, {
        method: "DELETE",
      });
      showToast(t("Bloco excluído"));
    } catch (err) {
      console.error("Delete block error:", err);
    }
  }

  async function handleMoveBlock(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);

    setBlocks(newBlocks);

    // Save order to server
    try {
      await fetch(`/api/profiles/${profileId}/blocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds: newBlocks.map((b) => b.id) }),
      });
    } catch (err) {
      console.error("Reorder blocks error:", err);
    }
  }

  function handleCopyPublicUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/${handle}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted">{t("Carregando Studio...")}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass rounded-2xl p-8 text-center max-w-md mx-auto space-y-4">
        <p className="text-error font-medium">{t("Perfil não encontrado")}</p>
        <Link href={`/${lang}/profiles`} className="text-sm text-accent hover:underline">
          {t("Voltar para lista de perfis")}
        </Link>
      </div>
    );
  }

  const themeConfig = getThemeConfig(theme);
  const utmLink = (() => {
    const params = new URLSearchParams();
    const slug = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "-");
    if (utmSource.trim()) params.set("utm_source", slug(utmSource));
    if (utmCampaign.trim()) params.set("utm_campaign", slug(utmCampaign));
    const query = params.toString();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://meuperfil.me";
    return `${origin}/${handle}${query ? `?${query}` : ""}`;
  })();
  const previewIconStyle: IconStyle = theme === "CUSTOM" ? customTheme.iconStyle : themeConfig.iconStyle ?? "theme";

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-ink text-white font-bold text-sm shadow-xl animate-fade-in flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-error hover:text-foreground">
            ✕
          </button>
        </div>
      )}

      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${lang}/profiles`}
            className="p-2 rounded-xl bg-surface-hover hover:bg-border text-ink-soft transition"
            title={t("Voltar aos perfis")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground truncate">{displayName}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-surface-hover text-muted">
                @{handle}
              </span>
            </div>
            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isPublished ? "bg-success" : "bg-warning"}`} />
              {isPublished ? t("Página Publicada e Ativa") : t("Modo Rascunho")}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mobile view switch */}
          <div className="flex lg:hidden bg-surface-hover rounded-xl p-1 border border-border text-xs font-semibold">
            <button
              onClick={() => setMobileView("editor")}
              className={`px-3 py-1.5 rounded-lg transition ${
                mobileView === "editor" ? "bg-accent text-white" : "text-muted"
              }`}
            >
              {t("Editor")}
            </button>
            <button
              onClick={() => setMobileView("preview")}
              className={`px-3 py-1.5 rounded-lg transition ${
                mobileView === "preview" ? "bg-accent text-white" : "text-muted"
              }`}
            >
              {t("Preview")}
            </button>
          </div>

          <button
            onClick={handleCopyPublicUrl}
            className="px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-border text-xs font-semibold text-foreground transition border border-border flex items-center gap-1.5"
          >
            {copiedLink ? (
              <span className="text-success">{t("Link Copiado!")}</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9 9.06 9.06 0 0 0-1.5.124m7.5 10.376h-3.375a1.125 1.125 0 0 1-1.125-1.125V7.875m-7.5 0V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.375m-9.75 0h9.75" />
                </svg>
                {t("Copiar Link")}
              </>
            )}
          </button>

          <a
            href={`/${handle}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-surface-hover text-xs font-semibold text-foreground transition border border-border flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            {t("Abrir Página")}
          </a>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition shadow-lg shadow-coral/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? t("Salvando...") : t("Salvar Alterações")}
          </button>
        </div>
      </div>

      {/* Main Studio Grid (Editor on Left, Sticky Smartphone on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: STUDIO EDITOR */}
        <div className={`lg:col-span-7 space-y-6 ${mobileView === "preview" ? "hidden lg:block" : "block"}`}>
          {/* Navigation Tabs */}
          <div className="flex border-b border-border gap-6">
            <button
              onClick={() => setActiveTab("blocks")}
              className={`pb-3 text-sm font-semibold transition relative ${
                activeTab === "blocks" ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {t("Blocos & Links")} ({blocks.length})
              {activeTab === "blocks" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`pb-3 text-sm font-semibold transition relative ${
                activeTab === "appearance" ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Aparência & Identidade
              {activeTab === "appearance" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 text-sm font-semibold transition relative ${
                activeTab === "analytics" ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {t("Métricas & CTR")}
              {activeTab === "analytics" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: BLOCKS */}
          {activeTab === "blocks" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("Conteúdo do Perfil")}</h3>
                  <p className="text-xs text-muted">
                    {t("Adicione links de conversão, redes sociais ou divisores de seção.")}
                  </p>
                </div>
                <button
                  onClick={openAddBlockModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 font-semibold text-xs transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t("Adicionar Bloco")}
                </button>
              </div>

              {blocks.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center space-y-3">
                  <p className="text-sm text-ink-soft font-medium">{t("Nenhum bloco cadastrado")}</p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    {t("Clique em &quot;Adicionar Bloco&quot; acima para incluir seu primeiro link com destino rastreado.")}
                  </p>
                  <button
                    onClick={openAddBlockModal}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold transition"
                  >
                    {t("Adicionar Bloco Agora")}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className={`glass rounded-2xl p-4 flex items-center justify-between gap-3 border transition-all ${
                        block.isActive ? "border-border" : "border-border opacity-60"
                      }`}
                    >
                      {/* Left: Reorder controls + Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 text-muted">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveBlock(index, "up")}
                            className="p-1 hover:text-foreground disabled:opacity-20 transition"
                            title={t("Mover para cima")}
                          >
                            ▲
                          </button>
                          <button
                            disabled={index === blocks.length - 1}
                            onClick={() => handleMoveBlock(index, "down")}
                            className="p-1 hover:text-foreground disabled:opacity-20 transition"
                            title={t("Mover para baixo")}
                          >
                            ▼
                          </button>
                        </div>

                        {/* Thumbnail / Icon */}
                        {block.imageUrl ? (
                          <Image unoptimized width={40} height={40}
                            src={block.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-muted flex-shrink-0">
                            {block.type === ProfileBlockType.LINK && (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                              </svg>
                            )}
                            {block.type === ProfileBlockType.TEXT_DIVIDER && (
                              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M4 12h10M4 17h7" /></svg>
                            )}
                            {block.type === ProfileBlockType.SOCIAL_LINKS && (
                              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {block.title || t("Sem título")}
                            </h4>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-hover text-muted">
                              {block.type === ProfileBlockType.LINK
                                ? t("Link")
                                : block.type === ProfileBlockType.TEXT_DIVIDER
                                ? t("Divisor")
                                : t("Sociais")}
                            </span>
                          </div>
                          {block.url && (
                            <p className="text-xs text-muted font-mono truncate mt-0.5">
                              {block.url}
                            </p>
                          )}
                          {block.description && (
                            <p className="text-xs text-muted truncate mt-0.5">
                              {block.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {block._count?.clicks !== undefined && (
                          <div className="hidden sm:block text-right">
                            <p className="text-xs font-bold text-success">
                              {block._count.clicks} {t("cliques")}
                            </p>
                          </div>
                        )}

                        {/* Active Switch */}
                        <button
                          onClick={() => handleToggleBlockActive(block)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                            block.isActive ? "bg-accent" : "bg-border"
                          }`}
                          title={block.isActive ? t("Desativar bloco") : t("Ativar bloco")}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              block.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingBlock(block);
                            if (block.type === ProfileBlockType.SOCIAL_LINKS && Array.isArray(block.config?.links)) {
                              setSocialLinks(block.config.links as Array<{ platform: string; url: string }>);
                            }
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition"
                          title={t("Editar")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-red-500/10 transition"
                          title={t("Excluir")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPEARANCE & IDENTITY */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-fade-in">
              {/* Profile Card Settings */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">{t("Identidade do Perfil")}</h3>

                {/* Avatar Section */}
                <div className="flex items-center gap-4 pt-2">
                  {avatarUrl ? (
                    <Image unoptimized width={64} height={64}
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-accent"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral to-coral-dark flex items-center justify-center text-white font-bold text-xl">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFile}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-surface-hover hover:bg-border text-xs font-semibold text-foreground transition border border-border"
                    >
                      {t("Alterar Foto / Avatar")}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        className="ml-2 text-xs text-muted hover:text-error transition"
                      >
                        {t("Remover")}
                      </button>
                    )}
                    <p className="text-[11px] text-muted mt-1">{t("PNG, JPG ou WebP (Máx. 2MB)")}</p>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                    {t("Nome de Exibição")}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                  />
                </div>

                {/* Handle */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                    {t("Handle (Link público)")}
                  </label>
                  <div className="flex items-center rounded-xl bg-background border border-border px-3.5 py-2.5 focus-within:border-accent transition">
                    <span className="text-sm text-muted font-mono select-none">meuperfil.me/</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().trim())}
                      className="flex-1 bg-transparent text-sm text-foreground font-mono focus:outline-none ml-1"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                    {t("Bio / Descrição")}
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t("Conte sobre seu trabalho, produtos ou canal...")}
                    className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                  />
                </div>

                {/* Publish status toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("Status de Publicação")}</p>
                    <p className="text-xs text-muted">
                      {t("Quando ativado, sua página fica acessível publicamente em")} meuperfil.me/{handle}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPublished(!isPublished)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      isPublished ? "bg-success" : "bg-border"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isPublished ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">{t("Seletor de Temas")}</h3>
                <p className="text-xs text-muted">
                  {t("Escolha uma identidade visual para encantar seus seguidores no primeiro segundo.")}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(THEMES).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setTheme(th.id)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 relative ${
                        theme === th.id
                          ? "border-accent bg-accent/15 ring-2 ring-accent/30 text-foreground"
                          : "border-border bg-background text-muted hover:border-border-hover"
                      }`}
                    >
                      <div className={`w-full h-14 rounded-xl ${th.previewBg} border border-border p-2 flex flex-col justify-between shadow-inner`}>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${th.previewAccent}`} />
                          <div className="w-8 h-1.5 rounded bg-white/20" />
                        </div>
                        <div className={`w-full h-3 rounded ${th.previewCard}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{th.name}</p>
                        <p className="text-[10px] text-muted line-clamp-1">{t(th.description)}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTheme("CUSTOM")}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 relative ${
                      theme === "CUSTOM"
                        ? "border-accent bg-accent/15 ring-2 ring-accent/30 text-foreground"
                        : "border-border bg-background text-muted hover:border-border-hover"
                    }`}
                  >
                    <div
                      className="w-full h-14 rounded-xl border border-border p-2 flex flex-col justify-between shadow-inner bg-[var(--mp-bg)] bg-[image:var(--mp-bg-image)]"
                      style={customThemeStyle(customTheme)}
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--mp-btn)]" />
                        <div className="w-8 h-1.5 rounded bg-[var(--mp-text)] opacity-40" />
                      </div>
                      <div className="w-full h-3 rounded bg-[var(--mp-btn)]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t("Personalizar")}</p>
                      <p className="text-[10px] text-muted line-clamp-1">{t("Suas cores e formato dos botões")}</p>
                    </div>
                  </button>
                </div>

                {theme === "CUSTOM" && (
                  <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(
                        [
                          ["background", t("Fundo")],
                          ["text", t("Texto")],
                          ["button", t("Botões")],
                          ["buttonText", t("Texto dos botões")],
                        ] as Array<[keyof CustomThemeSettings, string]>
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                          <span className="text-xs text-ink-soft">{label}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-muted">{customTheme[key] as string}</span>
                            <input
                              type="color"
                              value={customTheme[key] as string}
                              onChange={(e) => setCustomTheme({ ...customTheme, [key]: e.target.value })}
                              className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent"
                            />
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                      <label className="flex items-center gap-2 text-xs text-ink-soft">
                        <input
                          type="checkbox"
                          checked={customTheme.backgroundTo !== null}
                          onChange={(e) =>
                            setCustomTheme({
                              ...customTheme,
                              backgroundTo: e.target.checked ? DEFAULT_CUSTOM_THEME.backgroundTo : null,
                            })
                          }
                        />
                        {t("Fundo em degradê")}
                      </label>
                      {customTheme.backgroundTo !== null && (
                        <span className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-muted">{customTheme.backgroundTo}</span>
                          <input
                            type="color"
                            value={customTheme.backgroundTo}
                            onChange={(e) => setCustomTheme({ ...customTheme, backgroundTo: e.target.value })}
                            className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent"
                          />
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-ink-soft mb-2">{t("Formato dos botões")}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ["rounded", t("Arredondado"), "rounded-xl"],
                            ["pill", t("Pílula"), "rounded-full"],
                            ["square", t("Reto"), "rounded-sm"],
                          ] as Array<[ButtonShape, string, string]>
                        ).map(([shape, label, radius]) => (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => setCustomTheme({ ...customTheme, buttonShape: shape })}
                            className={`py-2 text-xs font-semibold border transition ${radius} ${
                              customTheme.buttonShape === shape
                                ? "border-accent bg-accent/20 text-foreground"
                                : "border-border text-muted hover:border-border-hover"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="block text-xs text-ink-soft mb-2">{t("Fonte")}</span>
                        <select
                          value={customTheme.font}
                          onChange={(e) => setCustomTheme({ ...customTheme, font: e.target.value as ProfileFont })}
                          className={`w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none ${profileFontVariables}`}
                          style={{ fontFamily: PROFILE_FONTS[customTheme.font].family }}
                        >
                          {(Object.keys(PROFILE_FONTS) as ProfileFont[]).map((key) => (
                            <option key={key} value={key}>{t(PROFILE_FONTS[key].label)}</option>
                          ))}
                        </select>
                      </label>
                      <div>
                        <p className="text-xs text-ink-soft mb-2">{t("Tamanho do texto")}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              ["sm", t("Pequeno"), "text-[11px]"],
                              ["md", t("Médio"), "text-xs"],
                              ["lg", t("Grande"), "text-sm"],
                            ] as Array<[TextSize, string, string]>
                          ).map(([size, label, cls]) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setCustomTheme({ ...customTheme, textSize: size })}
                              className={`py-2 rounded-xl font-semibold border transition ${cls} ${
                                customTheme.textSize === size
                                  ? "border-accent bg-accent/20 text-foreground"
                                  : "border-border text-muted hover:border-border-hover"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-ink-soft mb-2">{t("Ícones das redes")}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(
                          [
                            ["brand", t("Cor da marca")],
                            ["theme", t("Cor dos botões")],
                            ["outline", t("Contorno")],
                            ["plain", t("Só o ícone")],
                          ] as Array<[IconStyle, string]>
                        ).map(([style, label]) => {
                          const sample = socialButtonProps("instagram", style, themeConfig);
                          return (
                            <button
                              key={style}
                              type="button"
                              onClick={() => setCustomTheme({ ...customTheme, iconStyle: style })}
                              className={`flex flex-col items-center gap-1.5 py-2 rounded-xl border transition ${
                                customTheme.iconStyle === style
                                  ? "border-accent bg-accent/20 text-foreground"
                                  : "border-border text-muted hover:border-border-hover"
                              }`}
                            >
                              <span
                                className={`${sample.className.replace("w-11 h-11", "w-8 h-8")} bg-[var(--mp-bg)] bg-[image:var(--mp-bg-image)] text-[var(--mp-text)]`}
                                style={{ ...customThemeStyle(customTheme), ...sample.style }}
                              >
                                <SocialGlyph platform="instagram" className="w-4 h-4" />
                              </span>
                              <span className="text-[11px]">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCustomTheme(DEFAULT_CUSTOM_THEME)}
                      className="text-[11px] text-muted hover:text-foreground"
                    >
                      {t("Restaurar cores padrão")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ANALYTICS & CTR */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-fade-in">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass rounded-2xl p-4">
                  <p className="text-xs text-muted font-medium">{t("Visitas Totais")}</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {analytics?.totalVisits ?? 0}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {analytics?.visitsWeek ?? 0} {t("nos últimos 7 dias")}
                  </p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="text-xs text-muted font-medium">{t("Cliques nos Links")}</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {analytics?.totalClicks ?? 0}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {analytics?.clicksWeek ?? 0} {t("nos últimos 7 dias")}
                  </p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="text-xs text-muted font-medium">{t("Taxa de Conversão (CTR)")}</p>
                  <p className="text-xl font-bold text-success mt-1">
                    {analytics?.ctr ?? 0}%
                  </p>
                  <p className="text-[11px] text-muted mt-1">{t("Cliques / Visitas")}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                  <p className="text-xs text-muted font-medium">{t("Visitas Hoje")}</p>
                  <p className="text-xl font-bold text-accent mt-1">
                    {analytics?.visitsToday ?? 0}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {analytics?.clicksToday ?? 0} {t("cliques hoje")}
                  </p>
                </div>
              </div>

              {/* 7-Day Chart */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {t("Desempenho dos Últimos 7 Dias")}
                </h3>
                <div className="flex items-end gap-3 h-44 pt-6 border-b border-border pb-2">
                  {analytics?.dailyVisits.map((day, idx) => {
                    const maxV = Math.max(
                      ...(analytics?.dailyVisits.map((d) => d.count) || [1]),
                      1
                    );
                    const clicksDay = analytics?.dailyClicks[idx]?.count ?? 0;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted font-mono">
                          <span className="text-accent">{day.count}v</span>
                          <span>·</span>
                          <span className="text-success">{clicksDay}c</span>
                        </div>
                        <div className="w-full flex items-end justify-center gap-1 h-28">
                          {/* Visit Bar */}
                          <div
                            className="w-1/2 rounded-t bg-gradient-to-t from-coral-dark to-coral transition-all min-h-[4px]"
                            style={{ height: `${Math.max((day.count / maxV) * 100, 4)}%` }}
                            title={`${day.count} ${t("visitas")}`}
                          />
                          {/* Click Bar */}
                          <div
                            className="w-1/2 rounded-t bg-gradient-to-t from-moss to-success transition-all min-h-[4px]"
                            style={{ height: `${Math.max((clicksDay / maxV) * 100, 4)}%` }}
                            title={`${clicksDay} ${t("cliques")}`}
                          />
                        </div>
                        <span className="text-[10px] text-muted">{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audience breakdowns */}
              {analytics?.breakdowns && (
                <div className="glass rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{t("Quem visitou")}</h3>
                    <p className="text-xs text-muted mt-1">
                      {t("Últimos {days} dias. Dados anônimos: não identificam a pessoa.").replace("{days}", String(analytics.breakdowns.days))}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {(
                      [
                        [t("Origem"), analytics.breakdowns.sources],
                        [t("Aparelho"), analytics.breakdowns.devices],
                        [t("Navegador / app"), analytics.breakdowns.browsers],
                        [t("País"), analytics.breakdowns.countries],
                        [t("Cidade"), analytics.breakdowns.cities],
                        [t("Campanhas (UTM)"), analytics.breakdowns.campaigns],
                      ] as Array<[string, Array<{ label: string; count: number }>]>
                    ).map(([title, items]) => {
                      const max = Math.max(1, ...items.map((i) => i.count));
                      return (
                        <div key={title}>
                          <p className="text-xs font-semibold text-ink-soft mb-2">{title}</p>
                          {items.length === 0 ? (
                            <p className="text-[11px] text-muted">{t("Sem dados ainda")}</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {items.map((item) => (
                                <li key={item.label} className="text-xs">
                                  <div className="flex justify-between gap-2 text-ink-soft">
                                    <span className="truncate">{t(item.label)}</span>
                                    <span className="font-mono text-muted">{item.count}</span>
                                  </div>
                                  <div className="mt-0.5 h-1.5 rounded-full bg-surface-hover">
                                    <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(item.count / max) * 100}%` }} />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* UTM link builder */}
              <div className="glass rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t("Link com rastreamento de campanha")}</h3>
                <p className="text-xs text-muted">
                  {t("Use um link diferente em cada lugar (bio do Instagram, post, anúncio) para saber de onde vieram as visitas.")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder={t("Origem, ex.: instagram")}
                    className="rounded-xl bg-background border border-border px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                  <input
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder={t("Campanha, ex.: black-friday")}
                    className="rounded-xl bg-background border border-border px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-xl bg-background border border-border px-3 py-2 text-[11px] text-ink-soft">
                    {utmLink}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(utmLink);
                      showToast(t("Link copiado!"));
                    }}
                    className="px-3 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
                  >
                    {t("Copiar")}
                  </button>
                </div>
              </div>

              {/* Clicks by Block Table */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">{t("Cliques por Bloco")}</h3>
                {analytics?.clicksByBlock.length === 0 ? (
                  <p className="text-xs text-muted py-4 text-center">{t("Nenhum clique registrado ainda")}</p>
                ) : (
                  <div className="space-y-2">
                    {analytics?.clicksByBlock.map((b) => (
                      <div
                        key={b.blockId}
                        className="flex items-center justify-between p-3 rounded-xl bg-background border border-border"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{b.title}</p>
                          {b.url && (
                            <p className="text-xs text-muted font-mono truncate">{b.url}</p>
                          )}
                          {b.channels && b.channels.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {b.channels.map((c) => (
                                <span key={c.label} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-hover text-ink-soft">
                                  {t(c.label)}: <b className="text-success">{c.count}</b>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-success px-3 py-1 rounded-lg bg-success/10 border border-success/20">
                          {b.count} {t("cliques")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REALTIME SMARTPHONE MOCKUP PREVIEW */}
        <div
          className={`lg:col-span-5 sticky top-24 ${
            mobileView === "editor" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="text-center mb-3">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">
                {t("Preview em Tempo Real")}
              </span>
            </div>

            {/* Smartphone Outer Chassis */}
            <div className="w-[320px] sm:w-[350px] h-[680px] rounded-[48px] bg-[#1a1a1f] p-3 border-4 border-ink/80 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative flex flex-col">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-surface-hover border border-border" />
              </div>

              {/* Smartphone Screen Viewport */}
              <div
                className={`w-full h-full rounded-[38px] overflow-y-auto ${themeConfig.classes.background} ${themeConfig.classes.container} flex flex-col justify-between p-5 pt-12 relative transition-all duration-300 ${profileFontVariables}`}
                style={{
                  scrollbarWidth: "none",
                  ...(theme === "CUSTOM" ? customThemeStyle(customTheme) : {}),
                }}
              >
                <div className="[zoom:var(--mp-zoom,1)]">
                  {/* Avatar + Identity */}
                  <div className="flex flex-col items-center text-center space-y-2.5 mb-6">
                    {avatarUrl ? (
                      <Image unoptimized width={80} height={80}
                        src={avatarUrl}
                        alt={t("Avatar preview")}
                        className={`w-20 h-20 rounded-full object-cover border-2 ${themeConfig.classes.avatarBorder} transition-all duration-300`}
                      />
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-full bg-gradient-to-br from-coral to-coral-dark flex items-center justify-center text-white font-bold text-2xl border-2 ${themeConfig.classes.avatarBorder}`}
                      >
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h2 className={`text-base ${themeConfig.classes.displayName}`}>
                        {displayName || t("Seu Nome")}
                      </h2>
                      <span className={`inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-full mt-1 ${themeConfig.classes.handleBadge}`}>
                        @{handle || "handle"}
                      </span>
                    </div>

                    {bio && (
                      <p className={`text-xs max-w-[260px] leading-relaxed ${themeConfig.classes.bio}`}>
                        {bio}
                      </p>
                    )}
                  </div>

                  {/* Rendered Live Blocks */}
                  <div className="space-y-3">
                    {blocks
                      .filter((b) => b.isActive)
                      .map((block) => {
                        if (block.type === ProfileBlockType.TEXT_DIVIDER) {
                          return (
                            <div key={block.id} className="py-2 text-center">
                              <span className={`text-xs font-bold uppercase tracking-wider ${themeConfig.classes.divider}`}>
                                {block.title}
                              </span>
                            </div>
                          );
                        }

                        if (block.type === ProfileBlockType.SOCIAL_LINKS && block.config?.links) {
                          const links = block.config.links as Array<{ platform: string; url: string }>;
                          return (
                            <div key={block.id} className="flex items-center justify-center gap-2 py-2 flex-wrap">
                              {links.map((s, idx) => {
                                const button = socialButtonProps(s.platform, previewIconStyle, themeConfig);
                                return (
                                  <div
                                    key={idx}
                                    title={getSocialPlatform(s.platform).label}
                                    className={button.className.replace("w-11 h-11", "w-9 h-9")}
                                    style={button.style}
                                  >
                                    <SocialGlyph platform={s.platform} className="w-4 h-4" />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={block.id}
                            className={`w-full p-3.5 ${themeConfig.classes.linkRadius ?? "rounded-2xl"} flex items-center gap-3 ${themeConfig.classes.linkCard} ${themeConfig.classes.linkCardHover}`}
                          >
                            {block.imageUrl && (
                              <Image unoptimized width={32} height={32}
                                src={block.imageUrl}
                                alt=""
                                className="w-8 h-8 rounded-xl object-cover border border-border flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1 text-center">
                              <p className={`text-xs ${themeConfig.classes.linkTitle} truncate`}>
                                {block.title}
                              </p>
                              {block.description && (
                                <p className={`${themeConfig.classes.linkDescription} truncate mt-0.5`}>
                                  {block.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Preview Footer Badge */}
                <div className="pt-8 pb-2 text-center">
                  <span className={`text-[10px] font-semibold tracking-wider uppercase opacity-75 ${themeConfig.classes.footerText}`}>
                    meuperfil.me
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD BLOCK */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/40 backdrop-blur-sm animate-fade-in">
          <ModalScrollLock />
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="glass-strong rounded-2xl w-full max-w-lg p-6 space-y-5 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{t("Adicionar Novo Bloco")}</h3>
              <button
                onClick={() => { setShowAddBlockModal(false); setModalError(null); }}
                className="text-muted hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewBlockType(ProfileBlockType.LINK)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  newBlockType === ProfileBlockType.LINK
                    ? "border-accent bg-accent/20 text-foreground"
                    : "border-border bg-background text-muted"
                }`}
              >
                {t("Link / Botão")}
              </button>
              <button
                type="button"
                onClick={() => setNewBlockType(ProfileBlockType.TEXT_DIVIDER)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  newBlockType === ProfileBlockType.TEXT_DIVIDER
                    ? "border-accent bg-accent/20 text-foreground"
                    : "border-border bg-background text-muted"
                }`}
              >
                {t("Texto / Divisor")}
              </button>
              <button
                type="button"
                onClick={() => setNewBlockType(ProfileBlockType.SOCIAL_LINKS)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  newBlockType === ProfileBlockType.SOCIAL_LINKS
                    ? "border-accent bg-accent/20 text-foreground"
                    : "border-border bg-background text-muted"
                }`}
              >
                {t("Redes Sociais")}
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  {newBlockType === ProfileBlockType.TEXT_DIVIDER ? t("Texto do Divisor") : t("Título")}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  placeholder={
                    newBlockType === ProfileBlockType.TEXT_DIVIDER
                      ? t("Ex: Meus Cursos & Produtos")
                      : t("Ex: Baixar E-book Grátis ou Agendar Reunião")
                  }
                  className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                />
                <p className="mt-1 text-right text-[11px] text-muted">{newBlockTitle.length}/100</p>
              </div>

              {newBlockType === ProfileBlockType.LINK && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                      {t("URL de Destino")}
                    </label>
                    <input
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={newBlockUrl}
                      onChange={(e) => setNewBlockUrl(e.target.value)}
                      placeholder={t("seusite.com.br/oferta")}
                      className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground font-mono focus:border-accent focus:outline-none transition"
                    />
                    {linkPreview(normalizeWebUrl(newBlockUrl), newBlockUrl)}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                      {t("Subtítulo / Descrição (Opcional)")}
                    </label>
                    <input
                      type="text"
                      maxLength={300}
                      value={newBlockDescription}
                      onChange={(e) => setNewBlockDescription(e.target.value)}
                      placeholder={t("Ex: Acesso instantâneo e 100% gratuito")}
                      className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                      {t("URL do Ícone ou Imagem (Opcional)")}
                    </label>
                    <input
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={newBlockImageUrl}
                      onChange={(e) => setNewBlockImageUrl(e.target.value)}
                      placeholder="seusite.com/imagem.png"
                      className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                    />
                    {linkPreview(normalizeWebUrl(newBlockImageUrl), newBlockImageUrl)}
                  </div>
                </>
              )}

              {newBlockType === ProfileBlockType.SOCIAL_LINKS && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">{t("Preencha os links das suas redes sociais:")}</p>
                  {socialLinks.map((s, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-foreground" style={{ backgroundColor: getSocialPlatform(s.platform).hex }}>
                          <SocialGlyph platform={s.platform} className="w-4 h-4" />
                        </span>
                        <select
                          value={s.platform}
                          onChange={(e) => {
                            const updated = [...socialLinks];
                            updated[idx] = { ...updated[idx], platform: e.target.value };
                            setSocialLinks(updated);
                          }}
                          aria-label={t("Rede")}
                          className="w-32 shrink-0 rounded-xl bg-background border border-border px-2 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                        >
                          {SOCIAL_PLATFORMS.map((p) => (
                            <option key={p.id} value={p.id}>{t(p.label)}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          inputMode={getSocialPlatform(s.platform).kind === "phone" ? "tel" : getSocialPlatform(s.platform).kind === "email" ? "email" : "url"}
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder={socialPlaceholder(s.platform)}
                          value={s.url}
                          onChange={(e) => {
                            const updated = [...socialLinks];
                            updated[idx] = { ...updated[idx], url: e.target.value };
                            setSocialLinks(updated);
                          }}
                          className="min-w-0 flex-1 rounded-xl bg-background border border-border px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== idx))}
                          aria-label={t("Remover")}
                          className="p-1.5 text-muted hover:text-error"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="pl-10">{linkPreview(normalizeSocialLink(s.platform, s.url), s.url)}</div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const used = new Set(socialLinks.map((l) => l.platform));
                      const next = SOCIAL_PLATFORMS.find((p) => !used.has(p.id))?.id ?? "website";
                      setSocialLinks([...socialLinks, { platform: next, url: "" }]);
                    }}
                    className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted hover:border-accent hover:text-foreground transition"
                  >
                    + {t("Adicionar rede ou canal")}
                  </button>
                </div>
              )}

              {modalError && (
                <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-xs text-error">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowAddBlockModal(false); setModalError(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  disabled={addingBlock}
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {addingBlock ? t("Adicionando...") : t("Adicionar Bloco")}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BLOCK */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/40 backdrop-blur-sm animate-fade-in">
          <ModalScrollLock />
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="glass-strong rounded-2xl w-full max-w-lg p-6 space-y-5 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{t("Editar Bloco")}</h3>
              <button onClick={() => { setEditingBlock(null); setModalError(null); }} className="text-muted hover:text-foreground p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  {t("Título")}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editingBlock.title || ""}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                />
                <p className="mt-1 text-right text-[11px] text-muted">{(editingBlock.title || "").length}/100</p>
              </div>

              {editingBlock.type === ProfileBlockType.LINK && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                      {t("URL de Destino")}
                    </label>
                    <input
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={editingBlock.url || ""}
                      onChange={(e) => setEditingBlock({ ...editingBlock, url: e.target.value })}
                      className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground font-mono focus:border-accent focus:outline-none transition"
                    />
                    {linkPreview(normalizeWebUrl(editingBlock.url || ""), editingBlock.url || "")}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                      {t("Subtítulo / Descrição")}
                    </label>
                    <input
                      type="text"
                      maxLength={300}
                      value={editingBlock.description || ""}
                      onChange={(e) =>
                        setEditingBlock({ ...editingBlock, description: e.target.value })
                      }
                      className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                      {t("URL do Ícone / Thumbnail")}
                    </label>
                    <input
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={editingBlock.imageUrl || ""}
                      onChange={(e) =>
                        setEditingBlock({ ...editingBlock, imageUrl: e.target.value })
                      }
                      className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none transition"
                    />
                    {linkPreview(normalizeWebUrl(editingBlock.imageUrl || ""), editingBlock.imageUrl || "")}
                  </div>
                </>
              )}

              {editingBlock.type === ProfileBlockType.SOCIAL_LINKS && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">{t("Links das suas redes sociais:")}</p>
                  {socialLinks.map((s, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-foreground" style={{ backgroundColor: getSocialPlatform(s.platform).hex }}>
                          <SocialGlyph platform={s.platform} className="w-4 h-4" />
                        </span>
                        <select
                          value={s.platform}
                          onChange={(e) => {
                            const updated = [...socialLinks];
                            updated[idx] = { ...updated[idx], platform: e.target.value };
                            setSocialLinks(updated);
                          }}
                          aria-label={t("Rede")}
                          className="w-32 shrink-0 rounded-xl bg-background border border-border px-2 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                        >
                          {SOCIAL_PLATFORMS.map((p) => (
                            <option key={p.id} value={p.id}>{t(p.label)}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          inputMode={getSocialPlatform(s.platform).kind === "phone" ? "tel" : getSocialPlatform(s.platform).kind === "email" ? "email" : "url"}
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder={socialPlaceholder(s.platform)}
                          value={s.url}
                          onChange={(e) => {
                            const updated = [...socialLinks];
                            updated[idx] = { ...updated[idx], url: e.target.value };
                            setSocialLinks(updated);
                          }}
                          className="min-w-0 flex-1 rounded-xl bg-background border border-border px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setSocialLinks(socialLinks.filter((_, i) => i !== idx))}
                          aria-label={t("Remover")}
                          className="p-1.5 text-muted hover:text-error"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="pl-10">{linkPreview(normalizeSocialLink(s.platform, s.url), s.url)}</div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const used = new Set(socialLinks.map((l) => l.platform));
                      const next = SOCIAL_PLATFORMS.find((p) => !used.has(p.id))?.id ?? "website";
                      setSocialLinks([...socialLinks, { platform: next, url: "" }]);
                    }}
                    className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted hover:border-accent hover:text-foreground transition"
                  >
                    + {t("Adicionar rede ou canal")}
                  </button>
                </div>
              )}

              {modalError && (
                <div role="alert" className="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-xs text-error">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setEditingBlock(null); setModalError(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  disabled={savingBlock}
                  className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {savingBlock ? t("Salvando...") : t("Salvar Bloco")}
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
