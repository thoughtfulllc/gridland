#!/bin/bash
# Ensure all gridland-jsx.d.ts copies stay in sync with the canonical version.
# The canonical file lives in packages/web/src/ (shipped to npm consumers).

canonical="packages/web/src/gridland-jsx.d.ts"
files=(
  "packages/ui/gridland-jsx.d.ts"
  "packages/create-gridland/templates/shared/gridland-jsx.d.ts"
  "e2e/harness/gridland-jsx.d.ts"
  "packages/docs/gridland-jsx.d.ts"
)

failed=0
for f in "${files[@]}"; do
  if ! diff -q "$canonical" "$f" > /dev/null 2>&1; then
    echo "DRIFT DETECTED: $f differs from $canonical"
    diff "$canonical" "$f"
    failed=1
  fi
done

if [ "$failed" -eq 1 ]; then
  echo ""
  echo "Fix: copy the canonical file to the drifted location(s):"
  echo "  cp $canonical packages/ui/gridland-jsx.d.ts"
  echo "  cp $canonical packages/create-gridland/templates/shared/gridland-jsx.d.ts"
  echo "  cp $canonical e2e/harness/gridland-jsx.d.ts"
  echo "  cp $canonical packages/docs/gridland-jsx.d.ts"
  exit 1
fi

echo "All gridland-jsx.d.ts files are in sync."
