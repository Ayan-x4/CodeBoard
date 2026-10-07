import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/editor/editor.all';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/language/html/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution';
import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution';
import 'monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution';
import 'monaco-editor/esm/vs/basic-languages/swift/swift.contribution';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
import 'monaco-editor/esm/vs/basic-languages/shell/shell.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = { getWorker(_id, label) {
  if (label === 'json') return new JsonWorker();
  if (['css', 'scss', 'less'].includes(label)) return new CssWorker();
  if (['html', 'handlebars', 'razor'].includes(label)) return new HtmlWorker();
  if (['typescript', 'javascript'].includes(label)) return new TsWorker();
  return new EditorWorker();
} };
monaco.editor.defineTheme('codeboard', {
  base: 'vs-dark', inherit: true,
  rules: [
    { token: 'comment', foreground: '626C7D', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'CBA3E8' },
    { token: 'string', foreground: 'A7CB8B' },
    { token: 'number', foreground: 'E6B783' },
    { token: 'delimiter', foreground: 'AAB3C5' },
    { token: 'type.identifier', foreground: '76CAC0' },
  ],
  colors: {
    'editor.background': '#14181F', 'editor.foreground': '#CDD4DF',
    'editorLineNumber.foreground': '#495363', 'editorLineNumber.activeForeground': '#AAB5C5',
    'editor.lineHighlightBackground': '#1B212B', 'editor.selectionBackground': '#324F52',
    'editorCursor.foreground': '#67E8B0', 'editorIndentGuide.background1': '#232A35',
    'editorWidget.background': '#1A202A', 'editorWidget.border': '#303847',
    'editorGutter.background': '#14181F', 'scrollbarSlider.background': '#47526755',
    'editorOverviewRuler.border': '#14181F', 'editor.findMatchBackground': '#64874C80',
  },
});
monaco.languages.typescript.javascriptDefaults.setCompilerOptions({ allowNonTsExtensions: true, target: monaco.languages.typescript.ScriptTarget.ES2020, checkJs: false });
loader.config({ monaco });
export { monaco };
