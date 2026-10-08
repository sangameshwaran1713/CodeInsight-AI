import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import {
  FiSearch, FiCode, FiAlertCircle, FiSettings, FiClock, FiTrendingUp,
  FiUpload, FiPlay, FiLoader, FiTerminal, FiCheckCircle,
  FiAlertTriangle, FiTrash2, FiCpu, FiZap, FiChevronLeft, FiChevronRight,
  FiShield, FiX, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LanguageSelector from '../components/Editor/LanguageSelector';
import AnalysisResults from '../components/Analysis/AnalysisResults';
import analysisService from '../services/analysisService';
import playgroundService from '../services/playgroundService';
import { executeCode } from '../services/sandboxService';

const analysisTypes = [
  { id: 'explain', label: 'Explain', icon: FiSearch, color: 'text-primary-400' },
  { id: 'line-by-line', label: 'Line by Line', icon: FiCode, color: 'text-primary-400' },
  { id: 'bugs', label: 'Find Bugs', icon: FiAlertCircle, color: 'text-primary-400' },
  { id: 'fix', label: 'Suggest Fixes', icon: FiSettings, color: 'text-primary-400' },
  { id: 'complexity', label: 'Complexity', icon: FiClock, color: 'text-primary-400' },
  { id: 'improve', label: 'Improve', icon: FiTrendingUp, color: 'text-primary-400' },
];

const aiModes = [
  {
    id: 'standard',
    label: 'Fast',
    icon: FiZap,
    badge: '⚡ Fast',
    color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    description: 'Optimized for quick analysis and general explanations'
  },
  {
    id: 'deep',
    label: 'Deep Audit',
    icon: FiCpu,
    badge: '🧠 Deep',
    color: 'from-purple-500/20 to-indigo-600/10 text-purple-400 border-purple-500/30',
    description: 'Comprehensive inspection of edge cases, complexity & architecture'
  },
  {
    id: 'security',
    label: 'Security',
    icon: FiShield,
    badge: '🛡️ Security',
    color: 'from-emerald-500/20 to-teal-600/10 text-emerald-400 border-emerald-500/30',
    description: 'Strict OWASP & vulnerability analysis'
  },
];

const RUNNABLE = ['python', 'javascript', 'java'];

// ── horizontal draggable split hook (Left/Right) ───────────────────────────
function useDrag(initial = 55, min = 30, max = 70) {
  const [pct, setPct] = useState(initial);
  const dragging = useRef(false);
  const ref = useRef(null);
  const onDown = useCallback(() => { dragging.current = true; }, []);
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setPct(Math.min(max, Math.max(min, ((e.clientX - r.left) / r.width) * 100)));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [min, max]);
  return { pct, ref, onDown };
}

// ── vertical draggable split hook (Output/Analysis) ─────────────────────────
function useVerticalDrag(initial = 25, min = 15, max = 65) {
  const [vPct, setVPct] = useState(initial);
  const dragging = useRef(false);
  const vRef = useRef(null);
  const onVDown = useCallback(() => { dragging.current = true; }, []);
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current || !vRef.current) return;
      const r = vRef.current.getBoundingClientRect();
      setVPct(Math.min(max, Math.max(min, ((e.clientY - r.top) / r.height) * 100)));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [min, max]);
  return { vPct, vRef, onVDown };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_PYTHON_CODE = `# Write your code here`;

const Analyze = () => {
  const [scanMode, setScanMode] = useState('snippet');
  const [aiMode, setAiMode] = useState('standard');
  const [aiProvider, setAiProvider] = useState('ollama');
  const [isProviderSwitching, setIsProviderSwitching] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [code, setCode] = useState(DEFAULT_PYTHON_CODE);
  const [language, setLanguage] = useState('python');
  const [selectedTypes, setSelectedTypes] = useState(['explain']);

  // Fetch AI provider on mount
  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const data = await playgroundService.getAIProvider();
        setAiProvider(data.provider);
      } catch {
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
      toast.success(`Switched AI Engine to ${ newProvider === 'ollama' ? 'Ollama DeepSeek' : 'OpenAI GPT-4o'}`);
    } catch (error) {
      toast.error('Failed to switch AI Engine');
    } finally {
      setIsProviderSwitching(false);
    }
  }, [aiProvider]);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);

  const fileInputRef = useRef(null);
  const canRun = RUNNABLE.includes(language);
  const { pct, ref: splitRef, onDown } = useDrag(55);
  const { vPct, vRef, onVDown } = useVerticalDrag(25);

  const toggle = (id) =>
    setSelectedTypes(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const loadFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { setCode(ev.target.result); toast.success(`Loaded ${ f.name } `); };
    r.readAsText(f);
  };

  const handleRun = async () => {
    if (!code.trim() || code.trim() === '// Paste your code here') { toast.error('Enter some code'); return; }
    setIsRunning(true); setOutput(null);
    try {
      const res = await executeCode({ code, language, stdin, timeout: 15 });
      setOutput({ stdout: res.stdout || '', stderr: res.stderr || '', exitCode: res.exit_code ?? 0, ms: res.execution_time ? Math.round(res.execution_time * 1000) : null, timedOut: res.timed_out || false });
    } catch (err) {
      setOutput({ stdout: '', stderr: err.message, exitCode: 1, timedOut: false });
      toast.error(err.message);
    } finally { setIsRunning(false); }
  };

  const handleAnalyze = async () => {
    if (!code.trim() || code.trim() === '// Paste your code here') { toast.error('Enter some code'); return; }
    if (!selectedTypes.length) { toast.error('Select at least one type'); return; }
    setIsAnalyzing(true); setResults(null); setProcessingTime(null);
    const t0 = Date.now();
    try {
      const res = await analysisService.analyze(code, language, selectedTypes, aiMode);
      const elapsed = Date.now() - t0;
      setProcessingTime(res.processingTime || elapsed);
      setResults(res.result || res.data);
      const activeModeObj = aiModes.find(m => m.id === aiMode);
      toast.success(`Analysis completed using ${ activeModeObj?.label || 'Standard'} Mode(${(elapsed / 1000).toFixed(1)}s)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally { setIsAnalyzing(false); }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex-1 flex flex-col bg-dark-950 py-3">

      {/* Main workspace container with side margins & fixed layout height */}
      <div className="flex flex-col flex-1 px-4 md:px-8 lg:px-12 gap-3 w-full">

        {/* ── Streamlined Single-Row Control Bar (Non-wrapping Single Horizontal Line) ── */}
        <div className="px-3 py-1.5 rounded-xl border border-dark-800 bg-dark-900/90 backdrop-blur-xl shadow-md shrink-0 flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {/* Left: Scan Mode, Language & Upload */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-dark-300">Scan Mode:</span>
            <div className="flex p-0.5 bg-dark-950 border border-dark-800 rounded-lg">
              <button
                onClick={() => setScanMode('snippet')}
                className={`px - 2 py - 0.5 text - xs font - medium rounded - md transition - all ${
  scanMode === 'snippet' ? 'bg-primary-500 text-white shadow-sm font-semibold' : 'text-dark-400 hover:text-white'
} `}
              >
                Code Snippet / Editor
              </button>
              <button
                onClick={() => setScanMode('repository')}
                className={`px - 2 py - 0.5 text - xs font - medium rounded - md transition - all ${
  scanMode === 'repository' ? 'bg-primary-500 text-white shadow-sm font-semibold' : 'text-dark-400 hover:text-white'
} `}
              >
                GitHub Repo Scanner
              </button>
            </div>

            {scanMode === 'snippet' ? (
              <div className="flex items-center gap-1.5">
                <LanguageSelector value={language} onChange={setLanguage} />
                <input type="file" ref={fileInputRef} onChange={loadFile} className="hidden" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-dark-300 bg-dark-800 hover:bg-dark-700 border border-dark-700 transition-colors">
                  <FiUpload className="w-3.5 h-3.5" /> Upload File
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Paste GitHub URL..."
                  className="w-48 bg-dark-950 border border-dark-800 rounded-lg px-2 py-0.5 text-xs text-white placeholder-dark-500 focus:outline-none font-mono"
                />
                {['facebook/react', 'expressjs/express'].map((repo) => (
                  <button
                    key={repo}
                    onClick={() => setRepoUrl(`https://github.com/${repo}`)}
className = "px-1.5 py-0.5 text-[11px] font-mono bg-dark-800 hover:bg-dark-700 text-primary-400 rounded border border-dark-700 transition-colors"
  >
  { repo }
                  </button >
                ))}
              </div >
            )}
          </div >

  {/* Right: AI Model, AI Mode & Action Buttons */ }
  < div className = "flex items-center gap-2 shrink-0" >
    {/* AI Model Switcher Button */ }
    < button
onClick = { handleProviderToggle }
disabled = { isProviderSwitching }
className = "inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-dark-950 border border-dark-800 hover:border-primary-500/40 text-dark-300 hover:text-white transition-all cursor-pointer shadow-sm"
title = {`Switch Engine (${aiProvider === 'ollama' ? 'OpenAI GPT-4o' : 'Ollama DeepSeek'})`}
            >
              <FiCpu className="w-3.5 h-3.5 text-primary-400" />
              <span>Model: {aiProvider === 'ollama' ? 'Ollama DeepSeek' : 'OpenAI GPT-4o'}</span>
            </button >

            <div className="flex items-center space-x-1">
              <span className="text-xs font-semibold text-dark-300">
                AI Mode:
              </span>
              <div className="flex p-0.5 bg-dark-950 border border-dark-800 rounded-lg">
                {aiModes.map((m) => {
                  const Icon = m.icon;
                  const isActive = aiMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setAiMode(m.id);
                        toast.success(`Switched to ${m.label} Mode`);
                      }}
                      title={m.description}
                      className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md transition-all ${isActive
                          ? 'bg-gradient-to-r from-primary-500 to-amber-600 text-white shadow-sm font-semibold'
                          : 'text-dark-400 hover:text-white'
                        }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={handleRun} disabled={isRunning || !canRun}
                title={!canRun ? 'Supports Python, JavaScript & Java' : ''}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${canRun ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' : 'bg-dark-800 text-dark-500 cursor-not-allowed'}`}>
                {isRunning ? <><FiLoader className="w-3.5 h-3.5 animate-spin" />Running...</> : <><FiPlay className="w-3.5 h-3.5" />Run Code</>}
              </button>
              <button onClick={handleAnalyze} disabled={isAnalyzing}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white shadow-glow-primary transition-all">
                {isAnalyzing ? <><FiLoader className="w-3.5 h-3.5 animate-spin" />Analyzing...</> : <><FiZap className="w-3.5 h-3.5" />Analyze Code</>}
              </button>
            </div>
          </div >
        </div >

  {/* ── Main Split View (Fixed Border Container) ── */ }
  < div ref = { splitRef } className = "flex gap-2.5 w-full h-[calc(100vh-170px)] min-h-[560px] overflow-hidden" >

    {/* LEFT COLUMN: Code Editor (Full Height Card) */ }
    < div className = "flex flex-col overflow-hidden rounded-xl border border-dark-800 bg-dark-900/80 shadow-2xl h-full" style = {{ width: `${pct}%` }}>
      {/* Editor Header */ }
      < div className = "flex items-center justify-between px-3.5 py-1.5 border-b border-dark-800 bg-dark-950/80 shrink-0" >
              <div className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-semibold text-white tracking-wide">Source Code</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-dark-800 text-primary-300 border border-dark-700 uppercase">
                  {language}
                </span>
              </div>
              <span className="text-xs text-dark-400 font-mono">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
            </div >

  {/* Editor Body */ }
  < div className = "flex-1 relative bg-dark-950 overflow-hidden min-h-0" >
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={(val) => setCode(val || '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13.5,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        lineDecorationsWidth: 12,
        glyphMargin: false,
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: language === 'python' ? 4 : 2,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
      }}
    />
            </div >

  {/* Stdin Footer Drawer */ }
  < div className = "border-t border-dark-800 bg-dark-950/90 shrink-0" >
    <button onClick={() => setShowStdin(v => !v)}
      className="flex items-center gap-2 px-4 py-1.5 text-xs text-dark-400 hover:text-white transition-colors w-full">
      <FiTerminal className="w-3.5 h-3.5 text-primary-400" />{showStdin ? 'Hide Program Stdin' : 'Program Stdin (optional)'}
    </button>
{
  showStdin && <textarea value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Provide standard input data for code simulation..." rows={2}
    className="w-full bg-transparent text-slate-200 text-xs font-mono px-4 pb-2 resize-none outline-none placeholder-dark-600" />
}
            </div >
          </div >

  {/* Resizable Divider */ }
  < div onMouseDown = { onDown }
className = "w-1.5 shrink-0 bg-dark-800/80 hover:bg-primary-500/60 rounded-full cursor-col-resize transition-all group relative self-center h-20 my-auto" >
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 rounded-full bg-dark-700 group-hover:bg-primary-500 transition-colors shadow-md" />
          </div >

  {/* RIGHT COLUMN: Output Panel (Top) & Dedicated Analysis Panel (Bottom Card) */ }
  < div ref = { vRef } className = "flex flex-col gap-1.5 overflow-hidden h-full min-h-0" style = {{ width: `${100 - pct}%` }}>

    {/* TOP HALF: Output Panel Card */ }
    < div className = "flex flex-col shrink-0 rounded-xl border border-dark-800 bg-dark-900/80 shadow-2xl overflow-hidden min-h-[90px]" style = {{ height: `${vPct}%` }}>
              <div className="flex items-center justify-between px-3.5 py-1 border-b border-dark-800 bg-dark-950/80 shrink-0">
                <div className="flex items-center gap-2">
                  <FiTerminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-200">Execution Output</span>
                  {output && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${output.exitCode === 0 ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                      {output.exitCode === 0 ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertTriangle className="w-3 h-3" />}
                      {output.exitCode === 0 ? 'Success' : 'Error'}
                    </span>
                  )}
                  {output?.ms && <span className="text-xs text-slate-500 font-mono">{output.ms}ms</span>}
                </div>
                {output && <button onClick={() => setOutput(null)} className="p-1 text-slate-500 hover:text-slate-300"><FiTrash2 className="w-3.5 h-3.5" /></button>}
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-dark-950/90 min-h-0">
                {isRunning && <div className="flex items-center gap-3 justify-center h-full text-slate-400"><FiLoader className="w-4 h-4 animate-spin text-green-400" />Executing code simulation...</div>}
                {!isRunning && !output && (
                  <div className="flex flex-col items-center justify-center h-full gap-1 text-dark-500">
                    <FiPlay className="w-5 h-5 text-dark-400 opacity-60" />
                    <p className="text-xs">Click <span className="text-green-400 font-medium">Run</span> to execute</p>
                    {!canRun && <p className="text-[11px] text-dark-500">Supports Python, JavaScript & Java</p>}
                  </div>
                )}
                {!isRunning && output && (
                  <div className="space-y-1.5">
                    {output.stdout && <><p className="text-[10px] text-dark-500 uppercase tracking-widest">stdout</p><pre className="text-green-300 whitespace-pre-wrap leading-5 text-xs">{output.stdout}</pre></>}
                    {output.stderr && <><p className="text-[10px] text-dark-500 uppercase tracking-widest">stderr</p><pre className="text-red-400 whitespace-pre-wrap leading-5 text-xs">{output.stderr}</pre></>}
                    {!output.stdout && !output.stderr && output.exitCode === 0 && <div className="flex items-center gap-2 text-green-400 text-xs"><FiCheckCircle className="w-3.5 h-3.5" />No output.</div>}
                    {output.timedOut && <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-xs"><FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />Timed out (15s)</div>}
                    <p className={`text-[11px] pt-1 border-t border-dark-800 font-mono ${output.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      === {output.exitCode === 0 ? 'Execution Successful' : `Exit code ${output.exitCode}`} ===
                    </p>
                  </div>
                )}
              </div>
            </div >

  {/* Resizable Horizontal Drag Bar between Output and Analysis */ }
  < div onMouseDown = { onVDown }
className = "h-2 shrink-0 bg-dark-800/80 hover:bg-primary-500/60 rounded-full cursor-row-resize transition-all group relative my-0.5 flex items-center justify-center" >
  <div className="h-1 w-12 rounded-full bg-dark-600 group-hover:bg-primary-400 transition-colors shadow-sm" />
            </div >

  {/* BOTTOM HALF: Dedicated Right-Side Analysis Panel Card */ }
  < div className = "flex flex-col flex-1 min-h-0 rounded-xl border border-dark-800 bg-dark-900/80 shadow-2xl overflow-hidden" >
    {/* Analysis Summary Header */ }
    < div className = "flex items-center justify-between px-3.5 py-1.5 border-b border-dark-800 bg-dark-950/80 shrink-0" >
      <div className="flex items-center gap-2.5">
        <div className="p-1 bg-primary-500/15 rounded-md">
          <FiZap className="w-3.5 h-3.5 text-primary-400" />
        </div>
        <span className="text-xs font-semibold text-white tracking-wide">Analysis Summary</span>
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${aiModes.find(m => m.id === aiMode)?.color || 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30'
          }`}>
          {aiModes.find(m => m.id === aiMode)?.badge} Active
        </span>
      </div>
{
  processingTime && (
    <span className="text-xs text-slate-500 font-mono">{processingTime}ms</span>
  )
}
              </div >

  {/* Analysis Toolbar (Explain, Line by Line, Find Bugs, Suggest Fixes, Complexity, Improve) */ }
  < div className = "px-3 py-1.5 bg-dark-950/60 border-b border-dark-800 flex flex-wrap gap-1.5 shrink-0" >
    <span className="text-[11px] font-semibold text-dark-400 self-center mr-1">Types:</span>
{
  analysisTypes.map(t => {
    const Icon = t.icon;
    const isSelected = selectedTypes.includes(t.id);
    return (
      <button
        key={t.id}
        onClick={() => toggle(t.id)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs shrink-0 transition-all ${isSelected
          ? 'border-primary-500/60 bg-primary-500/15 text-white font-medium shadow-sm'
          : 'border-dark-800 bg-dark-900/60 text-dark-400 hover:text-dark-200 hover:border-dark-700'
          }`}
      >
        <Icon className={`w-3.5 h-3.5 ${isSelected ? t.color : 'text-dark-500'}`} />
        <span>{t.label}</span>
      </button>
    );
  })
}
              </div >

  {/* Analysis Results Body */ }
  < div className = "flex-1 overflow-y-auto p-3.5 bg-dark-950/40 min-h-0" >
    {!results && !isAnalyzing ? (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-dark-500 py-8">
        <div className="p-3 bg-dark-800/40 rounded-full border border-dark-700/50">
          <FiZap className="w-7 h-7 text-primary-400/60" />
        </div>
        <p className="text-xs text-center max-w-xs text-dark-400 leading-relaxed">
          Select analysis types above and click{' '}
          <span className="text-primary-400 font-semibold">Analyze Code</span> to generate AI insights
        </p>
      </div>
    ) : (
      <AnalysisResults results={results} isLoading={isAnalyzing} processingTime={processingTime} />
    )}
              </div >
            </div >

          </div >

        </div >

      </div >

    </div >
  );
};

export default Analyze;
