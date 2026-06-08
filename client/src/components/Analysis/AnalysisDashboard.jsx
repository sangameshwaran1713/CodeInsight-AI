import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FiSearch,
  FiCode,
  FiAlertOctagon,
  FiSettings,
  FiClock,
  FiTrendingUp,
  FiBox,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';

// =============================================================================
// MARKDOWN RENDERER
// =============================================================================
const Markdown = ({ content }) => {
  if (!content) return null;
  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

  return (
    <div className="
      prose prose-invert max-w-none
      prose-headings:text-white prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h3:text-primary-300
      prose-p:text-slate-300 prose-p:leading-7 prose-p:my-3
      prose-strong:text-white prose-strong:font-semibold
      prose-em:text-slate-400
      prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
      prose-code:text-primary-300 prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
      prose-pre:code:bg-transparent prose-pre:code:p-0 prose-pre:code:text-slate-200
      prose-ul:text-slate-300 prose-ul:my-3 prose-ul:pl-5
      prose-ol:text-slate-300 prose-ol:my-3 prose-ol:pl-5
      prose-li:text-slate-300 prose-li:my-1.5 prose-li:leading-7
      prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-500/5 prose-blockquote:rounded-r-lg prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:text-slate-400 prose-blockquote:not-italic
      prose-hr:border-slate-700 prose-hr:my-6
      prose-table:w-full prose-table:border-collapse prose-table:text-sm
      prose-thead:bg-slate-800/80
      prose-th:text-white prose-th:font-semibold prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:border prose-th:border-slate-700
      prose-td:text-slate-300 prose-td:px-4 prose-td:py-3 prose-td:border prose-td:border-slate-700 prose-td:align-top
      prose-tbody:divide-y prose-tbody:divide-slate-700
    ">
      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-700">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-white font-semibold px-4 py-3 text-left border-b border-slate-700 whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => (
            <td className="text-slate-300 px-4 py-3 border-b border-slate-700/50 align-top leading-6">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>
          ),
          code({ inline, className, children }) {
            if (inline) {
              return <code className="text-primary-300 bg-slate-800/80 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
            }
            return (
              <div className="relative group my-4">
                <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-x-auto">
                  <code className="text-slate-200 text-sm font-mono">{children}</code>
                </pre>
              </div>
            );
          },
          h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-white mt-5 mb-3 pb-2 border-b border-slate-700">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-primary-300 mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mt-4 mb-2">{children}</h4>,
          p: ({ children }) => <p className="text-slate-300 leading-7 my-3">{children}</p>,
          ul: ({ children }) => <ul className="text-slate-300 my-3 pl-5 space-y-1.5 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="text-slate-300 my-3 pl-5 space-y-1.5 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-slate-300 leading-7">{children}</li>,
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          hr: () => <hr className="border-slate-700 my-6" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-500 bg-primary-500/5 rounded-r-lg px-4 py-2 my-4 text-slate-400">{children}</blockquote>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

// =============================================================================
// SEVERITY BADGE
// =============================================================================
const SeverityBadge = ({ severity }) => {
  const styles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const icons = { critical: FiAlertCircle, high: FiAlertTriangle, medium: FiAlertTriangle, low: FiInfo, info: FiInfo };
  const Icon = icons[severity] || FiInfo;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[severity] || styles.info}`}>
      <Icon className="w-3 h-3 mr-1" />
      {severity?.toUpperCase()}
    </span>
  );
};

// =============================================================================
// COPY BUTTON
// =============================================================================
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-dark-300 transition-colors" title="Copy">
      {copied ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiCopy className="w-4 h-4 text-dark-400" />}
    </button>
  );
};

// =============================================================================
// CODE BLOCK
// =============================================================================
const CodeBlock = ({ code }) => (
  <div className="relative group">
    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton text={code} />
    </div>
    <pre className="bg-dark-100 border border-dark-300 rounded-lg p-4 overflow-x-auto">
      <code className="text-sm text-primary-300 font-mono">{code}</code>
    </pre>
  </div>
);

// =============================================================================
// COLLAPSIBLE SECTION
// =============================================================================
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true, badge, color = 'text-primary-400', iconBg = 'bg-primary-500/10' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 ${iconBg} rounded-xl`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
          {badge && (
            <span className="px-2.5 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400 border border-slate-700">
              {badge}
            </span>
          )}
        </div>
        {isOpen
          ? <FiChevronDown className="w-4 h-4 text-slate-500" />
          : <FiChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PROJECT SUMMARY
// =============================================================================
const ProjectSummary = ({ data }) => {
  if (!data) return null;

  // If it's a plain string (most common case), just render as markdown
  if (typeof data === 'string') {
    return (
      <CollapsibleSection title="Project Summary" icon={FiBox} color="text-blue-400" iconBg="bg-blue-500/10">
        <div className="mt-4"><Markdown content={data} /></div>
      </CollapsibleSection>
    );
  }

  const summary = data;

  return (
    <CollapsibleSection title="Project Summary" icon={FiBox} color="text-blue-400" iconBg="bg-blue-500/10">
      <div className="space-y-4 mt-4">
        {summary.title && (
          <h4 className="text-lg font-bold text-white">{summary.title}</h4>
        )}

        {summary.purpose && (
          <div className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4">
            <p className="text-slate-300 leading-relaxed">{summary.purpose}</p>
          </div>
        )}

        {summary.components?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-widest mb-2">Components</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.components.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-dark-100/60 rounded-lg p-3">
                  <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded text-xs shrink-0">{c.type}</span>
                  <span className="text-white font-mono text-sm truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.technologies.map((t, i) => (
              <span key={i} className="px-3 py-1 bg-dark-300/60 border border-dark-300/40 rounded-full text-xs text-slate-300">{t}</span>
            ))}
          </div>
        )}

        {/* Markdown content fallback */}
        {summary.content && <Markdown content={summary.content} />}
      </div>
    </CollapsibleSection>
  );
};

// =============================================================================
// GENERIC MARKDOWN SECTION — used for explain, functions, line-by-line, fixes, improvements
// =============================================================================
const MarkdownSection = ({ title, icon, data, badge, color, iconBg }) => {
  if (!data) return null;
  return (
    <CollapsibleSection title={title} icon={icon} badge={badge} color={color} iconBg={iconBg}>
      <div className="mt-4">
        <Markdown content={typeof data === 'string' ? data : JSON.stringify(data, null, 2)} />
      </div>
    </CollapsibleSection>
  );
};

// =============================================================================
// BUG REPORT
// =============================================================================
const BugReport = ({ data }) => {
  if (!data) return null;
  const llmAnalysis = data.llm_analysis || data.llmAnalysis;
  const staticAnalysis = data.static_analysis || data.staticAnalysis;
  const issues = data.issues || [];
  const bugCount = issues.length || data.count || 0;

  return (
    <CollapsibleSection
      title="Bug Detection"
      icon={FiAlertOctagon}
      badge={bugCount > 0 ? `${bugCount} issues` : 'Clean'}
      color="text-red-400"
      iconBg="bg-red-500/10"
    >
      <div className="space-y-4 mt-4">
        {issues.length > 0 && (
          <div className="space-y-3">
            {issues.map((bug, i) => (
              <div key={i} className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4 hover:border-dark-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <SeverityBadge severity={bug.severity} />
                  {bug.line && <span className="text-xs text-dark-400 font-mono">Line {bug.line}</span>}
                  {bug.type && <span className="text-xs text-dark-400">{bug.type}</span>}
                </div>
                <p className="text-slate-300 text-sm">{bug.description}</p>
                {bug.suggestion && (
                  <p className="text-primary-400 text-sm mt-2">
                    <span className="text-dark-400">Fix: </span>{bug.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {llmAnalysis && <Markdown content={llmAnalysis} />}

        {staticAnalysis?.syntax_check && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${staticAnalysis.syntax_check.valid ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            {staticAnalysis.syntax_check.valid
              ? <FiCheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              : <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span className={staticAnalysis.syntax_check.valid ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>
              {staticAnalysis.syntax_check.message}
            </span>
          </div>
        )}

        {/* Fallback if just a string */}
        {!llmAnalysis && issues.length === 0 && typeof data === 'string' && (
          <Markdown content={data} />
        )}

        {!llmAnalysis && issues.length === 0 && typeof data !== 'string' && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
            <FiCheckCircle className="w-5 h-5 shrink-0" />
            <span>No bugs detected!</span>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

// =============================================================================
// COMPLEXITY SECTION
// =============================================================================
const TimeComplexity = ({ data }) => {
  if (!data) return null;
  const llmAnalysis = data.llm_analysis || data.llmAnalysis;
  const staticAnalysis = data.static_analysis || data.staticAnalysis;

  return (
    <CollapsibleSection title="Time & Space Complexity" icon={FiClock} color="text-yellow-400" iconBg="bg-yellow-500/10">
      <div className="space-y-4 mt-4">
        {(data.time?.notation || data.space?.notation || staticAnalysis) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.time?.notation && (
              <div className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-mono text-primary-400">{data.time.notation}</div>
                <div className="text-xs text-dark-400 mt-1">Time Complexity</div>
              </div>
            )}
            {data.space?.notation && (
              <div className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-mono text-green-400">{data.space.notation}</div>
                <div className="text-xs text-dark-400 mt-1">Space Complexity</div>
              </div>
            )}
            {staticAnalysis?.cyclomatic_complexity?.[0] && (
              <div className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-mono text-yellow-400">{staticAnalysis.cyclomatic_complexity[0].complexity}</div>
                <div className="text-xs text-dark-400 mt-1">Cyclomatic</div>
              </div>
            )}
            {staticAnalysis?.maintainability_index && (
              <div className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4 text-center">
                <div className="text-2xl font-mono text-blue-400">{staticAnalysis.maintainability_index.score}</div>
                <div className="text-xs text-dark-400 mt-1">Maintainability</div>
              </div>
            )}
          </div>
        )}

        {staticAnalysis?.raw_metrics && (
          <div className="bg-dark-100/60 border border-dark-300/40 rounded-lg p-4">
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-widest mb-3">Code Metrics</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
              {[
                { val: staticAnalysis.raw_metrics.loc, label: 'LOC' },
                { val: staticAnalysis.raw_metrics.sloc, label: 'SLOC' },
                { val: staticAnalysis.raw_metrics.comments, label: 'Comments' },
                { val: staticAnalysis.raw_metrics.blank, label: 'Blank' },
                { val: staticAnalysis.raw_metrics.lloc, label: 'Logical' },
                { val: staticAnalysis.raw_metrics.multi || 0, label: 'Multi-line' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div className="text-lg font-mono text-white">{val}</div>
                  <div className="text-xs text-dark-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {llmAnalysis && <Markdown content={llmAnalysis} />}
        {!llmAnalysis && !staticAnalysis && typeof data === 'string' && <Markdown content={data} />}
      </div>
    </CollapsibleSection>
  );
};

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
const AnalysisDashboard = ({ results, isLoading, processingTime }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [results]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-700 border-t-primary-500" />
          <FiCode className="absolute inset-0 m-auto w-5 h-5 text-primary-500" />
        </div>
        <p className="text-slate-300 font-medium">Analyzing your code...</p>
        <p className="text-slate-600 text-sm">This may take a moment</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-700">
        <FiCode className="w-10 h-10" />
        <p className="text-sm text-center max-w-xs">
          Select analysis types and click <span className="text-primary-400 font-medium">Analyze</span> to see results
        </p>
      </div>
    );
  }

  // ── Build sections from results ──────────────────────────────────────────
  const sectionDefs = [
    { key: 'explain',            label: 'Summary',      icon: FiBox,          color: '#60a5fa', data: results.explain || results.summary || results.project_summary },
    { key: 'function_exp',       label: 'Functions',    icon: FiLayers,       color: '#c084fc', data: results.functions || results.function_explanations },
    { key: 'line-by-line',       label: 'Line by Line', icon: FiCode,         color: '#22d3ee', data: results['line-by-line'] || results.lineExplanations },
    { key: 'bugs',               label: 'Bugs',         icon: FiAlertOctagon, color: '#f87171', data: results.bugs },
    { key: 'fix',                label: 'Fixes',        icon: FiSettings,     color: '#4ade80', data: results.fix || results.fixes || results.suggestedFixes },
    { key: 'complexity',         label: 'Complexity',   icon: FiClock,        color: '#facc15', data: results.complexity },
    { key: 'improve',            label: 'Improvements', icon: FiTrendingUp,   color: '#818cf8', data: results.improve || results.improvements },
  ].filter(s => !!s.data);

  if (!sectionDefs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-600">
        <FiCheckCircle className="w-8 h-8 text-green-500" />
        <p className="text-sm">Analysis complete</p>
        {processingTime && <p className="text-xs font-mono">{processingTime}ms</p>}
      </div>
    );
  }

  const idx = Math.min(activeIdx, sectionDefs.length - 1);
  const active = sectionDefs[idx];

  const renderContent = (s) => {
    if (!s) return null;
    const { key, data } = s;
    if (key === 'bugs') return <BugReport data={data} />;
    if (key === 'complexity') return <TimeComplexity data={data} />;
    return <Markdown content={typeof data === 'string' ? data : JSON.stringify(data, null, 2)} />;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status */}
      {processingTime && (
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-700/40">
          <span className="flex items-center gap-1.5">
            <FiCheckCircle className="w-3.5 h-3.5 text-green-400" /> Analysis Complete
          </span>
          <span className="font-mono">{processingTime}ms</span>
        </div>
      )}

      {/* Tab pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {sectionDefs.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => setActiveIdx(i)}
              style={i === idx ? { borderColor: s.color, color: s.color, backgroundColor: `${s.color}18` } : {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${i === idx ? 'shadow-sm' : 'border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}>
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content card */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30 bg-slate-800/40">
          <div className="flex items-center gap-2">
            {sectionDefs.map((s, i) => i === idx && (
              <span key={s.key} className="flex items-center gap-2 text-sm font-semibold text-white">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {idx > 0 && (
              <button onClick={() => setActiveIdx(idx - 1)}
                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {idx < sectionDefs.length - 1 && (
              <button onClick={() => setActiveIdx(idx + 1)}
                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div key={active.key} className="p-5" style={{ animation: 'slideIn 0.2s ease-out' }}>
          {renderContent(active)}
        </div>

        {/* Dot nav */}
        {sectionDefs.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-3 border-t border-slate-700/20">
            {sectionDefs.map((s, i) => (
              <button key={s.key} onClick={() => setActiveIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? '18px' : '6px',
                  height: '6px',
                  backgroundColor: i === idx ? s.color : '#334155',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
export { CollapsibleSection, ProjectSummary, BugReport, TimeComplexity, SeverityBadge, CodeBlock, CopyButton };
