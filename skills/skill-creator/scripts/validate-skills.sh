#!/bin/bash
# Validate all skills have proper YAML frontmatter
# Run: bash skills/skill-creator/scripts/validate-skills.sh

SKILLS_DIR="${1:-$HOME/.openclaw/workspace/skills}"
ERRORS=0

echo "🔍 Validating skills in: $SKILLS_DIR"
echo ""

while IFS= read -r skill_file; do
    if ! head -1 "$skill_file" | grep -q "^---"; then
        echo "❌ MISSING FRONTMATTER: $skill_file"
        ERRORS=$((ERRORS + 1))
    else
        # Check for required fields
        if ! head -10 "$skill_file" | grep -q "^name:"; then
            echo "⚠️  MISSING 'name' field: $skill_file"
            ERRORS=$((ERRORS + 1))
        fi
        if ! head -10 "$skill_file" | grep -q "^description:"; then
            echo "⚠️  MISSING 'description' field: $skill_file"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done < <(find "$SKILLS_DIR" -name "SKILL.md" -type f)

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All skills have valid frontmatter!"
else
    echo "❌ Found $ERRORS issues. Skills without frontmatter are INVISIBLE to agents."
    echo ""
    echo "Fix by adding to the top of each SKILL.md:"
    echo "---"
    echo "name: skill-name"
    echo 'description: "What it does. Use when: triggers."'
    echo "---"
    exit 1
fi
