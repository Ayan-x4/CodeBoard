import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, Download, Expand, Loader2, Maximize2, Minimize2, Minus, Plus, Redo2, Trash2, Undo2, WandSparkles, X, Grid3X3 } from 'lucide-react';
import type { WhiteboardData } from '../projects/types';
import { IconButton } from '../components/IconButton';
import { BoardToolbar, toolItems } from './BoardToolbar';
import { boardColors, type BoardSettings, type WhiteboardHandle } from './types';
import { useWhiteboard } from './useWhiteboard';

interface Props { projectId: string; data: WhiteboardData | null; welcome: boolean; onChange: (data: WhiteboardData) => void; onError: (message: string) => void; onLineLink: (fileId: string, line: number) => void; onMaximize: () => void; maximized: boolean; onClear: () => void; presentation: boolean }
export const Whiteboard = forwardRef<WhiteboardHandle, Props>(function Whiteboard(props, ref) {
  const [settings, setSettings] = useState<BoardSettings>({ tool: 'select', color: '#67E8B0', brushSize: 2, textSize: 20 });
  const [showProperties, setShowProperties] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showTip, setShowTip] = useState(true);
  const board = useWhiteboard({ projectId: props.projectId, initialData: props.data, welcome: props.welcome, settings, onChange: props.onChange, onError: props.onError, onLineLink: props.onLineLink });
  const pending = useRef<Parameters<WhiteboardHandle['addSnippet']>[]>([]);
  useImperativeHandle(ref, () => ({ undo: board.undo, redo: board.redo, clear: board.clear, addSnippet: (...args) => { if (board.state.loading) pending.current.push(args); else board.addSnippet(...args); }, exportImage: board.exportImage }), [board.undo, board.redo, board.clear, board.addSnippet, board.exportImage, board.state.loading]);
  useEffect(() => { if (!board.state.loading) { pending.current.forEach((args) => board.addSnippet(...args)); pending.current = []; } }, [board.state.loading, board.addSnippet]);
  useEffect(() => { if (props.presentation && !board.state.loading) board.fit(); }, [props.presentation, board.state.loading, board.fit]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!board.container.current?.contains(document.activeElement)) return;
      if ((event.target as HTMLElement).matches('input, textarea, [contenteditable="true"]')) return;
      if (event.ctrlKey || event.metaKey) { if (event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) board.redo(); else board.undo(); } return; }
      const tool = toolItems.find((item) => item.shortcut.toLowerCase() === event.key.toLowerCase());
      if (tool) { event.preventDefault(); setSettings((previous) => ({ ...previous, tool: tool.id })); }
    };
    window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut);
  }, [board.container, board.undo, board.redo]);
  return <section className="panel whiteboard-panel" aria-label="Interactive whiteboard">
    <header className="panel-heading"><div className="panel-title"><WandSparkles size={15} /><span>Whiteboard</span><span className="board-live"><span /> Live canvas</span></div><div className="panel-actions"><IconButton label="Export whiteboard as PNG" onClick={board.exportImage}><Download size={15} /></IconButton><IconButton label="Clear whiteboard" onClick={props.onClear}><Trash2 size={14} /></IconButton><IconButton label={props.maximized ? 'Restore whiteboard panel' : 'Maximize whiteboard panel'} onClick={props.onMaximize}>{props.maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</IconButton></div></header>
    <div className={`canvas-area ${showGrid ? 'dotted-grid' : ''}`} ref={board.container} tabIndex={0} onPointerDownCapture={(event) => { if (!(event.target as HTMLElement).closest('button, input, select, textarea')) board.container.current?.focus({ preventScroll: true }); }} aria-label="Drawing canvas. Use the toolbar to select a tool; Delete removes selected objects; Space pans.">
      <canvas ref={board.canvasElement} />
      {!props.presentation && <>
        <BoardToolbar tool={settings.tool} onChange={(tool) => setSettings((previous) => ({ ...previous, tool }))} />
        <div className="canvas-properties"><div className="quick-colors" aria-label="Drawing colors">{boardColors.slice(0, 4).map((color) => <button key={color} aria-label={`Use color ${color}`} title={`Use color ${color}`} aria-pressed={settings.color.toUpperCase() === color} className={settings.color.toUpperCase() === color ? 'selected' : ''} style={{ '--swatch': color } as React.CSSProperties} onClick={() => { setSettings((previous) => ({ ...previous, color })); board.recolorSelected(color); }} />)}</div><span className="property-divider" /><button className="stroke-button" title="Drawing style" aria-label="Drawing style settings" aria-expanded={showProperties} onClick={() => setShowProperties(!showProperties)}><span className="stroke-sample" style={{ height: settings.brushSize }} /><ChevronDown size={12} /></button></div>
        {showProperties && <div className="board-properties-popover"><div className="popover-title">Drawing style<IconButton label="Close drawing style" onClick={() => setShowProperties(false)}><X size={14} /></IconButton></div><label>Color <input type="color" aria-label="Custom drawing color" value={settings.color} onChange={(event) => { setSettings((previous) => ({ ...previous, color: event.target.value })); board.recolorSelected(event.target.value); }} /></label><div className="all-colors">{boardColors.map((color) => <button aria-label={`Choose ${color}`} key={color} style={{ background: color }} onClick={() => { setSettings((previous) => ({ ...previous, color })); board.recolorSelected(color); }} />)}</div><label htmlFor="brush-size">Stroke width <span>{settings.brushSize}px</span></label><input id="brush-size" type="range" min="1" max="12" value={settings.brushSize} onChange={(event) => setSettings((previous) => ({ ...previous, brushSize: Number(event.target.value) }))} /><label htmlFor="text-size">Text size<select id="text-size" value={settings.textSize} onChange={(event) => setSettings((previous) => ({ ...previous, textSize: Number(event.target.value) }))}>{[14, 16, 20, 24, 32, 40].map((size) => <option key={size} value={size}>{size}px</option>)}</select></label></div>}
      </>}
      {board.state.loading && <div className="canvas-loading"><Loader2 className="spin" size={24} /><span>Opening your canvas…</span></div>}
      <div className="canvas-bottom-controls"><div className="undo-controls"><IconButton label="Undo drawing (Ctrl+Z)" disabled={!board.state.undo} onClick={board.undo}><Undo2 size={16} /></IconButton><IconButton label="Redo drawing (Ctrl+Shift+Z)" disabled={!board.state.redo} onClick={board.redo}><Redo2 size={16} /></IconButton>{board.state.selected && <IconButton label="Delete selected objects" onClick={board.deleteSelected}><Trash2 size={15} /></IconButton>}</div><div className="zoom-controls"><IconButton label="Zoom out" onClick={() => board.zoom(-0.1)}><Minus size={15} /></IconButton><button className="zoom-value" title="Fit drawing to canvas" onClick={board.fit}>{board.state.zoom}%</button><IconButton label="Zoom in" onClick={() => board.zoom(0.1)}><Plus size={15} /></IconButton><span /><IconButton label="Fit drawing to canvas" onClick={board.fit}><Expand size={16} /></IconButton></div></div>
      {showTip && !props.presentation && <div className="canvas-tip"><span><kbd>Space</kbd> to pan <span>·</span> <kbd>Ctrl</kbd> + scroll to zoom</span><button aria-label="Dismiss canvas hint" onClick={() => setShowTip(false)}><X size={11} /></button></div>}
      {!props.presentation && <button className="grid-toggle" title="Toggle canvas grid" aria-label="Toggle canvas grid" aria-pressed={showGrid} onClick={() => setShowGrid(!showGrid)}><Grid3X3 size={14} /></button>}
    </div>
    <footer className="board-status"><span><span className="status-dot green" />All ideas welcome.</span><span>{board.state.objects} objects<span className="status-separator">·</span>Infinite canvas</span></footer>
  </section>;
});
