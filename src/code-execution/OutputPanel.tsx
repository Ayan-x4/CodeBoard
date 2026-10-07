import { useState } from 'react';
import { Terminal, Trash2, ChevronDown, CheckCircle2, CircleAlert, Loader2, Clock3, Maximize2, Minimize2, SquareTerminal, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ExecutionResult } from './types';
import { IconButton } from '../components/IconButton';

export function OutputPanel({ history, running, stdin, onStdinChange, onClear, onMaximize, maximized, fileName, onCopy }: { history: ExecutionResult[]; running: boolean; stdin: string; onStdinChange: (value: string) => void; onClear: () => void; onMaximize: () => void; maximized: boolean; fileName: string; onCopy: (text: string) => void }) {
  const [tab, setTab] = useState<'output' | 'input'>('output');
  const [selectedId, setSelectedId] = useState('');
  const result = history.find((item) => item.id === selectedId) ?? history[0];
  return <section className="panel output-panel" aria-label="Output console">
    <header className="panel-heading"><div className="output-tabs"><button className={tab === 'output' ? 'selected' : ''} onClick={() => setTab('output')}><Terminal size={15} />Output {history.length > 0 && <span className="output-count">{history.length}</span>}</button><button className={tab === 'input' ? 'selected' : ''} onClick={() => setTab('input')}>Input <span className="stdin-label">stdin</span></button></div><div className="panel-actions">
      {history.length > 1 && <select className="history-select" aria-label="Execution history" value={result?.id} onChange={(event) => setSelectedId(event.target.value)}>{history.map((item, index) => <option key={item.id} value={item.id}>{index === 0 ? 'Latest run' : new Date(item.timestamp).toLocaleTimeString()}</option>)}</select>}
      {result && <IconButton label="Copy output" onClick={() => onCopy([result.stdout, result.compileOutput, result.stderr].filter(Boolean).join('\n'))}><Copy size={14} /></IconButton>}
      <IconButton label="Clear output history" onClick={onClear}><Trash2 size={14} /></IconButton><IconButton label={maximized ? 'Restore output panel' : 'Maximize output panel'} onClick={onMaximize}>{maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</IconButton></div></header>
    {tab === 'input' ? <div className="input-panel"><label htmlFor="stdin">Program input <span>Passed to the remote sandbox as stdin</span></label><textarea id="stdin" spellCheck={false} value={stdin} onChange={(event) => onStdinChange(event.target.value)} placeholder="Enter input for your program…" /></div> : <>
      <div className={`output-content ${result?.preview ? 'has-preview' : ''}`} aria-live="polite" aria-busy={running}>
        {running ? <div className="output-empty running"><Loader2 className="spin" size={23} /><div><strong>Bringing your code to life…</strong><span>Running {fileName} in an isolated sandbox</span></div></div> : result ? <>
          {!result.preview && <div className="terminal-command"><span>❯</span> {result.provider === 'Browser sandbox' ? 'run' : 'sandbox'} {result.fileName ?? fileName}</div>}
          {result.stdout && <pre className="stdout">{result.stdout}</pre>}
          {result.compileOutput && <pre className="stderr">{result.compileOutput}</pre>}
          {result.stderr && <pre className={`stderr ${result.status === 'unavailable' ? 'provider-info' : ''}`}>{result.stderr}</pre>}
          {!result.stdout && !result.stderr && !result.compileOutput && !result.preview && <p className="muted mono">Program finished with no output.</p>}
          {result.preview?.type === 'html' && <iframe className="html-preview" title="HTML and CSS preview" sandbox="" srcDoc={result.preview.content} />}
          {result.preview?.type === 'markdown' && <article className="markdown-preview"><ReactMarkdown>{result.preview.content}</ReactMarkdown></article>}
        </> : <div className="output-empty"><div className="terminal-empty-icon"><SquareTerminal size={22} /></div><div><strong>Great ideas start with a run.</strong><span>Your output will appear here. <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run.</span></div></div>}
      </div>
      <footer className="output-status">{running ? <span className="run-status"><span className="status-dot pulsing" /> Running</span> : result ? <span className={`run-status ${result.status === 'success' ? 'success' : 'error'}`}>{result.status === 'success' ? <CheckCircle2 size={12} /> : <CircleAlert size={12} />}{({ success: 'Completed successfully', 'compilation-error': 'Compilation error', 'runtime-error': 'Runtime error', timeout: 'Time limit exceeded', unavailable: 'Provider required', cancelled: 'Stopped' })[result.status]}</span> : <span className="muted"><span className="status-dot" /> Ready to run</span>}<div>{result && <span><Clock3 size={11} />{result.durationMs < 1000 ? `${Math.max(1, Math.round(result.durationMs))} ms` : `${(result.durationMs / 1000).toFixed(2)} s`}</span>}<span>{result?.provider ?? 'Isolated execution'}<ChevronDown size={10} /></span></div></footer>
    </>}
  </section>;
}
