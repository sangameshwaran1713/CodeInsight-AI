/**
 * Live Code Playground - Interactive code editor with real-time execution
 * Features: Run code, Find bugs, Get fixes, Code explanation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import playgroundService from '../services/playgroundService';

// Language configurations
const LANGUAGES = {
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    defaultCode: `# Python 3 - Write your code here
# Try the "Find Bugs" button to detect issues!

def calculate_average(numbers):
    """Calculate the average of a list of numbers"""
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)  # Bug: Division by zero if list is empty!

def find_max(numbers):
    """Find the maximum value in a list"""
    max_val = numbers[0]  # Bug: IndexError if list is empty!
    for num in numbers:
        if num > max_val:
            max_val = num
    return max_val

# Test the functions
numbers = [10, 20, 30, 40, 50]
print(f"Numbers: {numbers}")
print(f"Average: {calculate_average(numbers)}")
print(f"Maximum: {find_max(numbers)}")

# Try with empty list - this will cause errors!
# empty = []
# print(calculate_average(empty))
`,
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    defaultCode: `// JavaScript (Node.js) - Write your code here
// Try the "Find Bugs" button to detect issues!

function calculateAverage(numbers) {
  let total = 0;
  for (let i = 0; i <= numbers.length; i++) {  // Bug: Off-by-one error!
    total += numbers[i];
  }
  return total / numbers.length;
}

function findMax(numbers) {
  let max = numbers[0];
  for (const num of numbers) {
    if (num > max) {
      max = num;
    }
  }
  return max;  // Bug: Returns undefined for empty array
}

// Test the functions
const numbers = [10, 20, 30, 40, 50];
console.log("Numbers:", numbers);
console.log("Average:", calculateAverage(numbers));
console.log("Maximum:", findMax(numbers));
`,
  },
};

// Output tab types
const TABS = {
  OUTPUT: 'output',
  BUGS: 'bugs',
  FIX: 'fix',
  EXPLAIN: 'explain',
  ANTIGRAVITY: 'antigravity',
};

const LiveCodeEditor = () => {
  // State
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES.python.defaultCode);
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState(TABS.OUTPUT);
  
  // Output states
  const [output, setOutput] = useState('');
  const [bugsAnalysis, setBugsAnalysis] = useState(null);
  const [fixSuggestion, setFixSuggestion] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [antiGravityAnalysis, setAntiGravityAnalysis] = useState(null);
  
  // AI Provider state
  const [aiProvider, setAiProvider] = useState('ollama');
  const [isProviderSwitching, setIsProviderSwitching] = useState(false);
  
  // Loading states
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzingBugs, setIsAnalyzingBugs] = useState(false);
  const [isGettingFix, setIsGettingFix] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isAnalyzingAntiGravity, setIsAnalyzingAntiGravity] = useState(false);
  
  const [executionTime, setExecutionTime] = useState(null);
  const [sandboxStatus, setSandboxStatus] = useState('checking');
  const [showStdin, setShowStdin] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const outputRef = useRef(null);

  // Check sandbox health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await playgroundService.checkSandboxHealth();
        // Use 'available' which is always true since we have simple execution fallback
        setSandboxStatus(status.available ? 'available' : 'unavailable');
      } catch {
        // Even on error, simple execution should work
        setSandboxStatus('available');
      }
    };
    checkHealth();
  }, []);

  // Fetch AI provider on mount
  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const data = await playgroundService.getAIProvider();
        setAiProvider(data.provider);
      } catch {
        // Default to ollama on error
        setAiProvider('ollama');
      }
    };
    fetchProvider();
  }, []);

  // Toggle AI provider
  const handleProviderToggle = useCallback(async () => {
    const newProvider = aiProvider === 'ollama' ? 'openai' : 'ollama';
    setIsProviderSwitching(true);
    try {
      await playgroundService.setAIProvider(newProvider);
      setAiProvider(newProvider);
    } catch (error) {
      console.error('Failed to switch provider:', error);
    } finally {
      setIsProviderSwitching(false);
    }
  }, [aiProvider]);

  // Handle language change
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    setCode(LANGUAGES[newLang].defaultCode);
    clearAllResults();
  }, []);

  // Clear all results
  const clearAllResults = useCallback(() => {
    setOutput('');
    setBugsAnalysis(null);
    setFixSuggestion(null);
    setExplanation(null);
    setAntiGravityAnalysis(null);
    setExecutionTime(null);
  }, []);

  // Run code
  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      setOutput('Error: No code to execute');
      return;
    }

    setIsRunning(true);
    setActiveTab(TABS.OUTPUT);
    setOutput('Running...\n');

    try {
      const result = await playgroundService.executeCode({
        code,
        language,
        stdin,
        timeout: 10,
      });

      let outputText = '';
      
      if (result.stdout) {
        outputText += result.stdout;
      }
      
      if (result.stderr) {
        outputText += result.stderr ? `\n${result.stderr}` : '';
      }
      
      if (result.timed_out) {
        outputText += '\n⏱️ Execution timed out (10s limit)';
      }
      
      if (result.memory_exceeded) {
        outputText += '\n💾 Memory limit exceeded (128MB limit)';
      }
      
      if (result.error) {
        outputText += `\n❌ Error: ${result.error}`;
      }

      setOutput(outputText || '(No output)');
      setExecutionTime(result.execution_time);

    } catch (error) {
      setOutput(`❌ ${error.message}`);
      setExecutionTime(null);
    } finally {
      setIsRunning(false);
    }
  }, [code, language, stdin]);

  // Find bugs in code
  const handleFindBugs = useCallback(async () => {
    if (!code.trim()) {
      setBugsAnalysis('Error: No code to analyze');
      return;
    }

    setIsAnalyzingBugs(true);
    setActiveTab(TABS.BUGS);
    setBugsAnalysis(null);

    try {
      const result = await playgroundService.detectBugs(code, language);
      
      if (result.success && result.data) {
        // Format the bug analysis
        let analysis = '';
        
        if (result.data.llm_analysis) {
          analysis = result.data.llm_analysis;
        }
        
        if (result.data.static_analysis) {
          analysis += '\n\n---\n\n## Static Analysis\n\n';
          if (result.data.static_analysis.issues) {
            result.data.static_analysis.issues.forEach((issue, idx) => {
              analysis += `${idx + 1}. **${issue.type}** (Line ${issue.line}): ${issue.message}\n`;
            });
          }
        }
        
        setBugsAnalysis(analysis || 'No bugs detected! Your code looks clean.');
      } else {
        setBugsAnalysis('Analysis complete. No significant issues found.');
      }
    } catch (error) {
      setBugsAnalysis(`❌ Error analyzing code: ${error.message}`);
    } finally {
      setIsAnalyzingBugs(false);
    }
  }, [code, language]);

  // Get fix suggestions
  const handleGetFix = useCallback(async () => {
    if (!code.trim()) {
      setFixSuggestion('Error: No code to fix');
      return;
    }

    setIsGettingFix(true);
    setActiveTab(TABS.FIX);
    setFixSuggestion(null);

    try {
      const result = await playgroundService.suggestFixes(code, language);
      
      if (result.success && result.data) {
        setFixSuggestion(result.data);
      } else {
        setFixSuggestion('No fixes needed. Your code appears to be correct!');
      }
    } catch (error) {
      setFixSuggestion(`❌ Error getting fixes: ${error.message}`);
    } finally {
      setIsGettingFix(false);
    }
  }, [code, language]);

  // Explain code
  const handleExplain = useCallback(async () => {
    if (!code.trim()) {
      setExplanation('Error: No code to explain');
      return;
    }

    setIsExplaining(true);
    setActiveTab(TABS.EXPLAIN);
    setExplanation(null);

    try {
      const result = await playgroundService.explainCode(code, language);
      
      if (result.success && result.data) {
        setExplanation(result.data);
      } else {
        setExplanation('Unable to generate explanation.');
      }
    } catch (error) {
      setExplanation(`❌ Error explaining code: ${error.message}`);
    } finally {
      setIsExplaining(false);
    }
  }, [code, language]);

  // Anti-Gravity analysis
  const handleAntiGravity = useCallback(async () => {
    if (!code.trim()) {
      setAntiGravityAnalysis('Error: No code to analyze');
      return;
    }

    setIsAnalyzingAntiGravity(true);
    setActiveTab(TABS.ANTIGRAVITY);
    setAntiGravityAnalysis(null);

    try {
      const result = await playgroundService.analyzeAntiGravity(code, language);
      
      if (result.success && result.data) {
        setAntiGravityAnalysis(result.data);
      } else {
        setAntiGravityAnalysis('Anti-Gravity Analysis failed.');
      }
    } catch (error) {
      setAntiGravityAnalysis(`❌ Error running anti-gravity analysis: ${error.message}`);
    } finally {
      setIsAnalyzingAntiGravity(false);
    }
  }, [code, language]);

  // Reset to default code
  const handleReset = useCallback(() => {
    setCode(LANGUAGES[language].defaultCode);
    clearAllResults();
  }, [language, clearAllResults]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  // Editor options
  const editorOptions = {
    minimap: { enabled: false },
    fontSize,
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: language === 'python' ? 4 : 2,
    wordWrap: 'on',
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true },
  };

  // Check if any analysis is in progress
  const isAnyLoading = isRunning || isAnalyzingBugs || isGettingFix || isExplaining || isAnalyzingAntiGravity;

  // Render markdown content
  const renderMarkdown = (content) => {
    if (!content) return null;
    return (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              if (inline) {
                return (
                  <code className="bg-dark-400 px-1.5 py-0.5 rounded text-primary-400" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <pre className="bg-dark-400 p-3 rounded-lg overflow-x-auto">
                  <code className="text-gray-200" {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-medium text-white mt-3 mb-1">{children}</h3>,
            p: ({ children }) => <p className="text-gray-300 mb-2 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-gray-300">{children}</li>,
            strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            em: ({ children }) => <em className="text-gray-400">{children}</em>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-400 my-2">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-dark-300 my-4" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.OUTPUT:
        return (
          <div ref={outputRef} className="flex-1 p-4 font-mono text-sm overflow-auto bg-[#0d1117]">
            {output ? (
              <pre className="whitespace-pre-wrap text-gray-200 leading-relaxed animate-fade-in">{output}</pre>
            ) : (
              <div className="text-dark-500 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-300/50 flex items-center justify-center">
                  <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-medium text-dark-400">Run your code</p>
                <p className="text-xs mt-1">or use AI tools to analyze it</p>
              </div>
            )}
          </div>
        );

      case TABS.BUGS:
        return (
          <div className="flex-1 p-4 overflow-auto">
            {isAnalyzingBugs ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div className="animate-spin h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-dark-400">Analyzing code for bugs...</p>
                  <p className="text-xs text-dark-500 mt-1">This may take a moment</p>
                </div>
              </div>
            ) : bugsAnalysis ? (
              <div className="animate-fade-in">
                {renderMarkdown(bugsAnalysis)}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                  <span className="text-3xl">🔍</span>
                </div>
                <p className="font-medium text-dark-400">Find bugs in your code</p>
                <p className="text-xs mt-1">Click "Find Bugs" to start analysis</p>
              </div>
            )}
          </div>
        );

      case TABS.FIX:
        return (
          <div className="flex-1 p-4 overflow-auto">
            {isGettingFix ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-dark-400">Generating fix suggestions...</p>
                  <p className="text-xs text-dark-500 mt-1">Analyzing issues and solutions</p>
                </div>
              </div>
            ) : fixSuggestion ? (
              <div className="animate-fade-in">
                {renderMarkdown(fixSuggestion)}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <span className="text-3xl">🔧</span>
                </div>
                <p className="font-medium text-dark-400">Get fix suggestions</p>
                <p className="text-xs mt-1">Click "Fix Code" to improve your code</p>
              </div>
            )}
          </div>
        );

      case TABS.EXPLAIN:
        return (
          <div className="flex-1 p-4 overflow-auto">
            {isExplaining ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">📖</span>
                  </div>
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-dark-400">Generating explanation...</p>
                  <p className="text-xs text-dark-500 mt-1">Breaking down your code</p>
                </div>
              </div>
            ) : explanation ? (
              <div className="animate-fade-in">
                {renderMarkdown(explanation)}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <span className="text-3xl">📖</span>
                </div>
                <p className="font-medium text-dark-400">Understand your code</p>
                <p className="text-xs mt-1">Click "Explain" for a detailed breakdown</p>
              </div>
            )}
          </div>
        );

      case TABS.ANTIGRAVITY:
        return (
          <div className="flex-1 p-4 overflow-auto">
            {isAnalyzingAntiGravity ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-2xl">🌌</span>
                  </div>
                  <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-dark-400">Applying anti-gravity fields...</p>
                  <p className="text-xs text-dark-500 mt-1">Measuring structural stability</p>
                </div>
              </div>
            ) : antiGravityAnalysis ? (
              <div className="animate-fade-in space-y-4 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-200 border border-dark-300 rounded-xl p-5">
                    <h3 className="text-dark-400 text-sm font-medium mb-1">Stability Score</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        {(antiGravityAnalysis.stability_score || 0).toFixed(1)}
                      </span>
                      <span className="text-dark-400 mb-1">/ 100</span>
                    </div>
                  </div>
                  <div className="bg-dark-200 border border-dark-300 rounded-xl p-5">
                    <h3 className="text-dark-400 text-sm font-medium mb-1">Status</h3>
                    <div className="text-xl font-semibold text-white mt-1">
                      {antiGravityAnalysis.status || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="bg-dark-200 border border-dark-300 rounded-xl p-5">
                  <h3 className="text-dark-400 text-sm font-medium mb-3">Parameters Used</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(antiGravityAnalysis.parameters_used || {}).map(([key, val]) => (
                      <div key={key} className="bg-dark-300/50 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-dark-400 text-xs font-mono">{key}:</span>
                        <span className="text-primary-400 text-sm font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {antiGravityAnalysis.suggestions && antiGravityAnalysis.suggestions.length > 0 && (
                  <div className="bg-dark-200 border border-dark-300 rounded-xl p-5">
                    <h3 className="text-white text-md font-medium mb-3">Suggestions</h3>
                    <ul className="space-y-2">
                      {antiGravityAnalysis.suggestions.map((sug, i) => (
                        <li key={i} className="flex gap-2 text-dark-400 text-sm">
                          <span className="text-purple-400">💡</span> {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {antiGravityAnalysis.execution_check && (
                  <div className="bg-dark-200 border border-dark-300 rounded-xl p-5">
                    <h3 className="text-white text-md font-medium mb-3">Execution Check</h3>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-dark-400 text-sm">Success:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${antiGravityAnalysis.execution_check.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {antiGravityAnalysis.execution_check.success ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {antiGravityAnalysis.execution_check.error && (
                        <div className="text-red-400 text-sm bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          {antiGravityAnalysis.execution_check.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <span className="text-3xl">🌌</span>
                </div>
                <p className="font-medium text-dark-400">Anti-Gravity Physics Analysis</p>
                <p className="text-xs mt-1">Click "Anti-Gravity" to measure code stability metrics.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-dark-100 p-4 md:p-6 overflow-hidden flex flex-col relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-primary-500/30">
                {'</>'}
              </span>
              <span className="bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
                Code Playground
              </span>
            </h1>
            <p className="text-dark-400 text-sm mt-1.5 ml-[52px]">
              Write, run, debug, and understand code with AI assistance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20">
              AI Powered
            </span>
            
            {/* AI Provider Toggle */}
            <button
              onClick={handleProviderToggle}
              disabled={isProviderSwitching}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-105 ${
                aiProvider === 'ollama'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              } ${isProviderSwitching ? 'opacity-50 cursor-wait' : ''}`}
              title={`Click to switch to ${aiProvider === 'ollama' ? 'OpenAI' : 'Ollama'}`}
            >
              {isProviderSwitching ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              )}
              <span className="font-semibold">
                {aiProvider === 'ollama' ? 'Ollama' : 'OpenAI'}
              </span>
              <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            
            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-sm transition-all duration-300 ${
              sandboxStatus === 'available' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10' 
                : sandboxStatus === 'unavailable'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                sandboxStatus === 'available' ? 'bg-green-400 animate-pulse' 
                : sandboxStatus === 'unavailable' ? 'bg-red-400'
                : 'bg-yellow-400 animate-pulse'
              }`}></span>
              {sandboxStatus === 'available' ? 'Sandbox Ready' 
                : sandboxStatus === 'unavailable' ? 'Sandbox Unavailable'
                : 'Checking...'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="max-w-7xl mx-auto flex-1 min-h-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          
          {/* Left Panel - Code Editor */}
          <div className="flex flex-col bg-dark-200/80 backdrop-blur-sm rounded-2xl border border-dark-300/50 overflow-hidden h-full shadow-xl shadow-black/20 animate-fade-in">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-dark-300/80 to-dark-300/50 border-b border-dark-300/50">
              <div className="flex items-center gap-3">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-dark-400/80 text-white text-sm rounded-xl px-4 py-2 border border-dark-300/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all hover:bg-dark-400 cursor-pointer"
                >
                  {Object.values(LANGUAGES).map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>

                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-dark-400/80 text-white text-sm rounded-xl px-4 py-2 border border-dark-300/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all hover:bg-dark-400 cursor-pointer"
                >
                  {[12, 14, 16, 18, 20].map((size) => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>

                <button
                  onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                  className="p-2 rounded-xl bg-dark-400/80 text-dark-400 hover:text-white hover:bg-dark-400 border border-dark-300/50 transition-all hover:scale-105"
                  title="Toggle theme"
                >
                  {theme === 'vs-dark' ? '☀️' : '🌙'}
                </button>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-dark-400 hover:text-white transition-all hover:bg-dark-400/50 rounded-lg"
              >
                ↻ Reset
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme={theme}
                options={editorOptions}
              />
            </div>

            {/* Stdin Input */}
            {showStdin && (
              <div className="border-t border-dark-300/50 p-4 bg-dark-300/20 animate-fade-in">
                <label className="text-xs text-dark-400 mb-2 block font-medium">⌨️ Standard Input (stdin)</label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input for your program..."
                  className="w-full h-20 bg-dark-400/50 text-white text-sm rounded-xl p-3 border border-dark-300/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all placeholder-dark-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-dark-300/80 to-dark-300/50 border-t border-dark-300/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStdin(!showStdin)}
                  className="text-sm text-dark-400 hover:text-white transition-all hover:bg-dark-400/30 px-2 py-1 rounded-lg"
                >
                  {showStdin ? '▼ Hide Input' : '▶ Add Input'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* AI Analysis Buttons */}
                <button
                  onClick={handleFindBugs}
                  disabled={isAnyLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isAnalyzingBugs
                      ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white cursor-wait shadow-lg shadow-yellow-500/25'
                      : isAnyLoading
                      ? 'bg-dark-400 text-dark-500 cursor-not-allowed'
                      : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 hover:scale-105'
                  }`}
                  title="Detect bugs in your code"
                >
                  🔍 {isAnalyzingBugs ? 'Analyzing...' : 'Find Bugs'}
                </button>

                <button
                  onClick={handleGetFix}
                  disabled={isAnyLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isGettingFix
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white cursor-wait shadow-lg shadow-green-500/25'
                      : isAnyLoading
                      ? 'bg-dark-400 text-dark-500 cursor-not-allowed'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 hover:scale-105'
                  }`}
                  title="Get fix suggestions"
                >
                  🔧 {isGettingFix ? 'Fixing...' : 'Fix Code'}
                </button>

                <button
                  onClick={handleExplain}
                  disabled={isAnyLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isExplaining
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-wait shadow-lg shadow-blue-500/25'
                      : isAnyLoading
                      ? 'bg-dark-400 text-dark-500 cursor-not-allowed'
                      : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105'
                  }`}
                  title="Explain the code line by line"
                >
                  📖 {isExplaining ? 'Explaining...' : 'Explain'}
                </button>

                {/* Anti-Gravity Button */}
                <button
                  onClick={handleAntiGravity}
                  disabled={isAnyLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isAnalyzingAntiGravity
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white cursor-wait shadow-lg shadow-purple-500/25'
                      : isAnyLoading
                      ? 'bg-dark-400 text-dark-500 cursor-not-allowed'
                      : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-105'
                  }`}
                  title="Run Anti-Gravity Analysis"
                >
                  🌌 {isAnalyzingAntiGravity ? 'Analyzing...' : 'Anti-Gravity'}
                </button>

                {/* Run Button */}
                <button
                  onClick={handleRun}
                  disabled={isRunning || sandboxStatus !== 'available'}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-semibold text-sm transition-all ${
                    isRunning
                      ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white cursor-wait shadow-lg shadow-primary-500/30'
                      : sandboxStatus !== 'available'
                      ? 'bg-dark-400 text-dark-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-400 hover:to-purple-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Running...
                    </>
                  ) : (
                    <>▶ Run</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Output/Analysis */}
          <div className="flex flex-col bg-dark-200/80 backdrop-blur-sm rounded-2xl border border-dark-300/50 overflow-hidden h-full shadow-xl shadow-black/20 animate-fade-in animation-delay-200">
            {/* Tabs */}
            <div className="flex items-center px-3 py-3 bg-gradient-to-r from-dark-300/80 to-dark-300/50 border-b border-dark-300/50 gap-2">
              <button
                onClick={() => setActiveTab(TABS.OUTPUT)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === TABS.OUTPUT
                    ? 'bg-dark-400/80 text-white shadow-lg'
                    : 'text-dark-400 hover:text-white hover:bg-dark-400/30'
                }`}
              >
                💻 Output
                {executionTime !== null && (
                  <span className="ml-2 text-xs text-primary-400">⚡{executionTime.toFixed(2)}s</span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab(TABS.BUGS)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
                  activeTab === TABS.BUGS
                    ? 'bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/10'
                    : 'text-dark-400 hover:text-white hover:bg-dark-400/30'
                }`}
              >
                🔍 Bugs
                {bugsAnalysis && <span className="ml-1.5 w-2 h-2 bg-yellow-400 rounded-full inline-block animate-pulse"></span>}
              </button>
              
              <button
                onClick={() => setActiveTab(TABS.FIX)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === TABS.FIX
                    ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10'
                    : 'text-dark-400 hover:text-white hover:bg-dark-400/30'
                }`}
              >
                🔧 Fix
                {fixSuggestion && <span className="ml-1.5 w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>}
              </button>
              
              <button
                onClick={() => setActiveTab(TABS.EXPLAIN)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === TABS.EXPLAIN
                    ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'text-dark-400 hover:text-white hover:bg-dark-400/30'
                }`}
              >
                📖 Explain
                {explanation && <span className="ml-1.5 w-2 h-2 bg-blue-400 rounded-full inline-block animate-pulse"></span>}
              </button>

              <button
                onClick={() => setActiveTab(TABS.ANTIGRAVITY)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === TABS.ANTIGRAVITY
                    ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10'
                    : 'text-dark-400 hover:text-white hover:bg-dark-400/30'
                }`}
              >
                🌌 Anti-Gravity
                {antiGravityAnalysis && <span className="ml-1.5 w-2 h-2 bg-purple-400 rounded-full inline-block animate-pulse"></span>}
              </button>

              <div className="flex-1"></div>
              
              <button
                onClick={clearAllResults}
                className="text-xs text-dark-400 hover:text-white transition-all px-3 py-1.5 hover:bg-dark-400/30 rounded-lg"
              >
                ✕ Clear
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto min-h-0">
              {renderTabContent()}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-dark-300/50 to-transparent border-t border-dark-300/50 text-xs text-dark-400 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-dark-400/50 rounded-lg text-dark-300 border border-dark-300/50">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-dark-400/50 rounded-lg text-dark-300 border border-dark-300/50">Enter</kbd>
                <span className="text-dark-500">Run code</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                AI-powered analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCodeEditor;
