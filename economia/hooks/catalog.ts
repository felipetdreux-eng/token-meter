// Catálogo das skills: em que bloco cada uma fica, para que serve (em português)
// e palavras que fazem ela ser sugerida. Só aparece no painel o que existir de verdade
// na sessão ($.command.list()); o que não está aqui cai em "Outras", com a descrição original.

export type BlockId = 'economia' | 'agentes' | 'conteudo' | 'marketing' | 'docs' | 'codigo' | 'design' | 'navegador' | 'estudos' | 'memoria' | 'outras'

export const BLOCKS: { id: BlockId; title: string }[] = [
  { id: 'economia', title: 'Economia de tokens' },
  { id: 'agentes', title: 'Agentes e automação' },
  { id: 'conteudo', title: 'Instagram e conteúdo' },
  { id: 'marketing', title: 'Marketing e vendas' },
  { id: 'docs', title: 'Documentos e planilhas' },
  { id: 'codigo', title: 'Código e mods' },
  { id: 'design', title: 'Design e visual' },
  { id: 'navegador', title: 'Navegador e computador' },
  { id: 'estudos', title: 'Estudos' },
  { id: 'memoria', title: 'Memória e preferências' },
  { id: 'outras', title: 'Outras' },
]

/** `what` ausente: o painel mostra a descrição oficial da skill. */
export type Entry = { block: BlockId; what?: string; words: string[] }

export const CATALOG: Record<string, Entry> = {
  // Economia de tokens
  economia: { block: 'economia', what: 'Mostra quanto trabalho foi desviado para Haiku e Sonnet; /economia off desliga.', words: ['economia', 'economizar', 'gastar menos', 'tokens', 'custo', 'limite'] },
  'caveman:caveman': { block: 'economia', what: 'Respostas curtas e simples: menos texto gerado, menos tokens gastos.', words: ['resposta curta', 'mais curto', 'resumido', 'simples', 'sem enrolação', 'caveman'] },
  'claude-api': { block: 'economia', what: 'Modelos, preços e limites da API; "/claude-api cost-optimize" corta custo de um app com Claude.', words: ['preço', 'api', 'modelo', 'custo', 'opus', 'sonnet', 'haiku', 'token'] },

  // Agentes e automação
  'ai-employees:hire': { block: 'agentes', what: 'Contrata um "funcionário de IA" (vendas, social media, SEO, chefe de gabinete...) numa pasta, já testado.', words: ['agente', 'funcionário', 'automatizar', 'contratar', 'chief of staff', 'gtm'] },
  loop: { block: 'agentes', what: 'Repete um comando ou tarefa de tempos em tempos (ex.: checar algo a cada 5 min).', words: ['repetir', 'a cada', 'monitorar', 'loop', 'de tempos em tempos', 'checar'] },
  'anthropic-skills:triagem-chats-projeto': { block: 'agentes', what: 'Passa por todos os chats de um projeto, acha perguntas pendentes e responde em cada um.', words: ['chats', 'pendente', 'projeto', 'triagem', 'responder'] },
  'anthropic-skills:morning': { block: 'agentes', what: 'Monta o seu resumo da manhã, ou deixa ele agendado para os dias úteis.', words: ['manhã', 'resumo do dia', 'morning', 'agenda'] },
  'anthropic-skills:projeto-do-dia': { block: 'agentes', what: 'No começo do chat: pergunta o projeto do dia e abre as abas dele no Chrome.', words: ['projeto do dia', 'começar', 'hoje'] },
  'anthropic-skills:deep-research': { block: 'agentes', what: 'Pesquisa profunda em várias fontes com subagentes e entrega um relatório.', words: ['pesquisa', 'pesquisar', 'comparar', 'mercado', 'relatório', 'fontes'] },
  'session-start-hook': { block: 'agentes', what: 'Cria um hook que roda no início das sessões na nuvem de um repositório.', words: ['hook', 'início da sessão', 'session start'] },

  // Instagram e conteúdo
  'instagram-br:ig-reel-br': { block: 'conteudo', what: 'Roteiro de Reel em PT-BR: ganchos com nota, fala, texto de tela e tempos.', words: ['reel', 'roteiro', 'vídeo curto', 'gancho'] },
  'instagram-br:ig-dm-br': { block: 'conteudo', what: 'DMs em PT-BR para vender site/serviço a clínicas: abordagem e follow-ups.', words: ['dm', 'direct', 'abordagem', 'clínica', 'prospecção', 'follow-up'] },
  'instagram-br:ig-human-br': { block: 'conteudo', what: 'Tira a cara de IA de textos em PT-BR e dá nota de humanidade.', words: ['humanizar', 'cara de ia', 'travessão', 'parecer humano'] },
  'instagram-agent:ig-reel': { block: 'conteudo', what: 'Reel a partir de uma ideia crua: ganchos, roteiro, texto de tela (em inglês por padrão).', words: ['reel', 'script', 'hook'] },
  'instagram-agent:ig-caption': { block: 'conteudo', what: 'Legenda do post: a primeira linha, o corpo, o pedido e as hashtags.', words: ['legenda', 'caption', 'hashtag'] },
  'instagram-agent:ig-carousel': { block: 'conteudo', what: 'Carrossel: capa, texto de cada slide e as imagens 1080x1350.', words: ['carrossel', 'slides', 'carousel'] },
  'instagram-agent:ig-story': { block: 'conteudo', what: 'Sequência de Stories do dia, com figurinhas e chamada para o direct.', words: ['story', 'stories', 'enquete'] },
  'instagram-agent:ig-plan': { block: 'conteudo', what: 'Planeja a semana no Instagram: o que postar, formato, quando.', words: ['planejar', 'semana', 'calendário', 'o que postar'] },
  'instagram-agent:ig-viral': { block: 'conteudo', what: 'Acha os Reels que estão bombando no seu nicho e monta um arquivo de referências.', words: ['viral', 'bombando', 'tendência', 'nicho', 'referência'] },
  'instagram-agent:ig-audit': { block: 'conteudo', what: 'Analisa seus posts antigos: o que funcionou, por quê e o que parar de fazer.', words: ['analisar posts', 'insights', 'o que funcionou', 'auditoria'] },
  'instagram-agent:ig-profile': { block: 'conteudo', what: 'Dá nota 0-100 ao perfil e reescreve bio, destaques e o que perde ponto.', words: ['perfil', 'bio', 'destaques'] },
  'instagram-agent:ig-comment': { block: 'conteudo', what: 'Comentários em posts dos outros que soam como gente, não robô.', words: ['comentar', 'comentário', 'engajar'] },
  'instagram-agent:ig-reply': { block: 'conteudo', what: 'Responde os comentários dos seus posts, separando os que valem resposta.', words: ['responder comentários', 'hater', 'comentários'] },
  'instagram-agent:ig-dm': { block: 'conteudo', what: 'DMs que recebem resposta: entrega, primeira mensagem, parceria e follow-ups.', words: ['dm', 'mensagem', 'parceria'] },
  'instagram-agent:ig-human': { block: 'conteudo', what: 'Tira marcas de IA de qualquer texto e testa se ainda parece IA.', words: ['humanizar', 'parece ia', 'em dash'] },
  'instagram-agent:ig-repurpose': { block: 'conteudo', what: 'Transforma um vídeo longo, podcast ou texto numa semana de Reels e carrosséis.', words: ['reaproveitar', 'podcast', 'vídeo longo', 'transcrição'] },
  'video-shotcraft:video-shotcraft': { block: 'conteudo', what: 'Vídeo de produto com cara de cinema a partir de um site ou projeto (Remotion).', words: ['vídeo de produto', 'promo', 'remotion', 'animação'] },
  'anthropic-skills:link-de-video': { block: 'conteudo', what: 'Você manda link de TikTok/YouTube/Reels e recebe um resumo curto e crítico.', words: ['tiktok', 'youtube', 'link', 'vídeo'] },
  'watermarks-remover:clean-user-facing-text': { block: 'conteudo', what: 'Limpa e finaliza textos para leitores, sem mudar fatos nem sua voz.', words: ['revisar texto', 'polir', 'finalizar texto'] },
  'watermarks-remover:remove-ai-marks': { block: 'conteudo', what: 'Remove marcas de IA: caracteres invisíveis e metadados de imagens e arquivos.', words: ['marca d\'água', 'metadados', 'invisível'] },

  // Marketing e vendas
  'marketing:campaign-plan': { block: 'marketing', what: 'Plano de campanha: objetivo, público, mensagem, canais, calendário e métricas.', words: ['campanha', 'lançamento', 'plano de marketing'] },
  'marketing:draft-content': { block: 'marketing', what: 'Rascunho de post, e-mail, landing page ou release no formato de cada canal.', words: ['post', 'blog', 'landing', 'newsletter', 'texto de venda'] },
  'marketing:email-sequence': { block: 'marketing', what: 'Sequência de e-mails completa: textos, tempos e regras de saída.', words: ['e-mail', 'email', 'sequência', 'nutrição'] },
  'marketing:competitive-brief': { block: 'marketing', what: 'Pesquisa concorrentes e mostra brechas de posicionamento.', words: ['concorrente', 'concorrência', 'posicionamento'] },
  'marketing:brand-review': { block: 'marketing', what: 'Confere um texto contra a voz da marca e aponta o que corrigir.', words: ['marca', 'tom de voz', 'revisar copy'] },
  'marketing:seo-audit': { block: 'marketing', what: 'Auditoria de SEO: palavras-chave, página, técnico e plano de ação.', words: ['seo', 'google', 'palavra-chave', 'ranquear'] },
  'marketing:performance-report': { block: 'marketing', what: 'Relatório de resultados de marketing com recomendações.', words: ['relatório', 'métricas', 'resultado', 'desempenho'] },

  // Documentos e planilhas
  'anthropic-skills:docs': { block: 'docs', what: 'Cria docs editáveis que você compartilha e comenta (relatório, proposta, guia).', words: ['documento', 'doc', 'proposta', 'relatório', 'guia'] },
  'anthropic-skills:docx': { block: 'docs', what: 'Cria ou edita arquivos Word (.docx).', words: ['word', 'docx'] },
  'anthropic-skills:pdf': { block: 'docs', what: 'Lê, junta, divide, preenche ou cria PDFs.', words: ['pdf'] },
  'anthropic-skills:pptx': { block: 'docs', what: 'Cria ou edita apresentações PowerPoint (.pptx).', words: ['powerpoint', 'pptx', 'apresentação'] },
  'anthropic-skills:xlsx': { block: 'docs', what: 'Cria ou arruma planilhas Excel/CSV.', words: ['planilha', 'excel', 'xlsx', 'csv'] },
  'anthropic-skills:setup-writing-style': { block: 'docs', what: 'Aprende como você escreve para os rascunhos soarem como você.', words: ['meu jeito de escrever', 'estilo', 'minha voz'] },

  // Código e mods
  'code-review': { block: 'codigo', what: 'Revisa as mudanças do código (ou um PR) atrás de bugs.', words: ['revisar código', 'review', 'pr', 'bug'] },
  simplify: { block: 'codigo', what: 'Limpa e simplifica o código alterado, sem caçar bug.', words: ['simplificar', 'limpar código', 'refatorar'] },
  run: { block: 'codigo', what: 'Roda o app do projeto para ver uma mudança funcionando de verdade.', words: ['rodar', 'testar app', 'abrir o app', 'screenshot'] },
  'plugin-authoring': { block: 'codigo', what: 'Faz mods do Claude Code: painéis, temas, comandos, hooks.', words: ['mod', 'plugin', 'painel', 'tema'] },
  'anthropic-skills:skill-creator': { block: 'codigo', what: 'Cria e melhora skills, com testes de quando elas disparam.', words: ['criar skill', 'skill nova', 'melhorar skill'] },
  'anthropic-skills:fuply-crm': { block: 'codigo', what: 'Contexto técnico do Fuply (CRM de leads pelo WhatsApp).', words: ['fuply', 'crm', 'whatsapp', 'whatscrm'] },
  'anthropic-skills:shadcn-ui': { block: 'codigo', what: 'Monta telas com shadcn/ui: componentes, blocos e tema.', words: ['shadcn', 'dashboard', 'formulário', 'react'] },
  'update-config': { block: 'codigo', what: 'Muda configurações do Claude Code: permissões, hooks, variáveis.', words: ['permissão', 'configuração', 'settings'] },
  'fewer-permission-prompts': { block: 'codigo', what: 'Libera os comandos seguros que você usa sempre, para pedir menos permissão.', words: ['permissão', 'pedir menos'] },

  // Design e visual
  dataviz: { block: 'design', what: 'Gráficos e painéis de dados bonitos e legíveis, com cores validadas.', words: ['gráfico', 'dashboard', 'visualização', 'chart'] },
  'anthropic-skills:anatomy': { block: 'design', what: 'Ilustrações isométricas interativas que explicam como algo funciona.', words: ['ilustração', 'isométrico', 'diagrama', 'explicar visualmente'] },

  design: { block: 'design', words: ['design', 'protótipo', 'tela', 'layout', 'mockup'] },
  'design-sync': { block: 'design', words: ['design system', 'sincronizar design'] },
  whiteboard: { block: 'design', words: ['quadro', 'whiteboard', 'diagrama', 'fluxograma'] },
  slides: { block: 'docs', words: ['slides', 'apresentação', 'deck'] },
  verify: { block: 'codigo', words: ['verificar', 'conferir se funciona', 'testar'] },
  debug: { block: 'codigo', words: ['debug', 'depurar', 'erro', 'não funciona', 'quebrou'] },

  // Navegador e computador
  'anthropic-skills:chrome-browser': { block: 'navegador', what: 'Usa o seu Chrome de verdade (com seus logins) pela extensão Claude in Chrome.', words: ['chrome', 'navegador', 'site', 'logado'] },
  'anthropic-skills:built-in-browser': { block: 'navegador', what: 'Usa o navegador embutido do app desktop do Claude.', words: ['navegador do app', 'browser'] },
  'anthropic-skills:computer-use': { block: 'navegador', what: 'Controla apps no seu computador por cliques e prints.', words: ['computador', 'app do mac', 'clicar', 'tela'] },

  // Estudos
  'anthropic-skills:tutor-matematica-recuperacao': { block: 'estudos', what: 'Matemática do 8º ano para a recuperação: uma questão por vez, você tenta antes.', words: ['matemática', 'recuperação', 'equação', 'prova', 'estudar', 'exercício'] },

  // Memória e preferências
  'task-observer:task-observer': { block: 'memoria', what: 'Anota correções e preferências suas para as próximas sessões seguirem.', words: ['lembre', 'sempre faça', 'prefiro', 'não faça mais'] },
  'task-observer:learn': { block: 'memoria', what: 'Salva uma preferência sua no CLAUDE.md.', words: ['salvar preferência', 'lembrar disso'] },
  'task-observer:preferences': { block: 'memoria', what: 'Mostra e arruma as preferências salvas no CLAUDE.md.', words: ['minhas preferências'] },
  // Embutidas sem descrição própria aqui: o painel mostra a oficial
  batch: { block: 'outras', words: [] },
  'run-skill-generator': { block: 'outras', words: [] },

  'anthropic-skills:import-memory': { block: 'memoria', what: 'Importa a memória exportada de outro assistente de IA.', words: ['importar memória', 'chatgpt memória'] },
}

/** Busca no catálogo pelo nome completo ou pelo nome sem o prefixo do plugin. */
export const lookup = (name: string): Entry | undefined => CATALOG[name] ?? CATALOG[name.split(':').pop() ?? name]

const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Palavra curta (até 3 letras) precisa aparecer inteira; as maiores casam pelo começo ("reel" casa "reels").
const wordRe = (w: string): RegExp => {
  const n = esc(norm(w))
  return norm(w).length <= 3 ? new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`) : new RegExp(`(^|[^a-z0-9])${n}`)
}

/** Até `max` skills cujas palavras aparecem no texto, da que mais casa para a que menos. */
export function suggest(text: string, available: readonly string[], max = 3): { name: string; hits: string[] }[] {
  const t = norm(text)
  if (!t.trim()) return []
  const out: { name: string; hits: string[] }[] = []
  for (const name of available) {
    const entry = lookup(name)
    if (!entry) continue
    const hits = entry.words.filter(w => wordRe(w).test(t))
    if (hits.length) out.push({ name, hits })
  }
  // Empate: a versão em português (-br) primeiro, depois ordem alfabética.
  const br = (n: string): number => (n.endsWith('-br') ? 0 : 1)
  return out.sort((a, b) => b.hits.length - a.hits.length || br(a.name) - br(b.name) || a.name.localeCompare(b.name)).slice(0, max)
}
