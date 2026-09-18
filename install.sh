#!/usr/bin/env bash
set -e

echo "Installing CodeBox..."

if [ -z "$PREFIX" ]; then
    echo "This script must be run inside Termux."
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Installing Node.js..."
    pkg install -y nodejs
fi

# We clone the repo if not present or run npm install
echo "CodeBox can be installed globally via npm:"
npm install -g codebox
echo "Installation complete. Run 'codebox' to start."
