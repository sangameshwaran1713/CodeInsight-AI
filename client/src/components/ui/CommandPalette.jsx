import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiCode, FiShield, FiSliders, FiClock, FiCpu, 
  FiZap, FiCornerDownLeft, FiX, FiCheck, FiLayout, FiUser
} from 'react-icons/fi';

const COMMANDS = [
  { id: 'nav-dashboard', title: 'Go to Dashboard', category: 'Navigation', icon: FiLayout, path: '/dashboard' },
  { id: 'nav-analyze', title: 'New Repository Analysis', category: 'Navigation', icon: FiSearch, path: '/analyze' },
  { id: 'nav-playground', title: 'Open AI Code Playground', category: 'Navigation', icon: FiCode, path: '/playground' },
  { id: 'nav-history', title: 'View Scan History & Reports', category: 'Navigation', icon: FiClock, path: '/history' },
  { id: 'nav-settings', title: 'System & Model Settings', category: 'Navigation', icon: FiSliders, path: '/settings' },
  { id: 'nav-admin', title: 'Admin Control Center', category: 'Navigation', icon: FiShield, path: '/admin' },
  { id: 'action-quick-scan', title: 'Quick Scan React Component', category: 'Quick Action', icon: FiZap, action: 'scan-sample' },
  { id: 'ai-ollama', title: 'Switch AI Engine: Ollama Local (DeepSeek Coder)', category: 'AI Models', icon: FiCpu, model: 'ollama/deepseek-coder' },
  { id: 'ai-gpt4', title: 'Switch AI Engine: OpenAI GPT-4o Enterprise', category: 'AI Models', icon: FiCpu, model: 'openai/gpt-4o' },
  { id: 'ai-gemini', title: 'Switch AI Engine: Google Gemini 1.5 Pro', category: 'AI Models', icon: FiCpu, model: 'gemini/1.5-pro' },
  { id: 'ai-claude', title: 'Switch AI Engine: Anthropic Claude 3.5 Sonnet', category: 'AI Models', icon: FiCpu, model: 'claude-3.5-sonnet' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState('ollama/deepseek-coder');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (command) => {
    if (command.path) {
      navigate(command.path);
    } else if (command.model) {
      setSelectedModel(command.model);
      localStorage.setItem('codeinsight_active_model', command.model);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] divide-y divide-dark-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 bg-dark-900">
          <FiSearch className="w-5 h-5 text-primary-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, route, or search AI models (Press Esc to exit)..."
            className="w-full bg-transparent text-white placeholder-dark-400 focus:outline-none text-base"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Command Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-dark-400">
              <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No matching commands found</p>
              <p className="text-xs text-dark-500 mt-1">Try searching for "Analyze", "Playground", or "Ollama"</p>
            </div>
          ) : (
            filteredCommands.map((command, idx) => {
              const Icon = command.icon;
              const isSelected = idx === selectedIndex;
              const isCurrentModel = command.model && selectedModel === command.model;

              return (
                <div
                  key={command.id}
                  onClick={() => handleSelect(command)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-white' 
                      : 'text-dark-300 hover:bg-dark-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{command.title}</p>
                      <p className="text-xs text-dark-400">{command.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    {isCurrentModel && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-primary-500/10 text-primary-300 border border-primary-500/30">
                        <FiCheck className="w-3 h-3" />
                        <span>Selected</span>
                      </span>
                    )}
                    {isSelected && (
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium text-dark-300 bg-dark-800 border border-dark-700 rounded-md">
                        <FiCornerDownLeft className="w-3 h-3" /> Press Enter
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2.5 bg-dark-950/90 text-xs text-dark-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-dark-800 border border-dark-700 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-dark-800 border border-dark-700 rounded text-[10px]">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-dark-800 border border-dark-700 rounded text-[10px]">↵</kbd>
              <span className="ml-1">Select</span>
            </span>
          </div>
          <span className="font-mono text-[11px] text-dark-400">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
