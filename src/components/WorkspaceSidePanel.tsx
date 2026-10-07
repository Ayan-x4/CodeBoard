import { FileCode2, Plus, X } from 'lucide-react';
import type { CodeFile } from '../projects/types';
import type { SidebarPanel } from './Sidebar';
import { getLanguage } from '../editor/languages';
import { IconButton } from './IconButton';

export function WorkspaceSidePanel({ panel, files, activeId, notes, onSelect, onNew, onNotes, onClose }: { panel: SidebarPanel; files: CodeFile[]; activeId: string; notes: string; onSelect: (id: string) => void; onNew: () => void; onNotes: (notes: string) => void; onClose: () => void }) {
  if (!panel) return null;
  return <aside className="workspace-side-panel"><header><span>{panel === 'files' ? 'EXPLORER' : 'LESSON NOTES'}</span><div>{panel === 'files' && <IconButton label="Add file" onClick={onNew}><Plus size={15} /></IconButton>}<IconButton label="Close sidebar" onClick={onClose}><X size={15} /></IconButton></div></header>{panel === 'files' ? <><div className="explorer-caption">PROJECT FILES</div>{files.map((file) => <button key={file.id} className={`explorer-file ${file.id === activeId ? 'active' : ''}`} onClick={() => onSelect(file.id)}><span className="file-language" style={{ color: getLanguage(file.language).color }}>{getLanguage(file.language).badge}</span>{file.name}</button>)}<div className="explorer-hint"><FileCode2 size={19} /><span>Double-click a tab to rename a file.</span></div></> : <><p className="notes-caption">A little room for your big ideas.</p><textarea aria-label="Project lesson notes" value={notes} placeholder="Lesson goals, questions, reminders…" onChange={(event) => onNotes(event.target.value)} /><span className="notes-saved">Included in your project</span></>}</aside>;
}
