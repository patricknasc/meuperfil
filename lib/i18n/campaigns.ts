import { flowTranslator } from "./flows";

const entries: Record<string, [string, string, string]> = {
  "Active": [
    "Ativas",
    "Active",
    "Activas"
  ],
  "Sent": [
    "Enviadas",
    "Sent",
    "Enviados"
  ],
  "Clicks": [
    "Cliques",
    "Clicks",
    "Clics"
  ],
  "Avg CTR": [
    "CTR médio",
    "Avg CTR",
    "CTR medio"
  ],
  "Executive view": [
    "Visão executiva",
    "Executive view",
    "Vista ejecutiva"
  ],
  "Portfolio health": [
    "Saúde das campanhas",
    "Portfolio health",
    "Estado de las campañas"
  ],
  "Strong": [
    "Forte",
    "Strong",
    "Fuerte"
  ],
  "Growing": [
    "Em crescimento",
    "Growing",
    "En crecimiento"
  ],
  "Early": [
    "Inicial",
    "Early",
    "Inicial"
  ],
  "Leaderboard": [
    "Classificação",
    "Leaderboard",
    "Clasificación"
  ],
  "Campaign performance": [
    "Desempenho das campanhas",
    "Campaign performance",
    "Rendimiento de las campañas"
  ],
  "Paused": [
    "Pausada",
    "Paused",
    "Pausada"
  ],
  "All": [
    "Todas",
    "All",
    "Todas"
  ],
  "Needs attention": [
    "Precisa de atenção",
    "Needs attention",
    "Necesita atención"
  ],
  "New Campaign": [
    "Nova campanha",
    "New Campaign",
    "Nueva campaña"
  ],
  "No campaigns yet": [
    "Nenhuma campanha ainda",
    "No campaigns yet",
    "Todavía no hay campañas"
  ],
  "Create your first comment-to-DM campaign to turn a post or reel into a measurable conversation flow.": [
    "Crie sua primeira campanha de comentário para DM e acompanhe os resultados de uma publicação ou Reel.",
    "Create your first comment-to-DM campaign to turn a post or reel into a measurable conversation flow.",
    "Crea tu primera campaña de comentario a DM y mide los resultados de una publicación o Reel."
  ],
  "Create Campaign": [
    "Criar campanha",
    "Create Campaign",
    "Crear campaña"
  ],
  "Top keyword": [
    "Principal palavra-chave",
    "Top keyword",
    "Palabra clave principal"
  ],
  "Recommendation": [
    "Recomendação",
    "Recommendation",
    "Recomendación"
  ],
  "Next move": [
    "Próxima ação",
    "Next move",
    "Próxima acción"
  ],
  "Whole word": [
    "Palavra inteira",
    "Whole word",
    "Palabra completa"
  ],
  "Partial match": [
    "Correspondência parcial",
    "Partial match",
    "Coincidencia parcial"
  ],
  "Tracked link": [
    "Link rastreado",
    "Tracked link",
    "Enlace rastreado"
  ],
  "Open": [
    "Abrir",
    "Open",
    "Abrir"
  ],
  "Client report": [
    "Relatório do cliente",
    "Client report",
    "Informe del cliente"
  ],
  "Public": [
    "Público",
    "Public",
    "Público"
  ],
  "Disabled": [
    "Desativado",
    "Disabled",
    "Desactivado"
  ],
  "Copy": [
    "Copiar",
    "Copy",
    "Copiar"
  ],
  "View": [
    "Ver",
    "View",
    "Ver"
  ],
  "Delete this campaign? This cannot be undone.": [
    "Excluir esta campanha? Esta ação não pode ser desfeita.",
    "Delete this campaign? This cannot be undone.",
    "¿Eliminar esta campaña? Esta acción no se puede deshacer."
  ],
  "Campaign not found": [
    "Campanha não encontrada",
    "Campaign not found",
    "Campaña no encontrada"
  ],
  "This campaign may have been deleted or is no longer available.": [
    "Esta campanha pode ter sido excluída ou não estar mais disponível.",
    "This campaign may have been deleted or is no longer available.",
    "Esta campaña puede haberse eliminado o ya no estar disponible."
  ],
  "Back to campaigns": [
    "Voltar às campanhas",
    "Back to campaigns",
    "Volver a las campañas"
  ],
  "Campaign overview": [
    "Visão geral da campanha",
    "Campaign overview",
    "Resumen de la campaña"
  ],
  "Edit": [
    "Editar",
    "Edit",
    "Editar"
  ],
  "Back": [
    "Voltar",
    "Back",
    "Volver"
  ],
  "Keywords": [
    "Palavras-chave",
    "Keywords",
    "Palabras clave"
  ],
  "Goal": [
    "Objetivo",
    "Goal",
    "Objetivo"
  ],
  "Expected outcome": [
    "Resultado esperado",
    "Expected outcome",
    "Resultado esperado"
  ],
  "DM template": [
    "Modelo de DM",
    "DM template",
    "Plantilla de DM"
  ],
  "Keyword momentum": [
    "Desempenho das palavras-chave",
    "Keyword momentum",
    "Rendimiento de las palabras clave"
  ],
  "No keyword data yet.": [
    "Ainda não há dados de palavras-chave.",
    "No keyword data yet.",
    "Todavía no hay datos de palabras clave."
  ],
  "Tracked links": [
    "Links rastreados",
    "Tracked links",
    "Enlaces rastreados"
  ],
  "Performance": [
    "Desempenho",
    "Performance",
    "Rendimiento"
  ],
  "Skipped": [
    "Ignoradas",
    "Skipped",
    "Omitidos"
  ],
  "Failed": [
    "Falhas",
    "Failed",
    "Fallidos"
  ],
  "Click rate": [
    "Taxa de cliques",
    "Click rate",
    "Tasa de clics"
  ],
  "Stage": [
    "Estágio",
    "Stage",
    "Etapa"
  ],
  "Insights": [
    "Análise",
    "Insights",
    "Análisis"
  ],
  "Priority": [
    "Prioridade",
    "Priority",
    "Prioridad"
  ],
  "Primary offer": [
    "Oferta principal",
    "Primary offer",
    "Oferta principal"
  ],
  "Attribution": [
    "Atribuição",
    "Attribution",
    "Atribución"
  ],
  "Engagement score": [
    "Pontuação de engajamento",
    "Engagement score",
    "Puntuación de interacción"
  ],
  "Band": [
    "Faixa",
    "Band",
    "Nivel"
  ],
  "Best link": [
    "Melhor link",
    "Best link",
    "Mejor enlace"
  ],
  "Top links": [
    "Principais links",
    "Top links",
    "Enlaces principales"
  ],
  "Settings": [
    "Configurações",
    "Settings",
    "Configuración"
  ],
  "Yes": [
    "Sim",
    "Yes",
    "Sí"
  ],
  "No": [
    "Não",
    "No",
    "No"
  ],
  "Report public": [
    "Relatório público",
    "Report public",
    "Informe público"
  ],
  "Shareable report": [
    "Relatório compartilhável",
    "Shareable report",
    "Informe compartible"
  ],
  "Hidden": [
    "Oculto",
    "Hidden",
    "Oculto"
  ],
  "Open report": [
    "Abrir relatório",
    "Open report",
    "Abrir informe"
  ],
  "Copy link": [
    "Copiar link",
    "Copy link",
    "Copiar enlace"
  ],
  "No data": [
    "Sem dados",
    "No data",
    "Sin datos"
  ],
  "Waiting": [
    "Aguardando",
    "Waiting",
    "En espera"
  ],
  "Monitoring": [
    "Monitorando",
    "Monitoring",
    "En seguimiento"
  ],
  "Working": [
    "Funcionando",
    "Working",
    "Funcionando"
  ],
  "Testing": [
    "Em teste",
    "Testing",
    "En prueba"
  ],
  "No tracked link": [
    "Sem link rastreado",
    "No tracked link",
    "Sin enlace rastreado"
  ],
  "Scale": [
    "Expandir",
    "Scale",
    "Ampliar"
  ],
  "Optimize": [
    "Otimizar",
    "Optimize",
    "Optimizar"
  ],
  "Fix": [
    "Corrigir",
    "Fix",
    "Corregir"
  ],
  "High": [
    "Alta",
    "High",
    "Alta"
  ],
  "Medium": [
    "Média",
    "Medium",
    "Media"
  ],
  "Low": [
    "Baixa",
    "Low",
    "Baja"
  ],
  "Campaign objective": [
    "Objetivo da campanha",
    "Campaign objective",
    "Objetivo de la campaña"
  ],
  "waitlist growth": [
    "crescimento da lista de espera",
    "waitlist growth",
    "crecimiento de la lista de espera"
  ],
  "lead capture": [
    "captura de leads",
    "lead capture",
    "captación de leads"
  ],
  "sales or booking intent": [
    "intenção de compra ou agendamento",
    "sales or booking intent",
    "intención de compra o reserva"
  ],
  "audience engagement": [
    "engajamento do público",
    "audience engagement",
    "interacción del público"
  ],
  "High intent": [
    "Alta intenção",
    "High intent",
    "Alta intención"
  ],
  "Growing intent": [
    "Intenção crescente",
    "Growing intent",
    "Intención creciente"
  ],
  "Early stage": [
    "Estágio inicial",
    "Early stage",
    "Etapa inicial"
  ],
  "conversion": [
    "conversão",
    "conversion",
    "conversión"
  ],
  "mentions": [
    "menções",
    "mentions",
    "menciones"
  ],
  "share": [
    "participação",
    "share",
    "participación"
  ],
  "sent": [
    "enviadas",
    "sent",
    "enviados"
  ],
  "clicks": [
    "cliques",
    "clicks",
    "clics"
  ],
  "skipped": [
    "ignoradas",
    "skipped",
    "omitidos"
  ],
  "failed": [
    "falhas",
    "failed",
    "fallidos"
  ],
  "Name, message, and at least one keyword are required.": [
    "Informe o nome, a mensagem e pelo menos uma palavra-chave.",
    "Name, message, and at least one keyword are required.",
    "Introduce el nombre, el mensaje y al menos una palabra clave."
  ],
  "{shown} of {total} campaigns": [
    "{shown} de {total} campanhas",
    "{shown} of {total} campaigns",
    "{shown} de {total} campañas"
  ],
  "{shown} of {total} campaign": [
    "{shown} de {total} campanha",
    "{shown} of {total} campaign",
    "{shown} de {total} campaña"
  ],
  "This campaign is ready to scale. Increase volume on the winning message and keep the current offer stable.": [
    "Esta campanha está pronta para crescer. Amplie o envio da mensagem com melhor desempenho e mantenha a oferta atual.",
    "This campaign is ready to scale. Increase volume on the winning message and keep the current offer stable.",
    "Esta campaña está lista para crecer. Aumenta el envío del mensaje ganador y mantén la oferta actual."
  ],
  "This campaign is performing, but still needs a sharper message. Optimize the CTA and offer around LINK before scaling.": [
    "Esta campanha tem resultados, mas precisa de uma mensagem mais clara. Otimize a chamada para ação e a oferta em torno de LINK antes de ampliar.",
    "This campaign is performing, but still needs a sharper message. Optimize the CTA and offer around LINK before scaling.",
    "Esta campaña tiene resultados, pero necesita un mensaje más claro. Optimiza la llamada a la acción y la oferta en torno a LINK antes de ampliar."
  ],
  "This campaign needs a stronger offer and a clearer trigger before it can scale effectively.": [
    "Esta campanha precisa de uma oferta mais forte e de um gatilho mais claro antes de crescer.",
    "This campaign needs a stronger offer and a clearer trigger before it can scale effectively.",
    "Esta campaña necesita una oferta más fuerte y un disparador más claro antes de crecer."
  ],
  "This campaign is paused or hasn't started sending enough volume to make an executive call yet.": [
    "Esta campanha está pausada ou ainda não tem envios suficientes para orientar uma decisão.",
    "This campaign is paused or hasn't started sending enough volume to make an executive call yet.",
    "Esta campaña está pausada o todavía no tiene suficientes envíos para orientar una decisión."
  ],
  "Scale the strongest creative around {keyword} and increase delivery on the current winning flow.": [
    "Amplie o conteúdo de melhor desempenho em torno de {keyword} e aumente os envios do fluxo atual.",
    "Scale the strongest creative around {keyword} and increase delivery on the current winning flow.",
    "Amplía el contenido de mejor rendimiento en torno a {keyword} y aumenta los envíos del flujo actual."
  ],
  "Optimize the CTA and offer around {keyword} to improve conversion quality before a broader push.": [
    "Otimize a chamada para ação e a oferta em torno de {keyword} para melhorar a conversão antes de ampliar.",
    "Optimize the CTA and offer around {keyword} to improve conversion quality before a broader push.",
    "Optimiza la llamada a la acción y la oferta en torno a {keyword} para mejorar la conversión antes de ampliar."
  ],
  "Fix the offer and tighten the response trigger around {keyword} before expanding spend or volume.": [
    "Revise a oferta e ajuste o gatilho de resposta em torno de {keyword} antes de aumentar o investimento ou volume.",
    "Fix the offer and tighten the response trigger around {keyword} before expanding spend or volume.",
    "Revisa la oferta y ajusta el disparador de respuesta en torno a {keyword} antes de aumentar la inversión o el volumen."
  ],
  "Grow a qualified waitlist and turn attention into registrations.": [
    "Amplie uma lista de espera qualificada e transforme interesse em inscrições.",
    "Grow a qualified waitlist and turn attention into registrations.",
    "Amplía una lista de espera cualificada y convierte el interés en registros."
  ],
  "Capture high-intent leads and move them into an email or sales follow-up flow.": [
    "Capture leads com intenção de compra e encaminhe-os para acompanhamento por email ou vendas.",
    "Capture high-intent leads and move them into an email or sales follow-up flow.",
    "Capta leads con intención de compra y pásalos a un seguimiento por correo o ventas."
  ],
  "Turn interest into product demand, purchases, or booked conversations.": [
    "Transforme interesse em demanda pelo produto, compras ou conversas agendadas.",
    "Turn interest into product demand, purchases, or booked conversations.",
    "Convierte el interés en demanda del producto, compras o conversaciones reservadas."
  ],
  "Build momentum, intent, and repeat engagement from the top keyword.": [
    "Aumente o interesse e a recorrência de interação a partir da principal palavra-chave.",
    "Build momentum, intent, and repeat engagement from the top keyword.",
    "Aumenta el interés y la interacción recurrente a partir de la palabra clave principal."
  ],
  "This campaign is converting well. Keep the offer and tighten creative testing only if scale matters.": [
    "Esta campanha está convertendo bem. Mantenha a oferta e ajuste os testes de conteúdo se precisar ampliar.",
    "This campaign is converting well. Keep the offer and tighten creative testing only if scale matters.",
    "Esta campaña convierte bien. Mantén la oferta y ajusta las pruebas de contenido si necesitas ampliar."
  ],
  "This campaign is active but still underperforming. We should test a sharper CTA and a stronger headline around LINK.": [
    "Esta campanha está ativa, mas abaixo do esperado. Teste uma chamada para ação mais clara e um título mais forte em torno de LINK.",
    "This campaign is active but still underperforming. We should test a sharper CTA and a stronger headline around LINK.",
    "Esta campaña está activa, pero rinde menos de lo esperado. Prueba una llamada a la acción más clara y un título más fuerte en torno a LINK."
  ],
  "This campaign needs a tighter offer and a stronger response trigger before scaling.": [
    "Esta campanha precisa de uma oferta mais precisa e de um gatilho de resposta mais forte antes de ampliar.",
    "This campaign needs a tighter offer and a stronger response trigger before scaling.",
    "Esta campaña necesita una oferta más precisa y un disparador de respuesta más fuerte antes de ampliar."
  ],
  "This campaign is paused or has not started sending messages yet.": [
    "Esta campanha está pausada ou ainda não começou a enviar mensagens.",
    "This campaign is paused or has not started sending messages yet.",
    "Esta campaña está pausada o todavía no ha empezado a enviar mensajes."
  ],
  "Test a stronger CTA around {keyword} to lift the current {ctr}% CTR.": [
    "Teste uma chamada para ação mais forte em torno de {keyword} para elevar o CTR atual de {ctr}%.",
    "Test a stronger CTA around {keyword} to lift the current {ctr}% CTR.",
    "Prueba una llamada a la acción más fuerte en torno a {keyword} para aumentar el CTR actual del {ctr}%."
  ],
  "Keep the best-performing conversion path and trim weak variants.": [
    "Mantenha o caminho de conversão com melhor desempenho e retire as variantes fracas.",
    "Keep the best-performing conversion path and trim weak variants.",
    "Mantén la ruta de conversión con mejor rendimiento y elimina las variantes débiles."
  ],
  "Write a more specific offer in the DM and shorten the call to action.": [
    "Escreva uma oferta mais específica na DM e encurte a chamada para ação.",
    "Write a more specific offer in the DM and shorten the call to action.",
    "Escribe una oferta más específica en el DM y acorta la llamada a la acción."
  ],
  "Review the top keyword and push the strongest message to more posts.": [
    "Revise a principal palavra-chave e use a mensagem com melhor desempenho em mais publicações.",
    "Review the top keyword and push the strongest message to more posts.",
    "Revisa la palabra clave principal y usa el mensaje con mejor rendimiento en más publicaciones."
  ],
  "Start with one keyword and one CTA before scaling.": [
    "Comece com uma palavra-chave e uma chamada para ação antes de ampliar.",
    "Start with one keyword and one CTA before scaling.",
    "Empieza con una palabra clave y una llamada a la acción antes de ampliar."
  ]
};

export function campaignTranslator(locale: string) {
  const index = locale === "en" ? 1 : locale === "es" ? 2 : 0;
  const fallback = flowTranslator(locale);
  return (source: string, values: Record<string, string | number> = {}) => {
    const translated = entries[source]?.[index] ?? fallback(source);
    return translated.replace(/\{(\w+)\}/g, (token, key: string) => key in values ? String(values[key]) : token);
  };
}
