#!/bin/bash
# Step 1: Clone workspace template + skills
# Run this in Railway shell

cd /data/workspace

# Check if workspace already has files
if [ -f "AGENTS.md" ] || [ -f "SOUL.md" ]; then
  echo "Workspace has files already — backing up"
  mkdir -p /tmp/ws-backup
  cp *.md /tmp/ws-backup/ 2>/dev/null
fi

# Clone field template
git clone https://github.com/BJS-Innovation-Lab/vulkn-field-template.git /tmp/field-template
cp -r /tmp/field-template/* /data/workspace/ 2>/dev/null
cp -r /tmp/field-template/.* /data/workspace/ 2>/dev/null
rm -rf /tmp/field-template

# Install shared skills
mkdir -p /data/workspace/skills
cd /data/workspace/skills
git clone https://github.com/BJS-Innovation-Lab/skills.git .

# Install node deps
cd /data/workspace/rag
npm install @supabase/supabase-js openai 2>/dev/null

echo "✅ Step 1 complete — workspace + skills installed"
