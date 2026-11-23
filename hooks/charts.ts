// Hex do tema do Claude Code (claro / escuro). O SVG não lê os tokens do app,
// então troca de modo pelo prefers-color-scheme que o app repassa.
const STYLE = `<style>
.acc{stroke:#D77757;fill:none}
.warn{stroke:#966C1E;fill:none}
.err{stroke:#AB2B3F;fill:none}
.track{stroke:#D77757;stroke-opacity:.16;fill:none}
@media (prefers-color-scheme: dark){
.warn{stroke:#FFC107}
.err{stroke:#FF6B80}
}
</style>`

export const tone = (pct: number, warn: number, bad: number): 'acc' | 'warn' | 'err' =>
  pct >= bad ? 'err' : pct >= warn ? 'warn' : 'acc'

/** Anel de medição: trilha clara, arco no tom, ponta arredondada. */
export const ring = (pct: number, cls: string, size = 72, stroke = 8): string => {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, pct))
  const dash = (v / 100) * c
  const mid = size / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${STYLE}
<circle class="track" cx="${mid}" cy="${mid}" r="${r}" stroke-width="${stroke}"/>
${v > 0 ? `<circle class="${cls}" cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${mid} ${mid})"/>` : ''}
</svg>`
}

