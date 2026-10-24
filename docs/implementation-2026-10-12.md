# Implementação de 12 de outubro de 2026

## Correções e entrega

- Contas retornadas pelo agendador usam seleção explícita de campos públicos.
- IDs de jobs de DM são derivados de um hash da conta, comentário e tentativa.
- Criação de campanha manual e por publicação compartilha uma transação com lock
  do workspace para aplicar o limite sem corrida entre solicitações.
- Posts usam uma versão da fila: edição, pausa e publicação imediata invalidam
  jobs anteriores. O worker adquire o post atomicamente antes de publicar.
- Contêiner da Meta e tentativa de publicação são registrados no banco. O ID do
  post publicado é persistido antes de buscar permalink ou criar a campanha.
- O worker reconcilia agendamentos a cada 30 segundos. Processamentos interrompidos
  antes do envio voltam para a fila; resultados incertos exigem conferência.
- Posts contam para a quota mensal na ativação do agendamento, incluindo rascunhos
  criados em meses anteriores. Rascunhos novos não consomem quota.
- Falha na campanha após publicação mantém PUBLISHED e gera um aviso operacional.
- A lista de espera usa PostgreSQL, deduplica email e envia boas-vindas apenas no
  primeiro cadastro. Há importação preservando o arquivo JSONL legado.
- Diagnósticos exigem ADMIN/OWNER e restringem dados e alertas ao workspace.
- OAuth pede publicação; o publicador utiliza o host do Instagram Login, autentica
  por cabeçalho e limita a duração das requisições.
- Interações reconhecidas por palavras-chave criam contatos e histórico por
  campanha antes do envio de DM. Cliques anônimos não criam leads.
- A tela de leads oferece busca, filtro por status/campanha, paginação e atualização
  de status. MEMBER pode consultar; ADMIN/OWNER pode alterar status e tags pela API.
- Campanhas mostram leads identificados e contatos marcados como convertidos.
  Taxa de clique e conversão de contatos usam denominadores distintos; não há
  cálculo de receita/ROI financeiro.
- Navegação, leads, agendador, campanhas, perfis, dashboard, configurações, logs,
  diagnósticos, login, convites, páginas legais, SEO, templates e relatórios têm
  interface em português, inglês e espanhol. Datas, metadados e recomendações
  acompanham a rota. Conteúdo dos usuários e mensagens técnicas externas são
  preservados no idioma original.
- O agendador consulta uma rota real de contas, atualiza o estado periodicamente e
  apresenta erros de carregamento. Formulários começam sem mídia ou mensagem de
  demonstração e com campanha opcional desabilitada.

## Aplicação

1. Aplicar migrations no ambiente apropriado (`npm run db:migrate` em DS;
   scripts HM/PD conforme `docs/environments.md`).
2. Implantar/reiniciar web e worker juntos. Workers antigos não implementam as
   proteções dos novos jobs, portanto devem ser encerrados antes da substituição.
3. Reconectar Instagram e validar permissões de publicação.
4. Seguir `docs/integration-smoke-tests.md` em homologação.

As migrations são aditivas. Cadastros anteriores no JSONL só passam ao banco quando
importados. As quatro migrations novas foram aplicadas em HM em 12/10/2026 com
`npm run db:migrate:hm`, a pedido do usuário. O deploy de HM e o banco de PD não
foram alterados por esta etapa.

## Limites de recuperação

Uma chamada de publicação pode funcionar na Meta e perder a resposta. O aplicativo
bloqueia novas tentativas quando não consegue confirmar esse resultado. O suporte
precisa conferir a publicação e reconciliar o registro; não há botão de repetição
para essa situação. Isso reduz o risco de duplicação, mas não promete entrega
exatamente uma vez entre PostgreSQL e uma API externa.

A captura de leads começa nos novos eventos; não há importação retroativa dos logs
históricos nesta entrega. Status CONVERTED é uma classificação da equipe, não uma
venda confirmada por checkout. Landing pages por campanha, receita e atribuição
financeira continuam fora desta implementação.

## Verificação

- `npm test`: 164 testes unitários e de regressão passaram.
- `npm run test:integration`: testes contra PostgreSQL local, com dados temporários
  apagados ao final e fila de publicação simulada para não publicar conteúdo; os 5 testes passaram.
- `npm run test:http`: com `npm start -- --port 3015`, valida autenticação, isolamento,
  restrições de papel, ausência de tokens nas respostas, filtros e páginas nos três
  idiomas, incluindo login, privacidade, biblioteca de templates e relatórios. Passou com sessões e dados temporários locais, removidos ao final.
- `npm run typecheck` e `npm run build` passaram. Lint passou sem avisos e sem erros.

Publicação real na Meta e pagamentos reais não fazem parte das verificações locais.
