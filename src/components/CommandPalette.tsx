import { useMemo, useState } from 'react';
import { ArrowUp, Command, CornerDownLeft, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Modal } from './Modal';

export interface CommandAction { id: string; label: string; group: string; shortcut?: string; icon: LucideIcon; action: () => void }
export function CommandPalette({ commands, onClose }: { commands: CommandAction[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => commands.filter((command) => `${command.label} ${command.group}`.toLowerCase().includes(query.toLowerCase())), [commands, query]);
  const execute = (command: CommandAction) => { onClose(); command.action(); };
  return <Modal title="Command palette" onClose={onClose} className="command-modal"><div className="command-input"><Search size={20} /><input autoFocus aria-label="Search commands" placeholder="What would you like to do?" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => Math.min(index + 1, results.length - 1)); } if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); } if (event.key === 'Enter') { event.preventDefault(); if (results[active]) execute(results[active]); } }} /><kbd>esc</kbd></div><div className="command-results" role="listbox" aria-label="Available commands">{results.map((command, index) => <button key={command.id} role="option" aria-selected={index === active} className={index === active ? 'selected' : ''} onMouseEnter={() => setActive(index)} onClick={() => execute(command)}><command.icon size={17} /><span>{command.label}<small>{command.group}</small></span>{command.shortcut ? <kbd>{command.shortcut}</kbd> : index === active ? <CornerDownLeft size={15} /> : null}</button>)}{!results.length && <div className="command-empty"><Command size={26} /><p>No commands found for “{query}”.</p></div>}</div><footer className="command-footer"><span><ArrowUp size={12} />↓ to navigate</span><span><CornerDownLeft size={12} />to select</span><span><kbd>esc</kbd> to close</span></footer></Modal>;
}
