#!/bin/bash
# safety-shield.sh — Pre-commit hook to prevent identity/secret contamination

SYBIL_UUID="5fae1839"
BLOCK_PATTERNS=(
  "$SYBIL_UUID"
  "sk-ant-"
  "AIzaSy"
  "agent.conf"
  "config.json"
)

echo "🛡️ Running Safety Shield..."

FORBIDDEN_FOUND=0
for pattern in "${BLOCK_PATTERNS[@]}"; do
  # Check staged changes for these patterns
  if git diff --cached --name-only | xargs grep -q "$pattern" 2>/dev/null; then
    echo "❌ ERROR: Found forbidden pattern '$pattern' in staged files!"
    git diff --cached -G"$pattern" --name-only
    FORBIDDEN_FOUND=1
  fi
done

if [ $FORBIDDEN_FOUND -eq 1 ]; then
  echo "🚫 Commit blocked. Remove sensitive data or local IDs before pushing to shared repos."
  exit 1
fi

echo "✅ Safety Shield passed."
exit 0
