import Editor from '@monaco-editor/react';
import { useState } from 'react';

const CodeEditor = ({ 
  value, 
  onChange, 
  language = 'javascript',
  height = '400px',
  readOnly = false,
  theme = 'vs-dark'
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleEditorDidMount = () => {
    setIsLoading(false);
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-dark-300">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-200 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        options={editorOptions}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default CodeEditor;
