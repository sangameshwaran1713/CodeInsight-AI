module.exports = {
  // Supported programming languages
  SUPPORTED_LANGUAGES: [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
    'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    'scala', 'html', 'css', 'sql',
  ],

  // Analysis types
  ANALYSIS_TYPES: [
    'explain', 'line-by-line', 'bugs', 'fix', 'complexity', 'improve',
  ],

  // User roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },

  // Analysis status
  ANALYSIS_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },

  // Rate limit defaults
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },

  // File upload limits
  FILE_UPLOAD: {
    MAX_SIZE: 1024 * 1024, // 1MB
    ALLOWED_EXTENSIONS: [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c',
      '.cs', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala',
      '.html', '.css', '.sql', '.txt',
    ],
  },

  // Extension to language mapping
  EXTENSION_TO_LANGUAGE: {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    sql: 'sql',
  },
};
