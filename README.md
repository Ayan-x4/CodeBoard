# CodeBoard

**Your code. Your canvas. One thinking space.**

A dark-first coding and visual teaching workspace built with React, TypeScript, Vite, Monaco Editor, Fabric.js, Tailwind CSS, and Lucide. The first workspace includes an editable Array.filter lesson to help you get started.

## Run locally

Use **Node.js 22.12 or newer**. Open a terminal in this folder:

```bash
npm install
npm run dev
```

Open **http://localhost:5173** (use the URL printed by Vite if that port is busy). No database, account, or backend is needed for local projects and browser execution.

To build and preview the production version:

```bash
npm run build
npm run preview
```

## What's included

- **Monaco editor** with 19 language modes, file tabs, completions, diagnostics where Monaco supports them, find/replace, folding, and line numbers. Double-click a tab to rename a file.
- **Execution console** with standard output, compilation/runtime errors, elapsed time, cancellation, stdin for remote providers, and the last 20 results.
- **Editable whiteboard** with select/move/resize/rotate, hand/pan, pen, pencil, highlighter, object eraser, text, sticky notes, lines, arrows, rectangles, ellipses, and diamonds. Undo/redo, custom colors, stroke width, text size, zoom, fit-to-content, and PNG export.
- **Three resizable layouts**: side-by-side, stacked, and studio (code/output above the board). Keyboard-accessible dividers; double-click a divider to reset its position. Swap and maximize controls.
- **Coding, teaching, and presentation modes**, plus browser fullscreen. Presentation hides navigation and uses larger code.
- **Local projects**: create, save/autosave, open, rename, delete, import, and export. Exports include files, editable Fabric object data, annotations, notes, and output history. Data is versioned and validated on import.
- **Teaching interactions**: click a line number to toggle a marker; select code and click the explanation icon to copy a formatted snippet onto the board. Double-click the snippet's label to navigate back to the source line.
- **Command palette** and context-aware shortcuts. Mobile switches between code, output, and whiteboard rather than squeezing three panels onto the screen.

## Code execution

### Works immediately

JavaScript and TypeScript run in a disposable **Web Worker inside an opaque-origin sandboxed iframe**. A restrictive CSP blocks network access. The worker has no access to the application DOM or storage, and a five-second watchdog stops runaway execution. TypeScript is transpiled on demand. The browser runner executes the **active file**, with `console.log/info/warn/error/table/assert` capture. Module imports and Node.js APIs need a suitable remote provider.

JSON runs as validation/formatting. HTML and CSS use a script-free sandboxed preview; CSS files are combined with the project's HTML file. Markdown uses a safe rendered preview.

### Run Python, Java, C/C++, and other languages

The optional Express API forwards source to a **trusted Judge0-compatible execution sandbox**; it never evaluates code or launches user programs in Node.js.

1. Copy `.env.example` to `.env`.
2. Configure:

```dotenv
VITE_EXECUTION_API_URL=/api
JUDGE0_URL=https://your-judge0-host.example
JUDGE0_AUTH_TOKEN=your-provider-token
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

3. In one terminal, run `npm run server`.
4. In another terminal, run `npm run dev`. Restart Vite after changing `.env`.

Vite proxies `/api` to the API on port 3001. For a deployed frontend, point `VITE_EXECUTION_API_URL` at the deployed API's `/api` URL (this setting is baked in at build time), or configure a reverse proxy. Keep `JUDGE0_AUTH_TOKEN` on the server; it is never exposed to the client. `GET /api/health` reports whether execution is configured.

The adapter supports JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift, Bash, and SQL using standard Judge0 language IDs. Check your provider's `/languages` endpoint if it uses different IDs. The initial Judge0 adapter submits **only the active file**; the provider contract already includes every project file for future multi-file build adapters. CPU, wall-time, memory, network, output-size, request-size, and request-rate limits are applied.

Without an external provider, these languages remain fully editable and the output panel explains how to configure execution.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl / Cmd + Enter | Run active file |
| Ctrl / Cmd + S | Save project |
| Ctrl / Cmd + P | Open command palette |
| Ctrl / Cmd + Z | Undo in the focused editor or whiteboard |
| Ctrl / Cmd + Shift + Z | Redo in the focused editor or whiteboard |
| Escape | Exit presentation mode |
| Space + drag | Pan the focused canvas |
| Ctrl / Cmd + scroll | Zoom canvas |
| Delete / Backspace | Remove selected board objects |
| V, H, P, D, M, E, R, O, Q, A, L, T, N | Select a board tool while the canvas is focused |

The board does not intercept typing or undo in Monaco or text inputs.

## Architecture

```text
src/
  components/      Header, navigation, dialogs, command palette, accessible controls
  layouts/         Resizable split panes and responsive workspace
  editor/          Monaco setup, language catalog, editor and teaching selections
  whiteboard/      Fabric controller, structured scene, tools, and persistence
  code-execution/  Provider contracts, browser/remote providers, console
  projects/        Versioned project model, validation, local repository, dialogs
  store/           Project state and debounced persistence
  services/        Authentication and collaboration integration contracts
  hooks/           Toasts and responsive behavior
  utils/           Shared utilities
server/            Express API and Judge0 adapter
tests/             Persistence, execution, API, and browser integration tests
```

`ProjectRepository` is the boundary for a future authenticated MongoDB/cloud repository. `AuthProvider` describes email/password and Google authentication. `CollaborationProvider` defines presence and file/board/annotation operations for future WebSocket/Yjs adapters. Accounts, cloud storage, classrooms, and multiplayer are future integration points.

## Checks

```bash
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
```

Browser tests build and serve the production app and exercise actual execution, whiteboard undo/persistence, project/file creation, commands, presentation, and mobile panels. Local projects are specific to your browser and origin; export a `.codeboard.json` file to move one to another browser or machine.
