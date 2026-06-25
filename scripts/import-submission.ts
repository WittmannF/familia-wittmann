import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename } from 'node:path';
import { Readable } from 'node:stream';
import sharp from 'sharp';

const key = process.env.SUBMISSION_KEY || process.argv[2];
if (!key) throw new Error('Informe SUBMISSION_KEY ou passe a key do submission.json.');
const bucket = process.env.R2_BUCKET_NAME || 'familiawittmann-submissions';
const endpoint = process.env.R2_ENDPOINT || (process.env.CLOUDFLARE_ACCOUNT_ID ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);
if (!endpoint) throw new Error('Configure R2_ENDPOINT ou CLOUDFLARE_ACCOUNT_ID.');
const s3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID || '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '' } });
async function textFromS3(Key: string) { const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key })); return await res.Body!.transformToString(); }
async function fileFromS3(Key: string, out: string) { const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key })); await new Promise((resolve, reject) => Readable.fromWeb(res.Body as any).pipe(createWriteStream(out)).on('finish', resolve).on('error', reject)); }
function slug(s: string) { return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70) || 'contribuicao'; }
function yamlEscape(v: unknown) { return JSON.stringify(String(v ?? '')); }
const submission = JSON.parse(await textFromS3(key));
const f = submission.fields || {};
const today = new Date().toISOString().slice(0, 10);
const title = f.contribution_type === 'Livro de visitas' ? `Mensagem de ${f.name || 'visitante'}` : `${f.contribution_type || 'Memória'} de ${f.name || 'visitante'}`;
let mediaBlock = `  type: "none"
  src: ""
  alt: ""`;
if (submission.file?.key) {
  await mkdir('public/images/submissions/ivo', { recursive: true });
  await mkdir('/tmp/familiawittmann', { recursive: true });
  const raw = `/tmp/familiawittmann/${basename(submission.file.key)}`;
  await fileFromS3(submission.file.key, raw);
  if (submission.file.kind === 'image') {
    const out = `public/images/submissions/ivo/${submission.id}.webp`;
    await sharp(raw).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    mediaBlock = `  type: "image"
  src: "/images/submissions/ivo/${submission.id}.webp"
  alt: ${yamlEscape(title)}`;
  } else {
    // MVP: áudio/vídeo grande fica no R2 privado até revisão. O Markdown nasce sem src público.
    mediaBlock = `  type: "${submission.file.kind}"
  src: ""
  alt: ${yamlEscape(title)}`;
  }
}
const body = String(f.message || '').trim() || 'Mensagem recebida pelo formulário. Completar contexto antes de publicar.';
if (f.contribution_type === 'Livro de visitas') {
  await mkdir('src/content/guestbook/ivo', { recursive: true });
  await writeFile(`src/content/guestbook/ivo/${today}-${slug(f.name)}-${submission.id.slice(4, 12)}.md`, `---
person: "ivo-wittmann"
author: ${yamlEscape(f.name)}
city: ${yamlEscape(f.location)}
relationship: ""
date_received: "${today}"
source: "site-form"
source_submission_id: "${submission.id}"
permission_to_publish: ${f.permission_to_publish === 'sim'}
show_author_name: ${f.show_author_name !== 'nao'}
publish: false
---

${body}
`);
} else {
  await mkdir('src/content/memories/ivo', { recursive: true });
  await writeFile(`src/content/memories/ivo/${today}-${slug(title)}-${submission.id.slice(4, 12)}.md`, `---
person: "ivo-wittmann"
title: ${yamlEscape(title)}
author: ${yamlEscape(f.name)}
relationship: ""
date_received: "${today}"
memory_date: ${yamlEscape(f.memory_date)}
location: ${yamlEscape(f.location)}
source: "site-form"
source_submission_id: "${submission.id}"
permission_to_publish: ${f.permission_to_publish === 'sim'}
show_author_name: ${f.show_author_name !== 'nao'}
publish: false
media:
${mediaBlock}
---

${body}
`);
}
console.log(`Imported ${submission.id} with publish: false`);
