import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Clock3, FileCode2, FolderOpen, Import, Loader2, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { IconButton } from '../components/IconButton';
import { getLanguage, languages, type LanguageId } from '../editor/languages';
import type { Project } from './types';
import { projectRepository } from '../store/useProject';
import { parseProject } from './localRepository';

export function NewProjectDialog({ onCreate, onClose }: { onCreate: (name: string, language: LanguageId) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<LanguageId>('javascript');
  return <Modal title="A fresh canvas for your next idea." subtitle="Bring your code and explanations together in a project." onClose={onClose}><form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onCreate(name.trim(), language); }}><label htmlFor="project-name">Project name</label><input id="project-name" autoFocus maxLength={100} placeholder="e.g. Java Arrays Masterclass" value={name} onChange={(event) => setName(event.target.value)} required /><label htmlFor="project-language">Starting language</label><select id="project-language" value={language} onChange={(event) => setLanguage(event.target.value as LanguageId)}>{languages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><div className="dialog-info"><FolderOpen size={17} /><span>Saved locally in this browser. You can export a backup anytime.</span></div><div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!name.trim()}><Plus size={16} />Create project</button></div></form></Modal>;
}

export function OpenProjectDialog({ activeId, onOpen, onNew, onClose, onError }: { activeId: string; onOpen: (project: Project) => void; onNew: () => void; onClose: () => void; onError: (message: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(() => { void projectRepository.list().then(setProjects).catch((error: Error) => onError(error.message)).finally(() => setLoading(false)); }, [onError]);
  const importProject = async (file?: File) => {
    if (!file) return;
    if (file.size > 5_000_000) { onError('This project is larger than the 5 MB import limit.'); return; }
    try { const project = parseProject(JSON.parse(await file.text())); onOpen(project); }
    catch (error) { onError(error instanceof SyntaxError ? 'This file does not contain valid project JSON.' : (error as Error).message); }
  };
  const remove = async () => {
    if (!deleteId) return;
    try { await projectRepository.delete(deleteId); setProjects((previous) => previous.filter((project) => project.id !== deleteId)); setDeleteId(null); }
    catch { onError('The project could not be deleted.'); }
  };
  return <Modal title="Your projects" subtitle="Pick up an idea where you left off." onClose={onClose} className="projects-modal"><div className="project-list">{loading ? <div className="dialog-empty"><Loader2 className="spin" size={24} />Loading your projects…</div> : projects.length ? projects.map((project) => <div className="project-card" key={project.id}><button className="project-open" onClick={() => onOpen(project)}><div className="project-card-icon"><FileCode2 size={23} /></div><div><strong>{project.name}{project.id === activeId && <span className="small-badge">Current</span>}</strong><span>{getLanguage(project.language).label}<span>·</span>{project.files.length} {project.files.length === 1 ? 'file' : 'files'}<span>·</span><Clock3 size={11} />{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div><ArrowUpRight size={17} /></button>{project.id !== activeId && <IconButton label={`Delete project ${project.name}`} onClick={() => setDeleteId(project.id)}><Trash2 size={15} /></IconButton>}</div>) : <div className="dialog-empty"><FolderOpen size={32} /><strong>A home for your ideas.</strong><p>Save your first project and it will appear here.</p></div>}</div>{deleteId && <div className="inline-confirm"><span>Delete this saved project? This cannot be undone.</span><button className="secondary-button" onClick={() => setDeleteId(null)}>Keep</button><button className="danger-button" onClick={() => void remove()}>Delete</button></div>}<input ref={importInput} type="file" accept="application/json,.json" hidden onChange={(event) => void importProject(event.target.files?.[0])} /><div className="modal-footer"><button className="secondary-button" onClick={() => importInput.current?.click()}><Import size={16} />Import project</button><button className="primary-button" onClick={onNew}><Plus size={16} />New project</button></div></Modal>;
}

export function NameDialog({ title, label, initial, onSubmit, onClose, validate }: { title: string; label: string; initial: string; onSubmit: (name: string) => void; onClose: () => void; validate?: (name: string) => string | null }) {
  const [name, setName] = useState(initial);
  const error = validate?.(name.trim());
  return <Modal title={title} onClose={onClose}><form className="dialog-form" onSubmit={(event) => { event.preventDefault(); if (name.trim() && !error) onSubmit(name.trim()); }}><label htmlFor="new-name">{label}</label><input id="new-name" autoFocus maxLength={100} value={name} onFocus={(event) => event.target.select()} onChange={(event) => setName(event.target.value)} required />{error && <p className="form-error">{error}</p>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!name.trim() || Boolean(error)}>Save</button></div></form></Modal>;
}
