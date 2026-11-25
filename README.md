# Roadmap do ady

Gestão de tarefas ligada ao roadmap do produto. Uma base, quatro telas:

| Tela | Endereço | Quem vê |
| --- | --- | --- |
| Roadmap público | `/` | Qualquer pessoa (vitrine de roadmap.useady.com.br) |
| Tarefas (dev) | `/app/tarefas` | Sócios, com login |
| Diretores | `/app/diretores` | Sócios, com login |
| Roadmap interno | `/app/roadmap` | Sócios, com login |

Proposta e regras: https://claude.ai/artifact/SEBBAobtbvLYgoTGdgqxv4

## Modelo

`Tarefa → Objetivo → Área`. Só a tarefa é digitada no dia a dia. O % de avanço, o status
(em dia, em risco, atrasado, entregue) e a fase do roadmap (previsto, em andamento, entregue)
são calculados no banco, nas views de `drizzle/0001_regras.sql`, e todas as telas leem delas.

- **% do objetivo** = peso das tarefas concluídas ÷ peso de todas (P=1, M=2, G=3). Em validação conta 0; cancelada sai da conta.
- **Tarefa atrasada**: passou do prazo. **Em risco**: bloqueada, ou faltam 2 dias úteis ou menos e ainda está em A fazer.
- **Objetivo atrasado**: passou do prazo, ou está mais de 25 pontos abaixo do % esperado pelo ritmo
  (`(hoje − início previsto) ÷ (prazo − início previsto)`). **Em risco**: tem tarefa atrasada ou bloqueada, ou 10 a 25 pontos abaixo.
- **Entregue**: "Entregue em" preenchido e nenhuma tarefa aberta (botão "Marcar como entregue" no objetivo).
- Marcações manuais: Adiado e Cancelado vencem o cálculo; A confirmar e A rever são só selos.
- Prazo é obrigatório para mover uma tarefa para Fazendo, Em validação ou Bloqueada.
- "Hoje" é sempre a data de São Paulo.

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, SESSION_SECRET etc.
npm run db:migrate && npm run db:seed
npm run user:add -- voce@exemplo.com "Seu nome" "uma senha boa"
npm run dev
```

Testes das regras (precisam de um Postgres vazio, que é recriado do zero):

```bash
TEST_DATABASE_URL=postgres://.../roadmap_test npm test
```

Mudou o schema? Edite `src/db/schema.ts` e rode `npm run db:generate`. Regras e views ficam em
migrations SQL escritas à mão (`npx drizzle-kit generate --custom --name nome`).

## Deploy no Easypanel

1. No projeto da VPS, crie um serviço **Postgres** chamado `roadmap`.
2. Crie um serviço **App** apontando para este repositório (branch `main`, build por `Dockerfile`).
3. Em Environment, preencha as variáveis do `.env.example`. A `DATABASE_URL` é a URL interna do serviço `roadmap`.
4. Em Domains, adicione `roadmap.useady.com.br` (porta 3000) e aponte o DNS (registro A para o IP da VPS, ou CNAME, conforme o seu DNS).
5. Deploy. Na primeira subida o app aplica as migrations, carrega as 12 áreas e os 39 objetivos e cria o usuário de `ADMIN_EMAIL`.

Usuários: tela **Usuários** (só admin). Perfis:
- **Admin**: acesso total (tarefas, objetivos, usuários).
- **Diretor**: só consulta o roadmap interno e a visão dos diretores, sem editar.

Pelo console do serviço também funciona: `npm run user:add -- email "Nome" "senha" [admin|diretor]`.

## WhatsApp (resumo para os diretores)

O container roda, junto com o site, um worker (`scripts/whatsapp.mjs`, Baileys) que:
- conecta o WhatsApp pelo QR code da tela **WhatsApp** (só admin), como um aparelho conectado;
- guarda a sessão no banco (tabela `whatsapp_auth`), então não precisa de volume no Easypanel;
- a cada 3 dias úteis, a partir da hora escolhida, manda no grupo escolhido o resumo: concluído desde o último envio, em andamento, em testes e atrasados.

Variáveis opcionais: `APP_URL` (link no fim da mensagem, padrão `https://roadmap.useady.com.br`), `WA_PORT` (porta interna, padrão 3100), `WHATSAPP_DESLIGADO=1` (não sobe o worker).
O Baileys não é oficial: o WhatsApp pode bloquear o número que o usa.

## API (para o Claude e scripts)

Todas pedem `Authorization: Bearer $API_TOKEN`.

| Método | Rota | O quê |
| --- | --- | --- |
| GET | `/api/objetivos` | Áreas e objetivos com %, status e fase |
| GET | `/api/tarefas?objetivo_id=N` | Tarefas com situação |
| POST | `/api/tarefas` | Cria: `{objetivo_id, titulo, peso?, prazo?, responsavel?, status?, link?}` |
| GET/PATCH/DELETE | `/api/tarefas/:id` | Lê, altera ou exclui uma tarefa |
