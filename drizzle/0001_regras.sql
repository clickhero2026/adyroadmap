-- Regras de % de avanço, status e fase (proposta aprovada em 24/11/2026).
-- Tudo que é calculado mora aqui, para todas as telas lerem o mesmo número.

ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_peso_check" CHECK ("peso" IN (1, 2, 3));
--> statement-breakpoint
CREATE INDEX "tarefas_objetivo_idx" ON "tarefas" ("objetivo_id");
--> statement-breakpoint
CREATE INDEX "objetivos_area_idx" ON "objetivos" ("area_id");
--> statement-breakpoint

-- "Hoje" no fuso de São Paulo. Os testes fixam a data com SET app.hoje = 'AAAA-MM-DD'.
CREATE OR REPLACE FUNCTION hoje() RETURNS date
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.hoje', true), '')::date,
    (now() AT TIME ZONE 'America/Sao_Paulo')::date
  )
$$;
--> statement-breakpoint

-- Dias úteis (seg a sex) depois de "de" até "ate", inclusive. 0 se "ate" <= "de".
CREATE OR REPLACE FUNCTION dias_uteis(de date, ate date) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT count(*)::integer
  FROM generate_series(de + 1, ate, interval '1 day') AS d
  WHERE extract(isodow FROM d) < 6
$$;
--> statement-breakpoint

-- Situação da tarefa. Vale a primeira regra que bater.
CREATE VIEW v_tarefas AS
SELECT
  t.*,
  CASE
    WHEN t.status = 'concluida' THEN 'concluida'
    WHEN t.status = 'cancelada' THEN 'cancelada'
    WHEN t.prazo IS NOT NULL AND t.prazo < hoje() THEN 'atrasada'
    WHEN t.status = 'bloqueada'
      OR (t.status = 'a_fazer' AND t.prazo IS NOT NULL AND dias_uteis(hoje(), t.prazo) <= 2)
      THEN 'em_risco'
    ELSE 'em_dia'
  END AS situacao,
  (t.prazo IS NULL AND t.status NOT IN ('concluida', 'cancelada')) AS sem_prazo
FROM tarefas t;
--> statement-breakpoint

-- % de avanço, % esperado, status e fase do objetivo.
CREATE VIEW v_objetivos AS
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
    o.*,
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
      WHEN (b.prazo IS NOT NULL AND b.prazo < hoje())
        OR (b.pct_esperado - b.pct) > 25 THEN 'atrasado'
      WHEN b.tarefas_atrasadas > 0
        OR b.tarefas_bloqueadas > 0
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
--> statement-breakpoint

-- % da área: média dos objetivos ponderada pelo peso das tarefas.
-- Objetivo sem tarefas (legado) pesa 2, como uma tarefa média.
CREATE VIEW v_areas AS
SELECT
  a.id,
  a.nome,
  a.ordem,
  COUNT(o.id) FILTER (WHERE o.status <> 'cancelado')::integer AS objetivos,
  COUNT(o.id) FILTER (WHERE o.status = 'entregue')::integer AS entregues,
  COALESCE(
    floor(
      SUM(o.pct * CASE WHEN o.peso_total > 0 THEN o.peso_total ELSE 2 END) FILTER (WHERE o.status <> 'cancelado')
      / NULLIF(SUM(CASE WHEN o.peso_total > 0 THEN o.peso_total ELSE 2 END) FILTER (WHERE o.status <> 'cancelado'), 0)
    ),
    0
  )::integer AS pct
FROM areas a
LEFT JOIN v_objetivos o ON o.area_id = a.id
GROUP BY a.id;
