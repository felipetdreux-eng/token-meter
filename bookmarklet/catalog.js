var TMCatalog = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../economia/hooks/catalog.ts
  var catalog_exports = {};
  __export(catalog_exports, {
    BLOCKS: () => BLOCKS,
    CATALOG: () => CATALOG,
    lookup: () => lookup,
    suggest: () => suggest
  });
  var BLOCKS = [
    { id: "economia", title: "Economia de tokens" },
    { id: "agentes", title: "Agentes e automa\xE7\xE3o" },
    { id: "conteudo", title: "Instagram e conte\xFAdo" },
    { id: "marketing", title: "Marketing e vendas" },
    { id: "docs", title: "Documentos e planilhas" },
    { id: "codigo", title: "C\xF3digo e mods" },
    { id: "design", title: "Design e visual" },
    { id: "navegador", title: "Navegador e computador" },
    { id: "estudos", title: "Estudos" },
    { id: "memoria", title: "Mem\xF3ria e prefer\xEAncias" },
    { id: "outras", title: "Outras" }
  ];
  var CATALOG = {
    // Economia de tokens
    economia: { block: "economia", what: "Mostra quanto trabalho foi desviado para Haiku e Sonnet; /economia off desliga.", words: ["economia", "economizar", "gastar menos", "tokens", "custo", "limite"] },
    "caveman:caveman": { block: "economia", what: "Respostas curtas e simples: menos texto gerado, menos tokens gastos.", words: ["resposta curta", "mais curto", "resumido", "simples", "sem enrola\xE7\xE3o", "caveman"] },
    "claude-api": { block: "economia", what: 'Modelos, pre\xE7os e limites da API; "/claude-api cost-optimize" corta custo de um app com Claude.', words: ["pre\xE7o", "api", "modelo", "custo", "opus", "sonnet", "haiku", "token"] },
    // Agentes e automação
    "ai-employees:hire": { block: "agentes", what: 'Contrata um "funcion\xE1rio de IA" (vendas, social media, SEO, chefe de gabinete...) numa pasta, j\xE1 testado.', words: ["agente", "funcion\xE1rio", "automatizar", "contratar", "chief of staff", "gtm"] },
    loop: { block: "agentes", what: "Repete um comando ou tarefa de tempos em tempos (ex.: checar algo a cada 5 min).", words: ["repetir", "a cada", "monitorar", "loop", "de tempos em tempos", "checar"] },
    "anthropic-skills:triagem-chats-projeto": { block: "agentes", what: "Passa por todos os chats de um projeto, acha perguntas pendentes e responde em cada um.", words: ["chats", "pendente", "projeto", "triagem", "responder"] },
    "anthropic-skills:morning": { block: "agentes", what: "Monta o seu resumo da manh\xE3, ou deixa ele agendado para os dias \xFAteis.", words: ["manh\xE3", "resumo do dia", "morning", "agenda"] },
    "anthropic-skills:projeto-do-dia": { block: "agentes", what: "No come\xE7o do chat: pergunta o projeto do dia e abre as abas dele no Chrome.", words: ["projeto do dia", "come\xE7ar", "hoje"] },
    "anthropic-skills:deep-research": { block: "agentes", what: "Pesquisa profunda em v\xE1rias fontes com subagentes e entrega um relat\xF3rio.", words: ["pesquisa", "pesquisar", "comparar", "mercado", "relat\xF3rio", "fontes"] },
    "session-start-hook": { block: "agentes", what: "Cria um hook que roda no in\xEDcio das sess\xF5es na nuvem de um reposit\xF3rio.", words: ["hook", "in\xEDcio da sess\xE3o", "session start"] },
    // Instagram e conteúdo
    "instagram-br:ig-reel-br": { block: "conteudo", what: "Roteiro de Reel em PT-BR: ganchos com nota, fala, texto de tela e tempos.", words: ["reel", "roteiro", "v\xEDdeo curto", "gancho"] },
    "instagram-br:ig-dm-br": { block: "conteudo", what: "DMs em PT-BR para vender site/servi\xE7o a cl\xEDnicas: abordagem e follow-ups.", words: ["dm", "direct", "abordagem", "cl\xEDnica", "prospec\xE7\xE3o", "follow-up"] },
    "instagram-br:ig-human-br": { block: "conteudo", what: "Tira a cara de IA de textos em PT-BR e d\xE1 nota de humanidade.", words: ["humanizar", "cara de ia", "travess\xE3o", "parecer humano"] },
    "instagram-agent:ig-reel": { block: "conteudo", what: "Reel a partir de uma ideia crua: ganchos, roteiro, texto de tela (em ingl\xEAs por padr\xE3o).", words: ["reel", "script", "hook"] },
    "instagram-agent:ig-caption": { block: "conteudo", what: "Legenda do post: a primeira linha, o corpo, o pedido e as hashtags.", words: ["legenda", "caption", "hashtag"] },
    "instagram-agent:ig-carousel": { block: "conteudo", what: "Carrossel: capa, texto de cada slide e as imagens 1080x1350.", words: ["carrossel", "slides", "carousel"] },
    "instagram-agent:ig-story": { block: "conteudo", what: "Sequ\xEAncia de Stories do dia, com figurinhas e chamada para o direct.", words: ["story", "stories", "enquete"] },
    "instagram-agent:ig-plan": { block: "conteudo", what: "Planeja a semana no Instagram: o que postar, formato, quando.", words: ["planejar", "semana", "calend\xE1rio", "o que postar"] },
    "instagram-agent:ig-viral": { block: "conteudo", what: "Acha os Reels que est\xE3o bombando no seu nicho e monta um arquivo de refer\xEAncias.", words: ["viral", "bombando", "tend\xEAncia", "nicho", "refer\xEAncia"] },
    "instagram-agent:ig-audit": { block: "conteudo", what: "Analisa seus posts antigos: o que funcionou, por qu\xEA e o que parar de fazer.", words: ["analisar posts", "insights", "o que funcionou", "auditoria"] },
    "instagram-agent:ig-profile": { block: "conteudo", what: "D\xE1 nota 0-100 ao perfil e reescreve bio, destaques e o que perde ponto.", words: ["perfil", "bio", "destaques"] },
    "instagram-agent:ig-comment": { block: "conteudo", what: "Coment\xE1rios em posts dos outros que soam como gente, n\xE3o rob\xF4.", words: ["comentar", "coment\xE1rio", "engajar"] },
    "instagram-agent:ig-reply": { block: "conteudo", what: "Responde os coment\xE1rios dos seus posts, separando os que valem resposta.", words: ["responder coment\xE1rios", "hater", "coment\xE1rios"] },
    "instagram-agent:ig-dm": { block: "conteudo", what: "DMs que recebem resposta: entrega, primeira mensagem, parceria e follow-ups.", words: ["dm", "mensagem", "parceria"] },
    "instagram-agent:ig-human": { block: "conteudo", what: "Tira marcas de IA de qualquer texto e testa se ainda parece IA.", words: ["humanizar", "parece ia", "em dash"] },
    "instagram-agent:ig-repurpose": { block: "conteudo", what: "Transforma um v\xEDdeo longo, podcast ou texto numa semana de Reels e carross\xE9is.", words: ["reaproveitar", "podcast", "v\xEDdeo longo", "transcri\xE7\xE3o"] },
    "video-shotcraft:video-shotcraft": { block: "conteudo", what: "V\xEDdeo de produto com cara de cinema a partir de um site ou projeto (Remotion).", words: ["v\xEDdeo de produto", "promo", "remotion", "anima\xE7\xE3o"] },
    "anthropic-skills:link-de-video": { block: "conteudo", what: "Voc\xEA manda link de TikTok/YouTube/Reels e recebe um resumo curto e cr\xEDtico.", words: ["tiktok", "youtube", "link", "v\xEDdeo"] },
    "watermarks-remover:clean-user-facing-text": { block: "conteudo", what: "Limpa e finaliza textos para leitores, sem mudar fatos nem sua voz.", words: ["revisar texto", "polir", "finalizar texto"] },
    "watermarks-remover:remove-ai-marks": { block: "conteudo", what: "Remove marcas de IA: caracteres invis\xEDveis e metadados de imagens e arquivos.", words: ["marca d'\xE1gua", "metadados", "invis\xEDvel"] },
    // Marketing e vendas
    "marketing:campaign-plan": { block: "marketing", what: "Plano de campanha: objetivo, p\xFAblico, mensagem, canais, calend\xE1rio e m\xE9tricas.", words: ["campanha", "lan\xE7amento", "plano de marketing"] },
    "marketing:draft-content": { block: "marketing", what: "Rascunho de post, e-mail, landing page ou release no formato de cada canal.", words: ["post", "blog", "landing", "newsletter", "texto de venda"] },
    "marketing:email-sequence": { block: "marketing", what: "Sequ\xEAncia de e-mails completa: textos, tempos e regras de sa\xEDda.", words: ["e-mail", "email", "sequ\xEAncia", "nutri\xE7\xE3o"] },
    "marketing:competitive-brief": { block: "marketing", what: "Pesquisa concorrentes e mostra brechas de posicionamento.", words: ["concorrente", "concorr\xEAncia", "posicionamento"] },
    "marketing:brand-review": { block: "marketing", what: "Confere um texto contra a voz da marca e aponta o que corrigir.", words: ["marca", "tom de voz", "revisar copy"] },
    "marketing:seo-audit": { block: "marketing", what: "Auditoria de SEO: palavras-chave, p\xE1gina, t\xE9cnico e plano de a\xE7\xE3o.", words: ["seo", "google", "palavra-chave", "ranquear"] },
    "marketing:performance-report": { block: "marketing", what: "Relat\xF3rio de resultados de marketing com recomenda\xE7\xF5es.", words: ["relat\xF3rio", "m\xE9tricas", "resultado", "desempenho"] },
    // Documentos e planilhas
    "anthropic-skills:docs": { block: "docs", what: "Cria docs edit\xE1veis que voc\xEA compartilha e comenta (relat\xF3rio, proposta, guia).", words: ["documento", "doc", "proposta", "relat\xF3rio", "guia"] },
    "anthropic-skills:docx": { block: "docs", what: "Cria ou edita arquivos Word (.docx).", words: ["word", "docx"] },
    "anthropic-skills:pdf": { block: "docs", what: "L\xEA, junta, divide, preenche ou cria PDFs.", words: ["pdf"] },
    "anthropic-skills:pptx": { block: "docs", what: "Cria ou edita apresenta\xE7\xF5es PowerPoint (.pptx).", words: ["powerpoint", "pptx", "apresenta\xE7\xE3o"] },
    "anthropic-skills:xlsx": { block: "docs", what: "Cria ou arruma planilhas Excel/CSV.", words: ["planilha", "excel", "xlsx", "csv"] },
    "anthropic-skills:setup-writing-style": { block: "docs", what: "Aprende como voc\xEA escreve para os rascunhos soarem como voc\xEA.", words: ["meu jeito de escrever", "estilo", "minha voz"] },
    // Código e mods
    "code-review": { block: "codigo", what: "Revisa as mudan\xE7as do c\xF3digo (ou um PR) atr\xE1s de bugs.", words: ["revisar c\xF3digo", "review", "pr", "bug"] },
    simplify: { block: "codigo", what: "Limpa e simplifica o c\xF3digo alterado, sem ca\xE7ar bug.", words: ["simplificar", "limpar c\xF3digo", "refatorar"] },
    run: { block: "codigo", what: "Roda o app do projeto para ver uma mudan\xE7a funcionando de verdade.", words: ["rodar", "testar app", "abrir o app", "screenshot"] },
    "plugin-authoring": { block: "codigo", what: "Faz mods do Claude Code: pain\xE9is, temas, comandos, hooks.", words: ["mod", "plugin", "painel", "tema"] },
    "anthropic-skills:skill-creator": { block: "codigo", what: "Cria e melhora skills, com testes de quando elas disparam.", words: ["criar skill", "skill nova", "melhorar skill"] },
    "anthropic-skills:fuply-crm": { block: "codigo", what: "Contexto t\xE9cnico do Fuply (CRM de leads pelo WhatsApp).", words: ["fuply", "crm", "whatsapp", "whatscrm"] },
    "anthropic-skills:shadcn-ui": { block: "codigo", what: "Monta telas com shadcn/ui: componentes, blocos e tema.", words: ["shadcn", "dashboard", "formul\xE1rio", "react"] },
    "update-config": { block: "codigo", what: "Muda configura\xE7\xF5es do Claude Code: permiss\xF5es, hooks, vari\xE1veis.", words: ["permiss\xE3o", "configura\xE7\xE3o", "settings"] },
    "fewer-permission-prompts": { block: "codigo", what: "Libera os comandos seguros que voc\xEA usa sempre, para pedir menos permiss\xE3o.", words: ["permiss\xE3o", "pedir menos"] },
    // Design e visual
    dataviz: { block: "design", what: "Gr\xE1ficos e pain\xE9is de dados bonitos e leg\xEDveis, com cores validadas.", words: ["gr\xE1fico", "dashboard", "visualiza\xE7\xE3o", "chart"] },
    "anthropic-skills:anatomy": { block: "design", what: "Ilustra\xE7\xF5es isom\xE9tricas interativas que explicam como algo funciona.", words: ["ilustra\xE7\xE3o", "isom\xE9trico", "diagrama", "explicar visualmente"] },
    design: { block: "design", words: ["design", "prot\xF3tipo", "tela", "layout", "mockup"] },
    "design-sync": { block: "design", words: ["design system", "sincronizar design"] },
    whiteboard: { block: "design", words: ["quadro", "whiteboard", "diagrama", "fluxograma"] },
    slides: { block: "docs", words: ["slides", "apresenta\xE7\xE3o", "deck"] },
    verify: { block: "codigo", words: ["verificar", "conferir se funciona", "testar"] },
    debug: { block: "codigo", words: ["debug", "depurar", "erro", "n\xE3o funciona", "quebrou"] },
    // Navegador e computador
    "anthropic-skills:chrome-browser": { block: "navegador", what: "Usa o seu Chrome de verdade (com seus logins) pela extens\xE3o Claude in Chrome.", words: ["chrome", "navegador", "site", "logado"] },
    "anthropic-skills:built-in-browser": { block: "navegador", what: "Usa o navegador embutido do app desktop do Claude.", words: ["navegador do app", "browser"] },
    "anthropic-skills:computer-use": { block: "navegador", what: "Controla apps no seu computador por cliques e prints.", words: ["computador", "app do mac", "clicar", "tela"] },
    // Estudos
    "anthropic-skills:tutor-matematica-recuperacao": { block: "estudos", what: "Matem\xE1tica do 8\xBA ano para a recupera\xE7\xE3o: uma quest\xE3o por vez, voc\xEA tenta antes.", words: ["matem\xE1tica", "recupera\xE7\xE3o", "equa\xE7\xE3o", "prova", "estudar", "exerc\xEDcio"] },
    // Memória e preferências
    "task-observer:task-observer": { block: "memoria", what: "Anota corre\xE7\xF5es e prefer\xEAncias suas para as pr\xF3ximas sess\xF5es seguirem.", words: ["lembre", "sempre fa\xE7a", "prefiro", "n\xE3o fa\xE7a mais"] },
    "task-observer:learn": { block: "memoria", what: "Salva uma prefer\xEAncia sua no CLAUDE.md.", words: ["salvar prefer\xEAncia", "lembrar disso"] },
    "task-observer:preferences": { block: "memoria", what: "Mostra e arruma as prefer\xEAncias salvas no CLAUDE.md.", words: ["minhas prefer\xEAncias"] },
    // Embutidas sem descrição própria aqui: o painel mostra a oficial
    batch: { block: "outras", words: [] },
    "run-skill-generator": { block: "outras", words: [] },
    "anthropic-skills:import-memory": { block: "memoria", what: "Importa a mem\xF3ria exportada de outro assistente de IA.", words: ["importar mem\xF3ria", "chatgpt mem\xF3ria"] }
  };
  var lookup = (name) => CATALOG[name] ?? CATALOG[name.split(":").pop() ?? name];
  var norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  var esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var wordRe = (w) => {
    const n = esc(norm(w));
    return norm(w).length <= 3 ? new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`) : new RegExp(`(^|[^a-z0-9])${n}`);
  };
  function suggest(text, available, max = 3) {
    const t = norm(text);
    if (!t.trim()) return [];
    const out = [];
    for (const name of available) {
      const entry = lookup(name);
      if (!entry) continue;
      const hits = entry.words.filter((w) => wordRe(w).test(t));
      if (hits.length) out.push({ name, hits });
    }
    const br = (n) => n.endsWith("-br") ? 0 : 1;
    return out.sort((a, b) => b.hits.length - a.hits.length || br(a.name) - br(b.name) || a.name.localeCompare(b.name)).slice(0, max);
  }
  return __toCommonJS(catalog_exports);
})();
self.TMCatalog = TMCatalog;
