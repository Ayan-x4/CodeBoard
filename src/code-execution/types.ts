import type { CodeFile } from '../projects/types';
import type { LanguageId } from '../editor/languages';

export type ExecutionStatus = 'success' | 'compilation-error' | 'runtime-error' | 'timeout' | 'unavailable' | 'cancelled';
export interface ExecutionRequest { language: LanguageId; files: CodeFile[]; entryFileId: string; stdin: string }
export interface ExecutionResult {
  id: string;
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  compileOutput?: string;
  durationMs: number;
  timestamp: string;
  provider: string;
  fileName?: string;
  preview?: { type: 'html' | 'markdown'; content: string };
}
export interface ExecutionProvider {
  name: string;
  supports(language: LanguageId): boolean;
  execute(request: ExecutionRequest, signal?: AbortSignal): Promise<ExecutionResult>;
}
