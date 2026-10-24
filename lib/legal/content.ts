import type { Locale } from "@/app/[lang]/dictionaries";

/**
 * Legal pages copy (privacy policy and data deletion) per locale.
 * Keep the three languages in sync: the Portuguese text is the reference.
 */

export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LEGAL_CONTACT_EMAIL = "meuperfilproject@gmail.com";
const CONTROLLER = "Patrick Nascimento";
const UPDATED_AT = "2026-10-24";

const privacy: Record<Locale, LegalDocument> = {
  pt: {
    metaTitle: "Política de Privacidade — MeuPerfil",
    metaDescription:
      "Quais dados o MeuPerfil coleta, por que coleta, com quem compartilha e como você exerce seus direitos pela LGPD.",
    title: "Política de Privacidade",
    intro:
      "Esta política explica, em linguagem direta, quais dados o MeuPerfil (meuperfil.me) trata, para quê, por quanto tempo e como você pode acessá-los, corrigi-los ou pedir a exclusão. Ela segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "1. Quem é o responsável",
        blocks: [
          `O MeuPerfil é operado por ${CONTROLLER}, pessoa física, no Brasil, que atua como controlador dos dados das contas cadastradas. Contato do encarregado (DPO) para qualquer assunto de privacidade: ${LEGAL_CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. Para quem vale esta política",
        blocks: [
          {
            list: [
              "Clientes: pessoas e empresas que criam uma conta no MeuPerfil.",
              "Visitantes das páginas públicas de link na bio (meuperfil.me/seunome).",
              "Pessoas que comentam ou enviam mensagens para uma conta do Instagram conectada por um cliente.",
            ],
          },
          "No caso dos visitantes e de quem comenta, o cliente dono da página ou da conta do Instagram decide a finalidade do uso (por exemplo, enviar um link por DM). Nessas situações o MeuPerfil trata os dados em nome do cliente, como operador.",
        ],
      },
      {
        heading: "3. Dados que coletamos",
        blocks: [
          "De clientes:",
          {
            list: [
              "E-mail usado no login, que é feito por link enviado ao e-mail, sem senha.",
              "Nome do espaço de trabalho, membros convidados e suas funções.",
              "Conta do Instagram conectada: identificador, nome de usuário e o token de acesso fornecido pela Meta, guardado de forma criptografada. Nunca pedimos nem guardamos a senha do Instagram.",
              "Configurações de campanhas, páginas de link na bio e publicações agendadas, incluindo textos, links e imagens enviados por você.",
              "Dados de assinatura: plano, status e identificadores do Stripe. Os dados do cartão ficam apenas com o Stripe.",
            ],
          },
          "De quem comenta ou envia mensagens para uma conta conectada:",
          {
            list: [
              "Identificador e nome de usuário no Instagram, texto do comentário ou da mensagem e o post em que foi feito.",
              "Registro da resposta enviada pelo Direct e da palavra-chave encontrada.",
              "Se a pessoa interagir com uma campanha, um registro de contato (lead) no espaço de trabalho do cliente.",
            ],
          },
          "De visitantes das páginas de link na bio e de links rastreados:",
          {
            list: [
              "Data e hora da visita e do clique, e qual link foi clicado.",
              "Navegador e tipo de aparelho, página de origem e parâmetros de campanha (UTM).",
              "País, estado e cidade aproximados, deduzidos pela rede da hospedagem a partir do endereço IP.",
              "Uma versão embaralhada (hash) do endereço IP, usada só para contar visitantes únicos. O IP original não é guardado.",
            ],
          },
        ],
      },
      {
        heading: "4. Para que usamos e com qual base legal",
        blocks: [
          {
            list: [
              "Prestar o serviço contratado: login, campanhas, respostas automáticas, link na bio, agendamento e relatórios (execução de contrato).",
              "Cobrança e emissão de registros financeiros (execução de contrato e cumprimento de obrigação legal).",
              "Métricas anônimas de visitas e cliques para o cliente dono da página (legítimo interesse do cliente, como controlador).",
              "Segurança, prevenção de abuso, limites de envio e diagnóstico de falhas (legítimo interesse).",
              "E-mails sobre a sua conta e, se você se inscrever, sobre o programa beta (execução de contrato e consentimento).",
            ],
          },
          "Não vendemos dados pessoais, não usamos os dados para publicidade e não treinamos modelos de inteligência artificial com eles.",
        ],
      },
      {
        heading: "5. Dados do Instagram e da Meta",
        blocks: [
          "A conexão com o Instagram usa somente a API oficial da Meta, autorizada pelo dono da conta no próprio Instagram. Não fazemos raspagem de dados, não automatizamos o navegador e não acessamos contas que não nos autorizaram.",
          "Usamos os dados do Instagram apenas para o que o cliente configurou: ler comentários dos próprios posts, responder pelo Direct, publicar conteúdos agendados e mostrar métricas. O acesso pode ser revogado a qualquer momento no MeuPerfil (Configurações → Desconectar) ou no Instagram (Configurações → Apps e sites).",
        ],
      },
      {
        heading: "6. Com quem compartilhamos",
        blocks: [
          "Usamos fornecedores que processam dados apenas para o MeuPerfil funcionar:",
          {
            list: [
              "Vercel: hospedagem do site e do aplicativo (Estados Unidos, com execução em São Paulo).",
              "Supabase: banco de dados (região São Paulo, Brasil).",
              "Upstash: fila de processamento (região São Paulo, Brasil).",
              "Railway: processamento em segundo plano das respostas e publicações (Estados Unidos).",
              "Resend: envio de e-mails de acesso e avisos.",
              "Stripe: pagamentos e assinaturas.",
              "Meta: Instagram, quando você conecta uma conta.",
            ],
          },
          "Alguns desses fornecedores ficam fora do Brasil. Nessas transferências exigimos garantias contratuais de proteção compatíveis com a LGPD. Também podemos compartilhar dados quando a lei ou uma autoridade competente exigir.",
        ],
      },
      {
        heading: "7. Cookies",
        blocks: [
          "Usamos apenas dois cookies necessários: um para manter você conectado e outro para lembrar o idioma escolhido. Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros.",
        ],
      },
      {
        heading: "8. Por quanto tempo guardamos",
        blocks: [
          {
            list: [
              "Dados da conta: enquanto a conta existir.",
              "Conta do Instagram conectada, campanhas e registros de envio: até você desconectar a conta ou pedir a exclusão. Ao desconectar, apagamos o token e também as campanhas e os registros de DM ligados àquela conta.",
              "Visitas e cliques: enquanto a página existir, ou até o pedido de exclusão.",
              "Registros de cobrança: pelo prazo exigido pela legislação fiscal (em geral, 5 anos).",
              "Cópias de segurança: sobrescritas automaticamente em até 30 dias.",
            ],
          },
        ],
      },
      {
        heading: "9. Seus direitos",
        blocks: [
          "Pela LGPD, você pode pedir: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos, e revogação de consentimento.",
          `Envie o pedido para ${LEGAL_CONTACT_EMAIL}. Respondemos em até 15 dias. Se o pedido for sobre um comentário ou uma página de um cliente, podemos encaminhá-lo ao cliente responsável e avisaremos você. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
          "Para apagar a conta ou dados específicos, veja a página Exclusão de dados.",
        ],
      },
      {
        heading: "10. Segurança",
        blocks: [
          "Os tokens do Instagram são criptografados, o acesso ao site usa HTTPS, o login não usa senha e o acesso interno aos dados é restrito. Nenhum sistema é totalmente imune a incidentes; se ocorrer um incidente relevante, avisaremos os afetados e a ANPD, como manda a lei.",
        ],
      },
      {
        heading: "11. Menores de idade",
        blocks: [
          "O MeuPerfil é destinado a maiores de 18 anos. Não criamos contas de menores de forma consciente.",
        ],
      },
      {
        heading: "12. Mudanças nesta política",
        blocks: [
          "Quando houver mudança importante, avisaremos por e-mail ou no aplicativo antes de ela valer. A data no topo desta página mostra a última atualização.",
        ],
      },
    ],
  },
  en: {
    metaTitle: "Privacy Policy — MeuPerfil",
    metaDescription:
      "What data MeuPerfil collects, why, who we share it with and how to exercise your rights under Brazil's LGPD.",
    title: "Privacy Policy",
    intro:
      "This policy explains, in plain language, what data MeuPerfil (meuperfil.me) processes, why, for how long, and how you can access, correct or delete it. It follows Brazil's General Data Protection Law (Law 13,709/2018 — LGPD).",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "1. Who is responsible",
        blocks: [
          `MeuPerfil is operated by ${CONTROLLER}, an individual based in Brazil, who acts as the controller of account data. Data protection officer contact for any privacy matter: ${LEGAL_CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. Who this policy covers",
        blocks: [
          {
            list: [
              "Customers: people and businesses who create a MeuPerfil account.",
              "Visitors of public link-in-bio pages (meuperfil.me/yourname).",
              "People who comment on or message an Instagram account connected by a customer.",
            ],
          },
          "For visitors and commenters, the customer who owns the page or Instagram account decides the purpose (for example, sending a link by DM). In those cases MeuPerfil processes the data on the customer's behalf, as a processor.",
        ],
      },
      {
        heading: "3. Data we collect",
        blocks: [
          "From customers:",
          {
            list: [
              "The email used to sign in. Sign-in works with a link sent by email, without a password.",
              "Workspace name, invited members and their roles.",
              "The connected Instagram account: ID, username and the access token issued by Meta, stored encrypted. We never ask for or store your Instagram password.",
              "Campaign, link-in-bio and scheduled post settings, including text, links and images you upload.",
              "Subscription data: plan, status and Stripe identifiers. Card details stay with Stripe only.",
            ],
          },
          "From people who comment on or message a connected account:",
          {
            list: [
              "Instagram ID and username, the comment or message text and the post it was made on.",
              "A record of the reply sent by DM and the keyword that matched.",
              "If the person interacts with a campaign, a contact (lead) record in the customer's workspace.",
            ],
          },
          "From visitors of link-in-bio pages and tracked links:",
          {
            list: [
              "Date and time of the visit and click, and which link was clicked.",
              "Browser and device type, referring page and campaign parameters (UTM).",
              "Approximate country, state and city, derived by our hosting network from the IP address.",
              "A scrambled (hashed) version of the IP address, used only to count unique visitors. The original IP is not stored.",
            ],
          },
        ],
      },
      {
        heading: "4. Why we use it and on what legal basis",
        blocks: [
          {
            list: [
              "To provide the service: sign-in, campaigns, automated replies, link in bio, scheduling and reports (performance of contract).",
              "Billing and financial records (performance of contract and legal obligation).",
              "Anonymous visit and click metrics for the page owner (the customer's legitimate interest, as controller).",
              "Security, abuse prevention, sending limits and troubleshooting (legitimate interest).",
              "Emails about your account and, if you sign up, about the beta program (contract and consent).",
            ],
          },
          "We do not sell personal data, do not use it for advertising and do not train artificial intelligence models with it.",
        ],
      },
      {
        heading: "5. Instagram and Meta data",
        blocks: [
          "The Instagram connection uses only Meta's official API, authorized by the account owner on Instagram itself. We do not scrape data, do not automate browsers and do not access accounts that have not authorized us.",
          "Instagram data is used only for what the customer configured: reading comments on their own posts, replying by DM, publishing scheduled content and showing metrics. Access can be revoked at any time in MeuPerfil (Settings → Disconnect) or on Instagram (Settings → Apps and websites).",
        ],
      },
      {
        heading: "6. Who we share data with",
        blocks: [
          "We use providers that process data only so MeuPerfil can work:",
          {
            list: [
              "Vercel: website and app hosting (United States, running in São Paulo).",
              "Supabase: database (São Paulo region, Brazil).",
              "Upstash: processing queue (São Paulo region, Brazil).",
              "Railway: background processing of replies and posts (United States).",
              "Resend: sign-in and notice emails.",
              "Stripe: payments and subscriptions.",
              "Meta: Instagram, when you connect an account.",
            ],
          },
          "Some of these providers are outside Brazil. For those transfers we require contractual safeguards compatible with the LGPD. We may also share data when required by law or a competent authority.",
        ],
      },
      {
        heading: "7. Cookies",
        blocks: [
          "We use only two necessary cookies: one to keep you signed in and one to remember your language. We do not use advertising cookies or third-party tracking tools.",
        ],
      },
      {
        heading: "8. How long we keep data",
        blocks: [
          {
            list: [
              "Account data: while the account exists.",
              "Connected Instagram account, campaigns and send records: until you disconnect the account or ask for deletion. Disconnecting deletes the token and also the campaigns and DM records tied to that account.",
              "Visits and clicks: while the page exists, or until a deletion request.",
              "Billing records: for the period required by tax law (usually 5 years).",
              "Backups: automatically overwritten within 30 days.",
            ],
          },
        ],
      },
      {
        heading: "9. Your rights",
        blocks: [
          "Under the LGPD you may request: confirmation that we process your data, access, correction, anonymization or deletion of unnecessary data, portability, information on who we share it with, and withdrawal of consent.",
          `Send your request to ${LEGAL_CONTACT_EMAIL}. We reply within 15 days. If the request concerns a customer's comment or page, we may forward it to that customer and will let you know. You can also complain to Brazil's National Data Protection Authority (ANPD).`,
          "To delete your account or specific data, see the Data Deletion page.",
        ],
      },
      {
        heading: "10. Security",
        blocks: [
          "Instagram tokens are encrypted, the site uses HTTPS, sign-in is passwordless and internal access to data is restricted. No system is fully immune to incidents; if a relevant incident happens, we will notify those affected and the ANPD, as required by law.",
        ],
      },
      {
        heading: "11. Minors",
        blocks: ["MeuPerfil is intended for people aged 18 or over. We do not knowingly create accounts for minors."],
      },
      {
        heading: "12. Changes to this policy",
        blocks: [
          "If something important changes, we will tell you by email or in the app before it takes effect. The date at the top of this page shows the last update.",
        ],
      },
    ],
  },
  es: {
    metaTitle: "Política de Privacidad — MeuPerfil",
    metaDescription:
      "Qué datos recopila MeuPerfil, para qué, con quién los comparte y cómo ejercer tus derechos según la LGPD de Brasil.",
    title: "Política de Privacidad",
    intro:
      "Esta política explica, en lenguaje claro, qué datos trata MeuPerfil (meuperfil.me), para qué, durante cuánto tiempo y cómo puedes acceder a ellos, corregirlos o pedir su eliminación. Sigue la Ley General de Protección de Datos de Brasil (Ley 13.709/2018 — LGPD).",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "1. Quién es el responsable",
        blocks: [
          `MeuPerfil es operado por ${CONTROLLER}, persona física con sede en Brasil, que actúa como responsable de los datos de las cuentas. Contacto del encargado de protección de datos (DPO): ${LEGAL_CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. A quién se aplica esta política",
        blocks: [
          {
            list: [
              "Clientes: personas y empresas que crean una cuenta en MeuPerfil.",
              "Visitantes de las páginas públicas de enlace en bio (meuperfil.me/tunombre).",
              "Personas que comentan o envían mensajes a una cuenta de Instagram conectada por un cliente.",
            ],
          },
          "En el caso de visitantes y de quien comenta, el cliente dueño de la página o de la cuenta de Instagram decide la finalidad (por ejemplo, enviar un enlace por DM). En esas situaciones MeuPerfil trata los datos en nombre del cliente, como encargado.",
        ],
      },
      {
        heading: "3. Datos que recopilamos",
        blocks: [
          "De clientes:",
          {
            list: [
              "El email usado para iniciar sesión. El acceso funciona con un enlace enviado por email, sin contraseña.",
              "Nombre del espacio de trabajo, miembros invitados y sus funciones.",
              "La cuenta de Instagram conectada: identificador, nombre de usuario y el token de acceso emitido por Meta, guardado cifrado. Nunca pedimos ni guardamos la contraseña de Instagram.",
              "Configuración de campañas, páginas de enlace en bio y publicaciones programadas, incluidos textos, enlaces e imágenes que subas.",
              "Datos de suscripción: plan, estado e identificadores de Stripe. Los datos de la tarjeta quedan solo en Stripe.",
            ],
          },
          "De quien comenta o envía mensajes a una cuenta conectada:",
          {
            list: [
              "Identificador y nombre de usuario de Instagram, el texto del comentario o mensaje y la publicación donde se hizo.",
              "Un registro de la respuesta enviada por DM y de la palabra clave encontrada.",
              "Si la persona interactúa con una campaña, un registro de contacto (lead) en el espacio de trabajo del cliente.",
            ],
          },
          "De visitantes de páginas de enlace en bio y enlaces rastreados:",
          {
            list: [
              "Fecha y hora de la visita y del clic, y qué enlace se pulsó.",
              "Navegador y tipo de dispositivo, página de origen y parámetros de campaña (UTM).",
              "País, estado y ciudad aproximados, deducidos por la red de alojamiento a partir de la dirección IP.",
              "Una versión cifrada (hash) de la dirección IP, usada solo para contar visitantes únicos. La IP original no se guarda.",
            ],
          },
        ],
      },
      {
        heading: "4. Para qué los usamos y con qué base legal",
        blocks: [
          {
            list: [
              "Prestar el servicio: acceso, campañas, respuestas automáticas, enlace en bio, programación e informes (ejecución de contrato).",
              "Cobro y registros financieros (ejecución de contrato y obligación legal).",
              "Métricas anónimas de visitas y clics para el dueño de la página (interés legítimo del cliente, como responsable).",
              "Seguridad, prevención de abusos, límites de envío y diagnóstico de fallos (interés legítimo).",
              "Emails sobre tu cuenta y, si te inscribes, sobre el programa beta (contrato y consentimiento).",
            ],
          },
          "No vendemos datos personales, no los usamos para publicidad y no entrenamos modelos de inteligencia artificial con ellos.",
        ],
      },
      {
        heading: "5. Datos de Instagram y de Meta",
        blocks: [
          "La conexión con Instagram usa solo la API oficial de Meta, autorizada por el dueño de la cuenta en el propio Instagram. No extraemos datos de forma automatizada, no automatizamos navegadores y no accedemos a cuentas que no nos autorizaron.",
          "Usamos los datos de Instagram solo para lo que el cliente configuró: leer comentarios de sus publicaciones, responder por DM, publicar contenido programado y mostrar métricas. El acceso puede revocarse en cualquier momento en MeuPerfil (Configuración → Desconectar) o en Instagram (Configuración → Apps y sitios web).",
        ],
      },
      {
        heading: "6. Con quién compartimos",
        blocks: [
          "Usamos proveedores que tratan datos solo para que MeuPerfil funcione:",
          {
            list: [
              "Vercel: alojamiento del sitio y la aplicación (Estados Unidos, con ejecución en São Paulo).",
              "Supabase: base de datos (región São Paulo, Brasil).",
              "Upstash: cola de procesamiento (región São Paulo, Brasil).",
              "Railway: procesamiento en segundo plano de respuestas y publicaciones (Estados Unidos).",
              "Resend: emails de acceso y avisos.",
              "Stripe: pagos y suscripciones.",
              "Meta: Instagram, cuando conectas una cuenta.",
            ],
          },
          "Algunos de estos proveedores están fuera de Brasil. Para esas transferencias exigimos garantías contractuales compatibles con la LGPD. También podemos compartir datos cuando lo exija la ley o una autoridad competente.",
        ],
      },
      {
        heading: "7. Cookies",
        blocks: [
          "Usamos solo dos cookies necesarias: una para mantener tu sesión y otra para recordar el idioma. No usamos cookies publicitarias ni herramientas de seguimiento de terceros.",
        ],
      },
      {
        heading: "8. Cuánto tiempo guardamos los datos",
        blocks: [
          {
            list: [
              "Datos de la cuenta: mientras la cuenta exista.",
              "Cuenta de Instagram conectada, campañas y registros de envío: hasta que desconectes la cuenta o pidas la eliminación. Al desconectar, borramos el token y también las campañas y los registros de DM de esa cuenta.",
              "Visitas y clics: mientras la página exista, o hasta una solicitud de eliminación.",
              "Registros de cobro: por el plazo exigido por la ley fiscal (en general, 5 años).",
              "Copias de seguridad: se sobrescriben automáticamente en hasta 30 días.",
            ],
          },
        ],
      },
      {
        heading: "9. Tus derechos",
        blocks: [
          "Según la LGPD puedes pedir: confirmación de que tratamos tus datos, acceso, corrección, anonimización o eliminación de datos innecesarios, portabilidad, información sobre con quién los compartimos y revocación del consentimiento.",
          `Envía tu solicitud a ${LEGAL_CONTACT_EMAIL}. Respondemos en hasta 15 días. Si la solicitud trata de un comentario o una página de un cliente, podemos reenviarla a ese cliente y te avisaremos. También puedes reclamar ante la Autoridad Nacional de Protección de Datos de Brasil (ANPD).`,
          "Para borrar tu cuenta o datos específicos, consulta la página Eliminación de datos.",
        ],
      },
      {
        heading: "10. Seguridad",
        blocks: [
          "Los tokens de Instagram están cifrados, el sitio usa HTTPS, el acceso no usa contraseña y el acceso interno a los datos es restringido. Ningún sistema es totalmente inmune a incidentes; si ocurre uno relevante, avisaremos a los afectados y a la ANPD, como exige la ley.",
        ],
      },
      {
        heading: "11. Menores de edad",
        blocks: ["MeuPerfil está destinado a mayores de 18 años. No creamos cuentas de menores de forma consciente."],
      },
      {
        heading: "12. Cambios en esta política",
        blocks: [
          "Si hay un cambio importante, te avisaremos por email o en la aplicación antes de que entre en vigor. La fecha al inicio de esta página indica la última actualización.",
        ],
      },
    ],
  },
};

const dataDeletion: Record<Locale, LegalDocument> = {
  pt: {
    metaTitle: "Exclusão de dados — MeuPerfil",
    metaDescription:
      "Como desconectar o Instagram, apagar sua conta do MeuPerfil ou pedir a exclusão dos seus dados, seja você cliente, visitante ou alguém que comentou.",
    title: "Exclusão de dados",
    intro:
      "Você pode apagar seus dados do MeuPerfil a qualquer momento. Escolha abaixo a situação que se aplica a você.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Sou cliente e quero desconectar o Instagram",
        blocks: [
          {
            list: [
              "Entre no MeuPerfil e abra Configurações.",
              "Em Conexão com Instagram, clique em Desconectar na conta desejada.",
            ],
          },
          "Na hora, apagamos o token de acesso daquela conta e também as campanhas e os registros de DM ligados a ela. As respostas automáticas param imediatamente.",
          "Você também pode remover o acesso pelo próprio Instagram: Configurações → Apps e sites → MeuPerfil → Remover. Isso interrompe as respostas na hora, mas os registros só são apagados quando você desconecta a conta no MeuPerfil ou nos pede por e-mail.",
        ],
      },
      {
        heading: "Sou cliente e quero apagar minha conta inteira",
        blocks: [
          `Envie um e-mail para ${LEGAL_CONTACT_EMAIL} com o assunto "Exclusão de conta", a partir do e-mail que você usa para entrar. Informe o nome do espaço de trabalho e, se houver, o @ do Instagram conectado.`,
          "Apagamos: usuário, espaço de trabalho, contas do Instagram, campanhas, registros de DM, contatos, páginas de link na bio, métricas, publicações agendadas e convites.",
          "Mantemos apenas os registros de cobrança exigidos pela legislação fiscal, pelo prazo legal. Se houver assinatura ativa, ela é cancelada antes da exclusão.",
        ],
      },
      {
        heading: "Não sou cliente: comentei, mandei mensagem ou visitei uma página",
        blocks: [
          `Envie um e-mail para ${LEGAL_CONTACT_EMAIL} com o seu @ do Instagram (ou o link da página que visitou) e o que deseja apagar.`,
          "Apagamos o registro do seu comentário, da resposta enviada e o seu contato nos espaços de trabalho em que aparecer. Como o cliente dono da conta é quem decide sobre esses dados, também avisaremos esse cliente.",
          "As visitas às páginas são guardadas sem o seu endereço IP original. Por isso, só conseguimos localizá-las se você indicar a página, a data e o horário aproximados.",
        ],
      },
      {
        heading: "Prazos e confirmação",
        blocks: [
          {
            list: [
              "Confirmamos o recebimento em até 2 dias úteis.",
              "Concluímos a exclusão em até 15 dias e enviamos uma confirmação por e-mail.",
              "Cópias de segurança são sobrescritas automaticamente em até 30 dias.",
            ],
          },
          "Para proteger você, podemos pedir uma confirmação de que você controla o e-mail ou a conta do Instagram antes de apagar os dados.",
        ],
      },
      {
        heading: "Dúvidas",
        blocks: [
          `Escreva para ${LEGAL_CONTACT_EMAIL}. Os detalhes sobre quais dados tratamos estão na Política de Privacidade.`,
        ],
      },
    ],
  },
  en: {
    metaTitle: "Data Deletion — MeuPerfil",
    metaDescription:
      "How to disconnect Instagram, delete your MeuPerfil account or request deletion of your data, whether you are a customer, a visitor or someone who commented.",
    title: "Data Deletion",
    intro: "You can delete your MeuPerfil data at any time. Pick the situation that applies to you below.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "I am a customer and want to disconnect Instagram",
        blocks: [
          { list: ["Sign in to MeuPerfil and open Settings.", "Under Instagram connection, click Disconnect on the account."] },
          "We immediately delete that account's access token and the campaigns and DM records tied to it. Automated replies stop right away.",
          "You can also remove access on Instagram itself: Settings → Apps and websites → MeuPerfil → Remove. Replies stop right away, but records are only deleted when you disconnect the account in MeuPerfil or ask us by email.",
        ],
      },
      {
        heading: "I am a customer and want to delete my whole account",
        blocks: [
          `Email ${LEGAL_CONTACT_EMAIL} with the subject "Account deletion" from the address you use to sign in. Include the workspace name and, if any, the connected Instagram @.`,
          "We delete: user, workspace, Instagram accounts, campaigns, DM records, contacts, link-in-bio pages, metrics, scheduled posts and invitations.",
          "We keep only the billing records required by tax law, for the legal period. Any active subscription is cancelled before deletion.",
        ],
      },
      {
        heading: "I am not a customer: I commented, sent a message or visited a page",
        blocks: [
          `Email ${LEGAL_CONTACT_EMAIL} with your Instagram @ (or the link of the page you visited) and what you want deleted.`,
          "We delete the record of your comment, the reply sent and your contact in any workspace where it appears. Because the customer who owns the account decides about that data, we will also let that customer know.",
          "Page visits are stored without your original IP address, so we can only find them if you tell us the page and the approximate date and time.",
        ],
      },
      {
        heading: "Timelines and confirmation",
        blocks: [
          {
            list: [
              "We acknowledge your request within 2 business days.",
              "We complete the deletion within 15 days and confirm by email.",
              "Backups are automatically overwritten within 30 days.",
            ],
          },
          "To protect you, we may ask you to confirm that you control the email or Instagram account before deleting data.",
        ],
      },
      {
        heading: "Questions",
        blocks: [`Write to ${LEGAL_CONTACT_EMAIL}. Details about the data we process are in the Privacy Policy.`],
      },
    ],
  },
  es: {
    metaTitle: "Eliminación de datos — MeuPerfil",
    metaDescription:
      "Cómo desconectar Instagram, borrar tu cuenta de MeuPerfil o pedir la eliminación de tus datos, seas cliente, visitante o alguien que comentó.",
    title: "Eliminación de datos",
    intro: "Puedes borrar tus datos de MeuPerfil en cualquier momento. Elige abajo la situación que te corresponde.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Soy cliente y quiero desconectar Instagram",
        blocks: [
          { list: ["Inicia sesión en MeuPerfil y abre Configuración.", "En Conexión con Instagram, pulsa Desconectar en la cuenta."] },
          "Al instante borramos el token de acceso de esa cuenta y también las campañas y los registros de DM vinculados. Las respuestas automáticas se detienen de inmediato.",
          "También puedes quitar el acceso en el propio Instagram: Configuración → Apps y sitios web → MeuPerfil → Eliminar. Las respuestas se detienen al instante, pero los registros solo se borran cuando desconectas la cuenta en MeuPerfil o nos lo pides por email.",
        ],
      },
      {
        heading: "Soy cliente y quiero borrar toda mi cuenta",
        blocks: [
          `Escribe a ${LEGAL_CONTACT_EMAIL} con el asunto "Eliminación de cuenta" desde el email con el que inicias sesión. Indica el nombre del espacio de trabajo y, si lo hay, el @ de Instagram conectado.`,
          "Borramos: usuario, espacio de trabajo, cuentas de Instagram, campañas, registros de DM, contactos, páginas de enlace en bio, métricas, publicaciones programadas e invitaciones.",
          "Solo conservamos los registros de cobro exigidos por la ley fiscal, durante el plazo legal. Si hay una suscripción activa, se cancela antes de la eliminación.",
        ],
      },
      {
        heading: "No soy cliente: comenté, envié un mensaje o visité una página",
        blocks: [
          `Escribe a ${LEGAL_CONTACT_EMAIL} con tu @ de Instagram (o el enlace de la página que visitaste) y lo que quieres borrar.`,
          "Borramos el registro de tu comentario, de la respuesta enviada y tu contacto en los espacios de trabajo donde aparezca. Como el cliente dueño de la cuenta decide sobre esos datos, también se lo comunicaremos.",
          "Las visitas a las páginas se guardan sin tu dirección IP original, así que solo podemos encontrarlas si indicas la página y la fecha y hora aproximadas.",
        ],
      },
      {
        heading: "Plazos y confirmación",
        blocks: [
          {
            list: [
              "Confirmamos la recepción en hasta 2 días hábiles.",
              "Completamos la eliminación en hasta 15 días y lo confirmamos por email.",
              "Las copias de seguridad se sobrescriben automáticamente en hasta 30 días.",
            ],
          },
          "Para protegerte, podemos pedirte que confirmes que controlas el email o la cuenta de Instagram antes de borrar los datos.",
        ],
      },
      {
        heading: "Dudas",
        blocks: [`Escribe a ${LEGAL_CONTACT_EMAIL}. Los detalles sobre los datos que tratamos están en la Política de Privacidad.`],
      },
    ],
  },
};

export type LegalKind = "privacy" | "dataDeletion" | "terms" | "metaReview";

export async function getLegalDocument(kind: LegalKind, locale: Locale): Promise<LegalDocument> {
  if (kind === "privacy") return privacy[locale];
  if (kind === "dataDeletion") return dataDeletion[locale];
  // Imported lazily: terms.ts imports this module for shared constants.
  const docs = await import("./terms");
  return (kind === "terms" ? docs.terms : docs.metaReview)[locale];
}
