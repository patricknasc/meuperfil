import type { Locale } from "@/app/[lang]/dictionaries";

/** Copy for the public site (home, header, footer). Portuguese is the reference text. */

interface Feature {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: string;
}

export interface SiteCopy {
  meta: { title: string; description: string };
  nav: { how: string; features: string; pricing: string; faq: string; signIn: string; cta: string };
  hero: { badge: string; titleStart: string; titleHighlight: string; titleEnd: string; description: string; primary: string; secondary: string; reassurance: string[] };
  demo: { name: string; bio: string; links: string[]; comment: string; commentUser: string; dmGreeting: string; dmLink: string; matched: string; clicksToday: string };
  trust: string[];
  how: { eyebrow: string; title: string; steps: { title: string; description: string }[] };
  features: { eyebrow: string; title: string; items: [Feature, Feature, Feature, Feature] };
  demoCards: {
    themes: string[];
    keywordLabel: string;
    keyword: string;
    allPosts: string;
    typo: string;
    endsOn: string;
    sources: { label: string; value: number }[];
    sourcesTitle: string;
    scheduled: string;
    autoReply: string;
  };
  useCases: { eyebrow: string; title: string; items: { title: string; description: string }[] };
  pricing: { eyebrow: string; title: string; description: string; note: string; tiers: [Tier, Tier, Tier] };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  final: {
    title: string;
    description: string;
    cta: string;
    agencyTitle: string;
    agencyDescription: string;
    name: string;
    email: string;
    company: string;
    submit: string;
    success: string;
    invalid: string;
  };
  footer: { tagline: string; product: string; legal: string; templates: string; privacy: string; terms: string; dataDeletion: string; contact: string; rights: string };
}

const pt: SiteCopy = {
  meta: {
    title: "MeuPerfil — Link na bio e Direct automático para o Instagram",
    description:
      "Crie seu link na bio e responda no Direct, na hora, quem comenta a palavra-chave nos seus posts. API oficial do Instagram. Grátis para começar.",
  },
  nav: { how: "Como funciona", features: "Recursos", pricing: "Preços", faq: "Dúvidas", signIn: "Entrar", cta: "Criar meu link grátis" },
  hero: {
    badge: "Link na bio + Direct automático no Instagram",
    titleStart: "Transforme",
    titleHighlight: "comentários",
    titleEnd: "em vendas.",
    description:
      "Uma página de link na bio com a sua cara e um Direct que responde sozinho: quem comenta a palavra-chave no seu post recebe o link na hora. Tudo pela API oficial do Instagram.",
    primary: "Criar meu link grátis",
    secondary: "Ver como funciona",
    reassurance: ["Grátis para começar", "Sem cartão de crédito", "Sem pedir sua senha do Instagram"],
  },
  demo: {
    name: "Ana Lima Doces",
    bio: "Bolos e doces por encomenda em Curitiba",
    links: ["Cardápio de outubro", "Encomendar pelo WhatsApp", "Curso de brigadeiro gourmet"],
    commentUser: "julia.m",
    comment: "QUERO o cardápio 😍",
    dmGreeting: "Oi, Julia! Aqui está o cardápio de outubro:",
    dmLink: "meuperfil.me/r/cardapio",
    matched: "Palavra-chave encontrada · resposta enviada",
    clicksToday: "cliques hoje",
  },
  trust: ["API oficial da Meta", "Nunca pedimos sua senha", "Banco de dados no Brasil", "Em português, inglês e espanhol"],
  how: {
    eyebrow: "Como funciona",
    title: "Três passos e o seu Direct passa a trabalhar por você.",
    steps: [
      {
        title: "Crie sua página",
        description: "Escolha um tema ou monte o seu: cores, fontes, botões e os ícones das suas redes. Fica pronta em minutos.",
      },
      {
        title: "Conecte o Instagram",
        description: "Pelo login oficial do Instagram, sem passar senha. Depois é só escolher o post e a palavra-chave.",
      },
      {
        title: "Deixe o Direct responder",
        description: "Quem comentar a palavra-chave recebe sua mensagem com o link, de dia, de noite ou no fim de semana.",
      },
    ],
  },
  features: {
    eyebrow: "Recursos",
    title: "Tudo o que acontece entre o post e a venda, em um lugar só.",
    items: [
      {
        eyebrow: "Link na bio",
        title: "Uma página que parece sua, não um modelo pronto.",
        description: "Seu endereço fica meuperfil.me/seunome, com o visual da sua marca.",
        bullets: [
          "Temas prontos ou personalizados: cores, fontes e formato dos botões",
          "Ícones oficiais de 18 redes e canais, do WhatsApp à sua loja",
          "Botões, textos e divisores para organizar o que você oferece",
        ],
      },
      {
        eyebrow: "Comentário vira Direct",
        title: "Responda cada comentário no privado, na hora.",
        description: "Você define as palavras-chave; o MeuPerfil envia a mensagem e o link para quem comentou.",
        bullets: [
          "Por post ou em todas as publicações e Reels",
          "Entende acentos e, se você quiser, pequenos erros de digitação",
          "Data de encerramento para ofertas e cupons",
        ],
      },
      {
        eyebrow: "Métricas",
        title: "Saiba o que realmente traz cliques.",
        description: "Veja quem visitou, de onde veio e em qual botão clicou, sem instalar nada.",
        bullets: [
          "Visitas e cliques por botão e por rede social",
          "Origem do público: Instagram, Google, WhatsApp, cidade e aparelho",
          "Links com UTM para cada post, anúncio ou parceria",
        ],
      },
      {
        eyebrow: "Agendador",
        title: "Publique e deixe a campanha pronta junto.",
        description: "Programe posts, Reels e carrosséis e ative a resposta automática no mesmo passo.",
        bullets: [
          "Calendário com tudo o que vai ao ar",
          "Resposta automática criada junto com a publicação",
          "Status de cada publicação, com o motivo se algo falhar",
        ],
      },
    ],
  },
  demoCards: {
    themes: ["Clássico", "Neon", "Aurora", "Claro", "Pôr do sol", "Esmeralda"],
    keywordLabel: "Palavra-chave",
    keyword: "QUERO",
    allPosts: "Todas as publicações",
    typo: "Aceita “QERO”",
    endsOn: "Termina em 31/10",
    sourcesTitle: "De onde vieram as visitas",
    sources: [
      { label: "Instagram", value: 62 },
      { label: "WhatsApp", value: 21 },
      { label: "Google", value: 11 },
      { label: "Direto", value: 6 },
    ],
    scheduled: "Agendado · sexta, 18h",
    autoReply: "Resposta automática ativa",
  },
  useCases: {
    eyebrow: "Para quem é",
    title: "Feito para quem vende pelo Instagram.",
    items: [
      { title: "Criadores de conteúdo", description: "Entregue e-books, aulas e cupons para quem comenta, sem responder um por um." },
      { title: "Lojas e marcas", description: "Mande o link do produto, o preço e o frete no Direct de quem demonstrou interesse." },
      { title: "Prestadores de serviço", description: "Leve quem comentou direto para o seu WhatsApp ou agenda de horários." },
      { title: "Agências", description: "Gerencie várias contas de clientes e mostre resultados com relatórios compartilháveis." },
    ],
  },
  pricing: {
    eyebrow: "Preços",
    title: "Comece grátis. Mude de plano quando fizer sentido.",
    description: "Sem fidelidade: cancele quando quiser e continue no plano grátis.",
    note: "Valores em reais, cobrados mensalmente.",
    tiers: [
      {
        name: "Grátis",
        price: "R$ 0",
        period: "para sempre",
        description: "Para ter seu link na bio e testar a primeira campanha.",
        features: ["1 página de link na bio", "Até 5 botões", "1 campanha de Direct", "100 respostas por mês", "5 posts agendados por mês"],
        cta: "Criar grátis",
      },
      {
        name: "Pro",
        price: "R$ 97",
        period: "por mês",
        description: "Para criadores e marcas que fazem lançamentos e ofertas com frequência.",
        features: ["3 páginas de link na bio", "25 botões por página", "10 campanhas de Direct", "2.000 respostas por mês", "60 posts agendados por mês"],
        cta: "Escolher o plano Pro",
        highlight: "Mais escolhido",
      },
      {
        name: "Agência",
        price: "R$ 247",
        period: "por mês",
        description: "Para quem cuida de várias contas e precisa mostrar resultado.",
        features: ["20 páginas de link na bio", "10 contas do Instagram", "Campanhas ilimitadas", "10.000 respostas por mês", "Equipe com até 10 pessoas"],
        cta: "Escolher o plano Agência",
      },
    ],
  },
  faq: {
    eyebrow: "Dúvidas",
    title: "Perguntas frequentes",
    items: [
      { q: "Preciso passar a senha do meu Instagram?", a: "Não. A conexão é feita pelo login oficial do Instagram, e você pode remover o acesso a qualquer momento." },
      {
        q: "Funciona com conta pessoal do Instagram?",
        a: "O link na bio funciona com qualquer conta. As respostas automáticas exigem conta profissional (Comercial ou Criador de conteúdo), que é gratuita e se ativa em um minuto nas configurações do Instagram.",
      },
      { q: "Isso é permitido pelo Instagram?", a: "Sim. Usamos a API oficial da Meta para responder comentários no privado, dentro dos limites definidos por ela. Nada de robôs ou automação de navegador." },
      { q: "Quem comenta várias vezes recebe várias mensagens?", a: "Cada comentário com a palavra-chave recebe uma única resposta. Você escolhe em quais posts a campanha vale e até quando." },
      { q: "Posso cancelar quando quiser?", a: "Sim, sem multa. Sua conta volta para o plano grátis e você mantém sua página." },
      { q: "Onde ficam os meus dados?", a: "O banco de dados fica no Brasil, em São Paulo. Os detalhes estão na Política de Privacidade." },
    ],
  },
  final: {
    title: "Seu próximo post pode começar a vender hoje.",
    description: "Crie seu link na bio em minutos e conecte o Instagram quando quiser.",
    cta: "Criar meu link grátis",
    agencyTitle: "Tem uma agência ou vários clientes?",
    agencyDescription: "Deixe seu contato para entrar na turma de agências do beta, com acompanhamento na implantação.",
    name: "Seu nome",
    email: "Seu e-mail",
    company: "Agência ou empresa (opcional)",
    submit: "Quero participar",
    success: "Recebemos seu contato. Vamos falar com você em breve.",
    invalid: "Confira o nome e o e-mail e tente de novo.",
  },
  footer: {
    tagline: "Link na bio e Direct automático para quem vende pelo Instagram.",
    product: "Produto",
    legal: "Legal",
    templates: "Modelos de campanha",
    privacy: "Privacidade",
    terms: "Termos de uso",
    dataDeletion: "Exclusão de dados",
    contact: "Contato",
    rights: "Todos os direitos reservados.",
  },
};

const en: SiteCopy = {
  meta: {
    title: "MeuPerfil — Link in bio and automatic Instagram DMs",
    description:
      "Build your link in bio and instantly DM everyone who comments your keyword on Instagram posts. Official Instagram API. Free to start.",
  },
  nav: { how: "How it works", features: "Features", pricing: "Pricing", faq: "FAQ", signIn: "Sign in", cta: "Create my free link" },
  hero: {
    badge: "Link in bio + automatic Instagram DMs",
    titleStart: "Turn",
    titleHighlight: "comments",
    titleEnd: "into sales.",
    description:
      "A link-in-bio page that looks like you, and DMs that reply on their own: whoever comments your keyword gets the link right away. All through the official Instagram API.",
    primary: "Create my free link",
    secondary: "See how it works",
    reassurance: ["Free to start", "No credit card", "We never ask for your Instagram password"],
  },
  demo: {
    name: "Ana Lima Bakes",
    bio: "Custom cakes and sweets in Curitiba",
    links: ["October menu", "Order on WhatsApp", "Gourmet brigadeiro course"],
    commentUser: "julia.m",
    comment: "I WANT the menu 😍",
    dmGreeting: "Hi Julia! Here is the October menu:",
    dmLink: "meuperfil.me/r/menu",
    matched: "Keyword matched · reply sent",
    clicksToday: "clicks today",
  },
  trust: ["Official Meta API", "We never ask for your password", "Database hosted in Brazil", "In Portuguese, English and Spanish"],
  how: {
    eyebrow: "How it works",
    title: "Three steps and your DMs start working for you.",
    steps: [
      { title: "Create your page", description: "Pick a theme or build your own: colors, fonts, buttons and icons for your networks. Ready in minutes." },
      { title: "Connect Instagram", description: "Through the official Instagram login, no password shared. Then choose the post and the keyword." },
      { title: "Let the DMs reply", description: "Whoever comments the keyword gets your message with the link, day or night, weekends included." },
    ],
  },
  features: {
    eyebrow: "Features",
    title: "Everything between the post and the sale, in one place.",
    items: [
      {
        eyebrow: "Link in bio",
        title: "A page that looks like you, not like a template.",
        description: "Your address is meuperfil.me/yourname, with your brand's look.",
        bullets: ["Ready-made or custom themes: colors, fonts and button shapes", "Official icons for 18 networks and channels, from WhatsApp to your store", "Buttons, text and dividers to organize what you offer"],
      },
      {
        eyebrow: "Comment to DM",
        title: "Reply to every comment privately, instantly.",
        description: "You set the keywords; MeuPerfil sends the message and the link to whoever commented.",
        bullets: ["Per post or across all posts and Reels", "Understands accents and, if you want, small typos", "End dates for offers and coupons"],
      },
      {
        eyebrow: "Analytics",
        title: "Know what actually drives clicks.",
        description: "See who visited, where they came from and which button they clicked, with nothing to install.",
        bullets: ["Visits and clicks per button and social network", "Audience sources: Instagram, Google, WhatsApp, city and device", "UTM links for each post, ad or partnership"],
      },
      {
        eyebrow: "Scheduler",
        title: "Publish and have the campaign ready at once.",
        description: "Schedule posts, Reels and carousels and turn on the automatic reply in the same step.",
        bullets: ["A calendar with everything going live", "Automatic reply created with the post", "Status for every post, with the reason if something fails"],
      },
    ],
  },
  demoCards: {
    themes: ["Classic", "Neon", "Aurora", "Light", "Sunset", "Emerald"],
    keywordLabel: "Keyword",
    keyword: "WANT",
    allPosts: "All posts",
    typo: "Accepts “WNAT”",
    endsOn: "Ends Oct 31",
    sourcesTitle: "Where visits came from",
    sources: [
      { label: "Instagram", value: 62 },
      { label: "WhatsApp", value: 21 },
      { label: "Google", value: 11 },
      { label: "Direct", value: 6 },
    ],
    scheduled: "Scheduled · Friday, 6pm",
    autoReply: "Automatic reply on",
  },
  useCases: {
    eyebrow: "Who it's for",
    title: "Built for people who sell on Instagram.",
    items: [
      { title: "Content creators", description: "Deliver e-books, classes and coupons to commenters without replying one by one." },
      { title: "Stores and brands", description: "Send the product link, price and shipping to everyone who showed interest." },
      { title: "Service providers", description: "Take commenters straight to your WhatsApp or booking calendar." },
      { title: "Agencies", description: "Manage several client accounts and show results with shareable reports." },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Start free. Upgrade when it makes sense.",
    description: "No lock-in: cancel anytime and keep the free plan.",
    note: "Prices in Brazilian reais (BRL), billed monthly.",
    tiers: [
      { name: "Free", price: "R$ 0", period: "forever", description: "To get your link in bio and try your first campaign.", features: ["1 link-in-bio page", "Up to 5 buttons", "1 DM campaign", "100 replies per month", "5 scheduled posts per month"], cta: "Start free" },
      { name: "Pro", price: "R$ 97", period: "per month", description: "For creators and brands running launches and offers often.", features: ["3 link-in-bio pages", "25 buttons per page", "10 DM campaigns", "2,000 replies per month", "60 scheduled posts per month"], cta: "Start with Pro", highlight: "Most popular" },
      { name: "Agency", price: "R$ 247", period: "per month", description: "For teams managing several accounts who need to show results.", features: ["20 link-in-bio pages", "10 Instagram accounts", "Unlimited campaigns", "10,000 replies per month", "Team of up to 10 people"], cta: "Start with Agency" },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    items: [
      { q: "Do I need to share my Instagram password?", a: "No. You connect through the official Instagram login and can remove access at any time." },
      { q: "Does it work with a personal Instagram account?", a: "The link in bio works with any account. Automatic replies need a professional account (Business or Creator), which is free and takes a minute to switch in Instagram settings." },
      { q: "Is this allowed by Instagram?", a: "Yes. We use Meta's official API to reply to comments privately, within the limits Meta sets. No bots or browser automation." },
      { q: "Does someone who comments many times get many messages?", a: "Each comment with the keyword gets a single reply. You choose which posts a campaign covers and until when." },
      { q: "Can I cancel anytime?", a: "Yes, with no fee. Your account goes back to the free plan and you keep your page." },
      { q: "Where is my data stored?", a: "The database is in Brazil, in São Paulo. Details are in the Privacy Policy." },
    ],
  },
  final: {
    title: "Your next post can start selling today.",
    description: "Create your link in bio in minutes and connect Instagram whenever you want.",
    cta: "Create my free link",
    agencyTitle: "Running an agency or several clients?",
    agencyDescription: "Leave your contact to join the agency group in our beta, with hands-on onboarding.",
    name: "Your name",
    email: "Your email",
    company: "Agency or company (optional)",
    submit: "I want in",
    success: "We got your contact and will reach out soon.",
    invalid: "Check your name and email and try again.",
  },
  footer: {
    tagline: "Link in bio and automatic DMs for people who sell on Instagram.",
    product: "Product",
    legal: "Legal",
    templates: "Campaign templates",
    privacy: "Privacy",
    terms: "Terms of use",
    dataDeletion: "Data deletion",
    contact: "Contact",
    rights: "All rights reserved.",
  },
};

const es: SiteCopy = {
  meta: {
    title: "MeuPerfil — Enlace en bio y DM automático para Instagram",
    description:
      "Crea tu enlace en bio y responde al instante por DM a quien comenta tu palabra clave en Instagram. API oficial de Instagram. Gratis para empezar.",
  },
  nav: { how: "Cómo funciona", features: "Funciones", pricing: "Precios", faq: "Dudas", signIn: "Iniciar sesión", cta: "Crear mi enlace gratis" },
  hero: {
    badge: "Enlace en bio + DM automático en Instagram",
    titleStart: "Convierte",
    titleHighlight: "comentarios",
    titleEnd: "en ventas.",
    description:
      "Una página de enlace en bio con tu estilo y DMs que responden solos: quien comenta tu palabra clave recibe el enlace al instante. Todo con la API oficial de Instagram.",
    primary: "Crear mi enlace gratis",
    secondary: "Ver cómo funciona",
    reassurance: ["Gratis para empezar", "Sin tarjeta de crédito", "Nunca pedimos tu contraseña de Instagram"],
  },
  demo: {
    name: "Ana Lima Dulces",
    bio: "Tortas y dulces por encargo en Curitiba",
    links: ["Menú de octubre", "Pedir por WhatsApp", "Curso de brigadeiro gourmet"],
    commentUser: "julia.m",
    comment: "QUIERO el menú 😍",
    dmGreeting: "¡Hola, Julia! Aquí está el menú de octubre:",
    dmLink: "meuperfil.me/r/menu",
    matched: "Palabra clave encontrada · respuesta enviada",
    clicksToday: "clics hoy",
  },
  trust: ["API oficial de Meta", "Nunca pedimos tu contraseña", "Base de datos en Brasil", "En portugués, inglés y español"],
  how: {
    eyebrow: "Cómo funciona",
    title: "Tres pasos y tus DMs empiezan a trabajar por ti.",
    steps: [
      { title: "Crea tu página", description: "Elige un tema o arma el tuyo: colores, fuentes, botones e iconos de tus redes. Lista en minutos." },
      { title: "Conecta Instagram", description: "Con el inicio de sesión oficial de Instagram, sin compartir contraseña. Luego eliges la publicación y la palabra clave." },
      { title: "Deja que el DM responda", description: "Quien comente la palabra clave recibe tu mensaje con el enlace, de día, de noche o el fin de semana." },
    ],
  },
  features: {
    eyebrow: "Funciones",
    title: "Todo lo que pasa entre la publicación y la venta, en un solo lugar.",
    items: [
      {
        eyebrow: "Enlace en bio",
        title: "Una página que se parece a ti, no a una plantilla.",
        description: "Tu dirección es meuperfil.me/tunombre, con el estilo de tu marca.",
        bullets: ["Temas listos o personalizados: colores, fuentes y forma de los botones", "Iconos oficiales de 18 redes y canales, desde WhatsApp hasta tu tienda", "Botones, textos y divisores para organizar lo que ofreces"],
      },
      {
        eyebrow: "Comentario a DM",
        title: "Responde cada comentario en privado, al instante.",
        description: "Tú defines las palabras clave; MeuPerfil envía el mensaje y el enlace a quien comentó.",
        bullets: ["Por publicación o en todas las publicaciones y Reels", "Entiende acentos y, si quieres, pequeños errores de escritura", "Fecha de cierre para ofertas y cupones"],
      },
      {
        eyebrow: "Métricas",
        title: "Descubre qué genera clics de verdad.",
        description: "Mira quién visitó, de dónde vino y en qué botón hizo clic, sin instalar nada.",
        bullets: ["Visitas y clics por botón y por red social", "Origen del público: Instagram, Google, WhatsApp, ciudad y dispositivo", "Enlaces con UTM para cada publicación, anuncio o alianza"],
      },
      {
        eyebrow: "Programador",
        title: "Publica y deja la campaña lista a la vez.",
        description: "Programa publicaciones, Reels y carruseles y activa la respuesta automática en el mismo paso.",
        bullets: ["Un calendario con todo lo que se publicará", "Respuesta automática creada junto con la publicación", "Estado de cada publicación, con el motivo si algo falla"],
      },
    ],
  },
  demoCards: {
    themes: ["Clásico", "Neón", "Aurora", "Claro", "Atardecer", "Esmeralda"],
    keywordLabel: "Palabra clave",
    keyword: "QUIERO",
    allPosts: "Todas las publicaciones",
    typo: "Acepta “QIERO”",
    endsOn: "Termina el 31/10",
    sourcesTitle: "De dónde vinieron las visitas",
    sources: [
      { label: "Instagram", value: 62 },
      { label: "WhatsApp", value: 21 },
      { label: "Google", value: 11 },
      { label: "Directo", value: 6 },
    ],
    scheduled: "Programado · viernes, 18 h",
    autoReply: "Respuesta automática activa",
  },
  useCases: {
    eyebrow: "Para quién es",
    title: "Hecho para quien vende por Instagram.",
    items: [
      { title: "Creadores de contenido", description: "Entrega e-books, clases y cupones a quien comenta, sin responder uno por uno." },
      { title: "Tiendas y marcas", description: "Envía el enlace del producto, el precio y el envío a quien mostró interés." },
      { title: "Prestadores de servicios", description: "Lleva a quien comentó directo a tu WhatsApp o a tu agenda." },
      { title: "Agencias", description: "Gestiona varias cuentas de clientes y muestra resultados con informes compartibles." },
    ],
  },
  pricing: {
    eyebrow: "Precios",
    title: "Empieza gratis. Cambia de plan cuando tenga sentido.",
    description: "Sin permanencia: cancela cuando quieras y sigue en el plan gratis.",
    note: "Precios en reales brasileños (BRL), cobrados mensualmente.",
    tiers: [
      { name: "Gratis", price: "R$ 0", period: "para siempre", description: "Para tener tu enlace en bio y probar tu primera campaña.", features: ["1 página de enlace en bio", "Hasta 5 botones", "1 campaña de DM", "100 respuestas al mes", "5 publicaciones programadas al mes"], cta: "Empezar gratis" },
      { name: "Pro", price: "R$ 97", period: "al mes", description: "Para creadores y marcas que lanzan ofertas con frecuencia.", features: ["3 páginas de enlace en bio", "25 botones por página", "10 campañas de DM", "2.000 respuestas al mes", "60 publicaciones programadas al mes"], cta: "Empezar con Pro", highlight: "El más elegido" },
      { name: "Agencia", price: "R$ 247", period: "al mes", description: "Para quien gestiona varias cuentas y necesita mostrar resultados.", features: ["20 páginas de enlace en bio", "10 cuentas de Instagram", "Campañas ilimitadas", "10.000 respuestas al mes", "Equipo de hasta 10 personas"], cta: "Empezar con Agencia" },
    ],
  },
  faq: {
    eyebrow: "Dudas",
    title: "Preguntas frecuentes",
    items: [
      { q: "¿Tengo que dar la contraseña de mi Instagram?", a: "No. La conexión se hace con el inicio de sesión oficial de Instagram y puedes quitar el acceso cuando quieras." },
      { q: "¿Funciona con una cuenta personal de Instagram?", a: "El enlace en bio funciona con cualquier cuenta. Las respuestas automáticas requieren una cuenta profesional (Empresa o Creador), que es gratis y se activa en un minuto en la configuración de Instagram." },
      { q: "¿Instagram lo permite?", a: "Sí. Usamos la API oficial de Meta para responder comentarios en privado, dentro de los límites que Meta define. Sin bots ni automatización de navegador." },
      { q: "¿Quien comenta varias veces recibe varios mensajes?", a: "Cada comentario con la palabra clave recibe una sola respuesta. Tú eliges en qué publicaciones vale la campaña y hasta cuándo." },
      { q: "¿Puedo cancelar cuando quiera?", a: "Sí, sin penalización. Tu cuenta vuelve al plan gratis y conservas tu página." },
      { q: "¿Dónde se guardan mis datos?", a: "La base de datos está en Brasil, en São Paulo. Los detalles están en la Política de Privacidad." },
    ],
  },
  final: {
    title: "Tu próxima publicación puede empezar a vender hoy.",
    description: "Crea tu enlace en bio en minutos y conecta Instagram cuando quieras.",
    cta: "Crear mi enlace gratis",
    agencyTitle: "¿Tienes una agencia o varios clientes?",
    agencyDescription: "Déjanos tu contacto para entrar al grupo de agencias de la beta, con acompañamiento en la implementación.",
    name: "Tu nombre",
    email: "Tu email",
    company: "Agencia o empresa (opcional)",
    submit: "Quiero participar",
    success: "Recibimos tu contacto. Te escribiremos pronto.",
    invalid: "Revisa el nombre y el email e inténtalo de nuevo.",
  },
  footer: {
    tagline: "Enlace en bio y DM automático para quien vende por Instagram.",
    product: "Producto",
    legal: "Legal",
    templates: "Plantillas de campaña",
    privacy: "Privacidad",
    terms: "Términos de uso",
    dataDeletion: "Eliminación de datos",
    contact: "Contacto",
    rights: "Todos los derechos reservados.",
  },
};

const copies: Record<Locale, SiteCopy> = { pt, en, es };

export function getSiteCopy(locale: Locale): SiteCopy {
  return copies[locale];
}
