#!/bin/sh
set -e

SOURCE_TYPE="${SOURCE_TYPE:-npm}"
SOURCE_VALUE="${SOURCE_VALUE:?SOURCE_VALUE is required}"

# Resolve entry point from package.json (bin → main → index.js) and exec it
run_package() {
  if [ ! -f package.json ]; then
    echo "Error: no package.json found"
    exit 1
  fi
  ENTRY=$(bun -e "
    const p = JSON.parse(require('fs').readFileSync('package.json','utf8'));
    const b = p.bin;
    console.log(typeof b === 'string' ? b : b ? Object.values(b)[0] : p.main || 'index.js');
  ")
  exec bun run "$ENTRY" "$@"
}

case "$SOURCE_TYPE" in
  npm)
    echo "Installing $SOURCE_VALUE..."
    cd /tmp
    mkdir -p app && cd app
    echo '{}' > package.json
    bun add "$SOURCE_VALUE" 2>&1
    BIN_DIR=$(bun pm bin)
    EXEC=$(ls "$BIN_DIR" 2>/dev/null | head -1)
    if [ -n "$EXEC" ]; then
      exec node "$BIN_DIR/$EXEC" "$@"
    else
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
    run_package "$@"
    ;;
  local)
    echo "Running from mounted source..."
    cp -r /app/source /tmp/source
    cd /tmp/source
    echo "Installing dependencies..."
    bun install 2>&1
    run_package "$@"
    ;;
  *)
    echo "Unknown source type: $SOURCE_TYPE"
    exit 1
    ;;
esac
