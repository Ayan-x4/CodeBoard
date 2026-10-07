import { BrowserExecutionProvider } from './BrowserExecutionProvider';
import { RemoteExecutionProvider } from './RemoteExecutionProvider';
import type { ExecutionProvider, ExecutionRequest, ExecutionResult } from './types';
import { getLanguage } from '../editor/languages';
import { createId } from '../utils/id';

export class CodeExecutionService {
  constructor(private providers: ExecutionProvider[]) {}
  async execute(request: ExecutionRequest, signal?: AbortSignal): Promise<ExecutionResult> {
    const provider = this.providers.find((item) => item.supports(request.language));
    const base = { id: createId(), stdout: '', stderr: '', timestamp: new Date().toISOString(), durationMs: 0, provider: provider?.name ?? 'No provider' };
    if (!provider) return { ...base, status: 'unavailable', stderr: `${getLanguage(request.language).label} is ready to edit. To run it, connect a secure execution provider.\n\nSet VITE_EXECUTION_API_URL=/api and configure JUDGE0_URL in .env, then start the API with npm run server.\n\nJavaScript and TypeScript run in the built-in browser sandbox.` };
    try { return await provider.execute(request, signal); }
    catch (error) {
      if (signal?.aborted) return { ...base, status: 'cancelled', stderr: 'Execution stopped.' };
      return { ...base, status: 'unavailable', stderr: error instanceof Error ? error.message : 'Execution failed. Please try again.' };
    }
  }
}

const remoteUrl = import.meta.env.VITE_EXECUTION_API_URL;
export const codeExecutionService = new CodeExecutionService([
  ...(remoteUrl ? [new RemoteExecutionProvider(remoteUrl)] : []), new BrowserExecutionProvider(),
]);
