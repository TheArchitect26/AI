#!/bin/bash
set -e

PROJECT="/root/ai-os/nexus-core"
REMOTE="git@github.com:TheArchitect26/AI.git"

cd "$PROJECT"

echo "🔐 Creating safe .gitignore..."
cat > .gitignore <<'EOF'
node_modules
.next
dist
.env
.env.local
*.log
.DS_Store
server/*.env
EOF

echo "🧾 Creating project status..."
cat > PROJECT_STATUS.md <<'EOF'
# NEXUS AI Brain

## Current State
Nexus is now the main frontend.
AI Brain backend runs separately on port 4000.
Nexus API proxy runs on port 3010.

## Running Services
- Nexus frontend: port 3000
- AI Brain backend: port 4000
- Nexus API proxy: port 3010

## Important Notes
- Chat proxy works from terminal.
- Frontend chat UI still needs final response rendering cleanup.
- Old Lovable gateway references still exist in backup files and some labels.
- OpenRouter key was exposed earlier and must be revoked/replaced later.
EOF

echo "🧹 Removing sensitive env from git tracking..."
git rm --cached .env 2>/dev/null || true
git rm --cached .env.local 2>/dev/null || true

echo "📦 Initializing git..."
git init

echo "🔗 Setting remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"

echo "📂 Staging files..."
git add .

echo "📝 Committing..."
git commit -m "Integrate Nexus frontend with AI Brain backend" || echo "Nothing to commit"

echo "🌿 Setting branch..."
git branch -M main

echo "🚀 Pushing..."
git push -u origin main

echo "✅ Done."
