import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../src/projects/defaultProject';
import { LocalProjectRepository, parseProject } from '../src/projects/localRepository';

describe('project persistence', () => {
  const storage = new Map<string, string>();
  beforeEach(() => { storage.clear(); vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) }); });
  afterEach(() => vi.unstubAllGlobals());
  it('round-trips files, editable whiteboard objects, notes, and annotations', async () => {
    const repository = new LocalProjectRepository();
    const project = createProject('Arrays lesson', 'java');
    project.whiteboard = { version: '6.0.0', objects: [{ type: 'Rect', left: 20, top: 30, width: 100, height: 50, stroke: '#67e8b0', fill: 'transparent' }] };
    project.annotations = [{ id: 'marker', fileId: project.files[0].id, line: 2, text: 'Entry point', color: '#67e8b0' }];
    project.notes = 'Discuss static methods.';
    await repository.save(project);
    expect(await repository.get(project.id)).toEqual(project);
    await repository.delete(project.id);
    expect(await repository.get(project.id)).toBeNull();
  });
  it('rejects projects with dangling active files', () => {
    expect(() => parseProject({ ...createProject(), activeFileId: 'missing' })).toThrow('not a valid CodeBoard project');
  });
  it('rejects imported remote image objects, including nested groups', () => {
    const project = createProject();
    project.whiteboard = { version: '6.0.0', objects: [{ type: 'Group', objects: [{ type: 'Image', src: 'https://example.com/tracker' }] }] };
    expect(() => parseProject(project)).toThrow('unsupported whiteboard object');
  });
  it('accepts Fabric group layout metadata while rejecting image clip paths', () => {
    const project = createProject();
    project.whiteboard = { version: '6.0.0', objects: [{ type: 'Group', layoutManager: { type: 'layoutManager', strategy: 'fit-content' }, objects: [{ type: 'Rect', width: 20, height: 30 }] }] };
    expect(parseProject(project).whiteboard).toEqual(project.whiteboard);
    project.whiteboard.objects[0].clipPath = { type: 'Image', src: 'https://example.com/tracker' };
    expect(() => parseProject(project)).toThrow('unsupported whiteboard object');
  });
  it('reports storage quota failures without silently losing the project', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('quota'); } });
    await expect(new LocalProjectRepository().save(createProject())).rejects.toThrow('storage is full');
  });
});
