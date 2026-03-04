#!/bin/bash
# Quick memory retrieval — spawns a sub-agent to search memory
# Usage: ./quick-retrieve.sh "what happened with client X last week?"

QUERY="$*"

if [[ -z "$QUERY" ]]; then
  echo "Usage: ./quick-retrieve.sh <query>"
  echo "Example: ./quick-retrieve.sh 'what did Santos say about the API?'"
  exit 1
fi

# Use sessions_spawn via openclaw CLI if available
if command -v openclaw &> /dev/null; then
  openclaw run --task "Search memory for: $QUERY" --label memory-retriever
else
  echo "📝 Spawn this in your session:"
  echo ""
  echo "sessions_spawn({"
  echo "  task: \"Search memory for: $QUERY\","
  echo "  label: \"memory-retriever\""
  echo "})"
fi
