#!/bin/sh
set -e

SOURCE_TYPE="${SOURCE_TYPE:-npm}"
SOURCE_VALUE="${SOURCE_VALUE:?SOURCE_VALUE is required}"

case "$SOURCE_TYPE" in
  npm)
    echo "Installing $SOURCE_VALUE..."
    cd /tmp
    mkdir -p app && cd app
    bun init -y > /dev/null 2>&1
    bun add "$SOURCE_VALUE" 2>&1
    BIN_DIR=$(bun pm bin)
    EXEC=$(ls "$BIN_DIR" 2>/dev/null | head -1)
    if [ -n "$EXEC" ]; then
      exec "$BIN_DIR/$EXEC" "$@"
    else
      # No bin, try to run the package directly
      exec bun run "$SOURCE_VALUE" "$@"
    fi
    ;;
  git)
    echo "Cloning $SOURCE_VALUE..."
    cd /tmp
    git clone --depth 1 -q "$SOURCE_VALUE" repo
    cd repo
    echo "Installing dependencies..."
    bun install 2>&1
    if [ -f package.json ]; then
      # Try bin first, then main, then index.js
      ENTRY=$(bun -e "
        const p = JSON.parse(require('fs').readFileSync('package.json','utf8'));
        const b = p.bin;
        console.log(typeof b === 'string' ? b : b ? Object.values(b)[0] : p.main || 'index.js');
      ")
      exec bun run "$ENTRY" "$@"
    fi
    ;;
  local)
    echo "Running from mounted source..."
    cp -r /app/source /tmp/source
    cd /tmp/source
    echo "Installing dependencies..."
    bun install 2>&1
    if [ -f package.json ]; then
      ENTRY=$(bun -e "
        const p = JSON.parse(require('fs').readFileSync('package.json','utf8'));
        const b = p.bin;
        console.log(typeof b === 'string' ? b : b ? Object.values(b)[0] : p.main || 'index.js');
      ")
      exec bun run "$ENTRY" "$@"
    fi
    ;;
  *)
    echo "Unknown source type: $SOURCE_TYPE"
    exit 1
    ;;
esac
