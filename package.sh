#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Remove old zip if it exists
rm -f dist/full-page-screenshot.zip

# Create zip file with only the necessary files
zip -r dist/full-page-screenshot.zip \
    manifest.json \
    background.js \
    content.js \
    screenshot.js \
    screenshot.html \
    icons/* \
    -x "*.DS_Store" \
    -x "*/.git/*" \
    -x "*.sh" \
    -x "*.md" \
    -x ".gitignore" \
    -x "dist/*" \
    -x "store-assets/*"
