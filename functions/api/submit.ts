type Env = {
  TURNSTILE_SECRET_KEY: string;
  R2_BUCKET_NAME: string;
  SUBMISSIONS: R2Bucket;
  GITHUB_TOKEN?: string;
  GITHUB_REPOSITORY?: string;
  GITHUB_WORKFLOW_DISPATCH_TOKEN?: string;
};

const allowed = {
  image: { max: 20 * 1024 * 1024, exts: ['jpg','jpeg','png','webp'], mimes: ['image/jpeg','image/png','image/webp'] },
  audio: { max: 50 * 1024 * 1024, exts: ['mp3','m4a','wav','ogg'], mimes: ['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/ogg'] },
  video: { max: 80 * 1024 * 1024, exts: ['mp4','mov','webm'], mimes: ['video/mp4','video/quicktime','video/webm'] }
};

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }); }
function safeName(name: string) { return name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 90) || 'arquivo'; }
function classify(file: File) { const ext = file.name.split('.').pop()?.toLowerCase() || ''; for (const [kind, rule] of Object.entries(allowed)) if (rule.exts.includes(ext) && rule.mimes.includes(file.type)) return { kind, ext, ...rule }; return null; }
async function verifyTurnstile(token: string, secret: string, ip?: string) { const form = new FormData(); form.append('secret', secret); form.append('response', token); if (ip) form.append('remoteip', ip); const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form }); const data = await r.json() as { success?: boolean }; return Boolean(data.success); }

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const form = await request.formData();
    const token = String(form.get('cf-turnstile-response') || '');
    if (!token || !env.TURNSTILE_SECRET_KEY) return json({ message: 'Validação anti-spam indisponível. Envie pelo WhatsApp ou tente novamente.' }, 400);
    const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP') || undefined);
    if (!ok) return json({ message: 'Não foi possível validar o Turnstile. Tente novamente.' }, 400);

    const id = `sub_${crypto.randomUUID()}`;
    const day = new Date().toISOString().slice(0, 10);
    const prefix = `inbox/${day}/${id}`;
    const fields = Object.fromEntries([...form.entries()].filter(([_, v]) => typeof v === 'string'));
    delete (fields as any)['cf-turnstile-response'];
    const file = form.get('file');
    let fileInfo = null;
    if (file instanceof File && file.size > 0) {
      const rule = classify(file);
      if (!rule) return json({ message: 'Tipo de arquivo não permitido.' }, 400);
      if (file.size > rule.max) return json({ message: `Arquivo maior que o limite para ${rule.kind}.` }, 400);
      const originalName = safeName(file.name);
      const key = `${prefix}/original/${crypto.randomUUID()}.${rule.ext}`;
      await env.SUBMISSIONS.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName, submissionId: id, kind: rule.kind } });
      fileInfo = { key, originalName, type: file.type, size: file.size, kind: rule.kind };
    }
    const submission = { id, received_at: new Date().toISOString(), fields, file: fileInfo, publish: false, source: 'site-form' };
    await env.SUBMISSIONS.put(`${prefix}/submission.json`, JSON.stringify(submission, null, 2), { httpMetadata: { contentType: 'application/json' } });

    if (env.GITHUB_TOKEN && env.GITHUB_REPOSITORY) {
      await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/workflows/import-submission.yml/dispatches`, {
        method: 'POST', headers: { 'authorization': `Bearer ${env.GITHUB_TOKEN}`, 'accept': 'application/vnd.github+json', 'user-agent': 'familia-wittmann-submit' },
        body: JSON.stringify({ ref: 'main', inputs: { submission_key: `${prefix}/submission.json` } })
      });
    }
    return json({ ok: true, message: 'Contribuição recebida para revisão.' });
  } catch (error) { console.error(error); return json({ message: 'Erro ao receber a contribuição. Tente novamente ou envie pelo WhatsApp.' }, 500); }
};
