#!/usr/bin/env bash
# One-shot deploy of backend + lms + live to a single Railway project,
# using Supabase Postgres. Idempotent: re-run to redeploy.
#
# Prereqs (once):
#   npm i -g @railway/cli && railway login
#   cp deploy/deploy.env.example deploy/deploy.env   # fill in Supabase URLs + keys
#
# Usage:
#   bash deploy/railway-deploy.sh            # full deploy
#   bash deploy/railway-deploy.sh backend    # redeploy one service only
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/deploy/deploy.env"
PROJECT_NAME="${PROJECT_NAME:-capacity-connect}"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE — copy deploy/deploy.env.example and fill it in."; exit 1; }
command -v railway >/dev/null || { echo "Install the Railway CLI: npm i -g @railway/cli && railway login"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${SUPABASE_SESSION_URL:?set in deploy.env (pooler :5432)}"
: "${SUPABASE_TX_URL:?set in deploy.env (pooler :6543)}"

ONLY="${1:-}"
want() { [[ -z "$ONLY" || "$ONLY" == "$1" ]]; }

# ---------- project + services ----------
cd "$ROOT"
if ! railway status >/dev/null 2>&1; then
  echo "▶ creating Railway project '$PROJECT_NAME'"
  railway init -n "$PROJECT_NAME"
fi

EXISTING="$(railway status --json 2>/dev/null | python3 -c 'import json,sys; print(" ".join(e["node"]["name"] for e in json.load(sys.stdin)["services"]["edges"]))' 2>/dev/null || true)"
for svc in backend lms live; do
  if ! grep -qw "$svc" <<<"$EXISTING"; then
    echo "▶ adding service $svc"
    railway add --service "$svc" >/dev/null
  fi
  # Generate a public *.up.railway.app domain (no-op if one exists).
  railway domain --service "$svc" >/dev/null 2>&1 || true
done

# ---------- shared secrets (persisted so re-runs don't rotate them) ----------
SECRETS_FILE="$ROOT/deploy/.secrets.env"
if [[ ! -f "$SECRETS_FILE" ]]; then
  {
    echo "LIVE_OPENGRAPES_JWT_SECRET=$(openssl rand -base64 32)"
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
    echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)"
    echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
    echo "CERTIFICATE_SECRET=$(openssl rand -base64 32)"
  } > "$SECRETS_FILE"
fi
# shellcheck disable=SC1090
set -a; source "$SECRETS_FILE"; set +a

# Railway resolves ${{svc.RAILWAY_PUBLIC_DOMAIN}} at runtime → no URL copy-paste.
BACKEND_URL='https://${{backend.RAILWAY_PUBLIC_DOMAIN}}'
LMS_URL='https://${{lms.RAILWAY_PUBLIC_DOMAIN}}'
LIVE_URL='https://${{live.RAILWAY_PUBLIC_DOMAIN}}'

# ---------- variables ----------
if want backend; then
  echo "▶ backend variables"
  railway variables --service backend --skip-deploys \
    --set "NODE_ENV=production" \
    --set "PORT=3001" \
    --set "DATABASE_URL=${SUPABASE_SESSION_URL}?schema=backend" \
    --set "CLIENT_URL=$LMS_URL" \
    --set "LIVE_CLIENT_URL=$LIVE_URL" \
    --set "LMS_API_URL=$LMS_URL" \
    --set "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET" \
    --set "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" \
    --set "JWT_ACCESS_EXPIRY=15m" \
    --set "JWT_REFRESH_EXPIRY=7d" \
    --set "LIVE_OPENGRAPES_JWT_SECRET=$LIVE_OPENGRAPES_JWT_SECRET" \
    --set "CERTIFICATE_SECRET=$CERTIFICATE_SECRET" \
    --set "LIVEKIT_URL=${LIVEKIT_URL:-wss://livekit.opengrapes.com}" \
    --set "LIVEKIT_API_KEY=${LIVEKIT_API_KEY:-}" \
    --set "LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET:-}" \
    --set "METERED_API_KEY=${METERED_API_KEY:-}" \
    --set "METERED_APP_NAME=${METERED_APP_NAME:-}" \
    --set "GEMINI_API_KEY=${GEMINI_API_KEY:-}" >/dev/null
fi

if want lms; then
  echo "▶ lms variables"
  railway variables --service lms --skip-deploys \
    --set "NODE_ENV=production" \
    --set "NPM_CONFIG_LEGACY_PEER_DEPS=true" \
    --set "PORT=3000" \
    --set "DATABASE_URL=${SUPABASE_TX_URL}?pgbouncer=true" \
    --set "DIRECT_URL=$SUPABASE_SESSION_URL" \
    --set "NEXTAUTH_URL=$LMS_URL" \
    --set "AUTH_TRUST_HOST=true" \
    --set "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
    --set "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
    --set "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}" \
    --set "LIVE_OPENGRAPES_JWT_SECRET=$LIVE_OPENGRAPES_JWT_SECRET" \
    --set "MEETING_PLATFORM_URL=$LIVE_URL" \
    --set "MEETING_PLATFORM_API_URL=$BACKEND_URL" \
    --set "PUSHER_APP_ID=${PUSHER_APP_ID:-}" \
    --set "PUSHER_KEY=${PUSHER_KEY:-}" \
    --set "PUSHER_SECRET=${PUSHER_SECRET:-}" \
    --set "PUSHER_CLUSTER=${PUSHER_CLUSTER:-ap2}" \
    --set "NEXT_PUBLIC_PUSHER_KEY=${PUSHER_KEY:-}" \
    --set "NEXT_PUBLIC_PUSHER_CLUSTER=${PUSHER_CLUSTER:-ap2}" \
    --set "AUTH_SECRET=$NEXTAUTH_SECRET" \
    --set "CERTIFICATE_SECRET=$CERTIFICATE_SECRET" \
    --set "UPLOAD_DIR=/tmp/uploads" \
    --set "DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}" \
    --set "DEEPSEEK_API_BASE_URL=${DEEPSEEK_API_BASE_URL:-https://api.siliconflow.com/v1}" \
    --set "DEEPSEEK_MODEL_NAME=${DEEPSEEK_MODEL_NAME:-deepseek-ai/DeepSeek-V4-Flash}" \
    --set "GEMINI_API_KEY=${GEMINI_API_KEY:-}" \
    --set "GEMINI_MODEL_NAME=${GEMINI_MODEL_NAME:-gemini-3.7-flash}" \
    --set "GEMINI_FALLBACK_MODEL_NAME=${GEMINI_FALLBACK_MODEL_NAME:-gemini-3.5-flash}" \
    --set "GROQ_API_KEY=${GROQ_API_KEY:-}" \
    --set "GROQ_API_BASE_URL=${GROQ_API_BASE_URL:-https://api.groq.com/openai/v1}" \
    --set "GROQ_EXTRACTION_MODEL=${GROQ_EXTRACTION_MODEL:-groq/compound-mini}" \
    --set "GROQ_ANALYST_MODEL=${GROQ_ANALYST_MODEL:-openai/gpt-oss-120b}" \
    --set "GROQ_TPM_BUDGET=${GROQ_TPM_BUDGET:-60000}" \
    --set "FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY:-}" \
    --set "NEXT_PUBLIC_GOV_EMBLEM_SRC=${NEXT_PUBLIC_GOV_EMBLEM_SRC:-}" >/dev/null
fi

if want live; then
  echo "▶ live variables"
  railway variables --service live --skip-deploys \
    --set "NODE_ENV=production" \
    --set "PORT=3002" \
    --set "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL" \
    --set "LIVE_OPENGRAPES_JWT_SECRET=$LIVE_OPENGRAPES_JWT_SECRET" >/dev/null
fi

# ---------- deploy (backend first: lms build needs nothing from it, but
# live/lms runtime call it) ----------
for svc in backend lms live; do
  want "$svc" || continue
  echo "▶ deploying $svc"
  railway up "$ROOT/$svc" --path-as-root --service "$svc" --detach
done

echo
echo "✅ Deploys queued. Domains:"
for svc in backend lms live; do
  printf "  %-8s " "$svc"; railway domain --service "$svc" 2>/dev/null | grep -oE 'https?://[^ ]+' | head -1 || echo "(pending)"
done
echo
echo "Next: add  https://<lms-domain>/api/auth/callback/google  to Google OAuth redirect URIs."
echo "Logs:  railway logs --service <backend|lms|live>"
