# CLAUDE.md

Painel de tarefas e roadmap do ady. Next.js 15 (App Router) + Postgres (postgres.js) + Drizzle (schema e migrations).

- Idioma do código, da interface e dos commits: português do Brasil.
- Regras de %, status e fase ficam **só** no SQL (`drizzle/0001_regras.sql`, views `v_tarefas`, `v_objetivos`, `v_areas`). Não recalcule em TypeScript; mudou regra, escreva uma nova migration e atualize `tests/regras.test.mjs`.
- Escritas passam por `src/lib/dados.ts` (validação compartilhada entre telas e API).
- Datas `date` trafegam como texto `AAAA-MM-DD`; "hoje" é `hoje()` no banco e `hojeSP()` no app.
- Antes de abrir PR: `npm run typecheck`, `npm run build` e `npm test` com `TEST_DATABASE_URL`.
