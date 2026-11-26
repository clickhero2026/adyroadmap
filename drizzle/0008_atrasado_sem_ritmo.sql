-- Regra de 26/11 (Rafael): ficar abaixo do ritmo não marca mais o objetivo como atrasado, só em risco.
-- Atrasado passa a ser prazo do objetivo vencido ou tarefa atrasada, igual ao quadro de tarefas.
CREATE OR REPLACE VIEW v_objetivos AS
WITH agg AS (
  SELECT
    o.id AS objetivo_id,
    COALESCE(SUM(t.peso) FILTER (WHERE t.status <> 'cancelada'), 0)::integer AS peso_total,
    COALESCE(SUM(t.peso) FILTER (WHERE t.status = 'concluida'), 0)::integer AS peso_concluido,
    COUNT(t.id) FILTER (WHERE t.status <> 'cancelada')::integer AS tarefas_total,
    COUNT(t.id) FILTER (WHERE t.status = 'concluida')::integer AS tarefas_concluidas,
    COUNT(t.id) FILTER (WHERE t.situacao = 'atrasada')::integer AS tarefas_atrasadas,
    COUNT(t.id) FILTER (WHERE t.status = 'bloqueada')::integer AS tarefas_bloqueadas,
    COUNT(t.id) FILTER (WHERE t.status NOT IN ('a_fazer', 'cancelada'))::integer AS tarefas_iniciadas,
    COUNT(t.id) FILTER (WHERE t.status NOT IN ('concluida', 'cancelada'))::integer AS tarefas_abertas,
    MIN(COALESCE(t.iniciada_em, t.concluida_em)) AS primeira_iniciada
  FROM objetivos o
  LEFT JOIN v_tarefas t ON t.objetivo_id = o.id
  GROUP BY o.id
),
base AS (
  SELECT
    -- Colunas explícitas: a view mantém as mesmas colunas de antes (beneficios fica fora dela).
    o.id, o.area_id, o.nome, o.tipo, o.prioridade, o.responsavel, o.inicio_previsto, o.prazo, o.iniciado_em, o.entregue_em, o.descricao_publica, o.publico, o.marcacao, o.nota_interna, o.criado_em,
    a.nome AS area_nome,
    a.ordem AS area_ordem,
    agg.peso_total,
    agg.peso_concluido,
    agg.tarefas_total,
    agg.tarefas_concluidas,
    agg.tarefas_atrasadas,
    agg.tarefas_bloqueadas,
    agg.tarefas_iniciadas,
    agg.tarefas_abertas,
    COALESCE(o.iniciado_em, agg.primeira_iniciada) AS inicio_efetivo,
    CASE
      -- Item entregue sem tarefas registradas (legado do roadmap) conta como 100%.
      WHEN o.entregue_em IS NOT NULL AND agg.tarefas_abertas = 0 THEN 100
      WHEN agg.peso_total > 0 THEN floor(100.0 * agg.peso_concluido / agg.peso_total)::integer
      ELSE 0
    END AS pct,
    CASE
      WHEN o.inicio_previsto IS NOT NULL AND o.prazo IS NOT NULL AND o.prazo > o.inicio_previsto
        THEN LEAST(100, GREATEST(0,
          round(100.0 * (hoje() - o.inicio_previsto) / (o.prazo - o.inicio_previsto))
        ))::integer
    END AS pct_esperado
  FROM objetivos o
  JOIN areas a ON a.id = o.area_id
  JOIN agg ON agg.objetivo_id = o.id
),
com_status AS (
  SELECT
    b.*,
    CASE
      WHEN b.marcacao = 'cancelado' THEN 'cancelado'
      WHEN b.entregue_em IS NOT NULL AND b.tarefas_abertas = 0 THEN 'entregue'
      WHEN b.marcacao = 'adiado' THEN 'adiado'
      -- Atrasado só com atraso de fato: prazo do objetivo vencido ou alguma tarefa atrasada.
      WHEN (b.prazo IS NOT NULL AND b.prazo < hoje())
        OR b.tarefas_atrasadas > 0 THEN 'atrasado'
      -- Abaixo do ritmo esperado (10 pontos ou mais) ou tarefa bloqueada: em risco.
      WHEN b.tarefas_bloqueadas > 0
        OR (b.pct_esperado - b.pct) >= 10 THEN 'em_risco'
      ELSE 'em_dia'
    END AS status
  FROM base b
)
SELECT
  s.*,
  CASE
    WHEN s.status = 'entregue' THEN 'entregue'
    WHEN s.iniciado_em IS NOT NULL OR s.tarefas_iniciadas > 0 THEN 'em_andamento'
    ELSE 'previsto'
  END AS fase,
  (
    SELECT count(*)::integer FROM tarefas t
    WHERE t.objetivo_id = s.id
      AND t.status <> 'cancelada'
      AND s.inicio_efetivo IS NOT NULL
      AND (t.criada_em AT TIME ZONE 'America/Sao_Paulo')::date > s.inicio_efetivo
  ) AS tarefas_novas
FROM com_status s;

