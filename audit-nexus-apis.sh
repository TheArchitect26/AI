#!/bin/bash
set -e

echo "🔍 Auditing Nexus for Lovable / external API dependencies..."

echo ""
echo "=== Searching for Lovable references ==="
grep -Rni "lovable\|supabase\|VITE_\|apiKey\|api_key\|OPENAI\|ANTHROPIC\|GROQ\|fetch(" src .env package.json 2>/dev/null || true

echo ""
echo "=== Environment files ==="
find . -maxdepth 2 -name ".env*" -type f -print -exec cat {} \;

echo ""
echo "=== API route files ==="
find src -path "*api*" -type f -print

echo ""
echo "=== Package scripts ==="
cat package.json | grep -A 20 '"scripts"'

echo ""
echo "✅ Audit complete."
