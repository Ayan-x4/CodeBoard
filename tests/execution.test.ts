import { describe, expect, it } from 'vitest';
import { CodeExecutionService } from '../src/code-execution/CodeExecutionService';
import { BrowserExecutionProvider } from '../src/code-execution/BrowserExecutionProvider';
import { createProject } from '../src/projects/defaultProject';
import type { ExecutionRequest } from '../src/code-execution/types';

function request(language: Parameters<typeof createProject>[1] = 'javascript'): ExecutionRequest {
  const project = createProject('Test', language);
  return { language: project.language, files: project.files, entryFileId: project.activeFileId, stdin: '' };
}
describe('execution routing and errors', () => {
  it('provides actionable setup information when a language needs a remote sandbox', async () => {
    const result = await new CodeExecutionService([new BrowserExecutionProvider()]).execute(request('java'));
    expect(result.status).toBe('unavailable');
    expect(result.stderr).toContain('JUDGE0_URL');
  });
  it('turns provider failures into an output result', async () => {
    const service = new CodeExecutionService([{ name: 'Unavailable API', supports: () => true, execute: async () => { throw new Error('Provider offline'); } }]);
    const result = await service.execute(request());
    expect(result.status).toBe('unavailable');
    expect(result.stderr).toBe('Provider offline');
  });
  it('validates JSON and reports a compilation error for invalid JSON', async () => {
    const provider = new BrowserExecutionProvider();
    const input = request('json');
    expect((await provider.execute(input)).status).toBe('success');
    input.files[0].content = '{ invalid }';
    expect((await provider.execute(input)).status).toBe('compilation-error');
  });
  it('does not execute an already-cancelled request', async () => {
    const controller = new AbortController(); controller.abort();
    expect((await new BrowserExecutionProvider().execute(request(), controller.signal)).status).toBe('cancelled');
  });
});
