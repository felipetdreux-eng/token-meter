#!/bin/bash
# Gera bundle.min.js e bookmarklet.txt a partir de lib.js, catalog.js (do mod economia), skills-web.js, agents.js, brain.js e overlay.js.
# (A página instalar-token-meter.html precisa ser regerada com o código novo.)
set -e
cd "$(dirname "$0")"
# O catálogo de skills vem do mod economia (uma fonte só para os dois)
npx -y esbuild ../economia/hooks/catalog.ts --bundle --format=iife --global-name=TMCatalog --target=es2020 --log-level=warning --tsconfig-raw='{}' --footer:js='self.TMCatalog = TMCatalog;' --outfile=catalog.js
cat lib.js catalog.js skills-web.js agents.js brain.js overlay.js > /tmp/tm-bundle.js
npx -y terser /tmp/tm-bundle.js -c -m --comments false -o bundle.min.js
node -e "const fs=require('fs');fs.writeFileSync('bookmarklet.txt','javascript:'+encodeURIComponent('(function(){'+fs.readFileSync('bundle.min.js','utf8')+'})()'))"
node make-install.js
