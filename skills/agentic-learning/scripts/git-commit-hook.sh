#!/bin/bash
# git-commit-hook.sh — Post-commit hook that auto-logs structured entries to daily memory
#
# Install:
#   ln -sf $(pwd)/git-commit-hook.sh /path/to/repo/.git/hooks/post-commit
#   OR: add to global git hooks
#
# What it does:
#   After every git commit, appends a structured entry to memory/YYYY-MM-DD.md
#   with commit hash, message, files changed, and diff stats.
#   This ensures no work is silently lost even if compaction hits without a flush prompt.
#
# Config (env vars):
#   WORKSPACE — path to agent workspace (default: ~/.openclaw/workspace)
#   MEMORY_DIR — path to memory dir (default: $WORKSPACE/memory)

set -euo pipefail

WORKSPACE="${WORKSPACE:-$HOME/.openclaw/workspace}"
MEMORY_DIR="${MEMORY_DIR:-$WORKSPACE/memory}"
TODAY=$(date +%Y-%m-%d)
MEMORY_FILE="$MEMORY_DIR/$TODAY.md"
NOW=$(date +%H:%M)

# Get commit info
HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
MESSAGE=$(git log -1 --pretty=format:'%s' 2>/dev/null || echo "unknown")
AUTHOR=$(git log -1 --pretty=format:'%an' 2>/dev/null || echo "unknown")
FILES_CHANGED=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null | head -10)
FILE_COUNT=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null | wc -l | tr -d ' ')
STATS=$(git diff-tree --no-commit-id --stat -r HEAD 2>/dev/null | tail -1)
REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")

# Ensure memory dir exists
mkdir -p "$MEMORY_DIR"

# Determine entry type based on commit message patterns
ENTRY_TYPE="commit"
if echo "$MESSAGE" | grep -qiE '^fix[:(]|bugfix|hotfix'; then
  ENTRY_TYPE="fix"
elif echo "$MESSAGE" | grep -qiE '^feat[:(]|feature|add'; then
  ENTRY_TYPE="feature"
elif echo "$MESSAGE" | grep -qiE '^refactor|restructure|reorganize'; then
  ENTRY_TYPE="refactor"
elif echo "$MESSAGE" | grep -qiE '^doc|readme|spec|research'; then
  ENTRY_TYPE="docs"
fi

# Build the entry
ENTRY="
### Git ${ENTRY_TYPE} — ${NOW}
- **Commit:** \`${HASH}\` on \`${REPO_NAME}\`
- **Message:** ${MESSAGE}
- **Files:** ${FILE_COUNT} changed
- **Stats:** ${STATS}"

# Add file list if manageable
if [ "$FILE_COUNT" -le 10 ] && [ -n "$FILES_CHANGED" ]; then
  ENTRY="${ENTRY}
- **Changed:** $(echo "$FILES_CHANGED" | tr '\n' ', ' | sed 's/,$//')"
fi

# Append (don't overwrite)
echo "$ENTRY" >> "$MEMORY_FILE"

# Also flag potential learning entries for later extraction
# Fixes and refactors often contain insights worth capturing
if [ "$ENTRY_TYPE" = "fix" ] || [ "$ENTRY_TYPE" = "refactor" ]; then
  LEARN_FLAG="$MEMORY_DIR/.pending-learn-extraction"
  echo "${TODAY}|${HASH}|${ENTRY_TYPE}|${MESSAGE}" >> "$LEARN_FLAG"
fi
