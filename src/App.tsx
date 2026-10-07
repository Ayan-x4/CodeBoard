import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Code2, Command, Download, Expand, FilePlus2, FolderOpen, GitBranch, Keyboard, LayoutPanelTop, Loader2, Maximize, MonitorPlay, Pencil, Plus, Save, Sparkles, SquarePen, Terminal, Trash2, X } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { Sidebar, type SidebarPanel } from './components/Sidebar';
import { WorkspaceToolbar, type WorkspaceLayout, type WorkspaceMode } from './components/WorkspaceToolbar';
import { WorkspaceSidePanel } from './components/WorkspaceSidePanel';
import { CommandPalette, type CommandAction } from './components/CommandPalette';
import { IconButton } from './components/IconButton';
import { Modal } from './components/Modal';
import { HelpDialog } from './components/HelpDialog';
import { Toast } from './components/Toast';
import type { CodeEditorHandle } from './editor/CodeEditor';
import { getLanguage, inferLanguage, type LanguageId } from './editor/languages';
import { OutputPanel } from './code-execution/OutputPanel';
import { codeExecutionService } from './code-execution/CodeExecutionService';
import { Whiteboard } from './whiteboard/Whiteboard';
import type { WhiteboardHandle } from './whiteboard/types';
import { Workspace, type WorkspacePanel } from './layouts/Workspace';
import { useProject, projectRepository } from './store/useProject';
import { useToast } from './hooks/useToast';
import { useMediaQuery } from './hooks/useMediaQuery';
import { createProject } from './projects/defaultProject';
import { NameDialog, NewProjectDialog, OpenProjectDialog } from './projects/ProjectDialogs';
import type { Project } from './projects/types';
import { createId } from './utils/id';

type Dialog = 'new-project' | 'open-project' | 'rename-project' | 'new-file' | 'rename-file' | 'delete-file' | 'delete-project' | 'clear-board' | 'help' | 'settings' | null;
const CodeEditor = lazy(() => import('./editor/CodeEditor').then((module) => ({ default: module.CodeEditor })));

export function App() {
  const { toast, notify, dismiss } = useToast();
  const reportError = useCallback((message: string) => notify(message, 'error'), [notify]);
  const { project, ready, saveState, update, save, open, updateBoard } = useProject(reportError);
  const [mode, setMode] = useState<WorkspaceMode>('teaching');
  const [layout, setLayout] = useState<WorkspaceLayout>('side');
  const [swapped, setSwapped] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [showBoard, setShowBoard] = useState(true);
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>(null);
  const [maximized, setMaximized] = useState<WorkspacePanel | null>(null);
  const [mobilePanel, setMobilePanel] = useState<WorkspacePanel>('code');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [targetFileId, setTargetFileId] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [fontSize, setFontSize] = useState(13);
  const mobile = useMediaQuery('(max-width: 760px)');
  const editor = useRef<CodeEditorHandle>(null);
  const board = useRef<WhiteboardHandle>(null);
  const execution = useRef<AbortController | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;
  const activeFile = project.files.find((file) => file.id === project.activeFileId) ?? project.files[0];
  const presentation = mode === 'presentation';
  const saveProject = useCallback(async (announce = true) => { if (await save() && announce) notify('Project saved. Your ideas are right where you left them.'); }, [save, notify]);
  const runCode = useCallback(async () => {
    if (execution.current) return;
    const current = projectRef.current;
    const file = current.files.find((item) => item.id === current.activeFileId) ?? current.files[0];
    const controller = new AbortController();
    execution.current = controller;
    setRunning(true); setShowOutput(true); setMobilePanel('output');
    if (maximized === 'code' || maximized === 'board') setMaximized(null);
    const result = { ...await codeExecutionService.execute({ language: file.language, files: current.files, entryFileId: file.id, stdin }, controller.signal), fileName: file.name };
    if (projectRef.current.id === current.id) update((previous) => ({ ...previous, outputHistory: [result, ...previous.outputHistory].slice(0, 20) }));
    if (execution.current === controller) { execution.current = null; setRunning(false); }
  }, [stdin, update, maximized]);
  useEffect(() => () => execution.current?.abort(), []);
  const changeMode = useCallback((next: WorkspaceMode) => {
    setMode(next); setMaximized(null);
    if (next === 'coding') { setShowBoard(false); setShowOutput(true); }
    else { setShowBoard(true); if (next === 'teaching') setShowOutput(true); }
    if (next === 'presentation') { setSidebarPanel(null); setShowOutput(false); }
  }, []);
  const fullScreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { notify('Fullscreen is unavailable in this browser. Presentation mode is still ready.', 'info'); }
  };
  const selectFile = useCallback((id: string) => { update((previous) => ({ ...previous, activeFileId: id, language: previous.files.find((file) => file.id === id)?.language ?? previous.language })); setMobilePanel('code'); }, [update]);
  const openProject = async (next: Project) => {
    if (next.id !== project.id) await saveProject(false);
    execution.current?.abort();
    open(next); setDialog(null); setMaximized(null); setMobilePanel('code'); notify(`Opened “${next.name}”.`);
  };
  const newProject = async (name: string, language: LanguageId) => { await saveProject(false); execution.current?.abort(); open(createProject(name, language)); setDialog(null); setMaximized(null); setMobilePanel('code'); notify('A fresh workspace, ready for your ideas.'); };
  const exportProject = useCallback(() => {
    const current = projectRef.current;
    const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${current.name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}.codeboard.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Project exported, including your files and editable whiteboard.');
  }, [notify]);
  const changeLanguage = (language: LanguageId) => {
    update((previous) => ({ ...previous, language, files: previous.files.map((file) => file.id === previous.activeFileId ? { ...file, language } : file) }));
    notify(`Syntax highlighting switched to ${getLanguage(language).label}.`, 'info');
  };
  const maximize = (panel: WorkspacePanel) => setMaximized((previous) => previous === panel ? null : panel);
  const explainSelection = () => {
    const selection = editor.current?.getSelection();
    if (!selection?.text.trim()) { notify('Select a code snippet or click a line to explain it.', 'info'); return; }
    const id = createId();
    update((previous) => ({ ...previous, annotations: [...previous.annotations, { id, fileId: selection.fileId, line: selection.line, text: selection.text, color: '#67e8b0' }] }));
    setShowBoard(true); setMobilePanel('board'); setMaximized(null);
    if (mode === 'coding') setMode('teaching');
    // The whiteboard handle queues additions while a newly mounted board is restoring its data.
    if (board.current) board.current.addSnippet(selection, id);
    else pendingSnippet.current = { selection, id };
    notify('Added to the canvas. Double-click its label to jump back to your code.');
  };
  const pendingSnippet = useRef<{ selection: ReturnType<CodeEditorHandle['getSelection']>; id: string } | null>(null);
  useEffect(() => { if (pendingSnippet.current && board.current) { board.current.addSnippet(pendingSnippet.current.selection, pendingSnippet.current.id); pendingSnippet.current = null; } }, [showBoard, mode, mobilePanel, maximized]);
  const markLine = (line: number) => update((previous) => {
    const existing = previous.annotations.find((annotation) => annotation.fileId === previous.activeFileId && annotation.line === line);
    return { ...previous, annotations: existing ? previous.annotations.filter((annotation) => annotation.id !== existing.id) : [...previous.annotations, { id: createId(), fileId: previous.activeFileId, line, text: `Teaching marker · line ${line}`, color: '#67e8b0' }] };
  });
  const jumpToLine = useCallback((fileId: string, line: number) => { selectFile(fileId); setMaximized(null); requestAnimationFrame(() => editor.current?.focusLine(line)); }, [selectFile]);
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); notify('Copied to clipboard.'); } catch { reportError('Clipboard access is unavailable in this browser.'); } };
  const shortcuts = useRef({ runCode, saveProject, changeMode, presentation });
  shortcuts.current = { runCode, saveProject, changeMode, presentation };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const current = shortcuts.current;
      if ((event.ctrlKey || event.metaKey) && ['p', 's'].includes(event.key.toLowerCase())) {
        event.preventDefault(); event.stopPropagation();
        if (event.key.toLowerCase() === 'p') setPaletteOpen((previous) => !previous); else void current.saveProject();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !document.querySelector('dialog[open]')) { event.preventDefault(); event.stopPropagation(); void current.runCode(); }
      if (event.key === 'Escape' && current.presentation && !document.querySelector('dialog[open]')) { current.changeMode('teaching'); if (document.fullscreenElement) void document.exitFullscreen(); }
    };
    window.addEventListener('keydown', handle, true); return () => window.removeEventListener('keydown', handle, true);
  }, []);
  const commands: CommandAction[] = [
    { id: 'run', label: 'Run code', group: 'Code', shortcut: 'Ctrl Enter', icon: Code2, action: () => void runCode() },
    { id: 'save', label: 'Save project', group: 'Project', shortcut: 'Ctrl S', icon: Save, action: () => void saveProject() },
    { id: 'new-file', label: 'New file', group: 'Code', icon: FilePlus2, action: () => setDialog('new-file') },
    { id: 'new-project', label: 'New project', group: 'Project', icon: Plus, action: () => setDialog('new-project') },
    { id: 'open', label: 'Open project', group: 'Project', icon: FolderOpen, action: () => { void saveProject(false).then(() => setDialog('open-project')); } },
    { id: 'rename', label: 'Rename project', group: 'Project', icon: Pencil, action: () => setDialog('rename-project') },
    { id: 'board', label: 'Toggle whiteboard', group: 'Layout', icon: SquarePen, action: () => { setShowBoard(!showBoard); setMaximized(null); } },
    { id: 'output', label: 'Toggle output', group: 'Layout', icon: Terminal, action: () => { setShowOutput(!showOutput); setMaximized(null); } },
    { id: 'present', label: 'Enter presentation mode', group: 'Teaching', icon: MonitorPlay, action: () => changeMode('presentation') },
    { id: 'clear', label: 'Clear whiteboard', group: 'Whiteboard', icon: Trash2, action: () => setDialog('clear-board') },
    { id: 'export', label: 'Export project', group: 'Project', icon: Download, action: exportProject },
    { id: 'layout', label: 'Switch panel layout', group: 'Layout', icon: LayoutPanelTop, action: () => setLayout(layout === 'side' ? 'stacked' : layout === 'stacked' ? 'studio' : 'side') },
    { id: 'fullscreen', label: 'Toggle fullscreen', group: 'View', icon: Expand, action: () => void fullScreen() },
    { id: 'help', label: 'Keyboard shortcuts', group: 'Help', icon: Keyboard, action: () => setDialog('help') },
  ];
  const targetFile = project.files.find((file) => file.id === targetFileId);
  const codePanel = <Suspense fallback={<section className="panel editor-panel"><header className="panel-heading"><span className="panel-title"><Code2 size={16} />Code editor</span></header><div className="editor-loading"><Loader2 className="spin" size={22} />Setting up your editor…</div></section>}><CodeEditor ref={editor} files={project.files} activeFileId={project.activeFileId} annotations={project.annotations} fontSize={presentation ? Math.max(17, fontSize) : fontSize}
    onChange={(id, content) => update((previous) => ({ ...previous, files: previous.files.map((file) => file.id === id ? { ...file, content } : file) }))}
    onSelect={selectFile} onNewFile={() => setDialog('new-file')} onDeleteFile={(id) => { setTargetFileId(id); setDialog('delete-file'); }} onRenameFile={(id) => { setTargetFileId(id); setDialog('rename-file'); }}
    onExplain={explainSelection} onMarkLine={markLine} onMaximize={() => maximize('code')} maximized={maximized === 'code'} onRun={() => void runCode()} onSave={() => void saveProject()} /></Suspense>;
  const outputPanel = <OutputPanel history={project.outputHistory} running={running} stdin={stdin} onStdinChange={setStdin} onClear={() => update((previous) => ({ ...previous, outputHistory: [] }))} onMaximize={() => maximize('output')} maximized={maximized === 'output'} fileName={activeFile.name} onCopy={(text) => void copy(text)} />;
  const boardPanel = <Whiteboard ref={board} projectId={project.id} data={project.whiteboard} welcome={project.name === 'Understanding arrays'} onChange={updateBoard} onError={reportError} onLineLink={jumpToLine} onMaximize={() => maximize('board')} maximized={maximized === 'board'} onClear={() => setDialog('clear-board')} presentation={presentation} />;
  return <div className={`app ${presentation ? 'presentation-mode' : ''}`}>
    {!presentation ? <AppHeader projectName={project.name} saveState={saveState} onSave={() => void saveProject()} onOpen={() => { void saveProject(false).then(() => setDialog('open-project')); }} onNew={() => setDialog('new-project')} onRename={() => setDialog('rename-project')} onDelete={() => setDialog('delete-project')} onExport={exportProject} onPresent={() => changeMode('presentation')} onCommands={() => setPaletteOpen(true)} /> : <header className="presentation-header"><span><Code2 size={22} />{project.name}<span className="presentation-badge">PRESENTING</span></span><div><IconButton label="Run code" onClick={() => void runCode()}><Code2 size={19} /></IconButton><IconButton label="Toggle fullscreen" onClick={() => void fullScreen()}><Maximize size={18} /></IconButton><button className="secondary-button" onClick={() => changeMode('teaching')}><X size={15} />Exit <kbd>Esc</kbd></button></div></header>}
    <div className="app-body">
      {!presentation && <Sidebar panel={sidebarPanel} onPanel={setSidebarPanel} onProjects={() => { void saveProject(false).then(() => setDialog('open-project')); }} onBoard={() => { setShowBoard(true); setMaximized('board'); setMobilePanel('board'); }} onHelp={() => setDialog('help')} onSettings={() => setDialog('settings')} />}
      {!presentation && <WorkspaceSidePanel panel={sidebarPanel} files={project.files} activeId={project.activeFileId} notes={project.notes} onSelect={selectFile} onNew={() => setDialog('new-file')} onNotes={(notes) => update((previous) => ({ ...previous, notes }))} onClose={() => setSidebarPanel(null)} />}
      <main className="main-workspace">
        {!presentation && <><div className="workspace-intro"><div><div className="workspace-breadcrumb">WORKSPACE<ChevronRight size={11} /><span>{project.name}</span></div><h1>Code meets canvas<span>.</span></h1></div><div className="workspace-tagline"><span className="tagline-icon"><Sparkles size={16} /></span><div>A space for lightbulb moments.<span>Write it. Draw it. Make it click.</span></div></div><IconButton className="fullscreen-button" label="Toggle fullscreen" onClick={() => void fullScreen()}><Maximize size={17} /></IconButton></div><WorkspaceToolbar mode={mode} onMode={changeMode} layout={layout} onLayout={(next) => { setLayout(next); setMaximized(null); setShowBoard(true); if (next === 'studio') setShowOutput(true); }} language={activeFile.language} onLanguage={changeLanguage} running={running} onRun={() => void runCode()} onStop={() => execution.current?.abort()} onSwap={() => setSwapped(!swapped)} showOutput={showOutput} onOutput={() => { setShowOutput(!showOutput); setMaximized(null); }} /></>}
        {mobile && <div className="mobile-panel-tabs" aria-label="Workspace panels">{([{ id: 'code', icon: Code2, label: 'Code' }, { id: 'output', icon: Terminal, label: 'Output' }, { id: 'board', icon: SquarePen, label: 'Whiteboard' }] as const).map((panel) => <button key={panel.id} className={mobilePanel === panel.id ? 'active' : ''} onClick={() => setMobilePanel(panel.id)}><panel.icon size={16} />{panel.label}{panel.id === 'output' && running && <Loader2 className="spin" size={12} />}</button>)}</div>}
        {ready ? <Workspace code={codePanel} output={outputPanel} board={boardPanel} layout={layout} swapped={swapped} showOutput={showOutput} showBoard={showBoard} maximized={maximized} mobile={mobile} mobilePanel={mobilePanel} /> : <div className="workspace-loading"><Loader2 className="spin" size={27} />Opening your thinking space…</div>}
        {!presentation && <footer className="workspace-footer"><span><span className="status-dot green" />Local workspace<span className="footer-divider">/</span><GitBranch size={12} />No account needed</span><button onClick={() => setPaletteOpen(true)}><Command size={12} />Command palette <kbd>Ctrl P</kbd></button><span className="footer-right">Built for better explanations<ArrowUpRight size={12} /></span></footer>}
      </main>
    </div>
    <Toast message={toast} onClose={dismiss} />
    {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
    {dialog === 'new-project' && <NewProjectDialog onCreate={(name, language) => void newProject(name, language)} onClose={() => setDialog(null)} />}
    {dialog === 'open-project' && <OpenProjectDialog activeId={project.id} onOpen={(next) => void openProject(next)} onNew={() => setDialog('new-project')} onClose={() => setDialog(null)} onError={reportError} />}
    {dialog === 'rename-project' && <NameDialog title="Rename your project" label="Project name" initial={project.name} onClose={() => setDialog(null)} onSubmit={(name) => { update((previous) => ({ ...previous, name })); setDialog(null); notify('Project renamed.'); }} />}
    {(dialog === 'new-file' || dialog === 'rename-file') && <NameDialog title={dialog === 'new-file' ? 'Add a file to your project' : 'Rename file'} label="File name" initial={dialog === 'new-file' ? `example.${getLanguage(activeFile.language).extension}` : targetFile?.name ?? ''} onClose={() => setDialog(null)} validate={(name) => !name ? null : /[\\/<>:"|?*]/.test(name) ? 'Use a filename without path separators or special characters.' : project.files.some((file) => file.name === name && (dialog !== 'rename-file' || file.id !== targetFileId)) ? 'A file with this name already exists.' : null} onSubmit={(name) => { const language = inferLanguage(name); if (dialog === 'new-file') { const id = createId(); update((previous) => ({ ...previous, activeFileId: id, language, files: [...previous.files, { id, name, language, content: getLanguage(language).sample }] })); } else update((previous) => ({ ...previous, files: previous.files.map((file) => file.id === targetFileId ? { ...file, name, language } : file) })); setDialog(null); setMobilePanel('code'); }} />}
    {(dialog === 'delete-file' || dialog === 'delete-project' || dialog === 'clear-board') && <Modal title={dialog === 'clear-board' ? 'Make room for a fresh idea?' : dialog === 'delete-file' ? `Delete ${targetFile?.name}?` : 'Delete this project?'} subtitle={dialog === 'clear-board' ? 'Clear all canvas objects. You can undo this with Ctrl+Z on the whiteboard.' : 'This removes the saved content. Export a backup first if you want to keep it.'} onClose={() => setDialog(null)}><div className="modal-footer"><button className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button className="danger-button" onClick={() => {
      if (dialog === 'clear-board') { if (board.current) board.current.clear(); else update((previous) => ({ ...previous, whiteboard: { version: '6.0.0', objects: [] } })); notify('Canvas cleared. A fresh start.'); }
      if (dialog === 'delete-file' && project.files.length > 1) update((previous) => { const files = previous.files.filter((file) => file.id !== targetFileId); const activeFileId = previous.activeFileId === targetFileId ? files[0].id : previous.activeFileId; return { ...previous, files, activeFileId, language: files.find((file) => file.id === activeFileId)!.language, annotations: previous.annotations.filter((annotation) => annotation.fileId !== targetFileId) }; });
      if (dialog === 'delete-project') { execution.current?.abort(); void projectRepository.delete(project.id).then(() => { open(createProject()); notify('Project deleted.'); }).catch(() => reportError('The project could not be deleted.')); }
      setDialog(null);
    }}><Trash2 size={15} />{dialog === 'clear-board' ? 'Clear canvas' : 'Delete'}</button></div></Modal>}
    {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
    {dialog === 'settings' && <Modal title="Make this space yours." subtitle="A few things to keep you comfortable while you teach." onClose={() => setDialog(null)}><div className="settings-body"><label htmlFor="editor-font">Editor font size<select id="editor-font" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}>{[12, 13, 14, 16, 18, 20, 24].map((size) => <option key={size} value={size}>{size}px</option>)}</select></label><div><span>Autosave<small>Your project saves after you stop editing.</small></span><span className="settings-enabled"><Check size={14} />Enabled</span></div><div><span>Execution<small>JavaScript / TypeScript in a private browser sandbox.</small></span><span className="small-badge">Isolated</span></div><div><span>Appearance<small>Easy on the eyes. Ready for long lessons.</small></span><span className="small-badge">Dark</span></div></div><div className="modal-footer"><button className="primary-button" onClick={() => setDialog(null)}>All set</button></div></Modal>}
  </div>;
}
