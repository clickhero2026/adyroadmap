ALTER TABLE "objetivos" ALTER COLUMN "publico" SET DEFAULT false;--> statement-breakpoint
-- Itens internos da empresa saem do roadmap público (pedido do Rafael em 24/11/2026):
-- onboarding, conversão, planos e pagamentos. Continuam no roadmap interno.
UPDATE "objetivos" SET "publico" = false
WHERE "nome" IN (
  'Novo fluxo de onboarding (MEI e não MEI)',
  'Pontos de conversão no app',
  'Planos e assinaturas',
  'Aviso de plano ativo ou vencido',
  'Pagamento e troca de plano automáticos',
  'Criar conta pelo site'
);
