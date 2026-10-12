#!/usr/bin/env bash
# Sobe o MeuPerfil localmente (ambiente DS): Postgres + Redis no Docker,
# migrations, app web e worker. Ctrl+C encerra app e worker.
#
#   ./iniciar-local.sh          inicia tudo
#   ./iniciar-local.sh parar    desliga Postgres e Redis do Docker

set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "parar" ]]; then
  docker compose down
  exit 0
fi

step() { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }

# 1. Docker Desktop
if ! docker info >/dev/null 2>&1; then
  step "Abrindo o Docker Desktop..."
  open -a Docker
  until docker info >/dev/null 2>&1; do sleep 2; done
fi

# 2. .env local (gerado na primeira execução, com segredos aleatórios)
if [[ ! -f .env ]]; then
  step "Criando .env a partir do .env.example"
  cp .env.example .env
  for key in NEXTAUTH_SECRET CRON_SECRET ENCRYPTION_KEY; do
    sed -i '' "s|^$key=.*|$key=$(openssl rand -hex 32)|" .env
  done
  sed -i '' "s|^WEBHOOK_VERIFY_TOKEN=.*|WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 16)|" .env
fi

# 3. Dependências
if [[ ! -d node_modules || package-lock.json -nt node_modules ]]; then
  step "Instalando dependências"
  npm install
fi

# 4. Postgres + Redis
step "Subindo Postgres (5433) e Redis (6379)"
docker compose up -d --wait

# 5. Banco
step "Aplicando migrations"
npx prisma migrate deploy

# 6. Primeira porta livre a partir de 3000
PORT=3000
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT + 1)); done
export PORT NEXTAUTH_URL="http://localhost:$PORT"

# 7. Worker em segundo plano + app web
step "Iniciando worker"
npm run worker 2>&1 | sed 's/^/[worker] /' &
WORKER_PID=$!
trap 'kill $WORKER_PID 2>/dev/null; pkill -f "tsx worker/dm-worker.ts" 2>/dev/null || true' EXIT

step "Iniciando app em $NEXTAUTH_URL"
echo "Login: use qualquer e-mail; o link de acesso aparece aqui no terminal."
npx next dev -p "$PORT"
