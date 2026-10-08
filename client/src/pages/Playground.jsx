/**
 * Live Code Playground - Interactive code editor with real-time execution
 * Features: Run code, Find bugs, Get fixes, Code explanation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
  FiSearch, FiCheckSquare, FiBookOpen, FiActivity, FiTerminal,
  FiPlay, FiX, FiCode, FiZap, FiCheck, FiCpu, FiSun, FiMoon, FiRotateCcw, FiShield, FiLoader
} from 'react-icons/fi';
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
  const [sandboxStatus, setSandboxStatus] = useState('available');
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
          <div ref={outputRef} className="flex-1 p-4 font-mono text-sm overflow-auto bg-dark-950">
            {output ? (
              <pre className="whitespace-pre-wrap text-dark-200 leading-relaxed animate-fade-in">{output}</pre>
            ) : (
              <div className="text-dark-500 text-center py-16">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center text-primary-400">
                  <FiTerminal className="w-6 h-6" />
                </div>
                <p className="font-semibold text-dark-300 text-xs">Run Code Execution</p>
                <p className="text-[11px] text-dark-500 mt-1">Execute program or perform code quality auditing</p>
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
                  <div className="w-10 h-10 rounded-xl bg-dark-900 border border-primary-500/30 flex items-center justify-center mx-auto mb-3 text-primary-400">
                    <FiSearch className="w-5 h-5 animate-pulse" />
                  </div>
                  <p className="text-dark-300 text-xs font-semibold">Auditing Codebase for Vulnerabilities...</p>
                  <p className="text-[11px] text-dark-500 mt-1">Evaluating Abstract Syntax Trees</p>
                </div>
              </div>
            ) : bugsAnalysis ? (
              <div className="animate-fade-in">
                {renderMarkdown(bugsAnalysis)}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-16">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center text-primary-400">
                  <FiSearch className="w-6 h-6" />
                </div>
                <p className="font-semibold text-dark-300 text-xs">Vulnerability Scanner</p>
                <p className="text-[11px] text-dark-500 mt-1">Click "Find Bugs" to run security & AST audits</p>
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
                  <div className="w-10 h-10 rounded-xl bg-dark-900 border border-primary-500/30 flex items-center justify-center mx-auto mb-3 text-primary-400">
                    <FiCheckSquare className="w-5 h-5 animate-pulse" />
                  </div>
                  <p className="text-dark-300 text-xs font-semibold">Generating Clean Code Recommendations...</p>
                </div>
              </div>
            ) : fixSuggestion ? (
              <div className="animate-fade-in">
                {renderMarkdown(fixSuggestion)}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-16">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center text-primary-400">
                  <FiCheckSquare className="w-6 h-6" />
                </div>
                <p className="font-semibold text-dark-300 text-xs">Automated Refactoring</p>
                <p className="text-[11px] text-dark-500 mt-1">Click "Fix Code" to receive clean code diffs</p>
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
                  <div className="w-10 h-10 rounded-xl bg-dark-900 border border-primary-500/30 flex items-center justify-center mx-auto mb-3 text-primary-400">
                    <FiBookOpen className="w-5 h-5 animate-pulse" />
                  </div>
                  <p className="text-dark-300 text-xs font-semibold">Generating Logic Breakdown...</p>
                </div>
              </div>
            ) : explanation ? (
              <div className="animate-fade-in">
                {renderMarkdown(explanation)}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-16">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center text-primary-400">
                  <FiBookOpen className="w-6 h-6" />
                </div>
                <p className="font-semibold text-dark-300 text-xs">Code Explanation</p>
                <p className="text-[11px] text-dark-500 mt-1">Click "Explain" for detailed architectural analysis</p>
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
                  <div className="w-10 h-10 rounded-xl bg-dark-900 border border-primary-500/30 flex items-center justify-center mx-auto mb-3 text-primary-400">
                    <FiActivity className="w-5 h-5 animate-pulse" />
                  </div>
                  <p className="text-dark-300 text-xs font-semibold">Measuring System Architecture & Stability...</p>
                </div>
              </div>
            ) : antiGravityAnalysis ? (
              <div className="animate-fade-in space-y-4 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
                    <h3 className="text-dark-400 text-xs font-semibold mb-1">Architecture Health Score</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold font-mono text-primary-300">
                        {(antiGravityAnalysis.stability_score || 0).toFixed(1)}
                      </span>
                      <span className="text-dark-400 text-xs mb-1 font-mono">/ 100</span>
                    </div>
                  </div>
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
                    <h3 className="text-dark-400 text-xs font-semibold mb-1">Audit Status</h3>
                    <div className="text-lg font-bold text-white mt-1">
                      {antiGravityAnalysis.status || 'Verified'}
                    </div>
                  </div>
                </div>

                <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
                  <h3 className="text-dark-400 text-xs font-semibold mb-3">Audited Parameters</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(antiGravityAnalysis.parameters_used || {}).map(([key, val]) => (
                      <div key={key} className="bg-dark-950 border border-dark-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-dark-400 text-xs font-mono">{key}:</span>
                        <span className="text-primary-400 text-xs font-medium font-mono">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {antiGravityAnalysis.suggestions && antiGravityAnalysis.suggestions.length > 0 && (
                  <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
                    <h3 className="text-white text-xs font-bold mb-3">Architectural Recommendations</h3>
                    <ul className="space-y-2">
                      {antiGravityAnalysis.suggestions.map((sug, i) => (
                        <li key={i} className="flex gap-2 text-dark-300 text-xs">
                          <FiCheck className="text-primary-400 w-4 h-4 shrink-0 mt-0.5" /> <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-dark-500 text-center py-16">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center text-primary-400">
                  <FiActivity className="w-6 h-6" />
                </div>
                <p className="font-semibold text-dark-300 text-xs">Architectural Code Health Audit</p>
                <p className="text-[11px] text-dark-500 mt-1">Evaluate codebase structure and maintainability metrics</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-6 flex flex-col relative text-white">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-primary-500/10 blur-[130px] rounded-full"></div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 w-full relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900/80 border border-dark-800 p-4 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-dark-950 border border-primary-500/40 flex items-center justify-center text-primary-400 font-mono font-bold text-sm shadow-md">
              <FiCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Code Intelligence Playground
              </h1>
              <p className="text-dark-400 text-xs">
                Interactive Monaco Editor with live AST auditing, complexity analysis, and execution sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Provider Toggle */}
            <button
              onClick={handleProviderToggle}
              disabled={isProviderSwitching}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-dark-950 border border-dark-800 hover:border-primary-500/30 text-dark-300 hover:text-white transition-all cursor-pointer"
              title={`Switch Engine (${aiProvider === 'ollama' ? 'OpenAI' : 'Ollama'})`}
            >
              <FiCpu className="w-3.5 h-3.5 text-primary-400" />
              <span>Model: {aiProvider === 'ollama' ? 'Ollama DeepSeek' : 'OpenAI GPT-4o'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="max-w-7xl mx-auto flex-1 w-full min-h-[620px] relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          
          {/* Left Panel - Code Editor */}
          <div className="flex flex-col bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden h-full shadow-xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-dark-950 border-b border-dark-800">
              <div className="flex items-center gap-3">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-dark-900 text-white text-xs font-semibold rounded-xl px-3 py-1.5 border border-dark-800 focus:outline-none focus:border-primary-500/50 cursor-pointer"
                >
                  {Object.values(LANGUAGES).map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>

                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-dark-900 text-white text-xs font-semibold rounded-xl px-3 py-1.5 border border-dark-800 focus:outline-none focus:border-primary-500/50 cursor-pointer"
                >
                  {[12, 14, 16, 18, 20].map((size) => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isRunning
                      ? 'bg-primary-600/80 text-dark-950 cursor-wait'
                      : 'bg-primary-500 hover:bg-primary-400 text-dark-950 shadow-glow-primary'
                  }`}
                  title="Run Code (Ctrl + Enter)"
                >
                  {isRunning ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiPlay className="w-3.5 h-3.5 fill-current" />}
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-dark-400 hover:text-white transition-all hover:bg-dark-800 rounded-xl flex items-center space-x-1"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[440px]">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={editorOptions}
              />
            </div>

            {/* Stdin Input */}
            {showStdin && (
              <div className="border-t border-dark-800 p-3 bg-dark-950 animate-fade-in">
                <label className="text-[11px] text-dark-400 mb-1.5 block font-mono font-medium">Standard Input (stdin)</label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input parameters..."
                  className="w-full h-16 bg-dark-900 text-white text-xs font-mono rounded-xl p-2.5 border border-dark-800 focus:outline-none focus:border-primary-500/50 placeholder-dark-600"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-dark-950 border-t border-dark-800">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className="text-xs text-dark-400 hover:text-white transition-all px-2.5 py-1.5 rounded-lg border border-dark-800 bg-dark-900"
              >
                {showStdin ? 'Hide Stdin' : '+ Add Stdin'}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* AI Analysis Buttons */}
                <button
                  onClick={handleFindBugs}
                  disabled={isAnyLoading}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isAnalyzingBugs
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 cursor-wait'
                      : isAnyLoading
                      ? 'bg-dark-900 text-dark-600 border border-dark-800 cursor-not-allowed'
                      : 'bg-dark-900 hover:bg-dark-800 text-dark-200 hover:text-white border border-dark-800 hover:border-primary-500/40'
                  }`}
                  title="Detect bugs in code"
                >
                  <FiSearch className="w-3.5 h-3.5 text-primary-400" />
                  <span>{isAnalyzingBugs ? 'Analyzing...' : 'Find Bugs'}</span>
                </button>

                <button
                  onClick={handleGetFix}
                  disabled={isAnyLoading}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isGettingFix
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 cursor-wait'
                      : isAnyLoading
                      ? 'bg-dark-900 text-dark-600 border border-dark-800 cursor-not-allowed'
                      : 'bg-dark-900 hover:bg-dark-800 text-dark-200 hover:text-white border border-dark-800 hover:border-primary-500/40'
                  }`}
                  title="Get fix suggestions"
                >
                  <FiCheckSquare className="w-3.5 h-3.5 text-primary-400" />
                  <span>{isGettingFix ? 'Fixing...' : 'Fix Code'}</span>
                </button>

                <button
                  onClick={handleExplain}
                  disabled={isAnyLoading}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isExplaining
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 cursor-wait'
                      : isAnyLoading
                      ? 'bg-dark-900 text-dark-600 border border-dark-800 cursor-not-allowed'
                      : 'bg-dark-900 hover:bg-dark-850 text-dark-200 hover:text-white border border-dark-800 hover:border-primary-500/40'
                  }`}
                  title="Explain code line by line"
                >
                  <FiBookOpen className="w-3.5 h-3.5 text-primary-400" />
                  <span>{isExplaining ? 'Explaining...' : 'Explain'}</span>
                </button>

                <button
                  onClick={handleAntiGravity}
                  disabled={isAnyLoading}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isAnalyzingAntiGravity
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 cursor-wait'
                      : isAnyLoading
                      ? 'bg-dark-900 text-dark-600 border border-dark-800 cursor-not-allowed'
                      : 'bg-dark-900 hover:bg-dark-850 text-dark-200 hover:text-white border border-dark-800 hover:border-primary-500/40'
                  }`}
                  title="Run Architectural Code Audit"
                >
                  <FiActivity className="w-3.5 h-3.5 text-primary-400" />
                  <span>{isAnalyzingAntiGravity ? 'Auditing...' : 'Arch Audit'}</span>
                </button>

                {/* Run Button */}
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isRunning
                      ? 'bg-primary-600/80 text-dark-950 cursor-wait'
                      : 'bg-primary-500 hover:bg-primary-400 text-dark-950 shadow-glow-primary'
                  }`}
                  title="Run Code (Ctrl + Enter)"
                >
                  {isRunning ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlay className="w-4 h-4 fill-current" />}
                  <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Output/Analysis */}
          <div className="flex flex-col bg-dark-900 rounded-2xl border border-dark-800 overflow-hidden h-full shadow-xl">
            {/* Tabs */}
            <div className="flex items-center px-3 py-2.5 bg-dark-950 border-b border-dark-800 gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab(TABS.OUTPUT)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === TABS.OUTPUT
                    ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FiTerminal className="w-3.5 h-3.5" />
                <span>Output</span>
                {executionTime !== null && (
                  <span className="ml-1 text-[10px] text-primary-400 font-mono">({executionTime.toFixed(2)}s)</span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab(TABS.BUGS)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === TABS.BUGS
                    ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FiSearch className="w-3.5 h-3.5" />
                <span>Bugs</span>
                {bugsAnalysis && <span className="w-1.5 h-1.5 bg-primary-400 rounded-full inline-block"></span>}
              </button>
              
              <button
                onClick={() => setActiveTab(TABS.FIX)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === TABS.FIX
                    ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FiCheckSquare className="w-3.5 h-3.5" />
                <span>Fix</span>
                {fixSuggestion && <span className="w-1.5 h-1.5 bg-primary-400 rounded-full inline-block"></span>}
              </button>
              
              <button
                onClick={() => setActiveTab(TABS.EXPLAIN)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === TABS.EXPLAIN
                    ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FiBookOpen className="w-3.5 h-3.5" />
                <span>Explain</span>
                {explanation && <span className="w-1.5 h-1.5 bg-primary-400 rounded-full inline-block"></span>}
              </button>

              <button
                onClick={() => setActiveTab(TABS.ANTIGRAVITY)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  activeTab === TABS.ANTIGRAVITY
                    ? 'bg-primary-500/10 text-primary-300 border border-primary-500/30'
                    : 'text-dark-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                <FiActivity className="w-3.5 h-3.5" />
                <span>Arch Audit</span>
                {antiGravityAnalysis && <span className="w-1.5 h-1.5 bg-primary-400 rounded-full inline-block"></span>}
              </button>

              <div className="flex-1"></div>
              
              <button
                onClick={clearAllResults}
                className="text-xs text-dark-400 hover:text-white transition-all px-2 py-1 hover:bg-dark-900 rounded-lg flex items-center space-x-1"
              >
                <FiX className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto min-h-0 bg-dark-950">
              {renderTabContent()}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-dark-950 border-t border-dark-800 text-[11px] font-mono text-dark-400 flex justify-between items-center">
              <span>Shortcut: Ctrl + Enter to run</span>
              <span className="text-primary-400 font-semibold">CodeInsight AST Sandbox</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCodeEditor;
