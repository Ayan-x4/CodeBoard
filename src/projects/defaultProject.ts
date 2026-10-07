import { createId } from '../utils/id';
import { getLanguage, mainFilename, type LanguageId } from '../editor/languages';
import type { Project } from './types';

const lesson = `// A little code. A bigger picture.\n// Let's explore how Array.filter() works.\n\nconst scores = [72, 85, 91, 64, 98];\n\n// Keep only the scores that are 80 or higher.\nfunction getTopScores(scores) {\n  return scores.filter((score) => score >= 80);\n}\n\nconst topScores = getTopScores(scores);\n\nconsole.log("All scores:", scores);\nconsole.log("Top scores:", topScores);\nconsole.log(\`\${topScores.length} students scored 80 or above!\`);\n`;

export function createProject(name = 'Untitled project', language: LanguageId = 'javascript'): Project {
  const fileId = createId();
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, id: createId(), name, language,
    files: [{ id: fileId, name: mainFilename(language), language, content: getLanguage(language).sample }],
    activeFileId: fileId, whiteboard: null, annotations: [], notes: '', outputHistory: [], createdAt: now, updatedAt: now,
  };
}

export function createWelcomeProject(): Project {
  const project = createProject('Understanding arrays');
  project.files[0].name = 'arrays.js';
  project.files[0].content = lesson;
  project.files.push({ id: createId(), name: 'notes.md', language: 'markdown', content: '# Understanding arrays\n\n**Learning goal:** understand how `filter` creates a new array.\n\n1. Start with five scores.\n2. Test each score against `score >= 80`.\n3. Keep the scores that pass.\n\nThe original array stays unchanged.\n' });
  project.notes = 'Ask students: what happens if the threshold changes to 90?';
  return project;
}
