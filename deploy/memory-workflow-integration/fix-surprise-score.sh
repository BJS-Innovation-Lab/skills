#!/bin/bash
# Fix surprise-score.cjs missing EMBEDDING_MODEL import

WORKSPACE="${WORKSPACE:-$HOME/.openclaw/workspace}"
FILE="$WORKSPACE/rag/surprise-score.cjs"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found"
  exit 1
fi

# Check if already fixed
if grep -q "EMBEDDING_MODEL } = require" "$FILE"; then
  echo "Already fixed: EMBEDDING_MODEL import present"
  exit 0
fi

# Apply fix
sed -i.bak 's/EMBEDDING_DIMS } = require/EMBEDDING_DIMS, EMBEDDING_MODEL } = require/' "$FILE"

if grep -q "EMBEDDING_MODEL } = require" "$FILE"; then
  echo "SUCCESS: Fixed EMBEDDING_MODEL import in $FILE"
  rm -f "$FILE.bak"
else
  echo "ERROR: Fix failed, restoring backup"
  mv "$FILE.bak" "$FILE"
  exit 1
fi
