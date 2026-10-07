import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, Maximize2, Minimize2, Plus, X, MessageSquarePlus, Loader2, FileCode2 } from 'lucide-react';
import { monaco } from './setup';
import { getLanguage } from './languages';
import type { CodeAnnotation, CodeFile } from '../projects/types';
import { IconButton } from '../components/IconButton';

export interface EditorSelection { text: string; line: number; fileId: string; fileName: string }
export interface CodeEditorHandle { getSelection(): EditorSelection; focusLine(line: number): void }
interface Props {
  files: CodeFile[]; activeFileId: string; annotations: CodeAnnotation[]; fontSize: number;
  onChange: (id: string, content: string) => void; onSelect: (id: string) => void;
  onNewFile: () => void; onDeleteFile: (id: string) => void; onRenameFile: (id: string) => void;
  onExplain: () => void; onMarkLine: (line: number) => void; onMaximize: () => void; maximized: boolean;
  onRun: () => void; onSave: () => void;
}
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(props, ref) {
  const file = props.files.find((item) => item.id === props.activeFileId) ?? props.files[0];
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorations = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const [position, setPosition] = useState({ lineNumber: 1, column: 1 });
  const latest = useRef(props);
  latest.current = props;
  useImperativeHandle(ref, () => ({
    getSelection() {
      const instance = editor.current;
      const selection = instance?.getSelection();
      const model = instance?.getModel();
      const line = selection?.startLineNumber ?? 1;
      const text = selection && !selection.isEmpty() ? model?.getValueInRange(selection) : model?.getLineContent(line);
      return { text: text ?? '', line, fileId: file.id, fileName: file.name };
    },
    focusLine(line) { editor.current?.revealLineInCenter(line); editor.current?.setPosition({ lineNumber: line, column: 1 }); editor.current?.focus(); },
  }), [file]);
  useEffect(() => {
    const instance = editor.current;
    if (!instance) return;
    decorations.current?.clear();
    decorations.current = instance.createDecorationsCollection(props.annotations.filter((item) => item.fileId === file.id).map((item) => ({
      range: new monaco.Range(item.line, 1, item.line, 1),
      options: { isWholeLine: true, className: 'teaching-line-highlight', glyphMarginClassName: 'teaching-line-marker', glyphMarginHoverMessage: { value: item.text }, hoverMessage: { value: item.text } },
    })));
  }, [props.annotations, file.id]);
  return <section className="panel editor-panel" aria-label="Code editor">
    <header className="panel-heading"><div className="panel-title"><Code2 size={16} /><span>Code editor</span><span className="small-badge">{props.files.length} files</span></div><div className="panel-actions"><IconButton label="Explain selected code on whiteboard" onClick={props.onExplain}><MessageSquarePlus size={16} /></IconButton><IconButton label={props.maximized ? 'Restore code panel' : 'Maximize code panel'} onClick={props.onMaximize}>{props.maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</IconButton></div></header>
    <div className="file-tabs" role="tablist" aria-label="Project files">
      {props.files.map((item) => <div key={item.id} className={`file-tab ${item.id === file.id ? 'selected' : ''}`}>
        <button role="tab" aria-selected={item.id === file.id} onClick={() => props.onSelect(item.id)} onDoubleClick={() => props.onRenameFile(item.id)} title={`${item.name} · Double-click to rename`}><span className="file-language" style={{ color: getLanguage(item.language).color }}>{getLanguage(item.language).badge}</span>{item.name}</button>
        {props.files.length > 1 && <button className="tab-close" aria-label={`Delete ${item.name}`} onClick={() => props.onDeleteFile(item.id)}><X size={12} /></button>}
      </div>)}
      <IconButton label="New file" onClick={props.onNewFile}><Plus size={16} /></IconButton>
    </div>
    <div className="editor-body">
      <Editor path={`${file.id}/${file.name}`} language={file.language} value={file.content} theme="codeboard" keepCurrentModel={false}
        loading={<div className="editor-loading"><Loader2 className="spin" size={22} /><span>Setting up your editor…</span></div>}
        onChange={(value) => props.onChange(file.id, value ?? '')}
        options={{ fontFamily: 'JetBrains Mono, monospace', fontSize: props.fontSize, lineHeight: 25, minimap: { enabled: false }, padding: { top: 23, bottom: 20 }, scrollBeyondLastLine: false, smoothScrolling: true, automaticLayout: true, tabSize: 2, glyphMargin: true, folding: true, lineNumbersMinChars: 3, renderLineHighlight: 'all', roundedSelection: true, bracketPairColorization: { enabled: true }, overviewRulerLanes: 0, fixedOverflowWidgets: true, wordWrap: 'off', scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, accessibilitySupport: 'auto' }}
        onMount={(instance) => {
          editor.current = instance;
          instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => latest.current.onRun());
          instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => latest.current.onSave());
          instance.onDidChangeCursorPosition((event) => setPosition(event.position));
          instance.onMouseDown((event) => { if ((event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || event.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) && event.target.position) latest.current.onMarkLine(event.target.position.lineNumber); });
          decorations.current = instance.createDecorationsCollection(latest.current.annotations.filter((item) => item.fileId === latest.current.activeFileId).map((item) => ({ range: new monaco.Range(item.line, 1, item.line, 1), options: { isWholeLine: true, className: 'teaching-line-highlight', glyphMarginClassName: 'teaching-line-marker', glyphMarginHoverMessage: { value: item.text } } })));
        }} />
    </div>
    <footer className="editor-status"><span><FileCode2 size={12} /> {getLanguage(file.language).label}</span><div><span>Ln {position.lineNumber}, Col {position.column}</span><span>UTF-8</span><span>Spaces: 2</span></div></footer>
  </section>;
});
