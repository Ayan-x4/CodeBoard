import { ArrowUpRight, Circle, Diamond, Eraser, Hand, Highlighter, Minus, MousePointer2, Pencil, PenLine, RectangleHorizontal, StickyNote, Type } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import type { BoardTool } from './types';

export const toolItems = [
  { id: 'select', label: 'Selection', shortcut: 'V', icon: MousePointer2 },
  { id: 'hand', label: 'Hand / pan', shortcut: 'H', icon: Hand },
  { id: 'pen', label: 'Pen / freehand', shortcut: 'P', icon: PenLine },
  { id: 'pencil', label: 'Pencil', shortcut: 'D', icon: Pencil },
  { id: 'highlighter', label: 'Highlighter', shortcut: 'M', icon: Highlighter },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: RectangleHorizontal },
  { id: 'circle', label: 'Circle / ellipse', shortcut: 'O', icon: Circle },
  { id: 'diamond', label: 'Diamond', shortcut: 'Q', icon: Diamond },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: ArrowUpRight },
  { id: 'line', label: 'Line', shortcut: 'L', icon: Minus },
  { id: 'text', label: 'Text', shortcut: 'T', icon: Type },
  { id: 'sticky', label: 'Sticky note', shortcut: 'N', icon: StickyNote },
] as const;

export function BoardToolbar({ tool, onChange }: { tool: BoardTool; onChange: (tool: BoardTool) => void }) {
  return <div className="board-toolbar" role="toolbar" aria-label="Whiteboard drawing tools">{toolItems.map((item, index) => <div key={item.id} className={index === 2 || index === 6 || index === 11 ? 'tool-group-start' : ''}><IconButton label={`${item.label} (${item.shortcut})`} active={tool === item.id} onClick={() => onChange(item.id)}><item.icon size={18} strokeWidth={1.7} /><span className="tool-shortcut">{item.shortcut.toLowerCase()}</span></IconButton></div>)}</div>;
}
