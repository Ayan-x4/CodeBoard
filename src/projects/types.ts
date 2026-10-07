import type { LanguageId } from '../editor/languages';
import type { ExecutionResult } from '../code-execution/types';

export interface CodeFile { id: string; name: string; language: LanguageId; content: string }
export interface CodeAnnotation { id: string; fileId: string; line: number; text: string; color: string }
export interface WhiteboardData { version: string; objects: Record<string, unknown>[]; viewport?: number[] }
export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  language: LanguageId;
  files: CodeFile[];
  activeFileId: string;
  whiteboard: WhiteboardData | null;
  annotations: CodeAnnotation[];
  notes: string;
  outputHistory: ExecutionResult[];
  createdAt: string;
  updatedAt: string;
}

// A cloud implementation can replace this without coupling workspace components to storage.
export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
