import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, Ellipse, FabricObject, Group, IText, Line, PencilBrush, Point, Polygon, Rect, Textbox } from 'fabric';
import type { WhiteboardData } from '../projects/types';
import type { BoardSettings } from './types';
import type { EditorSelection } from '../editor/CodeEditor';
import { addWelcomeScene, createArrow } from './scene';
import { createId } from '../utils/id';

interface Options {
  projectId: string; initialData: WhiteboardData | null; welcome: boolean; settings: BoardSettings;
  onChange: (data: WhiteboardData) => void; onError: (message: string) => void;
  onLineLink: (fileId: string, line: number) => void;
}
export function useWhiteboard(options: Options) {
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<Canvas | null>(null);
  const latest = useRef(options);
  latest.current = options;
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const loading = useRef(false);
  const [state, setState] = useState({ undo: false, redo: false, zoom: 100, objects: 0, loading: true, selected: false });
  const syncState = useCallback(() => {
    const board = canvas.current;
    if (!board) return;
    setState({ undo: historyIndex.current > 0, redo: historyIndex.current < history.current.length - 1, zoom: Math.round(board.getZoom() * 100), objects: board.getObjects().length, loading: loading.current, selected: Boolean(board.getActiveObject()) });
  }, []);
  const serialize = useCallback((): WhiteboardData | null => {
    const board = canvas.current;
    if (!board) return null;
    return { ...board.toObject(['id', 'lineLink', 'note']), viewport: [...board.viewportTransform] } as WhiteboardData;
  }, []);
  const commit = useCallback(() => {
    if (loading.current) return;
    const data = serialize();
    if (!data) return;
    const snapshot = JSON.stringify(data);
    if (history.current[historyIndex.current] !== snapshot) {
      history.current = history.current.slice(0, historyIndex.current + 1);
      history.current.push(snapshot);
      if (history.current.length > 60) history.current.shift();
      historyIndex.current = history.current.length - 1;
      latest.current.onChange(data);
    }
    syncState();
  }, [serialize, syncState]);
  const configure = useCallback(() => {
    const board = canvas.current;
    if (!board) return;
    const { tool, color, brushSize } = latest.current.settings;
    const drawing = ['pen', 'pencil', 'highlighter'].includes(tool);
    board.isDrawingMode = drawing;
    board.selection = tool === 'select';
    board.skipTargetFind = !['select', 'eraser'].includes(tool);
    board.defaultCursor = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair';
    board.hoverCursor = tool === 'eraser' ? 'crosshair' : tool === 'select' ? 'move' : board.defaultCursor;
    board.getObjects().forEach((object) => { object.selectable = tool === 'select'; object.evented = ['select', 'eraser'].includes(tool); });
    if (drawing) {
      const brush = new PencilBrush(board);
      brush.color = tool === 'highlighter' ? `${color}55` : tool === 'pencil' ? `${color}B3` : color;
      brush.width = tool === 'highlighter' ? brushSize * 6 : tool === 'pencil' ? Math.max(1, brushSize / 2) : brushSize;
      brush.decimate = 0.7;
      board.freeDrawingBrush = brush;
    }
    board.requestRenderAll();
  }, []);
  const fit = useCallback(() => {
    const board = canvas.current;
    if (!board) return;
    const objects = board.getObjects();
    if (!objects.length) { board.setViewportTransform([1, 0, 0, 1, 0, 0]); syncState(); return; }
    const bounds = objects.map((object) => object.getBoundingRect());
    const left = Math.min(...bounds.map((b) => b.left));
    const top = Math.min(...bounds.map((b) => b.top));
    const right = Math.max(...bounds.map((b) => b.left + b.width));
    const bottom = Math.max(...bounds.map((b) => b.top + b.height));
    const zoom = Math.max(0.1, Math.min(1.3, (board.width - 75) / (right - left), (board.height - 170) / (bottom - top)));
    board.setViewportTransform([zoom, 0, 0, zoom, (board.width - (right - left) * zoom) / 2 - left * zoom, (board.height - (bottom - top) * zoom) / 2 - top * zoom + 28]);
    syncState();
  }, [syncState]);
  useEffect(() => {
    if (!canvasElement.current || !container.current) return;
    const board = new Canvas(canvasElement.current, { width: container.current.clientWidth, height: container.current.clientHeight, preserveObjectStacking: true, backgroundColor: 'transparent', selectionColor: '#67e8b014', selectionBorderColor: '#67e8b0', enablePointerEvents: true, stopContextMenu: true });
    canvas.current = board;
    loading.current = true;
    history.current = [];
    historyIndex.current = -1;
    let disposed = false;
    let start: Point | null = null;
    let temporary: FabricObject | null = null;
    let panning = false;
    let lastX = 0;
    let lastY = 0;
    let spacePressed = false;
    const observer = new ResizeObserver(([entry]) => { if (!disposed) { board.setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height }); board.requestRenderAll(); } });
    observer.observe(container.current);
    board.on('mouse:down', (event) => {
      const tool = latest.current.settings.tool;
      const native = event.e as PointerEvent;
      if (tool === 'hand' || spacePressed || native.button === 1) {
        panning = true; lastX = native.clientX; lastY = native.clientY;
        board.selection = false; board.setCursor('grabbing'); return;
      }
      if (tool === 'eraser') { if (event.target) { board.remove(event.target); commit(); } return; }
      if (['pen', 'pencil', 'highlighter', 'select'].includes(tool)) return;
      const point = board.getScenePoint(event.e);
      if (tool === 'text' || tool === 'sticky') {
        const sticky = tool === 'sticky';
        const object = new Textbox(sticky ? 'Your idea here…' : 'Type something…', { left: point.x, top: point.y, width: sticky ? 230 : 300, fontSize: latest.current.settings.textSize, fontFamily: 'Inter', fill: sticky ? '#E4C77E' : latest.current.settings.color, backgroundColor: sticky ? '#343022' : '', padding: 12, lineHeight: 1.5 });
        object.set('id' as never, createId() as never);
        board.add(object); board.setActiveObject(object); object.enterEditing(); object.selectAll(); commit(); return;
      }
      start = point;
      board.discardActiveObject();
    });
    board.on('mouse:move', (event) => {
      if (panning) {
        const native = event.e as PointerEvent;
        const transform = board.viewportTransform;
        transform[4] += native.clientX - lastX; transform[5] += native.clientY - lastY;
        lastX = native.clientX; lastY = native.clientY;
        board.requestRenderAll(); return;
      }
      if (latest.current.settings.tool === 'eraser' && (event.e as PointerEvent).buttons === 1 && event.target) { board.remove(event.target); commit(); return; }
      if (!start) return;
      const point = board.getScenePoint(event.e);
      const { color, brushSize, tool } = latest.current.settings;
      const x = Math.min(start.x, point.x), y = Math.min(start.y, point.y), width = Math.abs(point.x - start.x), height = Math.abs(point.y - start.y);
      const common = { left: x, top: y, stroke: color, strokeWidth: brushSize, fill: 'transparent', selectable: false, evented: false, objectCaching: false };
      if (temporary) board.remove(temporary);
      if (tool === 'rectangle') temporary = new Rect({ ...common, width, height, rx: 5, ry: 5 });
      if (tool === 'circle') temporary = new Ellipse({ ...common, rx: width / 2, ry: height / 2 });
      if (tool === 'diamond') temporary = new Polygon([{ x: width / 2, y: 0 }, { x: width, y: height / 2 }, { x: width / 2, y: height }, { x: 0, y: height / 2 }], common);
      if (tool === 'line') temporary = new Line([start.x, start.y, point.x, point.y], { stroke: color, strokeWidth: brushSize, strokeLineCap: 'round', selectable: false, evented: false });
      if (tool === 'arrow') { temporary = createArrow(start.x, start.y, point.x, point.y, color, brushSize); temporary.set({ selectable: false, evented: false }); }
      if (temporary) board.add(temporary);
      board.requestRenderAll();
    });
    board.on('mouse:up', () => {
      if (panning) { panning = false; board.setViewportTransform(board.viewportTransform); syncState(); const data = serialize(); if (data) latest.current.onChange(data); configure(); }
      if (temporary) { temporary.set('id' as never, createId() as never); temporary.setCoords(); commit(); }
      start = null; temporary = null;
    });
    board.on('path:created', (event) => { event.path.set('id' as never, createId() as never); commit(); });
    board.on('object:modified', commit);
    board.on('text:changed', commit);
    board.on('text:editing:exited', commit);
    board.on('selection:created', syncState);
    board.on('selection:updated', syncState);
    board.on('selection:cleared', syncState);
    board.on('mouse:dblclick', (event) => {
      const target = event.subTargets?.find((object) => object instanceof IText) ?? event.target;
      if (target instanceof IText) { board.setActiveObject(target); target.enterEditing(); }
      const link = (event.target as unknown as { lineLink?: { fileId: string; line: number } })?.lineLink;
      if (link) latest.current.onLineLink(link.fileId, link.line);
    });
    board.on('mouse:wheel', (event) => {
      const wheel = event.e as WheelEvent;
      wheel.preventDefault(); wheel.stopPropagation();
      if (wheel.ctrlKey || wheel.metaKey) board.zoomToPoint(new Point(wheel.offsetX, wheel.offsetY), Math.max(0.1, Math.min(4, board.getZoom() * 0.998 ** wheel.deltaY)));
      else { board.viewportTransform[4] -= wheel.deltaX; board.viewportTransform[5] -= wheel.deltaY; board.setViewportTransform(board.viewportTransform); }
      syncState();
    });
    const keydown = (event: KeyboardEvent) => {
      if (!container.current?.contains(document.activeElement)) return;
      if ((event.target as HTMLElement).matches('input, textarea, [contenteditable="true"]')) return;
      if (event.code === 'Space') { event.preventDefault(); spacePressed = true; board.defaultCursor = 'grab'; }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); const selected = board.getActiveObjects(); board.discardActiveObject(); selected.forEach((object) => board.remove(object)); commit(); }
    };
    const keyup = (event: KeyboardEvent) => { if (event.code === 'Space') { spacePressed = false; configure(); } };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
    (async () => {
      try {
        await Promise.all([document.fonts.load('16px Inter'), document.fonts.load('16px "JetBrains Mono"')]);
        if (disposed) return;
        const initial = latest.current.initialData;
        if (initial) { await board.loadFromJSON(initial); if (disposed) return; if (initial.viewport) board.setViewportTransform(initial.viewport as [number, number, number, number, number, number]); }
        else if (latest.current.welcome) { addWelcomeScene(board); fit(); }
        if (disposed) return;
        loading.current = false; configure(); commit();
      } catch { if (!disposed) { loading.current = false; latest.current.onError('The whiteboard could not be restored. Your saved project is still available for export.'); syncState(); } }
    })();
    return () => { disposed = true; observer.disconnect(); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); canvas.current = null; void board.dispose(); };
  }, [options.projectId, commit, configure, fit, serialize, syncState]);
  useEffect(() => { configure(); }, [options.settings, configure]);
  const restore = useCallback(async (index: number) => {
    const board = canvas.current;
    if (!board || loading.current || index < 0 || index >= history.current.length) return;
    loading.current = true; syncState();
    try {
      const data = JSON.parse(history.current[index]) as WhiteboardData;
      await board.loadFromJSON(data);
      if (canvas.current !== board) return;
      if (data.viewport) board.setViewportTransform(data.viewport as [number, number, number, number, number, number]);
      historyIndex.current = index; latest.current.onChange(data);
    } catch { latest.current.onError('Could not restore that whiteboard action.'); }
    finally { loading.current = false; configure(); syncState(); }
  }, [configure, syncState]);
  const undo = useCallback(() => { void restore(historyIndex.current - 1); }, [restore]);
  const redo = useCallback(() => { void restore(historyIndex.current + 1); }, [restore]);
  const clear = useCallback(() => { const board = canvas.current; if (!board) return; board.discardActiveObject(); board.getObjects().forEach((object) => board.remove(object)); commit(); }, [commit]);
  const zoom = useCallback((delta: number) => { const board = canvas.current; if (!board) return; board.zoomToPoint(new Point(board.width / 2, board.height / 2), Math.max(0.1, Math.min(4, board.getZoom() + delta))); syncState(); const data = serialize(); if (data) latest.current.onChange(data); }, [serialize, syncState]);
  const deleteSelected = useCallback(() => { const board = canvas.current; if (!board) return; const objects = board.getActiveObjects(); board.discardActiveObject(); objects.forEach((object) => board.remove(object)); commit(); }, [commit]);
  const recolorSelected = useCallback((color: string) => {
    const board = canvas.current;
    if (!board) return;
    const apply = (object: FabricObject) => { if (object instanceof Group) object.getObjects().forEach(apply); else if (object instanceof IText) object.set('fill', color); else object.set('stroke', color); };
    board.getActiveObjects().forEach(apply); board.requestRenderAll(); commit();
  }, [commit]);
  const addSnippet = useCallback((selection: EditorSelection, annotationId?: string) => {
    const board = canvas.current;
    if (!board) return;
    const center = board.getVpCenter();
    const content = selection.text.trim() || '// Add your explanation here';
    const body = new Textbox(content, { left: center.x - 180, top: center.y + 30, width: 355, padding: 18, fontFamily: 'JetBrains Mono', fontSize: 15, fill: '#BDDACE', backgroundColor: '#20332E', lineHeight: 1.5, strokeWidth: 0 });
    const label = new Textbox(`${selection.fileName}  ·  line ${selection.line}`, { left: center.x - 180, top: center.y, width: 355, fontFamily: 'Inter', fontSize: 11, fill: '#67E8B0' });
    body.set({ id: annotationId ?? createId(), lineLink: { fileId: selection.fileId, line: selection.line } } as never);
    label.set({ id: createId(), lineLink: { fileId: selection.fileId, line: selection.line } } as never);
    board.add(label, body); configure(); commit();
  }, [commit, configure]);
  const exportImage = useCallback(() => {
    const board = canvas.current;
    if (!board) return;
    board.discardActiveObject();
    const before = board.backgroundColor;
    board.backgroundColor = '#171C24';
    const link = document.createElement('a'); link.download = 'codeboard-whiteboard.png'; link.href = board.toDataURL({ format: 'png', multiplier: 2 }); link.click();
    board.backgroundColor = before; board.requestRenderAll();
  }, []);
  return { canvasElement, container, state, undo, redo, clear, zoom, fit, addSnippet, exportImage, deleteSelected, recolorSelected };
}
