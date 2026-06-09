#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

echo "Publishing @bakend/client to npm..."
cd "$ROOT/sdk/javascript"
bun run build
npm publish --access public

echo ""
echo "Publishing bakend to pub.dev..."
cd "$ROOT/sdk/dart"
dart pub publish --dry-run
dart pub publish

echo ""
echo "Verify:"
echo "  npm view @bakend/client version"
echo "  dart pub add bakend"
