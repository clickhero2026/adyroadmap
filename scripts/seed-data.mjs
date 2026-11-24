// Carga inicial: as 12 áreas e os 37 itens do painel de roadmap (situação de 23/11/2026),
// mais os objetivos prioritários definidos na reunião de 23/11/2026.
//
// Como os itens antigos foram mapeados:
// - "Entregue" -> entregue_em (data real quando conhecida; senão 31/10/2026, que só quer dizer
//   "antes de novembro", para não aparecer como entrega da semana nem do mês)
// - "Em andamento" -> iniciado_em = 23/11/2026 (ainda não há tarefas registradas)
// - "Previsto" -> sem datas
// - selos: adiado -> marcação Adiado; a confirmar -> A confirmar; a rever -> A rever
// - "atrasado" passa a ser calculado pelo prazo; onde o prazo é conhecido, ele foi preenchido

export const AREAS = [
  "Criação com IA",
  "Campanhas de anúncios",
  "Redes sociais",
  "Clientes e vendas",
  "Desempenho",
  "Marca e identidade",
  "Google e presença online",
  "Assistente do ady",
  "Parceiros e várias marcas",
  "Conta, planos e pagamentos",
  "Experiência do app",
  "Comercial e operação",
];

const REVISAO = "2026-11-23";
const ANTES_DE_NOV = "2026-10-31";
const done = (extra = {}) => ({ entregue_em: ANTES_DE_NOV, ...extra });
const doing = (extra = {}) => ({ iniciado_em: REVISAO, ...extra });

// area = índice em AREAS
export const OBJETIVOS = [
  // Criação com IA
  { area: 0, nome: "Textos e imagens por IA", descricao_publica: "Textos e imagens criados a partir da descrição do seu negócio, com a sua identidade visual.", ...done() },
  { area: 0, nome: "Vídeos com roteiro e narração", descricao_publica: "Vídeos prontos, com roteiro e narração criados por IA.", ...done({ entregue_em: "2026-10-31" }), nota_interna: "Entregue em out/26." },
  { area: 0, nome: "Teste de várias opções de anúncio", descricao_publica: "Comparar versões do mesmo anúncio para descobrir qual traz mais resultado.", marcacao: "a_rever", nota_interna: "Já dá para usar mais de um criativo por campanha, mas não está funcional para o usuário. Precisa ser revisto." },
  { area: 0, nome: "Clonagem de pessoas em vídeos", descricao_publica: "Aparecer nos seus vídeos com a sua própria imagem e voz.", nota_interna: "O que falta hoje é a clonagem da voz." },

  // Campanhas
  { area: 1, nome: "Campanhas no Instagram e Facebook em 5 passos", descricao_publica: "Anúncios prontos e publicados com um passo a passo guiado, a partir de R$ 7 por dia.", ...done() },
  { area: 1, nome: "Campanhas para gerar conversas no WhatsApp", descricao_publica: "Anúncios que levam o cliente direto para o seu WhatsApp.", ...done(), nota_interna: "Funciona, mas precisa de melhorias." },
  { area: 1, nome: "Melhorias nas campanhas para WhatsApp", tipo: "melhoria", descricao_publica: "Ajustes para facilitar a criação e melhorar o resultado dessas campanhas.", ...doing() },
  { area: 1, nome: "Gestão automática de campanhas", descricao_publica: "O ady acompanha suas campanhas e ajusta sozinho." },
  { area: 1, nome: "Regras automáticas de desempenho", descricao_publica: "O ady age sozinho quando uma campanha não vai bem.", nota_interna: "Estava prevista para maio/26 e ainda não está disponível no produto." },

  // Redes sociais
  { area: 2, nome: "Conexão com o Instagram", descricao_publica: "Conecte seu Instagram em poucos passos para acompanhar seus números.", ...done({ entregue_em: "2026-11-09" }), nota_interna: "Entregue há cerca de 2 semanas, com atraso. Só Instagram por enquanto." },
  { area: 2, nome: "Calendário de posts com prévia", descricao_publica: "Posts de Feed, Carrossel, Reels e Stories em um só calendário, com prévia no formato real.", ...done(), nota_interna: "Hoje o usuário cria cada post manualmente." },
  { area: 2, nome: "Publicação automática no Instagram", descricao_publica: "Agende e o ady publica por você.", ...done() },
  { area: 2, nome: "Planejador automático de conteúdo", descricao_publica: "O ady monta o mês de posts a partir de informações do seu negócio e você só aprova.", marcacao: "a_confirmar", nota_interna: "Não acontece hoje. O ClickUp marca a automação como concluída, mas o produto não faz isso para o usuário. Confirmar com os devs." },
  { area: 2, nome: "Sugestões inteligentes de posts", descricao_publica: "O ady mostra quais posts deram mais resultado e oferece criar parecidos ou impulsionar." },

  // Clientes e vendas
  { area: 3, nome: "Central de contatos e status de venda", descricao_publica: "Todos os interessados vindos dos anúncios num só lugar: novo, em negociação ou venda concluída.", ...done({ entregue_em: "2026-09-30" }), nota_interna: "Entregue em set/26." },

  // Desempenho
  { area: 4, nome: "Painel de desempenho", descricao_publica: "Quanto você investiu, quantas pessoas alcançou e o custo por novo cliente, em gráficos simples.", ...done() },
  { area: 4, nome: "Indicador de campanha dentro ou fora da meta", descricao_publica: "Veja de relance quais campanhas estão indo bem.", ...done() },
  { area: 4, nome: "Painel de controle do dono do negócio", descricao_publica: "Visão geral do negócio em um só lugar.", ...done() },

  // Marca
  { area: 5, nome: "Logo, cores, tom de voz e públicos favoritos", descricao_publica: "Cadastre uma vez e tudo o que o ady cria segue a cara da sua marca.", ...done() },

  // Google
  { area: 6, nome: "Anúncios no Google", descricao_publica: "Criar anúncios no Google e aparecer quando alguém procura o seu negócio.", ...doing(), prazo: "2026-09-30", nota_interna: "Previsto para setembro. A funcionalidade está pronta e em validação, mas aguarda aprovação e permissões do Google." },
  { area: 6, nome: "Gestão da ficha do Google Meu Negócio", descricao_publica: "Cuidar da ficha da sua empresa no Google: fotos, avaliações e informações.", ...doing(), nota_interna: "Parte já feita e em validação (fotos, avaliações, nota). Criar e editar a ficha ainda não começou. Está escondida do usuário por estar incompleta." },
  { area: 6, nome: "Sites e páginas de destino", descricao_publica: "Criar o site ou a página da sua empresa com o ady." },

  // Assistente
  { area: 7, nome: "Assistente de chat dentro do ady", descricao_publica: "Peça textos, criativos e campanhas conversando com o ady, sem navegar pelas telas.", ...doing(), nota_interna: "Substituiu a ideia de usar o WhatsApp do usuário." },
  { area: 7, nome: "Falar com o ady pelo seu WhatsApp", descricao_publica: "Pedir tudo ao ady pelo seu próprio WhatsApp.", marcacao: "adiado", nota_interna: "Previsto para outubro e adiado." },
  { area: 7, nome: "O ady passa a conhecer o seu negócio", descricao_publica: "Logo depois de abrir a conta, o ady coleta dados do seu negócio para sugerir melhor.", marcacao: "a_confirmar", publico: false, nota_interna: "Pendente de revisão. Seria uma etapa logo após a abertura da conta. Fora da visão pública até a revisão." },

  // Parceiros
  { area: 8, nome: "Plano parceiro", descricao_publica: "Novo tipo de conta: o parceiro revende um número limitado de subcontas do ady para os seus clientes.", ...doing(), nota_interna: "Parte em validação. A rodada de feedback e os testes ainda não começaram." },
  { area: 8, nome: "Gestão de várias marcas ou clientes", descricao_publica: "Uma conta cuidando de várias marcas." },

  // Conta
  { area: 9, nome: "Criar conta pelo site", descricao_publica: "Crie sua conta e comece a usar.", ...done() },
  { area: 9, nome: "Planos e assinaturas", descricao_publica: "Escolha o plano que cabe no seu bolso.", ...doing(), nota_interna: "Marcado como atrasado no roadmap de 23/11. Definir o prazo para o status ser calculado." },
  { area: 9, nome: "Aviso de plano ativo ou vencido", descricao_publica: "Um aviso claro sobre a situação do seu plano.", marcacao: "a_confirmar", nota_interna: "O bloqueio de assinatura vencida existe. O aviso visual para o usuário não foi confirmado." },
  { area: 9, nome: "Pagamento e troca de plano automáticos", descricao_publica: "Pagar e mudar de plano direto na plataforma, sem etapas manuais." },

  // Experiência
  { area: 10, nome: "Nova identidade visual", descricao_publica: "O ady moderno, escuro e elegante, igual em toda a plataforma.", ...done() },
  { area: 10, nome: "Redesign mobile-first", descricao_publica: "O app repensado para o celular, mais simples e direto.", inicio_previsto: "2026-11-25", nota_interna: "Início previsto em 25/11." },
  { area: 10, nome: "Gamificação", descricao_publica: "Metas e conquistas para tornar o uso do ady mais envolvente.", prioridade: "P1", nota_interna: "Prioridade 3 da reunião de 23/11. Ideias em aberto; definir na reunião de sexta." },

  // Comercial (fora do público)
  { area: 11, nome: "Teste grátis", descricao_publica: "Nova página e fluxo do teste gratuito.", ...done(), publico: false, nota_interna: "Hoje são 3 dias (antes 7)." },
  { area: 11, nome: "Painel interno", descricao_publica: "Suporte, vendas e gestão dos leads do teste grátis.", ...done(), publico: false },
  { area: 11, nome: "Agente de vendas Bia no WhatsApp", descricao_publica: "Atendimento e qualificação dos leads pelo WhatsApp.", ...doing(), publico: false, nota_interna: "Pronta, falta testar." },

  // Prioridades da reunião de 23/11/2026
  { area: 10, nome: "Novo fluxo de onboarding (MEI e não MEI)", prioridade: "P1", responsavel: "Rafael", descricao_publica: "Um passo a passo simples, do anúncio até o primeiro post publicado.", ...doing(), nota_interna: "Prioridade 1 da reunião de 23/11. Substitui a landing page." },
  { area: 9, nome: "Pontos de conversão no app", prioridade: "P1", responsavel: "Rafael", descricao_publica: "Ofertas claras para assinar na hora certa, sem atrapalhar o uso.", nota_interna: "Prioridade 2 da reunião de 23/11: faixas e pop-ups de upgrade e contratação." },
];

// Tarefas iniciais (sem prazo: Rafael define). Chave = nome do objetivo.
export const TAREFAS = {
  "Novo fluxo de onboarding (MEI e não MEI)": [
    { titulo: "Ajustar o fluxo MEI: quem cria os posts e convite para o teste de 3 dias", peso: 2 },
    { titulo: "Fluxo não MEI: pergunta de anúncios sem \"não\" e divisão postar/anunciar", peso: 2 },
    { titulo: "Criar a tela e o processo de compra (oferta com 20% na hora)", peso: 3 },
    { titulo: "Tela de conexão com 3 opções de ajuda (sozinho, IA do ady, equipe)", peso: 2 },
    { titulo: "Tratar erro de conexão: baixar a arte e pedir ajuda no WhatsApp", peso: 2 },
    { titulo: "Trocar \"Meta\" por Instagram/Facebook e tirar termos técnicos", peso: 1 },
    { titulo: "Ligar o anúncio direto à primeira tela do fluxo", peso: 1 },
  ],
  "Pontos de conversão no app": [
    { titulo: "Faixa de preço promocional durante o teste", peso: 2 },
    { titulo: "Pop-up de contratação quando o teste de 3 dias acaba", peso: 2 },
  ],
};
