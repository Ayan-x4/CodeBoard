import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createServer } from '../server/app';
import { createProject } from '../src/projects/defaultProject';

let server: Server | undefined;
afterEach(async () => { vi.unstubAllEnvs(); if (server) await new Promise<void>((resolve) => server!.close(() => resolve())); });
async function start() {
  server = createServer().listen(0);
  await new Promise<void>((resolve) => server!.once('listening', resolve));
  const address = server.address();
  return `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
}
describe('sandbox API boundary', () => {
  it('rejects malformed requests before contacting an execution provider', async () => {
    const url = await start();
    const response = await fetch(`${url}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(response.status).toBe(400);
  });
  it('reports a missing sandbox as 503 without executing source', async () => {
    vi.stubEnv('JUDGE0_URL', '');
    const url = await start();
    const project = createProject('Test', 'python');
    const response = await fetch(`${url}/api/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: project.language, files: project.files, entryFileId: project.activeFileId, stdin: '' }) });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: expect.stringContaining('not configured') });
  });
});
