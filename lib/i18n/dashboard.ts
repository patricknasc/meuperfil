export type DashboardLocale = "pt" | "en" | "es";
const dictionaries = {
  pt: {
    plans: { FREE: "Plano Grátis", PRO: "Plano Pro", AGENCY: "Plano Agência" },
    dashboard: "Visão geral", profiles: "Link na bio", scheduler: "Agendador", campaigns: "Campanhas", leads: "Leads", logs: "Logs de DMs", settings: "Configurações", diagnostics: "Diagnósticos", signOut: "Sair",
    leadDescription: "Pessoas identificadas pelas interações com suas campanhas. Cliques anônimos não são contabilizados como leads.",
    search: "Buscar por nome, email ou Instagram", searchButton: "Buscar", all: "Todos", empty: "Nenhum lead encontrado. As interações com palavras-chave das campanhas aparecerão aqui.",
    person: "Contato", campaign: "Campanha", lastInteraction: "Última interação", status: "Status", saveError: "Não foi possível salvar. Tente novamente.", previous: "Anterior", next: "Próxima", viewLeads: "Ver leads desta campanha",
    NEW: "Novo", CONTACTED: "Contatado", QUALIFIED: "Qualificado", CONVERTED: "Convertido", LOST: "Perdido",
    loading: "Carregando…", loadError: "Não foi possível carregar os dados. Tente novamente.", connectFirst: "Conecte uma conta do Instagram nas configurações para publicar.",
  },
  en: {
    plans: { FREE: "Free plan", PRO: "Pro plan", AGENCY: "Agency plan" },
    dashboard: "Overview", profiles: "Bio link", scheduler: "Scheduler", campaigns: "Campaigns", leads: "Leads", logs: "DM logs", settings: "Settings", diagnostics: "Diagnostics", signOut: "Sign out",
    leadDescription: "People identified through campaign interactions. Anonymous clicks are not counted as leads.",
    search: "Search by name, email or Instagram", searchButton: "Search", all: "All", empty: "No leads found. Campaign keyword interactions will appear here.",
    person: "Contact", campaign: "Campaign", lastInteraction: "Last interaction", status: "Status", saveError: "Could not save. Please try again.", previous: "Previous", next: "Next", viewLeads: "View campaign leads",
    NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", CONVERTED: "Converted", LOST: "Lost",
    loading: "Loading…", loadError: "Could not load data. Please try again.", connectFirst: "Connect an Instagram account in settings to publish.",
  },
  es: {
    plans: { FREE: "Plan Gratis", PRO: "Plan Pro", AGENCY: "Plan Agencia" },
    dashboard: "Resumen", profiles: "Enlace en bio", scheduler: "Programador", campaigns: "Campañas", leads: "Leads", logs: "Registros de DM", settings: "Configuración", diagnostics: "Diagnósticos", signOut: "Cerrar sesión",
    leadDescription: "Personas identificadas mediante interacciones con las campañas. Los clics anónimos no se cuentan como leads.",
    search: "Buscar por nombre, email o Instagram", searchButton: "Buscar", all: "Todos", empty: "No se encontraron leads. Las interacciones con palabras clave de las campañas aparecerán aquí.",
    person: "Contacto", campaign: "Campaña", lastInteraction: "Última interacción", status: "Estado", saveError: "No se pudo guardar. Inténtalo de nuevo.", previous: "Anterior", next: "Siguiente", viewLeads: "Ver leads de la campaña",
    NEW: "Nuevo", CONTACTED: "Contactado", QUALIFIED: "Cualificado", CONVERTED: "Convertido", LOST: "Perdido",
    loading: "Cargando…", loadError: "No se pudieron cargar los datos. Inténtalo de nuevo.", connectFirst: "Conecta una cuenta de Instagram en la configuración para publicar.",
  },
};
export function dashboardMessages(locale: string) {
  return dictionaries[locale === "en" || locale === "es" ? locale : "pt"];
}
