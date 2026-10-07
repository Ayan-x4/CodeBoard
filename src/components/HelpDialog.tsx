import { Code2, ExternalLink, Sparkles } from 'lucide-react';
import { Modal } from './Modal';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const shortcuts = [['Run code', 'Ctrl + Enter'], ['Save project', 'Ctrl + S'], ['Command palette', 'Ctrl + P'], ['Undo (focused panel)', 'Ctrl + Z'], ['Redo', 'Ctrl + Shift + Z'], ['Exit presentation', 'Escape'], ['Pan canvas', 'Hold Space + drag'], ['Zoom canvas', 'Ctrl + scroll'], ['Delete board selection', 'Delete'], ['Find / replace in code', 'Ctrl + F / Ctrl + H']];
  return <Modal title="Less friction. More explaining." subtitle="A few shortcuts to keep you in the flow." onClose={onClose} className="help-modal"><div className="shortcut-list">{shortcuts.map(([label, key]) => <div key={label}><span>{label}</span><kbd>{key}</kbd></div>)}</div><div className="help-teaching"><Sparkles size={19} /><div><strong>Make your code part of the conversation.</strong><p>Select code and click the explanation icon above the editor to add it to the whiteboard. Double-click its label to jump back. Click a line number to add a teaching marker.</p></div></div><div className="help-bottom"><span><Code2 size={16} />CodeBoard · Made for lightbulb moments.</span><a href="https://microsoft.github.io/monaco-editor/" target="_blank" rel="noreferrer">Editor docs<ExternalLink size={12} /></a></div></Modal>;
}
