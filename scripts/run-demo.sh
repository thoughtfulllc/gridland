#!/usr/bin/env bash
set -euo pipefail

DEMO_NAME="${1:-}"

AVAILABLE_DEMOS="gradient ascii table spinner select-input multi-select text-input link tab-bar status-bar modal primitives chat terminal"

if [ -z "$DEMO_NAME" ]; then
  echo "Usage: run-demo.sh <demo-name>"
  echo ""
  echo "Available demos:"
  for d in $AVAILABLE_DEMOS; do
    echo "  $d"
  done
  exit 1
fi

# Check for bun
if ! command -v bun &>/dev/null; then
  echo "Error: bun is required. Install it with: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Setting up demo..."

git clone --depth 1 -q https://github.com/cjroth/polyterm.git "$WORK_DIR/polyterm"
cd "$WORK_DIR/polyterm"
bun install 2>/dev/null

echo "Running $DEMO_NAME demo..."
bun run demo "$DEMO_NAME"
