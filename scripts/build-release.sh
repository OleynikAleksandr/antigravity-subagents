#!/bin/bash

# SubAgent Manager Release Build Script
# Ensures clean build, architecture compliance, and VSIX packaging

set -e

PROJECT_NAME="SubAgent Manager"
# Ensure we run from repo root regardless of where script is invoked
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

# Ensure clean working tree before release build
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree has uncommitted changes. Commit or stash before running build-release.sh." >&2
  exit 1
fi

USE_CURRENT_VERSION=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --use-current-version)
      USE_CURRENT_VERSION=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

PACKAGE_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")

if $USE_CURRENT_VERSION; then
  VERSION=$CURRENT_VERSION
else
  VERSION=$(node <<'EOF'
const pkg = require('./package.json');
const parts = pkg.version.split('.').map((part) => Number(part));
if (parts.length !== 3 || parts.some(Number.isNaN)) {
  throw new Error(`Invalid semver ${pkg.version}`);
}
parts[2] += 1;
console.log(parts.join('.'));
EOF
)
fi

echo "🔧 ${PROJECT_NAME} - Release Build Script"
echo "============================================"
echo "📦 Building version: $VERSION"

# Step 1: Clean build artifacts
echo ""
echo "🧹 Step 1: Cleaning build cache..."
rm -rf out/*
rm -f *.vsix
rm -rf webview-ui/dist
echo "✅ Cache cleaned"

# Step 2: Update version in package.json
echo ""
if $USE_CURRENT_VERSION; then
  echo "📝 Step 2: Skipping version bump (using current version $VERSION)..."
  echo "✅ Version preserved"
else
  echo "📝 Step 2: Updating version to $VERSION..."
  npm version "$VERSION" --no-git-tag-version >/dev/null
  echo "✅ Version updated"
fi

# Step 3: Build Webview
echo ""
echo "⚛️ Step 3: Building Webview..."
cd webview-ui
npm install
npm run build
cd ..
echo "✅ Webview built"

# Step 4: Architecture check
echo ""
echo "🏗️ Step 4: Checking architecture compliance..."
./scripts/check-architecture.sh
echo "✅ Architecture check passed"

# Step 5: Smoke type-check (no emit)
echo ""
echo "🚬 Step 5: Type-check (no emit)..."
npx tsc -p . --noEmit
echo "✅ Type-check passed"

# Step 6: Compile Extension
echo ""
echo "⚙️ Step 6: Compiling Extension..."
npm run compile
echo "✅ Extension compiled"

# Step 7: Package extension
echo ""
echo "📦 Step 7: Creating VSIX package..."
npx vsce package
echo "✅ Package created"

VSIX_FILE="${PACKAGE_NAME}-${VERSION}.vsix"
if [ ! -f "$VSIX_FILE" ]; then
  echo "❌ VSIX file not found!"
  exit 1
fi

# Step 8: Check package size
echo ""
echo "📊 Step 8: Verifying package size..."
SIZE=$(du -sh "$VSIX_FILE" | cut -f1)
echo "📦 Package size: $SIZE"

# Summary
echo ""
echo "============================================"
echo "✅ Release build complete!"
echo "📦 Package: $VSIX_FILE ($SIZE)"
echo ""
echo "Next steps:"
echo "1. Test the extension locally"
echo "2. Commit changes: git add . && git commit -m \"feat: v$VERSION - release\""
echo "3. Push to GitHub: git push origin main"
