import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FiSearch, FiCode, FiAlertCircle, FiSettings, FiClock, FiTrendingUp,
  FiUpload, FiPlay, FiLoader, FiTerminal, FiCheckCircle,
  FiAlertTriangle, FiTrash2, FiCpu, FiZap, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CodeEditor from '../components/Editor/CodeEditor';
import LanguageSelector from '../components/Editor/LanguageSelector';
import AnalysisResults from '../components/Analysis/AnalysisResults';
import analysisService from '../services/analysisService';
import { executeCode } from '../services/sandboxService';

const analysisTypes = [
  { id: 'explain',      label: 'Explain',      icon: FiSearch,      color: 'text-blue-400' },
  { id: 'line-by-line', label: 'Line by Line',  icon: FiCode,        color: 'text-cyan-400' },
  { id: 'bugs',         label: 'Find Bugs',     icon: FiAlertCircle, color: 'text-red-400' },
  { id: 'fix',          label: 'Suggest Fixes', icon: FiSettings,    color: 'text-green-400' },
  { id: 'complexity',   label: 'Complexity',    icon: FiClock,       color: 'text-yellow-400' },
  { id: 'improve',      label: 'Improve',       icon: FiTrendingUp,  color: 'text-indigo-400' },
];

const RUNNABLE = ['python', 'javascript', 'java'];

// ── draggable top split ───────────────────────────────────────────────────────
function useDrag(initial, min = 20, max = 80) {
  const [pct, setPct] = useState(initial);
  const dragging = useRef(false);
  const ref = useRef(null);
  const onDown = useCallback(() => { dragging.current = true; }, []);
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setPct(Math.min(max, Math.max(min, (e.clientX - r.left) / r.width * 100)));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [min, max]);
  return { pct, ref, onDown };
}

// ── Markdown renderer (shared) ────────────────────────────────────────────────
function MD({ children, accent = 'text-primary-300' }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-white prose-headings:font-semibold prose-headings:mt-5 prose-headings:mb-2
      prose-h2:border-b prose-h2:border-slate-700/60 prose-h2:pb-1
      prose-p:text-slate-300 prose-p:leading-7 prose-p:my-2
      prose-strong:text-white prose-strong:font-semibold
      prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:p-4
      prose-li:text-slate-300 prose-li:my-1 prose-ul:text-slate-300 prose-ol:text-slate-300
      prose-hr:border-slate-700">
      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-700">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-800/80">{children}</thead>,
          th: ({ children }) => <th className="text-white font-semibold px-4 py-2.5 text-left border-b border-slate-700 whitespace-nowrap">{children}</th>,
          td: ({ children }) => <td className="text-slate-300 px-4 py-2.5 border-b border-slate-700/40 align-top leading-6">{children}</td>,
          tr: ({ children }) => <tr className="hover:bg-slate-800/20 transition-colors">{children}</tr>,
          code({ inline, children }) {
            return inline
              ? <code className={`${accent} bg-slate-800/80 px-1.5 py-0.5 rounded text-xs font-mono`}>{children}</code>
              : <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-x-auto my-3"><code className="text-slate-200 text-xs font-mono">{children}</code></pre>;
          },
        }}
      >{children}</ReactMarkdown>
    </div>
  );
}

// ── Slide Drawer ──────────────────────────────────────────────────────────────
function Drawer({ open, onClose, side = 'right', title, icon: Icon, accentColor, badge, children }) {
  const translate = side === 'right'
    ? open ? 'translate-x-0' : 'translate-x-full'
    : open ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          style={{ top: '4rem' }}
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-16 bottom-0 z-50 flex flex-col
          bg-slate-900/95 backdrop-blur-xl border-slate-700/60 shadow-2xl
          transition-transform duration-300 ease-in-out ${translate}
          ${side === 'right' ? 'right-0 border-l rounded-tl-2xl' : 'left-0 border-r rounded-tr-2xl'}`}
        style={{ width: '44vw', minWidth: '360px', maxWidth: '760px' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 shrink-0
          bg-gradient-to-r ${side === 'right' ? 'from-slate-800/60 to-slate-900/60' : 'from-slate-900/60 to-slate-800/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${accentColor.bg}`}>
              <Icon className={`w-4 h-4 ${accentColor.icon}`} />
            </div>
            <span className="text-sm font-semibold text-white">{title}</span>
            {badge && (
              <span className="px-2 py-0.5 bg-slate-700/60 border border-slate-600/40 rounded-full text-xs text-slate-400">
                {badge}
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/60 transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Floating tab buttons (edge triggers) ─────────────────────────────────────
function DrawerTab({ side, label, icon: Icon, accentColor, onClick, hasContent, isLoading }) {
  const pos = side === 'right' ? 'right-0 rounded-l-xl' : 'left-0 rounded-r-xl';
  return (
    <button
      onClick={onClick}
      className={`fixed top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5
        px-2 py-4 ${accentColor.tab} text-white text-xs font-semibold
        shadow-xl transition-all hover:scale-105 active:scale-95 ${pos}`}
      style={{ top: '55%' }}
    >
      {isLoading
        ? <FiLoader className="w-4 h-4 animate-spin" />
        : <Icon className="w-4 h-4" />}
      {side === 'right'
        ? <FiChevronLeft className="w-3 h-3 opacity-60" />
        : <FiChevronRight className="w-3 h-3 opacity-60" />}
      {hasContent && (
        <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
      )}
      <span className="[writing-mode:vertical-lr] rotate-180 tracking-wide text-[11px]">{label}</span>
    </button>
  );
}

// ── Slidable Analysis Type Bar ────────────────────────────────────────────────
function AnalysisTypeBar({ types, selected, onToggle }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [checkScroll]);

  const slide = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center border-y border-slate-700/40 bg-slate-900/80 shrink-0">
      {/* Left arrow */}
      <button
        onClick={() => slide(-1)}
        className={`shrink-0 px-2 h-full flex items-center text-slate-500 hover:text-white transition-all
          ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <FiChevronLeft className="w-4 h-4" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 py-2 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <span className="text-xs text-slate-500 shrink-0 pl-1">Analyze:</span>
        {types.map(t => (
          <button
            key={t.id}
            onClick={() => onToggle(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs shrink-0 transition-all
              ${selected.includes(t.id)
                ? 'border-primary-500/60 bg-primary-500/10 text-white'
                : 'border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}
          >
            <t.icon className={`w-3.5 h-3.5 ${selected.includes(t.id) ? t.color : ''}`} />
            {t.label}
          </button>
        ))}
        <span className="pr-1 shrink-0" />
      </div>

      {/* Right arrow */}
      <button
        onClick={() => slide(1)}
        className={`shrink-0 px-2 h-full flex items-center text-slate-500 hover:text-white transition-all
          ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <FiChevronRight className="w-4 h-4" />
      </button>

      {/* Fade edges */}
      {canScrollLeft  && <div className="absolute left-8 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900/80 to-transparent pointer-events-none" />}
      {canScrollRight && <div className="absolute right-8 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900/80 to-transparent pointer-events-none" />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const Analyze = () => {
  const [code, setCode]         = useState('// Paste your code here\n');
  const [language, setLanguage] = useState('javascript');
  const [selectedTypes, setSelectedTypes] = useState(['explain']);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput]       = useState(null);
  const [stdin, setStdin]         = useState('');
  const [showStdin, setShowStdin] = useState(false);

  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [results, setResults]               = useState(null);
  const [processingTime, setProcessingTime] = useState(null);

  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryResult, setDryResult]       = useState(null);

  const fileInputRef = useRef(null);
  const canRun = RUNNABLE.includes(language);
  const { pct, ref: splitRef, onDown } = useDrag(52);

  const toggle = (id) =>
    setSelectedTypes(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const loadFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { setCode(ev.target.result); toast.success(`Loaded ${f.name}`); };
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
      const res = await analysisService.analyze(code, language, selectedTypes);
      const elapsed = Date.now() - t0;
      setProcessingTime(res.processingTime || elapsed);
      setResults(res.result || res.data);
      toast.success(`Done in ${(elapsed / 1000).toFixed(1)}s`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally { setIsAnalyzing(false); }
  };

  const handleDryRun = async () => {
    if (!code.trim() || code.trim() === '// Paste your code here') { toast.error('Enter some code'); return; }
    setIsDryRunning(true); setDryResult(null);
    try {
      // Use the backend API (has auth + 120s timeout to AI service)
      const res = await analysisService.explainCode(code, language);
      const raw = res?.result || res?.data || res || '';
      setDryResult(typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Dry run failed';
      setDryResult(`**Error:** ${msg}`);
      toast.error('Dry run failed: ' + msg);
    } finally { setIsDryRunning(false); }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-16 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={setLanguage} />
          <input type="file" ref={fileInputRef} onChange={loadFile} className="hidden" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go" />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 bg-slate-700/50 hover:bg-slate-700 transition-colors">
            <FiUpload className="w-3.5 h-3.5" /> Upload
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDryRun} disabled={isDryRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {isDryRunning ? <><FiLoader className="w-4 h-4 animate-spin" />Tracing...</> : <><FiCpu className="w-4 h-4" />Dry Run</>}
          </button>
          <button onClick={handleRun} disabled={isRunning || !canRun}
            title={!canRun ? 'Supports Python, JavaScript & Java' : ''}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${canRun ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}>
            {isRunning ? <><FiLoader className="w-4 h-4 animate-spin" />Running...</> : <><FiPlay className="w-4 h-4" />Run</>}
          </button>
          <button onClick={handleAnalyze} disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white transition-all">
            {isAnalyzing ? <><FiLoader className="w-4 h-4 animate-spin" />Analyzing...</> : <><FiZap className="w-4 h-4" />Analyze</>}
          </button>
        </div>
      </div>

      {/* ── Editor | Output ── */}
      <div ref={splitRef} className="flex" style={{ height: '480px' }}>
        {/* Editor */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${pct}%` }}>
          <CodeEditor value={code} onChange={setCode} language={language} height="440px" />
          <div className="border-t border-slate-700/50 bg-slate-900/80 shrink-0">
            <button onClick={() => setShowStdin(v => !v)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full">
              <FiTerminal className="w-3.5 h-3.5" />{showStdin ? 'Hide stdin' : 'stdin (optional)'}
            </button>
            {showStdin && <textarea value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Program input..." rows={2}
              className="w-full bg-transparent text-slate-300 text-xs font-mono px-4 pb-2 resize-none outline-none placeholder-slate-700" />}
          </div>
        </div>

        {/* Divider */}
        <div onMouseDown={onDown}
          className="w-1 shrink-0 bg-slate-700/40 hover:bg-primary-500/50 cursor-col-resize transition-colors group relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 rounded-full bg-slate-600 group-hover:bg-primary-500 transition-colors" />
        </div>

        {/* Output */}
        <div className="flex flex-col overflow-hidden border-l border-slate-700/40" style={{ width: `${100 - pct}%` }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <FiTerminal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Output</span>
              {output && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${output.exitCode === 0 ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                  {output.exitCode === 0 ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertTriangle className="w-3 h-3" />}
                  {output.exitCode === 0 ? 'Success' : 'Error'}
                </span>
              )}
              {output?.ms && <span className="text-xs text-slate-600 font-mono">{output.ms}ms</span>}
            </div>
            {output && <button onClick={() => setOutput(null)} className="p-1 text-slate-600 hover:text-slate-400"><FiTrash2 className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-slate-950/50">
            {isRunning && <div className="flex items-center gap-3 justify-center h-full text-slate-400"><FiLoader className="w-5 h-5 animate-spin text-green-400" />Executing...</div>}
            {!isRunning && !output && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-700">
                <FiPlay className="w-10 h-10" />
                <p className="text-sm">Click <span className="text-green-400">Run</span> to execute</p>
                {!canRun && <p className="text-xs text-center max-w-xs">Supports Python, JavaScript & Java</p>}
              </div>
            )}
            {!isRunning && output && (
              <div className="space-y-3">
                {output.stdout && <><p className="text-xs text-slate-600 uppercase tracking-widest mb-1">stdout</p><pre className="text-green-300 whitespace-pre-wrap leading-6">{output.stdout}</pre></>}
                {output.stderr && <><p className="text-xs text-slate-600 uppercase tracking-widest mb-1">stderr</p><pre className="text-red-400 whitespace-pre-wrap leading-6">{output.stderr}</pre></>}
                {!output.stdout && !output.stderr && output.exitCode === 0 && <div className="flex items-center gap-2 text-green-400 text-sm"><FiCheckCircle className="w-4 h-4" />No output.</div>}
                {output.timedOut && <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm"><FiAlertTriangle className="w-4 h-4 shrink-0" />Timed out (15s)</div>}
                <p className={`text-xs pt-2 border-t border-slate-800 font-mono ${output.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  === {output.exitCode === 0 ? 'Execution Successful' : `Exit code ${output.exitCode}`} ===
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Analysis type bar (slidable) ── */}
      <AnalysisTypeBar types={analysisTypes} selected={selectedTypes} onToggle={toggle} />

      {/* ── Bottom: Analysis Summary | Dry Run side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[480px] border-t border-slate-700/40">

        {/* LEFT — Analysis Summary */}
        <div className="flex flex-col border-r border-slate-700/40">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40 bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary-500/15 rounded-lg">
                <FiZap className="w-4 h-4 text-primary-400" />
              </div>
              <span className="text-sm font-semibold text-white">Analysis Summary</span>
              {processingTime && (
                <span className="text-xs text-slate-500 font-mono">{processingTime}ms</span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {!results && !isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-700 py-16">
                <FiZap className="w-10 h-10" />
                <p className="text-sm text-center max-w-xs">
                  Select analysis types above and click{' '}
                  <span className="text-primary-400 font-medium">Analyze</span> to get AI insights
                </p>
              </div>
            ) : (
              <AnalysisResults results={results} isLoading={isAnalyzing} processingTime={processingTime} />
            )}
          </div>
        </div>

        {/* RIGHT — Dry Run */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40 bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/15 rounded-lg">
                <FiCpu className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-white">Dry Run Trace</span>
            </div>
            {dryResult && (
              <button onClick={() => setDryResult(null)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <FiTrash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {isDryRunning ? (
              <div className="flex items-center justify-center gap-3 h-full text-slate-400">
                <FiLoader className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-sm">Tracing execution flow...</span>
              </div>
            ) : !dryResult ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-700 py-16">
                <FiCpu className="w-10 h-10" />
                <p className="text-sm text-center max-w-xs">
                  Click <span className="text-purple-400 font-medium">Dry Run</span> to trace code logic without executing it
                </p>
              </div>
            ) : (
              <MD accent="text-purple-300">{dryResult}</MD>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analyze;
