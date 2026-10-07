export const languages = [
  { id: 'javascript', label: 'JavaScript', extension: 'js', badge: 'JS', color: '#e5c76b', runnable: true, sample: 'const message = "Hello, CodeBoard!";\nconsole.log(message);\n' },
  { id: 'typescript', label: 'TypeScript', extension: 'ts', badge: 'TS', color: '#75b4f1', runnable: true, sample: 'const message: string = "Hello, CodeBoard!";\nconsole.log(message);\n' },
  { id: 'python', label: 'Python', extension: 'py', badge: 'Py', color: '#e5c76b', runnable: true, sample: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("CodeBoard"))\n' },
  { id: 'java', label: 'Java', extension: 'java', badge: 'J', color: '#e89c77', runnable: true, sample: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodeBoard!");\n    }\n}\n' },
  { id: 'c', label: 'C', extension: 'c', badge: 'C', color: '#98b5d6', runnable: true, sample: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, CodeBoard!\\n");\n    return 0;\n}\n' },
  { id: 'cpp', label: 'C++', extension: 'cpp', badge: 'C+', color: '#82a7e9', runnable: true, sample: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodeBoard!" << std::endl;\n    return 0;\n}\n' },
  { id: 'csharp', label: 'C#', extension: 'cs', badge: 'C#', color: '#bba0e8', runnable: true, sample: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, CodeBoard!");\n    }\n}\n' },
  { id: 'go', label: 'Go', extension: 'go', badge: 'Go', color: '#7ccdd6', runnable: true, sample: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, CodeBoard!")\n}\n' },
  { id: 'rust', label: 'Rust', extension: 'rs', badge: 'Rs', color: '#d8a080', runnable: true, sample: 'fn main() {\n    println!("Hello, CodeBoard!");\n}\n' },
  { id: 'php', label: 'PHP', extension: 'php', badge: 'PHP', color: '#a4a6df', runnable: true, sample: '<?php\necho "Hello, CodeBoard!\\n";\n' },
  { id: 'ruby', label: 'Ruby', extension: 'rb', badge: 'Rb', color: '#ed8e95', runnable: true, sample: 'def greet(name)\n  "Hello, #{name}!"\nend\n\nputs greet("CodeBoard")\n' },
  { id: 'kotlin', label: 'Kotlin', extension: 'kt', badge: 'Kt', color: '#c897e9', runnable: true, sample: 'fun main() {\n    println("Hello, CodeBoard!")\n}\n' },
  { id: 'swift', label: 'Swift', extension: 'swift', badge: 'Sw', color: '#edac88', runnable: true, sample: 'let message = "Hello, CodeBoard!"\nprint(message)\n' },
  { id: 'html', label: 'HTML', extension: 'html', badge: '<>', color: '#e9a17b', runnable: false, sample: '<!doctype html>\n<html lang="en">\n  <head><title>CodeBoard</title></head>\n  <body>\n    <h1>Hello, CodeBoard!</h1>\n    <p>Your ideas, brought to life.</p>\n  </body>\n</html>\n' },
  { id: 'css', label: 'CSS', extension: 'css', badge: '#', color: '#9eabec', runnable: false, sample: 'body {\n  font-family: system-ui, sans-serif;\n  background: #101319;\n  color: #67e8b0;\n  padding: 2rem;\n}\n' },
  { id: 'sql', label: 'SQL', extension: 'sql', badge: 'SQL', color: '#d6bb78', runnable: true, sample: 'CREATE TABLE scores (name TEXT, score INTEGER);\nINSERT INTO scores VALUES (\'Alex\', 92), (\'Sam\', 85);\nSELECT * FROM scores WHERE score >= 90;\n' },
  { id: 'shell', label: 'Bash', extension: 'sh', badge: '$', color: '#a5cb93', runnable: true, sample: '#!/usr/bin/env bash\nname="CodeBoard"\necho "Hello, $name!"\n' },
  { id: 'json', label: 'JSON', extension: 'json', badge: '{}', color: '#ddc984', runnable: false, sample: '{\n  "name": "CodeBoard",\n  "idea": "Code. Draw. Explain.",\n  "ready": true\n}\n' },
  { id: 'markdown', label: 'Markdown', extension: 'md', badge: 'M↓', color: '#a8b4c5', runnable: false, sample: '# Lesson notes\n\n## What we will learn\n\n- Write some code\n- Draw the big picture\n- Make something click\n' },
] as const;

export type LanguageId = typeof languages[number]['id'];
export const getLanguage = (id: string) => languages.find((language) => language.id === id) ?? languages[0];
export const inferLanguage = (filename: string): LanguageId => languages.find((language) => filename.endsWith(`.${language.extension}`))?.id ?? 'javascript';
export const mainFilename = (language: LanguageId) => language === 'java' ? 'Main.java' : `main.${getLanguage(language).extension}`;
