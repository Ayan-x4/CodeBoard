import { useRef, useState, type ReactNode } from 'react';

export function SplitPane({ first, second, direction = 'horizontal', initial = 48, min = 22, className = '' }: { first: ReactNode; second: ReactNode; direction?: 'horizontal' | 'vertical'; initial?: number; min?: number; className?: string }) {
  const [ratio, setRatio] = useState(initial);
  const container = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const resize = (event: React.PointerEvent) => {
    if (!dragging || !container.current) return;
    const rect = container.current.getBoundingClientRect();
    const value = direction === 'horizontal' ? (event.clientX - rect.left) / rect.width * 100 : (event.clientY - rect.top) / rect.height * 100;
    setRatio(Math.max(min, Math.min(100 - min, value)));
  };
  return <div ref={container} className={`split-pane ${direction} ${dragging ? 'resizing' : ''} ${className}`}>
    <div className="split-child" style={{ flexBasis: `${ratio}%` }}>{first}</div>
    <div className="split-divider" role="separator" tabIndex={0} aria-label={`Resize ${direction === 'horizontal' ? 'columns' : 'rows'}`} aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'} aria-valuenow={Math.round(ratio)} aria-valuemin={min} aria-valuemax={100 - min}
      onPointerDown={(event) => { setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={resize} onPointerUp={() => setDragging(false)} onLostPointerCapture={() => setDragging(false)}
      onDoubleClick={() => setRatio(initial)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); setRatio((value) => Math.max(min, Math.min(100 - min, value + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -2 : 2)))); } }}><span /></div>
    <div className="split-child" style={{ flexBasis: `${100 - ratio}%` }}>{second}</div>
  </div>;
}
