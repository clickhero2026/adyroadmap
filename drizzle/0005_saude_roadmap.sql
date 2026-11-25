-- Saúde geral do roadmap (visão dos diretores e resumo do WhatsApp).
-- Considera os objetivos "em acompanhamento": não entregues/cancelados/adiados e que já começaram ou têm prazo.
-- Cor: vermelho se algum P1 atrasado ou >= 20% dos objetivos atrasados;
--      amarelo se há algum atrasado ou >= 20% em risco; verde no resto.
CREATE VIEW v_saude AS
WITH ativos AS (
  SELECT * FROM v_objetivos
  WHERE status IN ('atrasado', 'em_risco', 'em_dia')
    AND (fase = 'em_andamento' OR prazo IS NOT NULL)
),
c AS (
  SELECT
    count(*)::integer AS objetivos,
    count(*) FILTER (WHERE status = 'em_dia')::integer AS em_dia,
    count(*) FILTER (WHERE status = 'em_risco')::integer AS em_risco,
    count(*) FILTER (WHERE status = 'atrasado')::integer AS atrasados,
    count(*) FILTER (WHERE status = 'atrasado' AND prioridade = 'P1')::integer AS atrasados_p1,
    COALESCE(sum(tarefas_total), 0)::integer AS tarefas,
    COALESCE(sum(tarefas_concluidas), 0)::integer AS tarefas_concluidas,
    COALESCE(sum(tarefas_atrasadas), 0)::integer AS tarefas_atrasadas,
    COALESCE(sum(peso_total), 0)::integer AS peso_total,
    COALESCE(sum(peso_concluido), 0)::integer AS peso_concluido,
    -- % esperado ponderado, só entre objetivos com início e prazo definidos.
    floor(
      sum(pct_esperado * GREATEST(peso_total, 2)) FILTER (WHERE pct_esperado IS NOT NULL)
      / NULLIF(sum(GREATEST(peso_total, 2)) FILTER (WHERE pct_esperado IS NOT NULL), 0)
    )::integer AS pct_esperado,
    floor(
      sum(pct * GREATEST(peso_total, 2)) FILTER (WHERE pct_esperado IS NOT NULL)
      / NULLIF(sum(GREATEST(peso_total, 2)) FILTER (WHERE pct_esperado IS NOT NULL), 0)
    )::integer AS pct_real_com_prazo
  FROM ativos
)
SELECT
  c.*,
  CASE WHEN c.peso_total > 0 THEN floor(100.0 * c.peso_concluido / c.peso_total)::integer ELSE 0 END AS pct,
  CASE
    WHEN c.objetivos = 0 THEN 'verde'
    WHEN c.atrasados_p1 > 0 OR c.atrasados * 5 >= c.objetivos THEN 'vermelho'
    WHEN c.atrasados > 0 OR c.em_risco * 5 >= c.objetivos THEN 'amarelo'
    ELSE 'verde'
  END AS cor
FROM c;
