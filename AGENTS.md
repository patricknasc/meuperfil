<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Trabalho paralelo e branches

- Sempre trabalhe em uma branch própria; não implemente nem commite diretamente em `develop` ou `main`.
- `develop` é homologação (HM); pushes nessa branch disparam deploy.
- Antes de alterar arquivos, confira a branch e o estado do Git. Preserve mudanças da outra LLM.
- Com duas LLMs em paralelo, prefira worktrees separados: trocar a branch de uma pasta compartilhada afeta ambas.
- Adicione ao commit somente arquivos ou trechos da sua tarefa. Nunca use `git add -A` nem `git add .`.
- Leve mudanças à `develop` por PR. Aplique as migrations necessárias em HM antes do merge do código dependente.
