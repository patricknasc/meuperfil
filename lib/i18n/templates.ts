import type { CampaignTemplate } from "@/lib/templates/campaign-templates";

type TemplateCopy = Pick<CampaignTemplate, "title" | "category" | "audience" | "summary" | "dmMessage" | "privateReplyPreview" | "outcome" | "bestFor" | "playbook" | "metrics">;

const translations: Record<string, Record<"pt" | "es", TemplateCopy>> = {
  "dtc-product-link": {
    "pt": {
      "title": "Link de produto DTC",
      "category": "Comércio nas redes sociais",
      "audience": "Marcas DTC",
      "summary": "Transforme comentários como LINK ou SHOP em uma resposta privada com a página do produto, guia de tamanhos ou pacote de lançamento.",
      "dmMessage": "Olá {username}, aqui está o link do produto que você pediu: https://yourstore.com/product",
      "privateReplyPreview": "Olá Maya, aqui está o link do produto que você pediu: yourstore.com/product",
      "outcome": "Mais conversas sobre produtos a partir de comentários com intenção de compra.",
      "bestFor": [
        "Lançamentos de produtos",
        "Reels de clientes",
        "Campanhas com influenciadores"
      ],
      "playbook": [
        "Escolha uma publicação ou Reel que mostre o produto claramente.",
        "Use LINK, SHOP e BUY como primeiras palavras-chave.",
        "Envie a URL do produto com uma breve frase sobre o benefício.",
        "Acompanhe quais publicações geram mais respostas enviadas."
      ],
      "metrics": [
        "Respostas enviadas",
        "Duplicatas ignoradas",
        "CTR do link do produto"
      ]
    },
    "es": {
      "title": "Enlace de producto DTC",
      "category": "Comercio en redes sociales",
      "audience": "Marcas DTC",
      "summary": "Convierte comentarios como LINK o SHOP en una respuesta privada con la página del producto, guía de tallas o paquete de lanzamiento.",
      "dmMessage": "¡Hola {username}! Aquí tienes el enlace del producto que pediste: https://yourstore.com/product",
      "privateReplyPreview": "Hola Maya, aquí tienes el enlace del producto que pediste: yourstore.com/product",
      "outcome": "Más conversaciones sobre productos a partir de comentarios con intención de compra.",
      "bestFor": [
        "Lanzamientos de productos",
        "Reels de clientes",
        "Campañas con influencers"
      ],
      "playbook": [
        "Elige una publicación o Reel que muestre el producto claramente.",
        "Usa LINK, SHOP y BUY como primeras palabras clave.",
        "Envía la URL del producto con una frase breve sobre el beneficio.",
        "Mide qué publicaciones generan más respuestas enviadas."
      ],
      "metrics": [
        "Respuestas enviadas",
        "Duplicados omitidos",
        "CTR del enlace del producto"
      ]
    }
  },
  "real-estate-lead-form": {
    "pt": {
      "title": "Formulário de leads imobiliários",
      "category": "Geração de leads",
      "audience": "Corretores e imobiliárias",
      "summary": "Envie um formulário de avaliação, link de agendamento ou guia do bairro quando compradores e vendedores comentarem no Reel de um imóvel.",
      "dmMessage": "Olá {username}, aqui está o formulário com os detalhes do imóvel e horários de visita: https://yourlink.com/home",
      "privateReplyPreview": "Olá Jordan, aqui está o formulário com os detalhes do imóvel e horários de visita.",
      "outcome": "Capture o interesse pelo imóvel antes que se perca nos comentários.",
      "bestFor": [
        "Reels de imóveis",
        "Guias de bairros",
        "Publicações de avaliação de imóveis"
      ],
      "playbook": [
        "Escolha uma publicação sobre um imóvel ou mercado local.",
        "Use palavras-chave com intenção de compra em vez de emojis genéricos.",
        "Envie um formulário que peça contato e prazo de interesse.",
        "Acompanhe manualmente os leads qualificados do formulário."
      ],
      "metrics": [
        "Aberturas do formulário",
        "DMs enviadas",
        "Visitas agendadas"
      ]
    },
    "es": {
      "title": "Formulario de leads inmobiliarios",
      "category": "Generación de leads",
      "audience": "Agentes y equipos inmobiliarios",
      "summary": "Envía un formulario de valoración, enlace de reserva o guía del barrio cuando compradores y vendedores comenten en el Reel de un inmueble.",
      "dmMessage": "¡Hola {username}! Aquí tienes el formulario con los detalles del inmueble y horarios de visita: https://yourlink.com/home",
      "privateReplyPreview": "Hola Jordan, aquí tienes el formulario con los detalles del inmueble y horarios de visita.",
      "outcome": "Capta el interés por el inmueble antes de que se pierda entre los comentarios.",
      "bestFor": [
        "Reels de inmuebles",
        "Guías de barrios",
        "Publicaciones de valoración"
      ],
      "playbook": [
        "Elige una publicación sobre un inmueble o mercado local.",
        "Usa palabras clave con intención de compra en vez de emojis genéricos.",
        "Envía un formulario que solicite contacto y plazo de interés.",
        "Da seguimiento manual a los leads cualificados del formulario."
      ],
      "metrics": [
        "Aperturas del formulario",
        "DM enviados",
        "Visitas reservadas"
      ]
    }
  },
  "fitness-plan": {
    "pt": {
      "title": "Download de plano de treino",
      "category": "Funis para criadores",
      "audience": "Treinadores e criadores fitness",
      "summary": "Entregue um plano de treino, guia alimentar ou formulário de acompanhamento quando seguidores comentarem PLAN, FIT ou START.",
      "dmMessage": "Olá {username}, aqui está o plano gratuito do Reel: https://yourlink.com/fitness-plan",
      "privateReplyPreview": "Olá Sam, aqui está o plano gratuito do Reel: yourlink.com/fitness-plan",
      "outcome": "Leve seguidores motivados a um fluxo de acompanhamento ou email.",
      "bestFor": [
        "Reels de treino",
        "Publicações de transformação",
        "Lançamentos de desafios"
      ],
      "playbook": [
        "Publique um Reel que mostre o resultado e peça uma palavra-chave.",
        "Mantenha a DM curta e focada no material prometido.",
        "Adicione um link de acompanhamento após o conteúdo gratuito.",
        "Revise os registros de falhas e mensagens ignoradas após Reels com muito tráfego."
      ],
      "metrics": [
        "Pedidos de guia",
        "Inscrições em desafios",
        "Consultas sobre acompanhamento"
      ]
    },
    "es": {
      "title": "Descarga de plan de entrenamiento",
      "category": "Embudos para creadores",
      "audience": "Entrenadores y creadores fitness",
      "summary": "Entrega un plan de entrenamiento, guía alimentaria o formulario de asesoría cuando los seguidores comenten PLAN, FIT o START.",
      "dmMessage": "¡Hola {username}! Aquí tienes el plan gratuito del Reel: https://yourlink.com/fitness-plan",
      "privateReplyPreview": "Hola Sam, aquí tienes el plan gratuito del Reel: yourlink.com/fitness-plan",
      "outcome": "Lleva seguidores motivados a un flujo de asesoría o correo.",
      "bestFor": [
        "Reels de entrenamiento",
        "Publicaciones de transformación",
        "Lanzamientos de retos"
      ],
      "playbook": [
        "Publica un Reel que muestre el resultado y pida una palabra clave.",
        "Mantén el DM breve y centrado en el recurso prometido.",
        "Añade un enlace de asesoría después del contenido gratuito.",
        "Revisa los registros de fallos y mensajes omitidos tras Reels con mucho tráfico."
      ],
      "metrics": [
        "Solicitudes de guía",
        "Inscripciones en retos",
        "Consultas de asesoría"
      ]
    }
  },
  "course-webinar": {
    "pt": {
      "title": "Convite para aula de curso",
      "category": "Educação",
      "audience": "Vendedores de cursos",
      "summary": "Envie links de inscrição em aulas ou webinars a seguidores que comentarem WEBINAR, CLASS ou LEARN em conteúdos educativos.",
      "dmMessage": "Olá {username}, aqui está o link de inscrição na aula gratuita: https://yourlink.com/webinar",
      "privateReplyPreview": "Olá Alex, aqui está o link de inscrição na aula gratuita: yourlink.com/webinar",
      "outcome": "Transforme o alcance educativo em inscrições em webinars e listas de espera.",
      "bestFor": [
        "Lançamentos de cursos",
        "Treinamentos rápidos",
        "Workshops ao vivo"
      ],
      "playbook": [
        "Vincule a campanha a um Reel educativo com exemplos de resultados.",
        "Use uma palavra-chave principal na legenda e duas alternativas.",
        "Envie o link de inscrição com a data ou a proposta da aula.",
        "Compare os envios das publicações orgânicas antes de investir em anúncios."
      ],
      "metrics": [
        "Inscrições",
        "DMs enviadas",
        "Taxa de comparecimento"
      ]
    },
    "es": {
      "title": "Invitación a clase de curso",
      "category": "Educación",
      "audience": "Vendedores de cursos",
      "summary": "Envía enlaces de inscripción a clases o webinars a seguidores que comenten WEBINAR, CLASS o LEARN en contenido educativo.",
      "dmMessage": "¡Hola {username}! Aquí tienes el enlace de inscripción a la clase gratuita: https://yourlink.com/webinar",
      "privateReplyPreview": "Hola Alex, aquí tienes el enlace de inscripción a la clase gratuita: yourlink.com/webinar",
      "outcome": "Convierte el alcance educativo en registros a webinars y listas de espera.",
      "bestFor": [
        "Lanzamientos de cursos",
        "Formaciones breves",
        "Talleres en vivo"
      ],
      "playbook": [
        "Vincula la campaña a un Reel educativo con ejemplos de resultados.",
        "Usa una palabra clave principal en el texto y dos alternativas.",
        "Envía el enlace de registro con la fecha o propuesta de la clase.",
        "Compara los envíos de publicaciones orgánicas antes de invertir en anuncios."
      ],
      "metrics": [
        "Registros",
        "DM enviados",
        "Tasa de asistencia"
      ]
    }
  },
  "beauty-price-list": {
    "pt": {
      "title": "Tabela de preços de beleza",
      "category": "Serviços locais",
      "audience": "Salões, spas e profissionais de beleza",
      "summary": "Responda com preços, links de agendamento e menus de serviços quando as pessoas comentarem PRICE, MENU ou BOOK.",
      "dmMessage": "Olá {username}, aqui estão nossos serviços e o link de agendamento: https://yourlink.com/booking",
      "privateReplyPreview": "Olá Riley, aqui estão nossos serviços e o link de agendamento.",
      "outcome": "Reduza respostas repetitivas e encaminhe clientes para o agendamento.",
      "bestFor": [
        "Reels de antes e depois",
        "Publicações de serviços",
        "Publicações de horários disponíveis"
      ],
      "playbook": [
        "Escolha uma publicação em que as pessoas já perguntem sobre preços.",
        "Adicione um link de agendamento com categorias de serviço claras.",
        "Mantenha a DM adequada e evite alegações médicas ou exageradas.",
        "Atualize o link quando os preços ou a disponibilidade mudarem."
      ],
      "metrics": [
        "Cliques no agendamento",
        "DMs enviadas",
        "Novos agendamentos"
      ]
    },
    "es": {
      "title": "Lista de precios de belleza",
      "category": "Servicios locales",
      "audience": "Salones, spas y profesionales de belleza",
      "summary": "Responde con precios, enlaces de reserva y menús de servicios cuando las personas comenten PRICE, MENU o BOOK.",
      "dmMessage": "¡Hola {username}! Aquí tienes nuestros servicios y el enlace de reserva: https://yourlink.com/booking",
      "privateReplyPreview": "Hola Riley, aquí tienes nuestros servicios y el enlace de reserva.",
      "outcome": "Reduce respuestas repetitivas y lleva a los clientes hacia la reserva.",
      "bestFor": [
        "Reels de antes y después",
        "Publicaciones de servicios",
        "Publicaciones de disponibilidad"
      ],
      "playbook": [
        "Elige una publicación donde las personas ya pregunten por precios.",
        "Añade un enlace de reserva con categorías de servicio claras.",
        "Mantén el DM adecuado y evita afirmaciones médicas o exageradas.",
        "Actualiza el enlace cuando cambien los precios o la disponibilidad."
      ],
      "metrics": [
        "Clics en reservas",
        "DM enviados",
        "Nuevas citas"
      ]
    }
  },
  "restaurant-menu": {
    "pt": {
      "title": "Cardápio e reserva de restaurante",
      "category": "Hospitalidade",
      "audience": "Restaurantes e cafés",
      "summary": "Envie cardápios, links de reserva ou ofertas de eventos quando clientes comentarem MENU, TABLE ou RESERVE.",
      "dmMessage": "Olá {username}, aqui estão nosso cardápio e o link de reserva: https://yourlink.com/menu",
      "privateReplyPreview": "Olá Taylor, aqui estão nosso cardápio e o link de reserva.",
      "outcome": "Transforme Reels gastronômicos em reservas e visitas ao cardápio.",
      "bestFor": [
        "Ofertas especiais",
        "Lançamentos de cardápio",
        "Reservas para o fim de semana"
      ],
      "playbook": [
        "Use um Reel de comida atraente com um convite claro para comentar.",
        "Envie um cardápio ou página de reserva adaptados ao celular.",
        "Mencione vagas limitadas somente quando for verdade.",
        "Repita o modelo para ofertas sazonais."
      ],
      "metrics": [
        "Cliques no cardápio",
        "Reservas",
        "Respostas da campanha de fim de semana"
      ]
    },
    "es": {
      "title": "Menú y reserva de restaurante",
      "category": "Hostelería",
      "audience": "Restaurantes y cafeterías",
      "summary": "Envía menús, enlaces de reserva u ofertas de eventos cuando los clientes comenten MENU, TABLE o RESERVE.",
      "dmMessage": "¡Hola {username}! Aquí tienes nuestro menú y el enlace de reserva: https://yourlink.com/menu",
      "privateReplyPreview": "Hola Taylor, aquí tienes nuestro menú y el enlace de reserva.",
      "outcome": "Convierte Reels gastronómicos en reservas y visitas al menú.",
      "bestFor": [
        "Ofertas especiales",
        "Lanzamientos de menú",
        "Reservas de fin de semana"
      ],
      "playbook": [
        "Usa un Reel de comida atractivo con una invitación clara a comentar.",
        "Envía un menú o página de reserva adaptados al móvil.",
        "Menciona plazas limitadas solo cuando sea cierto.",
        "Repite la plantilla para ofertas de temporada."
      ],
      "metrics": [
        "Clics en el menú",
        "Reservas",
        "Respuestas de la campaña de fin de semana"
      ]
    }
  },
  "event-rsvp": {
    "pt": {
      "title": "Campanha de confirmação de evento",
      "category": "Eventos",
      "audience": "Espaços, comunidades e equipes de lançamento",
      "summary": "Envie formulários de confirmação, links de calendário ou ingressos quando alguém comentar RSVP, TICKET ou JOIN.",
      "dmMessage": "Olá {username}, aqui está o link de confirmação com os detalhes do evento: https://yourlink.com/rsvp",
      "privateReplyPreview": "Olá Morgan, aqui está o link de confirmação com os detalhes do evento.",
      "outcome": "Transforme interesse no evento em confirmações mensuráveis.",
      "bestFor": [
        "Eventos temporários",
        "Workshops",
        "Eventos de comunidade"
      ],
      "playbook": [
        "Escolha o anúncio ou Reel de resumo do evento.",
        "Use RSVP como palavra-chave principal e acrescente alternativas para ingressos.",
        "Envie um link com data, local e confirmação.",
        "Pause a campanha após o término do evento."
      ],
      "metrics": [
        "Confirmações",
        "Cliques em ingressos",
        "Respostas por publicação do evento"
      ]
    },
    "es": {
      "title": "Campaña de confirmación de evento",
      "category": "Eventos",
      "audience": "Espacios, comunidades y equipos de lanzamiento",
      "summary": "Envía formularios de confirmación, enlaces de calendario o entradas cuando alguien comente RSVP, TICKET o JOIN.",
      "dmMessage": "¡Hola {username}! Aquí tienes el enlace de confirmación con los detalles del evento: https://yourlink.com/rsvp",
      "privateReplyPreview": "Hola Morgan, aquí tienes el enlace de confirmación con los detalles del evento.",
      "outcome": "Convierte el interés en el evento en confirmaciones medibles.",
      "bestFor": [
        "Eventos temporales",
        "Talleres",
        "Eventos de comunidad"
      ],
      "playbook": [
        "Elige el anuncio o Reel de resumen del evento.",
        "Usa RSVP como palabra clave principal y añade alternativas para entradas.",
        "Envía un enlace con fecha, lugar y confirmación.",
        "Pausa la campaña cuando termine el evento."
      ],
      "metrics": [
        "Confirmaciones",
        "Clics en entradas",
        "Respuestas por publicación del evento"
      ]
    }
  },
  "creator-media-kit": {
    "pt": {
      "title": "Resposta com mídia kit",
      "category": "Negócios de criadores",
      "audience": "Criadores e agências",
      "summary": "Envie um mídia kit, tabela de valores ou formulário de parceria quando marcas comentarem COLLAB, KIT ou RATES.",
      "dmMessage": "Olá {username}, aqui estão meu mídia kit e o formulário de parceria: https://yourlink.com/media-kit",
      "privateReplyPreview": "Olá Casey, aqui estão meu mídia kit e o formulário de parceria.",
      "outcome": "Capture o interesse das marcas sem pedir que procurem o link na bio.",
      "bestFor": [
        "Reels de portfólio fixados",
        "Estudos de caso",
        "Prospecção de marcas"
      ],
      "playbook": [
        "Fixe uma publicação de parceria ou um Reel de portfólio.",
        "Use palavras-chave profissionais que as marcas comentem naturalmente.",
        "Envie o link do mídia kit e uma pergunta de qualificação.",
        "Revise as DMs semanalmente e identifique oportunidades qualificadas."
      ],
      "metrics": [
        "Consultas de marcas",
        "Cliques no mídia kit",
        "DMs de parceria qualificadas"
      ]
    },
    "es": {
      "title": "Respuesta con kit de medios",
      "category": "Negocios de creadores",
      "audience": "Creadores y agencias",
      "summary": "Envía un kit de medios, lista de tarifas o formulario de colaboración cuando las marcas comenten COLLAB, KIT o RATES.",
      "dmMessage": "¡Hola {username}! Aquí tienes mi kit de medios y el formulario de colaboración: https://yourlink.com/media-kit",
      "privateReplyPreview": "Hola Casey, aquí tienes mi kit de medios y el formulario de colaboración.",
      "outcome": "Capta el interés de las marcas sin pedirles que busquen el enlace en la bio.",
      "bestFor": [
        "Reels de portafolio fijados",
        "Casos de estudio",
        "Prospección de marcas"
      ],
      "playbook": [
        "Fija una publicación de colaboración o un Reel de portafolio.",
        "Usa palabras clave profesionales que las marcas comenten naturalmente.",
        "Envía el enlace del kit de medios y una pregunta de cualificación.",
        "Revisa los DM semanalmente e identifica oportunidades cualificadas."
      ],
      "metrics": [
        "Consultas de marcas",
        "Clics en kit de medios",
        "DM de colaboración cualificados"
      ]
    }
  }
};

/** Keep campaign goal values, URLs, slugs and trigger keywords stable across locales. */
export function localizeCampaignTemplate(template: CampaignTemplate, locale: string): CampaignTemplate {
  if (locale !== "pt" && locale !== "es") return template;
  const copy = translations[template.slug]?.[locale];
  const triggerExample = template.triggerExample
    .replace(" please", ", por favor")
    .replace(" details", locale === "pt" ? " detalhes" : " detalles");
  return copy ? { ...template, ...copy, triggerExample } : template;
}
