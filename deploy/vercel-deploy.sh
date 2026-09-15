#!/usr/bin/env bash
# Deploy lms + live to Vercel (Mumbai region), keep the backend on Railway,
# and point all three at each other. Uses the same deploy/deploy.env as
# railway-deploy.sh. Idempotent: re-run to redeploy.
#
# Prereqs (once):
#   npm i -g vercel && vercel login
#   npm i -g @railway/cli && railway login      (backend already deployed)
#
# Usage:
#   bash deploy/vercel-deploy.sh          # both apps
#   bash deploy/vercel-deploy.sh lms      # one app
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/deploy/deploy.env"
SECRETS_FILE="$ROOT/deploy/.secrets.env"
# Vercel project names → production domains <name>.vercel.app. Override with
# VERCEL_SLUG=... if the default names are taken.
SLUG="${VERCEL_SLUG:-capacity-connect-krish}"

[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }
[[ -f "$SECRETS_FILE" ]] || { echo "Missing $SECRETS_FILE — run railway-deploy.sh once first (it generates the shared secrets)"; exit 1; }
command -v vercel >/dev/null || { echo "npm i -g vercel && vercel login"; exit 1; }
vercel whoami >/dev/null 2>&1 || { echo "Run: vercel login"; exit 1; }
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; source "$SECRETS_FILE"; set +a
: "${SUPABASE_SESSION_URL:?}"; : "${SUPABASE_TX_URL:?}"

ONLY="${1:-}"
want() { [[ -z "$ONLY" || "$ONLY" == "$1" ]]; }

BACKEND_URL="https://$(cd "$ROOT" && railway domain --service backend 2>/dev/null | grep -oE '[a-z0-9.-]+\.up\.railway\.app' | head -1)"
[[ "$BACKEND_URL" != "https://" ]] || { echo "Could not read the Railway backend domain"; exit 1; }
LMS_URL="https://${SLUG}-lms.vercel.app"
LIVE_URL="https://${SLUG}-live.vercel.app"

# ---------- helpers ----------
link() { # link <dir> <project>
  [[ -f "$ROOT/$1/.vercel/project.json" ]] && return
  echo "▶ linking $1 → project $2"
  vercel link --cwd "$ROOT/$1" --yes --project "$2" >/dev/null
}
setenv() { # setenv <dir> KEY=VALUE ...
  local dir="$1"; shift
  for kv in "$@"; do
    vercel env add "${kv%%=*}" production --cwd "$ROOT/$dir" --value "${kv#*=}" --force --yes >/dev/null 2>&1 \
      || echo "  (warn) could not set ${kv%%=*}"
  done
}
deploy() { # deploy <dir> → prints production URL
  echo "▶ deploying $1 (Vercel, region bom1)" >&2
  vercel deploy --cwd "$ROOT/$1" --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | tail -1
}

# ---------- lms ----------
if want lms; then
  link lms "${SLUG}-lms"
  echo "▶ lms env"
  setenv lms \
    "DATABASE_URL=${SUPABASE_TX_URL}?pgbouncer=true" \
    "DIRECT_URL=$SUPABASE_SESSION_URL" \
    "NEXTAUTH_URL=$LMS_URL" \
    "AUTH_TRUST_HOST=true" \
    "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
    "AUTH_SECRET=$NEXTAUTH_SECRET" \
    "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}" \
    "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}" \
    "LIVE_OPENGRAPES_JWT_SECRET=$LIVE_OPENGRAPES_JWT_SECRET" \
    "MEETING_PLATFORM_URL=$LIVE_URL" \
    "MEETING_PLATFORM_API_URL=$BACKEND_URL" \
    "PUSHER_APP_ID=${PUSHER_APP_ID:-}" \
    "PUSHER_KEY=${PUSHER_KEY:-}" \
    "PUSHER_SECRET=${PUSHER_SECRET:-}" \
    "PUSHER_CLUSTER=${PUSHER_CLUSTER:-ap2}" \
    "NEXT_PUBLIC_PUSHER_KEY=${PUSHER_KEY:-}" \
    "NEXT_PUBLIC_PUSHER_CLUSTER=${PUSHER_CLUSTER:-ap2}" \
    "CERTIFICATE_SECRET=$CERTIFICATE_SECRET" \
    "UPLOAD_DIR=/tmp/uploads" \
    "DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}" \
    "DEEPSEEK_API_BASE_URL=${DEEPSEEK_API_BASE_URL:-https://api.siliconflow.com/v1}" \
    "DEEPSEEK_MODEL_NAME=${DEEPSEEK_MODEL_NAME:-deepseek-ai/DeepSeek-V4-Flash}" \
    "GEMINI_API_KEY=${GEMINI_API_KEY:-}" \
    "GEMINI_MODEL_NAME=${GEMINI_MODEL_NAME:-gemini-3.7-flash}" \
    "GEMINI_FALLBACK_MODEL_NAME=${GEMINI_FALLBACK_MODEL_NAME:-gemini-3.5-flash}" \
    "GROQ_API_KEY=${GROQ_API_KEY:-}" \
    "GROQ_API_BASE_URL=${GROQ_API_BASE_URL:-https://api.groq.com/openai/v1}" \
    "GROQ_EXTRACTION_MODEL=${GROQ_EXTRACTION_MODEL:-groq/compound-mini}" \
    "GROQ_ANALYST_MODEL=${GROQ_ANALYST_MODEL:-openai/gpt-oss-120b}" \
    "GROQ_TPM_BUDGET=${GROQ_TPM_BUDGET:-60000}" \
    "FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY:-}" \
    "NEXT_PUBLIC_GOV_EMBLEM_SRC=${NEXT_PUBLIC_GOV_EMBLEM_SRC:-}"
  ACTUAL_LMS="$(deploy lms)"
fi

# ---------- live ----------
if want live; then
  link live "${SLUG}-live"
  echo "▶ live env"
  setenv live \
    "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL" \
    "LIVE_OPENGRAPES_JWT_SECRET=$LIVE_OPENGRAPES_JWT_SECRET"
  ACTUAL_LIVE="$(deploy live)"
fi

# ---------- point the Railway backend at Vercel ----------
echo "▶ backend → Vercel URLs"
(cd "$ROOT" && railway variables --service backend \
  --set "CLIENT_URL=$LMS_URL" --set "LIVE_CLIENT_URL=$LIVE_URL" --set "LMS_API_URL=$LMS_URL" >/dev/null)

echo
echo "✅ Done"
echo "  lms      $LMS_URL"
echo "  live     $LIVE_URL"
echo "  backend  $BACKEND_URL   (Railway)"
echo
echo "Google OAuth redirect URI:  $LMS_URL/api/auth/callback/google"
echo "If Vercel printed a different production domain above, re-run with VERCEL_SLUG=<something-unique>."
