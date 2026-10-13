"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export type PostMediaType = "IMAGE" | "VIDEO" | "CAROUSEL" | "REEL" | "STORY";
export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED";

interface InstagramAccountSummary {
  id: string;
  instagramId: string;
  username: string;
  name?: string | null;
}

interface ScheduledPostItem {
  id: string;
  caption: string | null;
  mediaUrls: string[];
  mediaType: PostMediaType;
  platform: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  status: PostStatus;
  publishedPostId: string | null;
  publishedPostUrl: string | null;
  errorMessage: string | null;
  autoCampaignEnabled: boolean;
  autoCampaignKeywords: string[];
  autoCampaignDmMessage: string | null;
  createdAutomationId: string | null;
  createdAt: string;
  instagramAccount?: InstagramAccountSummary | null;
}

export default function SchedulerPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";

  // Data states
  const [posts, setPosts] = useState<ScheduledPostItem[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar");

  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Modal / Drawer state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Form State
  const [formAccountId, setFormAccountId] = useState("");
  const [formMediaType, setFormMediaType] = useState<PostMediaType>("REEL");
  const [formMediaUrls, setFormMediaUrls] = useState<string[]>([""]);
  const [formCaption, setFormCaption] = useState("");
  const [formScheduledFor, setFormScheduledFor] = useState("");
  const [formAutoCampaign, setFormAutoCampaign] = useState(true);
  const [formKeywords, setFormKeywords] = useState("QUERO, LINK, EU");
  const [formDmMessage, setFormDmMessage] = useState("Olá! Aqui está o link que você pediu: https://meuperfil.me");
  const [formError, setFormError] = useState<string | null>(null);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [postsRes, accountsRes] = await Promise.all([
        fetch("/api/scheduler/posts"),
        fetch("/api/instagram/sync-media").catch(() => null), // or fallback to workspace accounts
      ]);

      const postsData = await postsRes.json();
      if (postsData.success) {
        setPosts(postsData.data);
      }

      // If sync-media gives accounts or fallback to accounts extracted from posts
      const extractedAccounts: InstagramAccountSummary[] = [];
      if (postsData.data) {
        postsData.data.forEach((p: ScheduledPostItem) => {
          if (p.instagramAccount && !extractedAccounts.some((a) => a.id === p.instagramAccount!.id)) {
            extractedAccounts.push(p.instagramAccount);
          }
        });
      }

      // Also try fetching accounts list from dashboard/settings if available
      try {
        const accRes = await fetch("/api/instagram/automations");
        const accData = await accRes.json();
        if (accData.success && accData.data?.accounts) {
          accData.data.accounts.forEach((acc: InstagramAccountSummary) => {
            if (!extractedAccounts.some((a) => a.id === acc.id)) {
              extractedAccounts.push(acc);
            }
          });
        }
      } catch {}

      setAccounts(extractedAccounts);
      if (extractedAccounts.length > 0 && !formAccountId) {
        setFormAccountId(extractedAccounts[0].id);
      }
    } catch (err) {
      console.error("Error fetching scheduler data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (selectedAccountId !== "ALL" && p.instagramAccount?.id !== selectedAccountId) return false;
      return true;
    });
  }, [posts, statusFilter, selectedAccountId]);

  // Calendar calculation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean; posts: ScheduledPostItem[] }> = [];

    // Previous month filler days
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({ date: d, isCurrentMonth: false, posts: [] });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dayPosts = filteredPosts.filter((p) => {
        if (!p.scheduledFor) return false;
        const postDate = new Date(p.scheduledFor);
        return (
          postDate.getFullYear() === year &&
          postDate.getMonth() === month &&
          postDate.getDate() === dayNum
        );
      });
      days.push({ date: d, isCurrentMonth: true, posts: dayPosts });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, posts: [] });
    }

    return days;
  }, [currentMonth, filteredPosts]);

  // Quick schedule helper
  function setQuickSchedule(hoursAhead: number, targetHour?: number) {
    const d = new Date();
    if (targetHour !== undefined) {
      d.setDate(d.getDate() + (hoursAhead > 0 ? 1 : 0));
      d.setHours(targetHour, 0, 0, 0);
    } else {
      d.setTime(d.getTime() + hoursAhead * 60 * 60 * 1000);
    }
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFormScheduledFor(localIso);
  }

  function openCreateModal(datePreset?: Date) {
    setEditingPostId(null);
    setFormMediaType("REEL");
    setFormMediaUrls(["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"]);
    setFormCaption("");
    setFormAutoCampaign(true);
    setFormKeywords("QUERO, LINK, EU");
    setFormDmMessage("Olá! Aqui está o link exclusivo que você pediu: https://meuperfil.me");
    setFormError(null);

    if (datePreset) {
      const d = new Date(datePreset);
      d.setHours(18, 0, 0, 0);
      const pad = (n: number) => n.toString().padStart(2, "0");
      setFormScheduledFor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setQuickSchedule(24, 18); // Tomorrow at 18:00
    }

    setShowModal(true);
  }

  function openEditModal(post: ScheduledPostItem) {
    setEditingPostId(post.id);
    setFormAccountId(post.instagramAccount?.id || accounts[0]?.id || "");
    setFormMediaType(post.mediaType);
    setFormMediaUrls(post.mediaUrls.length > 0 ? post.mediaUrls : [""]);
    setFormCaption(post.caption || "");
    setFormAutoCampaign(post.autoCampaignEnabled);
    setFormKeywords(post.autoCampaignKeywords.join(", "));
    setFormDmMessage(post.autoCampaignDmMessage || "");
    setFormError(null);

    if (post.scheduledFor) {
      const d = new Date(post.scheduledFor);
      const pad = (n: number) => n.toString().padStart(2, "0");
      setFormScheduledFor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setFormScheduledFor("");
    }

    setShowModal(true);
  }

  async function handleSave(publishNow = false) {
    setFormError(null);
    const validUrls = formMediaUrls.filter((u) => u.trim().length > 0);

    if (validUrls.length === 0) {
      setFormError("Informe pelo menos uma URL de mídia válida.");
      return;
    }

    if (!formAccountId && accounts.length > 0) {
      setFormAccountId(accounts[0].id);
    }

    setSubmitting(true);
    try {
      const keywordsArray = formKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const scheduledIso = formScheduledFor ? new Date(formScheduledFor).toISOString() : null;

      if (editingPostId) {
        // Update
        const res = await fetch(`/api/scheduler/posts/${editingPostId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caption: formCaption,
            mediaUrls: validUrls,
            mediaType: formMediaType,
            scheduledFor: scheduledIso,
            autoCampaignEnabled: formAutoCampaign,
            autoCampaignKeywords: keywordsArray,
            autoCampaignDmMessage: formDmMessage,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast("Post atualizado com sucesso!");
      } else {
        // Create
        const res = await fetch("/api/scheduler/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagramAccountId: formAccountId || accounts[0]?.id,
            caption: formCaption,
            mediaUrls: validUrls,
            mediaType: formMediaType,
            scheduledFor: scheduledIso,
            publishNow,
            autoCampaignEnabled: formAutoCampaign,
            autoCampaignKeywords: keywordsArray,
            autoCampaignDmMessage: formDmMessage,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast(publishNow ? "Publicação disparada para o Instagram!" : "Post agendado com sucesso!");
      }

      setShowModal(false);
      fetchInitialData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar post";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Deseja realmente cancelar e excluir este post agendado?")) return;
    try {
      const res = await fetch(`/api/scheduler/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Post cancelado com sucesso.");
        fetchInitialData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePublishNow(postId: string) {
    if (!confirm("Deseja forçar a publicação imediata no Instagram agora?")) return;
    try {
      const res = await fetch(`/api/scheduler/posts/${postId}/publish-now`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Publicação imediata enfileirada no worker!");
        fetchInitialData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const selectedAccount = accounts.find((a) => a.id === formAccountId) || accounts[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-indigo-500/20 border border-indigo-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Novo Módulo
            </span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Agendador de Conteúdo
            </h1>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Planeje Reels, Carrosséis e Stories com disparo automático de DMs na publicação.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setActiveView("calendar")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === "calendar"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
              </svg>
              Calendário
            </button>
            <button
              onClick={() => setActiveView("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === "list"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z" />
              </svg>
              Lista
            </button>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agendar Publicação
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-medium">Agendados</p>
            <p className="text-2xl font-bold text-white mt-1">
              {posts.filter((p) => p.status === "SCHEDULED").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-medium">Publicados</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {posts.filter((p) => p.status === "PUBLISHED").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-medium">Rascunhos</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {posts.filter((p) => p.status === "DRAFT").length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-xs font-medium">Automações Ligadas</p>
            <p className="text-2xl font-bold text-violet-400 mt-1">
              {posts.filter((p) => p.autoCampaignEnabled || p.createdAutomationId).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main View: Calendar or List */}
      {activeView === "calendar" ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden p-6 space-y-6">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white capitalize">
                {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = new Date(currentMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentMonth(prev);
                }}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const next = new Date(currentMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentMonth(next);
                }}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isToday =
                new Date().toDateString() === day.date.toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => openCreateModal(day.date)}
                  className={`min-h-[110px] p-2 rounded-xl border transition group cursor-pointer flex flex-col justify-between ${
                    day.isCurrentMonth
                      ? isToday
                        ? "bg-indigo-950/20 border-indigo-500/50 shadow-inner"
                        : "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700"
                      : "bg-zinc-950/40 border-zinc-900/40 opacity-40 hover:opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-400 group-hover:text-white"
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                    <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition">
                      + Agendar
                    </span>
                  </div>

                  {/* Day Posts Badges */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                    {day.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(post);
                        }}
                        className={`p-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between gap-1 border transition hover:scale-[1.02] ${
                          post.status === "PUBLISHED"
                            ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                            : post.status === "FAILED"
                            ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                            : "bg-indigo-950/50 border-indigo-800/60 text-indigo-200"
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span>
                            {post.mediaType === "REEL"
                              ? "🎬"
                              : post.mediaType === "CAROUSEL"
                              ? "📑"
                              : post.mediaType === "STORY"
                              ? "⏳"
                              : "📷"}
                          </span>
                          <span className="truncate">
                            {post.caption || "Sem legenda"}
                          </span>
                        </div>
                        <span className="text-[9px] opacity-75 shrink-0">
                          {post.scheduledFor
                            ? new Date(post.scheduledFor).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
          {/* List Filters */}
          <div className="p-4 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {["ALL", "SCHEDULED", "PUBLISHED", "DRAFT", "FAILED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    statusFilter === st
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                      : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {st === "ALL"
                    ? "Todos"
                    : st === "SCHEDULED"
                    ? "Agendados"
                    : st === "PUBLISHED"
                    ? "Publicados"
                    : st === "DRAFT"
                    ? "Rascunhos"
                    : "Falhas"}
                </button>
              ))}
            </div>

            {accounts.length > 1 && (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="ALL">Todas as Contas</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    @{acc.username}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center mx-auto text-zinc-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <p className="text-zinc-300 font-medium">Nenhum post agendado nesta visão.</p>
              <button
                onClick={() => openCreateModal()}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
              >
                Criar primeiro agendamento
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredPosts.map((post) => (
                <div key={post.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/30 transition">
                  <div className="flex items-start gap-4">
                    {/* Media Thumbnail */}
                    <div className="w-16 h-20 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700 relative">
                      {post.mediaUrls[0] ? (
                        <img
                          src={post.mediaUrls[0]}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                          Sem foto
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white backdrop-blur">
                        {post.mediaType === "REEL"
                          ? "Reel"
                          : post.mediaType === "CAROUSEL"
                          ? "Carrossel"
                          : post.mediaType === "STORY"
                          ? "Story"
                          : "Feed"}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            post.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : post.status === "FAILED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : post.status === "PUBLISHING"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {post.status}
                        </span>

                        {post.instagramAccount && (
                          <span className="text-xs text-zinc-400 font-medium">
                            @{post.instagramAccount.username}
                          </span>
                        )}

                        {post.autoCampaignEnabled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1">
                            <span>💬</span> DM Ativa
                          </span>
                        )}
                        {post.createdAutomationId && (
                          <Link
                            href={`/${lang}/campaigns/${post.createdAutomationId}`}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 transition hover:bg-emerald-500/20"
                          >
                            <span>↗</span> Campanha criada
                          </Link>
                        )}
                      </div>

                      <p className="text-sm text-zinc-200 line-clamp-2 max-w-xl">
                        {post.caption || <span className="italic text-zinc-500">Sem legenda</span>}
                      </p>

                      <div className="text-xs text-zinc-400 flex items-center gap-3">
                        <span>
                          📅{" "}
                          {post.scheduledFor
                            ? new Date(post.scheduledFor).toLocaleString("pt-BR")
                            : "Sem data agendada"}
                        </span>
                        {post.publishedPostUrl && (
                          <a
                            href={post.publishedPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            Ver no Instagram
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        )}
                      </div>

                      {post.errorMessage && (
                        <p className="text-xs text-rose-400 bg-rose-950/30 p-1.5 rounded-lg border border-rose-800/30">
                          Erro: {post.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {post.status !== "PUBLISHED" && post.status !== "PUBLISHING" && (
                      <>
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                        >
                          Publicar Agora
                        </button>
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 transition"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Creation / Edit Drawer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingPostId ? "Editar Publicação Agendada" : "Novo Agendamento no Instagram"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Configure mídia, legenda, horário e gatilho de Comentário → Direct.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Two columns (Editor & Phone Simulator) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto p-6 gap-8">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    {formError}
                  </div>
                )}

                {/* Account Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Conta do Instagram
                  </label>
                  {accounts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      Nenhuma conta do Instagram conectada neste workspace. Vá em{" "}
                      <Link href={`/${lang}/settings`} className="underline font-bold">
                        Ajustes &gt; Conectar Instagram
                      </Link>{" "}
                      para vincular.
                    </div>
                  ) : (
                    <select
                      value={formAccountId}
                      onChange={(e) => setFormAccountId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none focus:border-indigo-500 transition"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          @{acc.username} {acc.name ? `(${acc.name})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Media Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Tipo de Formato
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: "REEL", label: "Reels", icon: "🎬" },
                      { type: "IMAGE", label: "Feed Foto", icon: "📷" },
                      { type: "CAROUSEL", label: "Carrossel", icon: "📑" },
                      { type: "STORY", label: "Story", icon: "⏳" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setFormMediaType(item.type as PostMediaType)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                          formMediaType === item.type
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media URLs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      URL da Mídia (Imagem ou Vídeo MP4)
                    </label>
                    {formMediaType === "CAROUSEL" && (
                      <button
                        type="button"
                        onClick={() => setFormMediaUrls([...formMediaUrls, ""])}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        + Adicionar Mídia ao Carrossel
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {formMediaUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="https://exemplo.com/video-reel.mp4 ou .jpg"
                          value={url}
                          onChange={(e) => {
                            const updated = [...formMediaUrls];
                            updated[idx] = e.target.value;
                            setFormMediaUrls(updated);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition"
                        />
                        {formMediaUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormMediaUrls(formMediaUrls.filter((_, i) => i !== idx))}
                            className="p-2 text-zinc-500 hover:text-rose-400 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caption Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Legenda do Post
                    </label>
                    <span className="text-[11px] text-zinc-500">
                      {formCaption.length} / 2.200
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Escreva a legenda envolvente do seu post... Diga para comentarem a palavra-chave!"
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500 transition"
                  />
                  {/* Quick Hashtags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["#meuperfil", "#instagramgrowth", "#linknabio", "#marketingdigital"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormCaption((prev) => `${prev} ${tag}`.trim())}
                        className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule Date & Time */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Data e Horário de Publicação
                  </label>
                  <input
                    type="datetime-local"
                    value={formScheduledFor}
                    onChange={(e) => setFormScheduledFor(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 transition"
                  />
                  {/* Quick Scheduling Shortcuts */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(0, 18)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] text-zinc-300 transition"
                    >
                      Hoje 18:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(24, 12)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] text-zinc-300 transition"
                    >
                      Amanhã 12:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(24, 19)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] text-zinc-300 transition"
                    >
                      Amanhã 19:00
                    </button>
                  </div>
                </div>

                {/* Integrated Auto-Campaign */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-950/30 to-indigo-950/20 border border-violet-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">Automação Comentário → Direct</h4>
                        <p className="text-[11px] text-zinc-400">
                          Dispara DM automática assim que alguém comentar no post publicado.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormAutoCampaign(!formAutoCampaign)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        formAutoCampaign ? "bg-indigo-600" : "bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          formAutoCampaign ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {formAutoCampaign && (
                    <div className="space-y-3 pt-2 border-t border-violet-500/20">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Palavras-chave Gatilho (separadas por vírgula)
                        </label>
                        <input
                          type="text"
                          value={formKeywords}
                          onChange={(e) => setFormKeywords(e.target.value)}
                          placeholder="QUERO, LINK, PRECO, EU"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Mensagem enviada no Direct (DM)
                        </label>
                        <textarea
                          rows={2}
                          value={formDmMessage}
                          onChange={(e) => setFormDmMessage(e.target.value)}
                          placeholder="Olá! Conforme prometido no post, aqui está seu link..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Phone Mockup (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="text-center mb-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Simulador em Tempo Real
                  </span>
                </div>

                {/* Phone Frame */}
                <div className="w-[290px] h-[580px] bg-black rounded-[44px] p-3 border-[6px] border-zinc-800 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="w-20 h-4 bg-zinc-900 rounded-full mx-auto mb-2 shrink-0" />

                  {/* Mock Post Content */}
                  <div className="bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between overflow-hidden border border-zinc-900">
                    {/* IG Header */}
                    <div className="p-3 flex items-center justify-between border-b border-zinc-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-white">
                            {selectedAccount?.username ? selectedAccount.username[0].toUpperCase() : "M"}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                          @{selectedAccount?.username || "seuperfil"}
                        </span>
                      </div>
                      <span className="text-zinc-600 text-xs">•••</span>
                    </div>

                    {/* Media Area */}
                    <div className="flex-1 bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                      {formMediaUrls[0] && formMediaUrls[0].trim().length > 0 ? (
                        <img
                          src={formMediaUrls[0]}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-zinc-600 space-y-1">
                          <span className="text-2xl">🎬</span>
                          <p className="text-[10px]">Insira uma URL de mídia para visualizar</p>
                        </div>
                      )}

                      {formMediaType === "REEL" && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] font-bold text-white flex items-center gap-1">
                          <span>🎬</span> Reels
                        </div>
                      )}
                    </div>

                    {/* IG Action Bar */}
                    <div className="p-3 space-y-2 bg-zinc-950">
                      <div className="flex items-center justify-between text-zinc-200">
                        <div className="flex items-center gap-3 text-sm">
                          <span>❤️</span>
                          <span>💬</span>
                          <span>✈️</span>
                        </div>
                        <span className="text-sm">🔖</span>
                      </div>

                      {/* Mock Caption */}
                      <p className="text-[11px] text-zinc-300 line-clamp-2">
                        <span className="font-bold text-white mr-1.5">
                          {selectedAccount?.username || "seuperfil"}
                        </span>
                        {formCaption || "Escreva a sua legenda..."}
                      </p>

                      {/* Auto Campaign Bubble in Preview */}
                      {formAutoCampaign && (
                        <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-[9px] text-indigo-300 flex items-center gap-1.5">
                          <span>💬</span>
                          <span className="truncate">Gatilho: {formKeywords}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Home Bar */}
                  <div className="w-24 h-1 bg-zinc-700 rounded-full mx-auto mt-2 shrink-0" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave(false)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar Agendamento"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSave(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Publicando..." : "Publicar Imediatamente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
