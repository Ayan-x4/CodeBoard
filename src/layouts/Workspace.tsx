import type { ReactNode } from 'react';
import { SplitPane } from './SplitPane';
import type { WorkspaceLayout } from '../components/WorkspaceToolbar';

export type WorkspacePanel = 'code' | 'output' | 'board';
export function Workspace({ code, output, board, layout, swapped, showOutput, showBoard, maximized, mobile, mobilePanel }: { code: ReactNode; output: ReactNode; board: ReactNode; layout: WorkspaceLayout; swapped: boolean; showOutput: boolean; showBoard: boolean; maximized: WorkspacePanel | null; mobile: boolean; mobilePanel: WorkspacePanel }) {
  if (mobile) return <div className="workspace-content single-panel">{mobilePanel === 'code' ? code : mobilePanel === 'output' ? output : board}</div>;
  if (maximized) return <div className="workspace-content single-panel">{maximized === 'code' ? code : maximized === 'output' ? output : board}</div>;
  const codeAndOutput = showOutput ? <SplitPane key="editor-output" direction="vertical" initial={70} min={16} first={code} second={output} /> : code;
  if (!showBoard) return <div className="workspace-content single-panel">{codeAndOutput}</div>;
  if (layout === 'studio') return <div className="workspace-content"><SplitPane direction="vertical" initial={49} min={23} first={swapped ? board : <SplitPane initial={62} first={code} second={output} />} second={swapped ? <SplitPane initial={62} first={code} second={output} /> : board} /></div>;
  return <div className="workspace-content"><SplitPane key={layout} direction={layout === 'stacked' ? 'vertical' : 'horizontal'} initial={layout === 'stacked' ? 48 : 48} min={26} first={swapped ? board : codeAndOutput} second={swapped ? codeAndOutput : board} /></div>;
}
