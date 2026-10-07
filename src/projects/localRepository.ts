import { z } from 'zod';
import { languages } from '../editor/languages';
import type { Project, ProjectRepository } from './types';

const languageSchema = z.enum(languages.map((l) => l.id) as [string, ...string[]]);
const resultSchema = z.object({
  id: z.string(), status: z.enum(['success', 'compilation-error', 'runtime-error', 'timeout', 'unavailable', 'cancelled']),
  stdout: z.string(), stderr: z.string(), compileOutput: z.string().optional(), durationMs: z.number(),
  timestamp: z.string(), provider: z.string(), fileName: z.string().optional(), preview: z.object({ type: z.enum(['html', 'markdown']), content: z.string() }).optional(),
});
export const projectSchema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), name: z.string().min(1).max(100), language: languageSchema,
  files: z.array(z.object({ id: z.string(), name: z.string().min(1).max(100), language: languageSchema, content: z.string().max(500_000) })).min(1).max(50),
  activeFileId: z.string(), whiteboard: z.object({ version: z.string(), objects: z.array(z.record(z.string(), z.unknown())).max(3000), viewport: z.array(z.number()).length(6).optional() }).nullable(),
  annotations: z.array(z.object({ id: z.string(), fileId: z.string(), line: z.number().int().positive(), text: z.string(), color: z.string() })),
  notes: z.string(), outputHistory: z.array(resultSchema).max(20), createdAt: z.string(), updatedAt: z.string(),
}).superRefine((project, context) => {
  if (!project.files.some((file) => file.id === project.activeFileId)) context.addIssue({ code: 'custom', message: 'The active file is missing.' });
  if (new Set(project.files.map((file) => file.id)).size !== project.files.length) context.addIssue({ code: 'custom', message: 'File IDs must be unique.' });
});

export function parseProject(input: unknown): Project {
  const result = projectSchema.safeParse(input);
  if (!result.success) throw new Error('This is not a valid CodeBoard project. Export a project from CodeBoard and try again.');
  // Only safe vector and text objects are accepted; imported images could make network requests.
  const allowedTypes = new Set(['rect', 'circle', 'ellipse', 'line', 'path', 'polyline', 'polygon', 'triangle', 'group', 'textbox', 'i-text', 'text', 'layoutmanager', 'fit-content', 'fixed', 'clip-path', 'linear', 'radial']);
  const validateValue = (value: unknown, depth = 0): void => {
    if (depth > 30) throw new Error('The whiteboard contains too many nested objects.');
    if (Array.isArray(value)) { value.forEach((item) => validateValue(item, depth + 1)); return; }
    if (value && typeof value === 'object') {
      const object = value as Record<string, unknown>;
      if ('src' in object || ('type' in object && !allowedTypes.has(String(object.type).toLowerCase()))) throw new Error('This project contains an unsupported whiteboard object.');
      Object.values(object).forEach((item) => validateValue(item, depth + 1));
    }
  };
  if (result.data.whiteboard) validateValue(result.data.whiteboard.objects);
  return result.data as Project;
}

const KEY = 'codeboard.projects.v1';
export const ACTIVE_KEY = 'codeboard.active-project';
export class LocalProjectRepository implements ProjectRepository {
  private readAll(): Project[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const input: unknown = JSON.parse(raw);
    if (!Array.isArray(input)) throw new Error('Saved projects could not be read. Export your current project before clearing browser storage.');
    return input.map(parseProject);
  }
  async list() { return this.readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async get(id: string) { return this.readAll().find((project) => project.id === id) ?? null; }
  async save(project: Project) {
    const validated = parseProject(project);
    const projects = this.readAll();
    const index = projects.findIndex((item) => item.id === project.id);
    if (index === -1) projects.push(validated); else projects[index] = validated;
    try { localStorage.setItem(KEY, JSON.stringify(projects)); localStorage.setItem(ACTIVE_KEY, project.id); }
    catch { throw new Error('Your browser storage is full or unavailable. Export this project to keep a backup.'); }
  }
  async delete(id: string) { localStorage.setItem(KEY, JSON.stringify(this.readAll().filter((project) => project.id !== id))); }
}
