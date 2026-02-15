#!/bin/bash
# Agentic Learning Activator Hook
# Triggers on UserPromptSubmit to remind agent about learning capture
# ~60 tokens overhead

set -e

cat << 'EOF'
<agentic-learning>
After this task, evaluate:
- Correction? (someone/something proved you wrong) → memory/learning/corrections/
- Insight? (new connection, technique, realization + clear stakes) → memory/learning/insights/
- Outcome? (past decision produced results) → memory/learning/outcomes/
- Just activity? (config, tool call, routine action) → daily log only
</agentic-learning>
EOF
