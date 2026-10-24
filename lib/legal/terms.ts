import type { Locale } from "@/app/[lang]/dictionaries";
import type { LegalDocument } from "./content";
import { LEGAL_CONTACT_EMAIL } from "./content";

const UPDATED_AT = "2026-10-24";
const OPERATOR = "Patrick Nascimento";

export const terms: Record<Locale, LegalDocument> = {
  pt: {
    metaTitle: "Termos de uso — MeuPerfil",
    metaDescription: "Regras para usar o MeuPerfil: conta, uso permitido do Instagram, planos e pagamentos, cancelamento e responsabilidades.",
    title: "Termos de uso",
    intro: `Estes termos regem o uso do MeuPerfil (meuperfil.me), operado por ${OPERATOR}, no Brasil. Ao criar uma conta ou usar o serviço, você concorda com eles. Se usar em nome de uma empresa, declara ter autorização para aceitá-los por ela.`,
    updatedAt: UPDATED_AT,
    sections: [
      { heading: "1. O serviço", blocks: ["O MeuPerfil oferece página de link na bio, respostas automáticas no Direct do Instagram a partir de comentários, agendamento de publicações, links rastreados, contatos e métricas. Alguns recursos dependem de conectar uma conta profissional do Instagram."] },
      { heading: "2. Sua conta", blocks: [{ list: ["Você precisa ter 18 anos ou mais.", "O acesso é feito por link enviado ao seu e-mail; mantenha esse e-mail seguro.", "Você responde pelo que acontece na sua conta e pelos membros que convidar.", "Avise-nos em caso de uso não autorizado."] }] },
      {
        heading: "3. Uso permitido",
        blocks: [
          "Você só pode conectar contas do Instagram que são suas ou que tem autorização para gerenciar, e deve seguir os Termos da Plataforma Meta, as regras do Instagram e a legislação brasileira, incluindo o Código de Defesa do Consumidor e a LGPD.",
          "Não é permitido usar o MeuPerfil para:",
          { list: ["enviar spam, mensagens enganosas ou conteúdo ilegal;", "golpes, pirâmides, venda de produtos proibidos ou conteúdo adulto;", "coletar dados de pessoas sem base legal ou repassá-los a terceiros;", "burlar limites do Instagram, automatizar contas de terceiros ou tentar acessar dados de outros clientes;", "páginas de link na bio que imitem outras marcas ou pessoas."] },
          "Podemos pausar campanhas, remover páginas ou suspender contas que violem estas regras ou coloquem em risco o serviço ou a integração com a Meta. Sempre que possível, avisaremos antes e explicaremos o motivo.",
        ],
      },
      { heading: "4. Seu conteúdo", blocks: ["Os textos, links, imagens e dados que você coloca no MeuPerfil continuam sendo seus. Você nos autoriza a armazená-los e exibi-los apenas para prestar o serviço, por exemplo publicar sua página e enviar as respostas que você configurou. Você garante que tem direito de usar esse conteúdo."] },
      { heading: "5. Endereço da página", blocks: ["O endereço meuperfil.me/seunome é concedido enquanto a conta estiver ativa e em uso. Podemos recuperar endereços que violem marcas de terceiros, imitem outras pessoas ou fiquem inativos por longo período, com aviso prévio."] },
      {
        heading: "6. Planos e pagamentos",
        blocks: [
          { list: ["O plano Grátis não tem custo e tem limites menores.", "Planos pagos são cobrados mensalmente, de forma antecipada, pelo Stripe, nos valores exibidos na página de preços.", "Ao atingir o limite do plano, o recurso para até o próximo ciclo ou até você mudar de plano.", "Podemos alterar preços com aviso de pelo menos 30 dias; a mudança vale a partir do ciclo seguinte."] },
        ],
      },
      { heading: "7. Cancelamento e reembolso", blocks: ["Você pode cancelar a assinatura a qualquer momento, sem multa. O plano pago continua até o fim do período já pago e depois a conta volta para o plano Grátis. Na primeira contratação de um plano pago, você pode pedir reembolso integral em até 7 dias, conforme o direito de arrependimento do Código de Defesa do Consumidor."] },
      { heading: "8. Dependência de terceiros", blocks: ["Recursos ligados ao Instagram dependem da Meta, que pode mudar regras, limites ou disponibilidade da API a qualquer momento. Trabalhamos para manter o serviço estável, mas não garantimos funcionamento ininterrupto nem que todas as mensagens sejam entregues."] },
      { heading: "9. Responsabilidade", blocks: ["O MeuPerfil é fornecido como está. Na extensão permitida pela lei, não respondemos por lucros cessantes ou danos indiretos, e nossa responsabilidade total fica limitada ao valor pago por você nos 12 meses anteriores ao fato. Nada nestes termos limita direitos que a lei garante ao consumidor."] },
      { heading: "10. Encerramento", blocks: ["Você pode encerrar sua conta a qualquer momento seguindo a página Exclusão de dados. Podemos encerrar contas por violação destes termos ou se o serviço for descontinuado; neste caso, avisaremos com pelo menos 30 dias para você salvar seus dados."] },
      { heading: "11. Mudanças nestes termos", blocks: ["Mudanças importantes serão avisadas por e-mail ou no aplicativo com antecedência. Continuar usando o serviço depois da data de vigência significa aceitar a nova versão."] },
      { heading: "12. Lei e foro", blocks: [`Estes termos seguem as leis do Brasil. Fica eleito o foro do domicílio do consumidor. Dúvidas: ${LEGAL_CONTACT_EMAIL}.`] },
    ],
  },
  en: {
    metaTitle: "Terms of Use — MeuPerfil",
    metaDescription: "Rules for using MeuPerfil: account, allowed Instagram use, plans and payments, cancellation and liability.",
    title: "Terms of Use",
    intro: `These terms govern your use of MeuPerfil (meuperfil.me), operated by ${OPERATOR} in Brazil. By creating an account or using the service you agree to them. If you use it on behalf of a company, you confirm you are authorized to accept them for it.`,
    updatedAt: UPDATED_AT,
    sections: [
      { heading: "1. The service", blocks: ["MeuPerfil offers a link-in-bio page, automatic Instagram DM replies to comments, post scheduling, tracked links, contacts and analytics. Some features require connecting a professional Instagram account."] },
      { heading: "2. Your account", blocks: [{ list: ["You must be 18 or older.", "Sign-in works with a link sent to your email; keep that email secure.", "You are responsible for activity in your account and for members you invite.", "Tell us about any unauthorized use."] }] },
      {
        heading: "3. Acceptable use",
        blocks: [
          "You may only connect Instagram accounts you own or are authorized to manage, and you must follow Meta's Platform Terms, Instagram's rules and applicable law, including Brazil's Consumer Code and LGPD.",
          "You may not use MeuPerfil for:",
          { list: ["spam, misleading messages or illegal content;", "scams, pyramid schemes, prohibited products or adult content;", "collecting people's data without a legal basis or passing it to third parties;", "circumventing Instagram limits, automating third-party accounts or trying to access other customers' data;", "link-in-bio pages that impersonate other brands or people."] },
          "We may pause campaigns, remove pages or suspend accounts that break these rules or put the service or the Meta integration at risk. Whenever possible we will warn you first and explain why.",
        ],
      },
      { heading: "4. Your content", blocks: ["The text, links, images and data you add to MeuPerfil remain yours. You allow us to store and display them only to provide the service, for example publishing your page and sending the replies you configured. You confirm you have the right to use that content."] },
      { heading: "5. Page address", blocks: ["Your meuperfil.me/yourname address is granted while the account is active and in use. We may reclaim addresses that infringe third-party trademarks, impersonate others or stay inactive for a long time, with prior notice."] },
      { heading: "6. Plans and payments", blocks: [{ list: ["The Free plan costs nothing and has lower limits.", "Paid plans are billed monthly in advance through Stripe, at the prices shown on the pricing page.", "When you reach a plan limit, that feature stops until the next cycle or until you upgrade.", "We may change prices with at least 30 days' notice; changes apply from the next cycle."] }] },
      { heading: "7. Cancellation and refunds", blocks: ["You can cancel at any time, without a fee. The paid plan stays active until the end of the paid period and then the account returns to the Free plan. On your first purchase of a paid plan you may request a full refund within 7 days, under the right of withdrawal in Brazil's Consumer Code."] },
      { heading: "8. Third-party dependencies", blocks: ["Instagram features depend on Meta, which may change rules, limits or API availability at any time. We work to keep the service stable but do not guarantee uninterrupted operation or delivery of every message."] },
      { heading: "9. Liability", blocks: ["MeuPerfil is provided as is. To the extent allowed by law we are not liable for lost profits or indirect damages, and our total liability is limited to what you paid us in the 12 months before the event. Nothing in these terms limits consumer rights guaranteed by law."] },
      { heading: "10. Termination", blocks: ["You can close your account at any time by following the Data Deletion page. We may close accounts that violate these terms or if the service is discontinued; in that case we will give at least 30 days' notice so you can save your data."] },
      { heading: "11. Changes to these terms", blocks: ["We will announce important changes by email or in the app in advance. Continuing to use the service after the effective date means you accept the new version."] },
      { heading: "12. Governing law", blocks: [`These terms are governed by Brazilian law, and the courts of the consumer's domicile have jurisdiction. Questions: ${LEGAL_CONTACT_EMAIL}.`] },
    ],
  },
  es: {
    metaTitle: "Términos de uso — MeuPerfil",
    metaDescription: "Reglas para usar MeuPerfil: cuenta, uso permitido de Instagram, planes y pagos, cancelación y responsabilidades.",
    title: "Términos de uso",
    intro: `Estos términos rigen el uso de MeuPerfil (meuperfil.me), operado por ${OPERATOR} en Brasil. Al crear una cuenta o usar el servicio, los aceptas. Si lo usas en nombre de una empresa, declaras estar autorizado para aceptarlos por ella.`,
    updatedAt: UPDATED_AT,
    sections: [
      { heading: "1. El servicio", blocks: ["MeuPerfil ofrece una página de enlace en bio, respuestas automáticas por DM de Instagram a partir de comentarios, programación de publicaciones, enlaces rastreados, contactos y métricas. Algunas funciones requieren conectar una cuenta profesional de Instagram."] },
      { heading: "2. Tu cuenta", blocks: [{ list: ["Debes tener 18 años o más.", "El acceso se hace con un enlace enviado a tu email; mantén ese email seguro.", "Eres responsable de lo que ocurre en tu cuenta y de los miembros que invites.", "Avísanos de cualquier uso no autorizado."] }] },
      {
        heading: "3. Uso permitido",
        blocks: [
          "Solo puedes conectar cuentas de Instagram que sean tuyas o que estés autorizado a gestionar, y debes cumplir los Términos de la Plataforma de Meta, las reglas de Instagram y la ley aplicable, incluidas las leyes de consumo y protección de datos de Brasil.",
          "No está permitido usar MeuPerfil para:",
          { list: ["spam, mensajes engañosos o contenido ilegal;", "estafas, esquemas piramidales, productos prohibidos o contenido adulto;", "recopilar datos de personas sin base legal o cederlos a terceros;", "eludir límites de Instagram, automatizar cuentas de terceros o intentar acceder a datos de otros clientes;", "páginas de enlace en bio que suplanten a otras marcas o personas."] },
          "Podemos pausar campañas, retirar páginas o suspender cuentas que incumplan estas reglas o pongan en riesgo el servicio o la integración con Meta. Siempre que sea posible, avisaremos antes y explicaremos el motivo.",
        ],
      },
      { heading: "4. Tu contenido", blocks: ["Los textos, enlaces, imágenes y datos que pones en MeuPerfil siguen siendo tuyos. Nos autorizas a guardarlos y mostrarlos solo para prestar el servicio, por ejemplo publicar tu página y enviar las respuestas que configuraste. Garantizas que tienes derecho a usar ese contenido."] },
      { heading: "5. Dirección de la página", blocks: ["La dirección meuperfil.me/tunombre se concede mientras la cuenta esté activa y en uso. Podemos recuperar direcciones que infrinjan marcas de terceros, suplanten a otras personas o queden inactivas por mucho tiempo, con aviso previo."] },
      { heading: "6. Planes y pagos", blocks: [{ list: ["El plan Gratis no tiene costo y tiene límites menores.", "Los planes de pago se cobran mensualmente por adelantado a través de Stripe, con los precios de la página de precios.", "Al alcanzar el límite del plan, esa función se detiene hasta el siguiente ciclo o hasta que cambies de plan.", "Podemos cambiar los precios con al menos 30 días de aviso; el cambio aplica desde el ciclo siguiente."] }] },
      { heading: "7. Cancelación y reembolso", blocks: ["Puedes cancelar en cualquier momento, sin penalización. El plan de pago sigue activo hasta el final del período pagado y luego la cuenta vuelve al plan Gratis. En la primera contratación de un plan de pago puedes pedir el reembolso total en hasta 7 días, conforme al derecho de arrepentimiento del Código de Defensa del Consumidor de Brasil."] },
      { heading: "8. Dependencia de terceros", blocks: ["Las funciones de Instagram dependen de Meta, que puede cambiar reglas, límites o la disponibilidad de la API en cualquier momento. Trabajamos para mantener el servicio estable, pero no garantizamos un funcionamiento ininterrumpido ni la entrega de todos los mensajes."] },
      { heading: "9. Responsabilidad", blocks: ["MeuPerfil se ofrece tal cual. En la medida permitida por la ley, no respondemos por lucro cesante ni daños indirectos, y nuestra responsabilidad total se limita a lo que nos pagaste en los 12 meses anteriores al hecho. Nada en estos términos limita los derechos que la ley garantiza al consumidor."] },
      { heading: "10. Terminación", blocks: ["Puedes cerrar tu cuenta en cualquier momento siguiendo la página Eliminación de datos. Podemos cerrar cuentas que incumplan estos términos o si el servicio se discontinúa; en ese caso avisaremos con al menos 30 días para que guardes tus datos."] },
      { heading: "11. Cambios en estos términos", blocks: ["Avisaremos con antelación de los cambios importantes por email o en la aplicación. Seguir usando el servicio después de la fecha de vigencia significa aceptar la nueva versión."] },
      { heading: "12. Ley y jurisdicción", blocks: [`Estos términos se rigen por las leyes de Brasil y es competente el foro del domicilio del consumidor. Dudas: ${LEGAL_CONTACT_EMAIL}.`] },
    ],
  },
};

export const metaReview: Record<Locale, LegalDocument> = {
  pt: {
    metaTitle: "Revisão do app pela Meta — MeuPerfil",
    metaDescription: "Como o MeuPerfil usa a API do Instagram e como testar o fluxo de comentário para Direct.",
    title: "Revisão do app pela Meta",
    intro: "Informações para a equipe de revisão da Meta sobre como o MeuPerfil usa a API do Instagram com login do Instagram.",
    updatedAt: UPDATED_AT,
    sections: [
      { heading: "Fluxo do usuário", blocks: [{ list: ["O dono do negócio entra no MeuPerfil com um link enviado ao e-mail.", "Conecta a própria conta profissional do Instagram pelo login oficial do Instagram.", "Cria uma campanha escolhendo um post ou Reel e uma palavra-chave.", "Quando alguém comenta a palavra-chave, a Meta envia um webhook; o MeuPerfil coloca o evento na fila, remove duplicados, confere os limites e envia uma resposta privada usando o ID do comentário."] }] },
      { heading: "Permissões usadas", blocks: [{ list: ["instagram_business_basic: identificar a conta e listar os posts para escolher a campanha.", "instagram_business_manage_comments: receber os comentários dos próprios posts.", "instagram_business_manage_messages: enviar a resposta privada para quem comentou.", "instagram_business_content_publish: publicar conteúdos agendados pelo próprio dono da conta."] }] },
      { heading: "Conformidade", blocks: ["Usamos apenas APIs oficiais, validamos a assinatura dos webhooks, guardamos os tokens criptografados, não fazemos raspagem nem pedimos senhas, e enviamos no máximo uma resposta privada por comentário."] },
      { heading: "Como testar", blocks: [{ list: ["Entre em meuperfil.me com um e-mail de teste e conecte uma conta profissional do Instagram de teste.", "Em Campanhas, crie uma campanha para um post com a palavra-chave LINK.", "Com outra conta, comente LINK nesse post.", "Confirme que a resposta privada chega uma única vez e aparece em Logs de DMs."] }] },
      { heading: "Contato", blocks: [`Dúvidas da revisão: ${LEGAL_CONTACT_EMAIL}.`] },
    ],
  },
  en: {
    metaTitle: "Meta App Review — MeuPerfil",
    metaDescription: "How MeuPerfil uses the Instagram API and how to test the comment-to-DM flow.",
    title: "Meta App Review",
    intro: "Information for Meta's review team on how MeuPerfil uses the Instagram API with Instagram Login.",
    updatedAt: UPDATED_AT,
    sections: [
      { heading: "User flow", blocks: [{ list: ["The business owner signs in to MeuPerfil with a link sent by email.", "They connect their own professional Instagram account through the official Instagram login.", "They create a campaign by choosing a post or Reel and a keyword.", "When someone comments the keyword, Meta sends a webhook; MeuPerfil queues the event, removes duplicates, checks limits and sends a private reply using the comment ID."] }] },
      { heading: "Permissions used", blocks: [{ list: ["instagram_business_basic: identify the account and list posts to set up a campaign.", "instagram_business_manage_comments: receive comments on the account's own posts.", "instagram_business_manage_messages: send the private reply to the commenter.", "instagram_business_content_publish: publish content scheduled by the account owner."] }] },
      { heading: "Compliance", blocks: ["We use only official APIs, verify webhook signatures, store tokens encrypted, never scrape or ask for passwords, and send at most one private reply per comment."] },
      { heading: "How to test", blocks: [{ list: ["Sign in at meuperfil.me with a test email and connect a test professional Instagram account.", "Under Campaigns, create a campaign for a post with the keyword LINK.", "From another account, comment LINK on that post.", "Confirm the private reply arrives exactly once and appears in DM Logs."] }] },
      { heading: "Contact", blocks: [`Review questions: ${LEGAL_CONTACT_EMAIL}.`] },
    ],
  },
  es: {
    metaTitle: "Revisión de la app por Meta — MeuPerfil",
    metaDescription: "Cómo MeuPerfil usa la API de Instagram y cómo probar el flujo de comentario a DM.",
    title: "Revisión de la app por Meta",
    intro: "Información para el equipo de revisión de Meta sobre cómo MeuPerfil usa la API de Instagram con inicio de sesión de Instagram.",
    updatedAt: UPDATED_AT,
    sections: [
      { heading: "Flujo del usuario", blocks: [{ list: ["El dueño del negocio entra en MeuPerfil con un enlace enviado por email.", "Conecta su propia cuenta profesional de Instagram con el inicio de sesión oficial de Instagram.", "Crea una campaña eligiendo una publicación o Reel y una palabra clave.", "Cuando alguien comenta la palabra clave, Meta envía un webhook; MeuPerfil pone el evento en cola, elimina duplicados, revisa los límites y envía una respuesta privada usando el ID del comentario."] }] },
      { heading: "Permisos usados", blocks: [{ list: ["instagram_business_basic: identificar la cuenta y listar publicaciones para la campaña.", "instagram_business_manage_comments: recibir comentarios de las publicaciones propias.", "instagram_business_manage_messages: enviar la respuesta privada a quien comentó.", "instagram_business_content_publish: publicar contenido programado por el dueño de la cuenta."] }] },
      { heading: "Cumplimiento", blocks: ["Usamos solo APIs oficiales, verificamos la firma de los webhooks, guardamos los tokens cifrados, no extraemos datos ni pedimos contraseñas, y enviamos como máximo una respuesta privada por comentario."] },
      { heading: "Cómo probar", blocks: [{ list: ["Entra en meuperfil.me con un email de prueba y conecta una cuenta profesional de Instagram de prueba.", "En Campañas, crea una campaña para una publicación con la palabra clave LINK.", "Desde otra cuenta, comenta LINK en esa publicación.", "Confirma que la respuesta privada llega una sola vez y aparece en Registros de DM."] }] },
      { heading: "Contacto", blocks: [`Dudas de la revisión: ${LEGAL_CONTACT_EMAIL}.`] },
    ],
  },
};
