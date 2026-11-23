#!/bin/bash
# Gera bundle.min.js e bookmarklet.txt a partir de lib.js + overlay.js.
# (A página instalar-token-meter.html precisa ser regerada com o código novo.)
set -e
cd "$(dirname "$0")"
cat lib.js overlay.js > /tmp/tm-bundle.js
npx -y terser /tmp/tm-bundle.js -c -m --comments false -o bundle.min.js
node -e "const fs=require('fs');fs.writeFileSync('bookmarklet.txt','javascript:'+encodeURIComponent('(function(){'+fs.readFileSync('bundle.min.js','utf8')+'})()'))"
