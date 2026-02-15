#!/bin/bash
# Agentic Learning Error Detector
# Triggers on PostToolUse for Bash to detect command failures
# Only prompts if error detected — zero overhead on success

set -e

OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"

ERROR_PATTERNS=(
    "error:" "Error:" "ERROR:"
    "failed" "FAILED"
    "command not found"
    "No such file"
    "Permission denied"
    "fatal:"
    "Exception" "Traceback"
    "npm ERR!"
    "ModuleNotFoundError"
    "SyntaxError" "TypeError"
    "exit code" "non-zero"
)

contains_error=false
for pattern in "${ERROR_PATTERNS[@]}"; do
    if [[ "$OUTPUT" == *"$pattern"* ]]; then
        contains_error=true
        break
    fi
done

if [ "$contains_error" = true ]; then
    cat << 'EOF'
<error-detected>
Command error detected. Does this teach you something?
- Non-obvious diagnosis needed? → Log as Correction (prior_belief was wrong)
- Reveals a knowledge gap? → Log as Correction
- Routine fix, no surprise? → Daily log or skip entirely
Path: memory/learning/corrections/YYYY-MM-DD.md
</error-detected>
EOF
fi
