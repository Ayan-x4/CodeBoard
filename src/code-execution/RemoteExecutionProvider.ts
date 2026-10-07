import type { ExecutionProvider, ExecutionRequest, ExecutionResult } from './types';
import type { LanguageId } from '../editor/languages';

export class RemoteExecutionProvider implements ExecutionProvider {
  name = 'Remote sandbox';
  constructor(private baseUrl: string) {}
  supports(language: LanguageId) { return !['html', 'css', 'json', 'markdown'].includes(language); }
  async execute(request: ExecutionRequest, signal?: AbortSignal): Promise<ExecutionResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(35_000)]) : AbortSignal.timeout(35_000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The execution service could not complete this request.');
    if (!data || typeof data.stdout !== 'string' || typeof data.stderr !== 'string' || !['success', 'compilation-error', 'runtime-error', 'timeout', 'unavailable', 'cancelled'].includes(data.status)) throw new Error('The execution service returned an invalid response.');
    return data as ExecutionResult;
  }
}
