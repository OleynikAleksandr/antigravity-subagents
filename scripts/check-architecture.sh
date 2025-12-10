#!/bin/bash

# Architecture Check Script for SubAgent Manager
# This script MUST run before every compile to prevent architecture violations

echo "🏗️  Architecture Check Starting..."
echo "================================"

# Color codes
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Flags
HAS_VIOLATIONS=0
HAS_WARNINGS=0

# Collect TS/TSX file lengths safely (handles large arg lists and spaces)
collect_file_lengths() {
  find src webview-ui/src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -print0 \
    | while IFS= read -r -d '' file; do
        lines=$(wc -l < "$file")
        printf "%s %s\n" "$lines" "$file"
      done
}

FILE_LENGTHS=$(collect_file_lengths)

# Check 1: Files > 300 lines (CRITICAL)
echo ""
echo "📏 Checking file sizes (max 300 lines)..."
echo "-----------------------------------"

LARGE_FILES=$(echo "$FILE_LENGTHS" | awk '$1 > 300 {print $2 " - " $1 " lines"}')
LARGE_FILE_COUNT=$(echo "$FILE_LENGTHS" | awk '$1 > 300 {count++} END {if (count=="") {count=0} print count}')

if [ ! -z "$LARGE_FILES" ]; then
    echo -e "${RED}❌ VIOLATION: Files exceeding 300 lines:${NC}"
    echo "$LARGE_FILES"
    echo ""
    echo "Total files over limit: $LARGE_FILE_COUNT"
    echo ""
    echo -e "${RED}⚠️  STOP! You MUST refactor these files before adding new features!${NC}"
    echo -e "${RED}Create new micro-classes instead of adding to existing large files!${NC}"
    HAS_VIOLATIONS=1
else
    echo -e "${GREEN}✅ All files under 300 lines${NC}"
fi

# Check 2: Files approaching limit (WARNING at 250 lines)
echo ""
echo "⚠️  Checking files approaching limit (250+ lines)..."
echo "-----------------------------------"

WARNING_FILES=$(echo "$FILE_LENGTHS" | awk '$1 >= 250 && $1 <= 300 {print $2 " - " $1 " lines"}')
WARNING_FILE_COUNT=$(echo "$FILE_LENGTHS" | awk '$1 >= 250 && $1 <= 300 {count++} END {if (count=="") {count=0} print count}')

if [ ! -z "$WARNING_FILES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Files approaching 300 line limit:${NC}"
    echo "$WARNING_FILES"
    echo ""
    echo "Total files in warning zone: $WARNING_FILE_COUNT"
    echo -e "${YELLOW}Consider refactoring these files BEFORE adding new code!${NC}"
    HAS_WARNINGS=1
else
    echo -e "${GREEN}✅ No files in warning zone (250-300 lines)${NC}"
fi

# Check 3: Facade pattern check
echo ""
echo "🏛️  Checking facade pattern compliance..."
echo "-----------------------------------"

# Count facade files (case-insensitive, supports hyphenated names)
FACADE_FILES=$(find src -type f \( -iname "*facade.ts" -o -iname "*facade.tsx" \) -not -path "*/node_modules/*")
if [ -z "$FACADE_FILES" ]; then
  FACADE_COUNT=0
else
  FACADE_COUNT=$(printf "%s\n" "$FACADE_FILES" | sed '/^$/d' | wc -l | awk '{print $1}')
fi
echo "Found $FACADE_COUNT facade file(s)"
if [ "$FACADE_COUNT" -gt 0 ]; then
  printf '%s\n' "$FACADE_FILES"
fi

# Check if large files are facades (facades can be slightly larger but should still be < 400)
LARGE_NON_FACADES=$(echo "$FILE_LENGTHS" | awk '$1 > 300 && $2 !~ /[Ff]acade/ {print $2}' | head -5)

if [ ! -z "$LARGE_NON_FACADES" ]; then
    echo -e "${RED}❌ Non-facade files over 300 lines detected!${NC}"
    echo "These should be refactored into micro-classes with a facade"
fi

# Check 4: Empty directory detection
echo ""
echo "📁 Checking for empty directories..."
echo "-----------------------------------"
EMPTY_DIRECTORIES=$(find src webview-ui/src -type d -empty -not -path "*/node_modules/*" -not -path "*/dist" -not -path "*/build" -not -path "*/.*")
if [ -n "$EMPTY_DIRECTORIES" ]; then
  EMPTY_DIR_COUNT=$(printf "%s\n" "$EMPTY_DIRECTORIES" | sed '/^$/d' | wc -l | awk '{print $1}')
  echo -e "${YELLOW}⚠️  WARNING: Empty directories detected:${NC}"
  printf '%s\n' "$EMPTY_DIRECTORIES"
  HAS_WARNINGS=1
else
  EMPTY_DIR_COUNT=0
  echo -e "${GREEN}✅ No empty directories found in src/ or webview-ui/src/${NC}"
fi

# Check 6: Duplication guard
echo ""
echo "🔁 Running duplication check (jscpd)..."
echo "-----------------------------------"

DUPLICATION_THRESHOLD=3

npx jscpd src webview-ui/src

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Duplication threshold (${DUPLICATION_THRESHOLD}%) exceeded${NC}"
  HAS_VIOLATIONS=1
else
  echo -e "${GREEN}✅ Duplication within ${DUPLICATION_THRESHOLD}% threshold${NC}"
fi

# Final verdict
echo ""
echo "================================"
echo "Summary:"
echo "  >300 lines: $LARGE_FILE_COUNT file(s)"
echo "  250-300 lines: $WARNING_FILE_COUNT file(s)"
echo "  Facades detected: $FACADE_COUNT"
echo "  Empty directories: $EMPTY_DIR_COUNT"
echo ""
if [ $HAS_VIOLATIONS -eq 1 ]; then
    echo -e "${RED}❌ ARCHITECTURE CHECK FAILED!${NC}"
    echo -e "${RED}You have files over 300 lines. Refactor them first!${NC}"
    echo ""
    echo "To fix:"
    echo "1. Create micro-classes for large files"
    echo "2. Extract methods to new classes"
    echo "3. Use facade pattern for coordination"
    exit 1
elif [ $HAS_WARNINGS -eq 1 ]; then
    echo -e "${YELLOW}⚠️  ARCHITECTURE CHECK PASSED WITH WARNINGS${NC}"
    echo "Some files are approaching the limit. Be careful!"
    exit 0
else
    echo -e "${GREEN}✅ ARCHITECTURE CHECK PASSED!${NC}"
    echo "All files comply with architecture rules."
    exit 0
fi
