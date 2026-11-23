// Troca o código do favorito dentro de instalar-token-meter.html pelo bookmarklet.txt atual.
const fs = require('fs')
const href = fs.readFileSync(__dirname + '/bookmarklet.txt', 'utf8')
const attr = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const file = __dirname + '/instalar-token-meter.html'
const html = fs.readFileSync(file, 'utf8').replace(/<a class="bm" href="[^"]*"/, `<a class="bm" href="${attr}"`)
fs.writeFileSync(file, html)
