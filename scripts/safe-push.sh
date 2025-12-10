#!/bin/bash
# safe-push.sh - Push to GitHub, then remove .agent/ from GitHub
# Antigravity requires .agent/ to be tracked, but we don't want it visible on GitHub

set -e

echo "🔄 Safe Push - will remove .agent/ from GitHub after push"

# 1. Check current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Branch: $BRANCH"

# 2. Normal push first
git push origin "$BRANCH"
echo "🚀 Pushed to origin/$BRANCH"

# 3. Now remove .agent/ from GitHub (but keep locally)
if git ls-files --error-unmatch .agent/ >/dev/null 2>&1; then
    echo "📂 Removing .agent/ from GitHub..."
    
    # Remove from git tracking
    git rm -r --cached .agent/
    
    # Commit the removal
    git commit -m "chore: exclude .agent/ from GitHub" --no-verify
    
    # Push the removal
    git push origin "$BRANCH"
    
    # Re-add to tracking for Antigravity
    git add .agent/
    
    echo "✅ .agent/ removed from GitHub, re-tracked locally"
else
    echo "✅ .agent/ already excluded from GitHub"
fi

echo ""
echo "✅ Done! .agent/ is:"
echo "   - NOT on GitHub"
echo "   - Tracked locally (Antigravity can see it)"
