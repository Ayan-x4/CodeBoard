import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const languageIds: Record<string, number> = { javascript: 63, typescript: 74, python: 71, java: 62, c: 50, cpp: 54, csharp: 51, go: 60, rust: 73, php: 68, ruby: 72, kotlin: 78, swift: 83, shell: 46, sql: 82 };
const requestSchema = z.object({ language: z.string(), files: z.array(z.object({ id: z.string(), name: z.string(), content: z.string().max(200_000), language: z.string() })).min(1).max(50), entryFileId: z.string(), stdin: z.string().max(20_000).default('') });

export function createServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', executionConfigured: Boolean(process.env.JUDGE0_URL) }));
  app.post('/api/execute', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid execution request.' }); return; }
    const request = parsed.data;
    const languageId = languageIds[request.language];
    const entry = request.files.find((file) => file.id === request.entryFileId);
    if (!languageId || !entry) { res.status(400).json({ error: 'Unsupported language or missing entry file.' }); return; }
    if (!process.env.JUDGE0_URL) { res.status(503).json({ error: 'The secure execution provider is not configured. Set JUDGE0_URL on the API server.' }); return; }
    // This adapter submits only the active file. Providers with project/build support can use
    // the complete files array instead. No user source is executed in the Node.js process.
    const url = process.env.JUDGE0_URL.replace(/\/$/, '');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.JUDGE0_AUTH_TOKEN) headers['X-Auth-Token'] = process.env.JUDGE0_AUTH_TOKEN;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      const submission = await fetch(`${url}/submissions?base64_encoded=false&wait=false`, {
        method: 'POST', headers, signal: controller.signal,
        body: JSON.stringify({ language_id: languageId, source_code: entry.content, stdin: request.stdin, cpu_time_limit: 3, wall_time_limit: 5, memory_limit: 128000, max_file_size: 1024, enable_network: false }),
      });
      if (!submission.ok) throw new Error('The sandbox rejected the submission.');
      const { token } = await submission.json() as { token: string };
      if (!token || !/^[a-zA-Z0-9-]+$/.test(token)) throw new Error('Invalid sandbox response.');
      let result: { status: { id: number }; stdout?: string; stderr?: string; compile_output?: string; message?: string; time?: string } | undefined;
      for (let attempt = 0; attempt < 50; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const response = await fetch(`${url}/submissions/${encodeURIComponent(token)}?base64_encoded=false`, { headers, signal: controller.signal });
        if (!response.ok) throw new Error('Could not retrieve sandbox output.');
        result = await response.json() as typeof result;
        if (result && result.status.id > 2) break;
      }
      if (!result || result.status.id <= 2) { res.status(504).json({ error: 'The sandbox took too long to respond.' }); return; }
      const status = result.status.id === 3 ? 'success' : result.status.id === 6 ? 'compilation-error' : result.status.id === 5 ? 'timeout' : 'runtime-error';
      res.json({ id: crypto.randomUUID(), status, stdout: (result.stdout ?? '').slice(0, 100_000), stderr: (result.stderr ?? result.message ?? '').slice(0, 100_000), compileOutput: (result.compile_output ?? '').slice(0, 100_000), durationMs: Number(result.time ?? 0) * 1000, timestamp: new Date().toISOString(), provider: 'Judge0 sandbox' });
    } catch (error) {
      if (!res.writableEnded && !res.destroyed) res.status(502).json({ error: controller.signal.aborted ? 'The execution request timed out.' : error instanceof Error ? error.message : 'The sandbox is unavailable.' });
    } finally { clearTimeout(timeout); }
  });
  app.use((error: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.status ?? 500).json({ error: error.status === 413 ? 'The project is too large to submit.' : 'The request could not be processed.' });
  });
  return app;
}
