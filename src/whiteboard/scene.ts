import { Canvas, Group, Line, Rect, Textbox, Triangle, FabricObject } from 'fabric';

FabricObject.customProperties = ['id', 'lineLink', 'note'];
FabricObject.ownDefaults = { ...FabricObject.ownDefaults, cornerColor: '#67e8b0', borderColor: '#67e8b0', cornerStrokeColor: '#14181f', cornerStyle: 'circle', transparentCorners: false, cornerSize: 9, padding: 5 };

const text = (value: string, x: number, y: number, options: Record<string, unknown> = {}) => new Textbox(value, { left: x, top: y, width: 630, fontFamily: 'Inter', fontSize: 17, fill: '#CBD3E0', ...options });
const box = (x: number, y: number, width: number, height: number, stroke: string, fill = '#1c242c') => new Rect({ left: x, top: y, width, height, rx: 9, ry: 9, stroke, strokeWidth: 1.6, fill });
export function createArrow(x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 90;
  return new Group([
    new Line([x1, y1, x2, y2], { stroke: color, strokeWidth: width, strokeLineCap: 'round' }),
    new Triangle({ left: x2, top: y2, originX: 'center', originY: 'center', width: 11 + width, height: 13 + width, fill: color, angle }),
  ], { objectCaching: false });
}

export function addWelcomeScene(canvas: Canvas) {
  canvas.add(text('LET’S MAKE IT CLICK', 64, 61, { fontSize: 11, charSpacing: 180, fill: '#6A7A8C', fontWeight: '600' }));
  canvas.add(text('A closer look at .filter()', 64, 91, { fontSize: 27, fill: '#E1E7EE', fontWeight: '600' }));
  canvas.add(text('One array in. A little condition. A new array out.', 65, 134, { fontSize: 14, fill: '#8492A6' }));
  canvas.add(text('scores', 65, 197, { fontFamily: 'JetBrains Mono', fontSize: 15, fill: '#B6C1D0' }));
  [72, 85, 91, 64, 98].forEach((value, index) => {
    const pass = value >= 80;
    const x = 65 + index * 107;
    canvas.add(new Group([box(0, 0, 89, 66, pass ? '#67C9A3' : '#4A5668', pass ? '#1A302B' : '#1D232D'), text(String(value), 0, 18, { width: 89, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 23, fill: pass ? '#8FE6BF' : '#B1BAC9' })], { left: x, top: 228 }));
    canvas.add(text(`[${index}]`, x, 305, { width: 89, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#66758A' }));
  });
  canvas.add(createArrow(313, 339, 313, 377, '#768A9A'));
  canvas.add(new Group([box(0, 0, 252, 48, '#739ECC', '#202B3A'), text('score >= 80', 0, 13, { width: 252, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 17, fill: '#A8C6F0' })], { left: 190, top: 389 }));
  canvas.add(text('keep it if it’s true', 452, 403, { fontSize: 12, width: 150, fill: '#92A1B6', angle: -3 }));
  canvas.add(createArrow(313, 451, 313, 488, '#67C9A3'));
  canvas.add(text('topScores', 65, 508, { fontFamily: 'JetBrains Mono', fontSize: 15, fill: '#B6C1D0' }));
  [85, 91, 98].forEach((value, index) => {
    canvas.add(new Group([box(0, 0, 89, 62, '#67C9A3', '#1A302B'), text(String(value), 0, 17, { width: 89, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 23, fill: '#8FE6BF' })], { left: 65 + index * 107, top: 542 }));
  });
  canvas.add(new Group([
    new Rect({ left: 0, top: 0, width: 209, height: 104, fill: '#343022', stroke: '#6A5D35', strokeWidth: 1, rx: 5, ry: 5 }),
    text('A new array', 15, 14, { width: 180, fontSize: 14, fontWeight: '600', fill: '#E4C77E' }),
    text('The original scores\nstay exactly the same.', 15, 41, { width: 180, fontSize: 12, lineHeight: 1.45, fill: '#B9AB86' }),
  ], { left: 408, top: 525, angle: -3, subTargetCheck: true, interactive: true }));
}
