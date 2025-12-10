#!/bin/bash
# safe-push.sh - Push to GitHub without .agent/ folder
# Antigravity requires .agent/ to be tracked, but we don't want it on GitHub

set -e

echo "🔄 Safe Push - excluding .agent/ from GitHub"

# 1. Check current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Branch: $BRANCH"

# 2. Remove .agent/ from git tracking (keeps files locally)
if git ls-files --error-unmatch .agent/ >/dev/null 2>&1; then
    git rm -r --cached .agent/
    echo "📂 Removed .agent/ from git tracking"
fi

# 3. Add .agent/ to .gitignore temporarily
if ! grep -q "^\.agent/$" .gitignore 2>/dev/null; then
    echo ".agent/" >> .gitignore
    echo "📝 Added .agent/ to .gitignore"
fi

# 4. Stage all changes
git add -A

# 5. Commit if there are staged changes
if ! git diff --cached --quiet; then
    git commit -m "$(git log -1 --format=%s 2>/dev/null || echo 'chore: update')"
    echo "✅ Changes committed"
fi

# 6. Push
git push origin "$BRANCH"
echo "🚀 Pushed to origin/$BRANCH"

# 7. Remove .agent/ from .gitignore (restore for local Antigravity)
sed -i '' '/^\.agent\/$/d' .gitignore
echo "📝 Removed .agent/ from .gitignore (local)"

# 8. Re-add .agent/ to git tracking (for Antigravity)
if [[ -d .agent ]]; then
    git add -f .agent/
    echo "📂 .agent/ re-tracked for Antigravity"
fi

echo ""
echo "✅ Done! .agent/ is:"
echo "   - NOT on GitHub"
echo "   - Tracked locally (Antigravity can see it)"
