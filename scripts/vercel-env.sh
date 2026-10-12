#!/usr/bin/env bash
# Envia as variáveis de .env.hm / .env.pd para a Vercel como Secret,
# no ambiente certo:
#
#   ./scripts/vercel-env.sh pd       -> Production
#   ./scripts/vercel-env.sh hm       -> Preview, só na branch develop
#   ./scripts/vercel-env.sh limpar   -> remove do projeto todas as variáveis
#                                       listadas no .env.example
#
# Pré-requisito (uma vez): npx vercel login && npx vercel link
# Rodar de novo é seguro: valores existentes no mesmo alvo são sobrescritos.

set -euo pipefail
cd "$(dirname "$0")/.."

VERCEL=(npx -y vercel@63.1.2)
target="${1:-}"

if [[ ! -f .vercel/project.json ]]; then
  echo "Projeto não vinculado. Rode antes: npx vercel login && npx vercel link"
  exit 1
fi

keys_from() { grep -E '^[A-Z_][A-Z0-9_]*=' "$1" | cut -d= -f1; }

case "$target" in
  limpar)
    for key in $(keys_from .env.example); do
      for env in production preview development; do
        "${VERCEL[@]}" env rm "$key" "$env" --yes >/dev/null 2>&1 && echo "removida: $key ($env)" || true
      done
    done
    exit 0
    ;;
  pd) file=.env.pd; args=(production) ;;
  hm) file=.env.hm; args=(preview --git-branch develop) ;;
  *) echo "Uso: $0 <pd|hm|limpar>"; exit 1 ;;
esac

[[ -f "$file" ]] || { echo "$file não encontrado"; exit 1; }

while IFS= read -r line; do
  [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]] || continue
  key="${line%%=*}"
  value="${line#*=}"
  printf '%s' "$value" | "${VERCEL[@]}" env add "$key" "${args[@]}" --sensitive --force --non-interactive >/dev/null
  echo "ok: $key -> ${args[*]}"
done < "$file"
