import type { ExecutionProvider, ExecutionRequest, ExecutionResult } from './types';
import type { LanguageId } from '../editor/languages';
import { createId } from '../utils/id';

const workerSource = `
const stringify = (value) => {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value instanceof Error) return value.name + ': ' + value.message;
  try {
    if (Array.isArray(value)) return '[' + value.map(item => JSON.stringify(item) ?? String(item)).join(', ') + ']';
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch { return String(value); }
};
self.onmessage = async ({data}) => {
  let output = '', size = 0;
  const print = (...args) => {
    const line = args.map(stringify).join(' ') + '\\n';
    size += line.length;
    if (size > 100000) throw new Error('Output exceeded the 100 KB limit.');
    output += line;
  };
  const console = { log: print, info: print, warn: print, error: print, debug: print, table: print, clear: () => { output = ''; }, assert: (condition, ...args) => { if (!condition) print('Assertion failed:', ...args); } };
  const start = performance.now();
  try {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    await new AsyncFunction('console', data.code)(console);
    self.postMessage({ status: 'success', stdout: output, stderr: '', durationMs: performance.now() - start });
  } catch(error) {
    self.postMessage({ status: error instanceof SyntaxError ? 'compilation-error' : 'runtime-error', stdout: output, stderr: error.name + ': ' + error.message, durationMs: performance.now() - start });
  }
};`;

// An opaque-origin iframe owns a disposable Worker. CSP denies network requests, the
// sandbox denies parent/storage access, and the Worker keeps infinite loops off the UI thread.
const sandboxDocument = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none';"><script>
const source = ${JSON.stringify(workerSource).replace(/</g, '\\u003c')};
let worker;
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.data.type !== 'execute') return;
  try {
    const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
    worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = ({data}) => parent.postMessage({type: 'result', result: data}, '*');
    worker.onerror = (event) => parent.postMessage({type: 'result', result: {status:'runtime-error', stdout:'', stderr:event.message || 'Sandbox worker failed.', durationMs:0}}, '*');
    worker.postMessage({code: event.data.code});
  } catch(error) { parent.postMessage({type:'result', result:{status:'runtime-error', stdout:'', stderr:error.message, durationMs:0}}, '*'); }
});
parent.postMessage({type:'ready'}, '*');
</script>`;

export class BrowserExecutionProvider implements ExecutionProvider {
  name = 'Browser sandbox';
  supports(language: LanguageId) { return ['javascript', 'typescript', 'json', 'html', 'css', 'markdown'].includes(language); }
  async execute(request: ExecutionRequest, signal?: AbortSignal): Promise<ExecutionResult> {
    const entry = request.files.find((file) => file.id === request.entryFileId);
    if (!entry) throw new Error('Select a file before running code.');
    const base = { id: createId(), timestamp: new Date().toISOString(), provider: this.name, durationMs: 0, stdout: '', stderr: '' };
    if (signal?.aborted) return { ...base, status: 'cancelled' };
    if (request.language === 'json') {
      try { return { ...base, status: 'success', stdout: JSON.stringify(JSON.parse(entry.content), null, 2) + '\n' }; }
      catch (error) { return { ...base, status: 'compilation-error', stderr: (error as Error).message }; }
    }
    if (request.language === 'markdown') return { ...base, status: 'success', preview: { type: 'markdown', content: entry.content } };
    if (request.language === 'html' || request.language === 'css') {
      const html = request.language === 'html' ? entry.content : request.files.find((file) => file.language === 'html')?.content ?? '<h1>Hello, CodeBoard!</h1><p>Edit your CSS to see it here.</p><button>A little button</button>';
      const css = request.files.filter((file) => file.language === 'css').map((file) => file.content).join('\n');
      return { ...base, status: 'success', preview: { type: 'html', content: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;"><style>${css.replace(/<\/style/gi, '')}</style>${html}` } };
    }
    let code = entry.content;
    if (request.language === 'typescript') {
      const ts = await import('typescript');
      const result = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }, reportDiagnostics: true });
      const errors = result.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error);
      if (errors?.length) return { ...base, status: 'compilation-error', stderr: errors.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n') };
      code = result.outputText;
    }
    if (signal?.aborted) return { ...base, status: 'cancelled' };
    return new Promise((resolve) => {
      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.display = 'none';
      frame.srcdoc = sandboxDocument;
      let done = false;
      const finish = (result: Partial<ExecutionResult>) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        window.removeEventListener('message', listener);
        signal?.removeEventListener('abort', cancel);
        frame.remove();
        resolve({ ...base, status: 'runtime-error', ...result });
      };
      const listener = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow) return;
        if (event.data?.type === 'ready') frame.contentWindow?.postMessage({ type: 'execute', code }, '*');
        if (event.data?.type === 'result') finish(event.data.result);
      };
      const cancel = () => finish({ status: 'cancelled', stderr: 'Execution stopped.' });
      const timeout = setTimeout(() => finish({ status: 'timeout', stderr: 'Execution exceeded the 5 second limit.', durationMs: 5000 }), 5000);
      window.addEventListener('message', listener);
      signal?.addEventListener('abort', cancel, { once: true });
      document.body.appendChild(frame);
    });
  }
}
