#!/bin/bash
# ============================================================
# JARVIS — Push files via GitHub API (no git required)
# Run from Terminal: bash push.sh
# ============================================================

set -e

GH_USER="rbolt543-sys"
GH_REPO="jarvis"
GH_TOKEN="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"
API="https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents"
BRANCH="main"

# Files to push (relative to this script's directory)
FILES=(
  "index.html"
  "config.js"
  "data.js"
  "jarvis-brain.js"
  "README.md"
  ".gitignore"
)

# ── Helpers ───────────────────────────────────────────────
upload_file() {
  local FILE="$1"
  local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local FULL_PATH="${SCRIPT_DIR}/${FILE}"

  if [ ! -f "$FULL_PATH" ]; then
    echo "  ⚠  Skipping (not found): $FILE"
    return
  fi

  # base64 encode (no line wrapping)
  local CONTENT
  CONTENT=$(base64 -i "$FULL_PATH" | tr -d '\n')

  # Check if file already exists in repo (need SHA to update)
  local SHA=""
  local CHECK
  CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token ${GH_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "${API}/${FILE}?ref=${BRANCH}")

  if [ "$CHECK" = "200" ]; then
    SHA=$(curl -s \
      -H "Authorization: token ${GH_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "${API}/${FILE}?ref=${BRANCH}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sha',''))" 2>/dev/null || echo "")
  fi

  # Build JSON payload
  local JSON
  if [ -n "$SHA" ]; then
    JSON="{\"message\":\"JARVIS deploy: ${FILE}\",\"content\":\"${CONTENT}\",\"branch\":\"${BRANCH}\",\"sha\":\"${SHA}\"}"
  else
    JSON="{\"message\":\"JARVIS deploy: ${FILE}\",\"content\":\"${CONTENT}\",\"branch\":\"${BRANCH}\"}"
  fi

  # Upload
  local RESULT
  RESULT=$(curl -s -w "\n%{http_code}" \
    -X PUT \
    -H "Authorization: token ${GH_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "$JSON" \
    "${API}/${FILE}")

  local HTTP_CODE
  HTTP_CODE=$(echo "$RESULT" | tail -1)

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "  ✓  ${FILE}"
  else
    echo "  ✗  ${FILE} (HTTP $HTTP_CODE)"
    echo "$RESULT" | head -1 | python3 -c "import sys,json; d=json.load(sys.stdin); print('     Error:', d.get('message','unknown'))" 2>/dev/null || true
  fi
}

# ── Main ──────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     JARVIS — GitHub Upload (no git)      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verify repo exists / initialise if empty
echo "→ Checking repo status…"
REPO_CHECK=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${GH_USER}/${GH_REPO}")

REPO_CODE=$(echo "$REPO_CHECK" | tail -1)
if [ "$REPO_CODE" != "200" ]; then
  echo "❌ Repo not found — creating it…"
  curl -s -X POST \
    -H "Authorization: token ${GH_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "{\"name\":\"${GH_REPO}\",\"description\":\"JARVIS Personal AI Command Center\",\"private\":false}" \
    https://api.github.com/user/repos > /dev/null
  sleep 2
  echo "✓ Repo created"
else
  echo "✓ Repo exists"
fi

# Upload files
echo ""
echo "→ Uploading files…"
for FILE in "${FILES[@]}"; do
  upload_file "$FILE"
done

# Enable GitHub Pages
echo ""
echo "→ Enabling GitHub Pages…"
PAGES=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}" \
  "https://api.github.com/repos/${GH_USER}/${GH_REPO}/pages")

PAGES_CODE=$(echo "$PAGES" | tail -1)
if [ "$PAGES_CODE" = "201" ]; then
  echo "✓ GitHub Pages enabled"
elif [ "$PAGES_CODE" = "409" ]; then
  echo "✓ GitHub Pages already active"
else
  echo "⚠  Pages returned $PAGES_CODE"
  echo "  → Enable manually: github.com/${GH_USER}/${GH_REPO}/settings/pages"
  echo "  → Source: Deploy from branch → main → / (root) → Save"
fi

# Done
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        ✅  JARVIS FILES UPLOADED          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Live in ~60 seconds:"
echo "  → https://${GH_USER}.github.io/${GH_REPO}"
echo ""
echo "  ⚠  One more step: open config.js and add"
echo "     your Anthropic API key, then run this"
echo "     script again to push the update."
echo ""
