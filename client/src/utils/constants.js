export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
  },
  ANALYSIS: {
    EXPLAIN: '/analysis/explain',
    LINE_BY_LINE: '/analysis/line-by-line',
    BUGS: '/analysis/bugs',
    FIX: '/analysis/fix',
    COMPLEXITY: '/analysis/complexity',
    IMPROVE: '/analysis/improve',
    FULL: '/analysis/full',
    UPLOAD: '/analysis/upload',
  },
  HISTORY: {
    LIST: '/history',
    STATS: '/history/stats',
    DETAIL: (id) => `/history/${id}`,
  },
};

export const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extensions: ['.js', '.jsx'] },
  { value: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx'] },
  { value: 'python', label: 'Python', extensions: ['.py'] },
  { value: 'java', label: 'Java', extensions: ['.java'] },
  { value: 'cpp', label: 'C++', extensions: ['.cpp', '.cc', '.cxx'] },
  { value: 'c', label: 'C', extensions: ['.c', '.h'] },
  { value: 'csharp', label: 'C#', extensions: ['.cs'] },
  { value: 'go', label: 'Go', extensions: ['.go'] },
  { value: 'rust', label: 'Rust', extensions: ['.rs'] },
  { value: 'php', label: 'PHP', extensions: ['.php'] },
  { value: 'ruby', label: 'Ruby', extensions: ['.rb'] },
  { value: 'swift', label: 'Swift', extensions: ['.swift'] },
  { value: 'kotlin', label: 'Kotlin', extensions: ['.kt'] },
  { value: 'scala', label: 'Scala', extensions: ['.scala'] },
  { value: 'html', label: 'HTML', extensions: ['.html', '.htm'] },
  { value: 'css', label: 'CSS', extensions: ['.css', '.scss', '.sass'] },
  { value: 'sql', label: 'SQL', extensions: ['.sql'] },
];

export const ANALYSIS_TYPES = {
  EXPLAIN: 'explain',
  LINE_BY_LINE: 'line-by-line',
  BUGS: 'bugs',
  FIX: 'fix',
  COMPLEXITY: 'complexity',
  IMPROVE: 'improve',
};

export const MAX_CODE_LENGTH = 100000;
export const MAX_FILE_SIZE = 1024 * 1024; // 1MB
