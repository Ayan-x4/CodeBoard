import { useCallback, useEffect, useRef, useState } from 'react';
import { createWelcomeProject } from '../projects/defaultProject';
import { ACTIVE_KEY, LocalProjectRepository } from '../projects/localRepository';
import type { Project, WhiteboardData } from '../projects/types';

export const projectRepository = new LocalProjectRepository();
export function useProject(onError: (message: string) => void) {
  const [project, setProject] = useState<Project>(createWelcomeProject);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const current = useRef(project);
  current.current = project;
  const revision = useRef(0);
  const autoSavePaused = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const id = localStorage.getItem(ACTIVE_KEY);
        const saved = id ? await projectRepository.get(id) : null;
        if (active && saved) setProject(saved);
      } catch (error) { onErrorRef.current((error as Error).message); }
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, []);
  const update = useCallback((updater: (project: Project) => Project) => {
    autoSavePaused.current = false;
    revision.current++;
    setProject((previous) => ({ ...updater(previous), updatedAt: new Date().toISOString() }));
    setSaveState('unsaved');
  }, []);
  const save = useCallback(async () => {
    const version = revision.current;
    setSaveState('saving');
    try {
      await projectRepository.save(current.current);
      if (version === revision.current) setSaveState('saved');
      return true;
    } catch (error) {
      autoSavePaused.current = true;
      setSaveState('unsaved');
      onErrorRef.current((error as Error).message);
      return false;
    }
  }, []);
  useEffect(() => {
    if (!ready || saveState !== 'unsaved' || autoSavePaused.current) return;
    const timer = setTimeout(() => { void save(); }, 1400);
    return () => clearTimeout(timer);
  }, [project, ready, saveState, save]);
  useEffect(() => {
    const flush = () => { if (ready && saveState === 'unsaved') void projectRepository.save(current.current).catch(() => {}); };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [ready, saveState]);
  const open = useCallback((next: Project) => {
    autoSavePaused.current = false;
    revision.current++;
    setProject(next);
    setSaveState('unsaved');
  }, []);
  const updateBoard = useCallback((whiteboard: WhiteboardData) => update((previous) => ({ ...previous, whiteboard })), [update]);
  return { project, ready, saveState, update, save, open, updateBoard };
}
