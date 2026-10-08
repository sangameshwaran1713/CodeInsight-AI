import Editor from '@monaco-editor/react';

const CodeEditor = ({ 
  value, 
  onChange, 
  language = 'javascript',
  height = '100%',
  readOnly = false,
  theme = 'vs-dark'
}) => {
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 13.5,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    lineDecorationsWidth: 12,
    glyphMargin: false,
    roundedSelection: true,
    scrollBeyondLastLine: false,
    readOnly,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
  };

  return (
    <div className="w-full h-full min-h-[420px] flex-1 relative bg-dark-950">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        options={editorOptions}
        loading={
          <div className="flex items-center justify-center h-full text-xs text-dark-400 font-mono">
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
