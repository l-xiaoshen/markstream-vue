const LANGUAGE_ALIAS_MAP: Record<string, string> = {
  '': '',
  'cjs': 'javascript',
  'cts': 'typescript',
  'c++': 'cpp',
  'c#': 'csharp',
  'd2lang': 'd2',
  'golang': 'go',
  'js': 'javascript',
  'jsonc': 'json',
  'jsx': 'jsx',
  'kt': 'kotlin',
  'md': 'markdown',
  'mjs': 'javascript',
  'objective-c': 'objectivec',
  'objective-c++': 'objectivecpp',
  'plaintext': 'plain',
  'rb': 'ruby',
  'rs': 'rust',
  'py': 'python',
  'bash': 'shell',
  'bat': 'shell',
  'batch': 'shell',
  'ps1': 'powershell',
  'sh': 'shell',
  'shellscript': 'shell',
  'text': 'plain',
  'ts': 'typescript',
  'tsx': 'tsx',
  'txt': 'plain',
  'yml': 'yaml',
  'zsh': 'shell',
}

const LANGUAGE_LABEL_MAP: Record<string, string> = {
  '': 'Text',
  'css': 'CSS',
  'c': 'C',
  'cpp': 'C++',
  'csharp': 'C#',
  'd2': 'D2',
  'go': 'Go',
  'html': 'HTML',
  'java': 'Java',
  'javascript': 'JavaScript',
  'json': 'JSON',
  'jsx': 'JSX',
  'markdown': 'Markdown',
  'mermaid': 'Mermaid',
  'php': 'PHP',
  'plain': 'Text',
  'plaintext': 'Text',
  'python': 'Python',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'shell': 'Shell',
  'sql': 'SQL',
  'svg': 'SVG',
  'tsx': 'TSX',
  'typescript': 'TypeScript',
  'vue': 'Vue',
  'yaml': 'YAML',
}

const LANGUAGE_PREFIX_CANDIDATES = Array.from(new Set([
  ...Object.keys(LANGUAGE_ALIAS_MAP),
  ...Object.keys(LANGUAGE_LABEL_MAP),
  'bash',
  'c',
  'cpp',
  'csharp',
  'diff',
  'go',
  'java',
  'php',
  'ruby',
  'rust',
  'sql',
  'yaml',
  'zsh',
]))

function extractLanguageToken(lang?: string | null) {
  if (!lang)
    return ''
  const trimmed = lang.trim()
  if (!trimmed)
    return ''
  const firstToken = trimmed.split(/\s+/, 1)[0] ?? ''
  const base = firstToken.split(':', 1)[0] ?? ''
  return base.toLowerCase()
}

export function normalizeLanguageIdentifier(lang?: string | null): string {
  const token = extractLanguageToken(lang)
  return LANGUAGE_ALIAS_MAP[token] ?? token
}

export function resolveMonacoLanguageId(lang?: string | null): string {
  const canonical = normalizeLanguageIdentifier(lang)
  if (!canonical)
    return 'plaintext'
  if (canonical === 'plain')
    return 'plaintext'
  if (canonical === 'jsx')
    return 'javascript'
  if (canonical === 'tsx')
    return 'typescript'
  return canonical
}

export function isLikelyIncompleteLanguageIdentifier(lang?: string | null): boolean {
  const token = extractLanguageToken(lang)
  if (!token)
    return false
  if (LANGUAGE_PREFIX_CANDIDATES.includes(token))
    return false
  return LANGUAGE_PREFIX_CANDIDATES.some(candidate => candidate.startsWith(token))
}

export const languageMap = LANGUAGE_LABEL_MAP
