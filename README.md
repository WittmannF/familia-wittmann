# Família Wittmann

Site memorial/familiar estático para preservar memórias, histórias, fotos e registros da Família Wittmann. A primeira versão começa pelo memorial de **Ivo / Ivo Amandio Wittmann**.

> O repositório pode ser público para compartilhar uma prévia. O site foi configurado com `noindex`, `robots.txt` e `X-Robots-Tag`, mas isso **não é privacidade real**. Não publique documentos pessoais, dados sensíveis ou informações de pessoas vivas sem consentimento.

## Stack

- Astro + TypeScript
- Markdown em Astro Content Collections
- GitHub Pages para prévia pública
- Estrutura compatível com Cloudflare Pages
- Cloudflare Pages Functions/Worker para submissões
- Cloudflare R2 para armazenar submissões privadas e arquivos brutos
- Cloudflare Turnstile anti-spam
- GitHub Actions para importar submissões e abrir Pull Requests

## Rodar localmente

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

Para simular o caminho do GitHub Pages:

```bash
GITHUB_PAGES=1 npm run build
```

## Rotas principais

- `/` — página inicial Família Wittmann
- `/ivo` — memorial principal de Ivo Amandio Wittmann
- `/ivo-amandio` — redireciona para `/ivo`
- `/qr/ivo` — página mobile-first para QR code na lápide
- `/ivo/historia` — história de vida estruturada
- `/ivo/fotos` — galeria de fotos publicadas
- `/ivo/videos` — vídeos publicados
- `/ivo/audios` — áudios publicados
- `/ivo/memorias` — relatos longos
- `/ivo/livro-de-visitas` — mensagens curtas
- `/ivo/linha-do-tempo` — eventos importantes
- `/enviar` — formulário de contribuições
- `/familia` — expansão futura: genealogia, imigração, Andreas Wittmann
- `/sobre` — objetivo, contribuição, privacidade e contato

## Estrutura de conteúdo

```text
src/content/
  people/ivo-wittmann.md
  memories/ivo/
  guestbook/ivo/
  timeline/ivo/
  photos/ivo/
  videos/ivo/
  audio/ivo/
  family-history/andreas-wittmann.md
public/images/
  people/ivo/
  submissions/ivo/
functions/api/submit.ts
scripts/import-submission.ts
.github/workflows/
```

O site renderiza apenas conteúdo com `publish: true`. Conteúdo importado de submissões nasce com `publish: false`.

## Criar um novo memorial

1. Crie uma pessoa em `src/content/people/nome-sobrenome.md`.
2. Use um `id` estável, por exemplo `maria-wittmann`.
3. Crie páginas ou rotas equivalentes, ou generalize as páginas atuais de `/ivo`.
4. Crie pastas de conteúdo por pessoa:
   - `src/content/memories/maria/`
   - `src/content/guestbook/maria/`
   - `src/content/photos/maria/`
5. Só publique entradas com `publish: true` após revisão familiar.

## Adicionar uma memória manualmente

Crie um arquivo em `src/content/memories/ivo/AAAA-MM-DD-titulo.md`:

```md
---
person: "ivo-wittmann"
title: "Título da memória"
author: "Nome"
relationship: "Filho, amigo, irmão..."
date_received: "2026-06-24"
memory_date: ""
location: ""
source: "manual"
source_submission_id: ""
permission_to_publish: true
show_author_name: true
publish: false
media:
  type: "none"
  src: ""
  alt: ""
---

Texto da memória.
```

Altere `publish: true` somente depois da revisão.

## Fluxo de upload

1. Visitante envia pelo formulário `/enviar`.
2. Cloudflare Turnstile valida o envio.
3. A Function `functions/api/submit.ts` valida token, tipo e tamanho do arquivo.
4. A submissão é salva em bucket privado do R2:

```text
r2://familiawittmann-submissions/inbox/YYYY-MM-DD/sub_<id>/submission.json
r2://familiawittmann-submissions/inbox/YYYY-MM-DD/sub_<id>/original/arquivo.ext
```

5. A Function dispara o workflow `import-submission.yml`.
6. O GitHub Action baixa a submissão, processa mídia simples, gera Markdown com `publish: false` e abre uma Pull Request.
7. A família revisa a PR; somente após alterar para `publish: true` e fazer merge o conteúdo aparece.

## Limites e tipos de upload

- Fotos: até 20 MB (`jpg`, `jpeg`, `png`, `webp`)
- Áudios: até 50 MB (`mp3`, `m4a`, `wav`, `ogg`)
- Vídeos: até 80 MB (`mp4`, `mov`, `webm`)

Para vídeos maiores, enviar pelo WhatsApp ou por link de Google Drive.

A primeira versão bloqueia SVG, HTML, ZIP, executáveis e arquivos desconhecidos.

## Configurar Cloudflare Pages

1. Crie um projeto no Cloudflare Pages apontando para este repositório.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Configure as variáveis/secrets abaixo.
5. Conecte a Function em `functions/api/submit.ts`.
6. Configure o domínio `familiawittmann.com.br` quando o DNS estiver pronto.

## Configurar R2

1. Crie o bucket privado `familiawittmann-submissions`.
2. Crie credenciais R2 com permissão de leitura/escrita para esse bucket.
3. Configure o binding da Function:
   - Binding: `SUBMISSIONS`
   - Bucket: `familiawittmann-submissions`
4. Configure os mesmos dados como secrets no GitHub Actions para o script de importação.

## Configurar Turnstile

1. Crie um widget no Cloudflare Turnstile para o domínio.
2. Coloque a site key pública em `PUBLIC_TURNSTILE_SITE_KEY`.
3. Coloque a secret key em `TURNSTILE_SECRET_KEY` no Cloudflare Pages/Worker.

## Variáveis de ambiente

Use `.env.example` como referência. Não commitar secrets reais.

- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `GITHUB_TOKEN`
- `GITHUB_REPOSITORY`
- `GITHUB_WORKFLOW_DISPATCH_TOKEN`
- `WHATSAPP_NUMBER`

## Configurar GitHub Actions

### GitHub Pages

O workflow `.github/workflows/pages.yml` publica a prévia em GitHub Pages. Ele usa `GITHUB_PAGES=1` para gerar links compatíveis com `/familia-wittmann/`.

### Importação de submissões

Configure os secrets no repositório:

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set R2_ACCESS_KEY_ID
gh secret set R2_SECRET_ACCESS_KEY
gh secret set R2_BUCKET_NAME
```

A Function precisa de um `GITHUB_TOKEN` com permissão para disparar `workflow_dispatch` no repositório.

## Como revisar PRs

1. Abra a PR criada automaticamente.
2. Verifique texto, autoria, permissões, privacidade, mídia e sensibilidade do conteúdo.
3. Ajuste o Markdown se necessário.
4. Mude `publish: false` para `publish: true` apenas quando aprovado.
5. Faça merge para publicar.

## Backup

- O GitHub guarda o conteúdo publicado e revisado.
- O R2 guarda submissões brutas privadas.
- Faça exportações periódicas do R2 e clone local do repositório.
- Vídeos grandes devem ficar no R2 ou em storage externo com backup separado.

## QR code da lápide

A rota preparada é:

```text
https://familiawittmann.com.br/qr/ivo
```

Quando o domínio estiver apontado, gere o QR code final usando essa URL. Não gere o QR definitivo com URL temporária de GitHub Pages.

## Observações de privacidade

- `noindex` e `robots.txt` reduzem indexação, mas não impedem acesso público.
- Não publique CPF, RG, endereço, telefone pessoal, documentos sensíveis ou dados de pessoas vivas sem consentimento.
- Prefira fotos e histórias familiares consensuais e respeitosas.
