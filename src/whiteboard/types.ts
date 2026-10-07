import type { EditorSelection } from '../editor/CodeEditor';

export type BoardTool = 'select' | 'hand' | 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'text' | 'sticky' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'diamond';
export interface BoardSettings { tool: BoardTool; color: string; brushSize: number; textSize: number }
export interface WhiteboardHandle {
  undo(): void; redo(): void; clear(): void;
  addSnippet(selection: EditorSelection, annotationId?: string): void;
  exportImage(): void;
}
export const boardColors = ['#E2E8F0', '#67E8B0', '#91ADFA', '#C9A0F1', '#F3B978', '#F18EAB'];
