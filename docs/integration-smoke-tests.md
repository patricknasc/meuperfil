# Validação das integrações em homologação

As verificações locais usam respostas simuladas. Esta lista confirma os fluxos
reais em HM, com contas de teste. Não use contas de clientes para validar.

## Preparação

1. Aplicar as migrations do commit em HM e implantar app e worker juntos.
2. Confirmar PostgreSQL, Redis, heartbeat do worker e acesso ao dashboard.
3. Reconectar o Instagram para conceder `instagram_business_content_publish`.
4. Conferir a permissão no painel Meta e a elegibilidade da conta para cada formato.

## Publicação e campanha

1. Criar um rascunho com uma mídia própria disponível em URL HTTPS pública.
2. Agendar e depois alterar o horário; confirmar que o horário antigo não publica.
3. Publicar imediatamente; confirmar uma única publicação e o registro PUBLISHED.
4. Repetir com Reel, carrossel e Story, quando a conta permitir esse formato.
5. Habilitar campanha automática; confirmar vínculo na publicação e limites do plano.
6. Comentar a palavra-chave com uma conta tester: confirmar uma DM, log SENT e lead.
7. Reenviar o webhook: confirmar ausência de duplicação do log e do lead.
8. Interromper Redis entre gravação e enqueue: confirmar recuperação pelo worker.
9. Se aparecer resultado incerto, conferir o post no Instagram antes de qualquer
   nova publicação. O aplicativo bloqueia a repetição automática desse envio.

## Stripe em test mode

1. Fazer Checkout do PRO e confirmar que o plano muda pelo webhook assinado.
2. Reenviar o mesmo evento e confirmar idempotência.
3. Cancelar via Customer Portal e verificar o plano efetivo após o webhook.
4. Confirmar que MEMBER/ADMIN não administram cobrança e outro workspace não lê os dados.

## Beta e isolamento

1. Cadastrar um email e repetir o cadastro: confirmar um registro no banco.
2. Reiniciar app e verificar que o cadastro permanece.
3. Entrar como MEMBER e confirmar 403 nos diagnósticos.
4. Entrar como ADMIN/OWNER de outro workspace: nenhum evento ou lead do primeiro
   workspace deve aparecer.
5. Conferir respostas do agendador: ausência de `accessToken` e dados internos da conta.

Fontes: [coleção oficial da Meta](https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login)
e [documentação de publicação](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing).
