import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash } from 'lucide-react';
import { clsx } from 'clsx';
import type { SupportedLanguage } from '@/utils/constants';

interface OutputTab {
  id: string;
  content: string;
  timestamp: number;
  name: string;
}

const STORAGE_KEY = "playground-outputs";
const MAX_TABS = 10;

interface PlaygroundOutputProps {
  output: string;
  selectedLanguage: SupportedLanguage;
  onClearAll?: () => void;
  onCurrentOutputChange?: (output: string) => void;
  onHasTabsChange?: (hasTabs: boolean) => void;
  onInput?: (input: string) => void;
  isWaitingForInput?: boolean;
}

export const PlaygroundOutput: React.FC<PlaygroundOutputProps> = ({
  output,
  selectedLanguage,
  onClearAll,
  onCurrentOutputChange,
  onHasTabsChange,
  onInput,
  isWaitingForInput,
}) => {
  const [savedTabs, setSavedTabs] = useState<OutputTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const recalculateTabNames = (tabs: OutputTab[]) => {
    return tabs.map((tab, index) => ({
      ...tab,
      name: `Output ${index + 1}`
    }));
  };

  const loadTabsFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored) as OutputTab[];
        parsed = recalculateTabNames(parsed);
        setSavedTabs(parsed);
        if (parsed.length > 0) {
          const lastTab = parsed[parsed.length - 1];
          setActiveTabId(lastTab.id);
        }
      } else if (output && output.trim()) {
        addOutputTab(output);
      }
    } catch (error) {
      console.warn("Failed to load tabs from localStorage:", error);
      if (output && output.trim()) {
        addOutputTab(output);
      }
    }
  };

  const saveTabsToStorage = (tabs: OutputTab[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (error) {
      console.warn("Failed to save tabs to localStorage:", error);
    }
  };

  const addOutputTab = (content: string) => {
    if (!content.trim()) return;

    setSavedTabs(prev => {
      const newTab: OutputTab = {
        id: `output-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        content,
        timestamp: Date.now(),
        name: `Output ${prev.length + 1}`,
      };

      let newTabs = [...prev, newTab];
      if (newTabs.length > MAX_TABS) {
        newTabs.shift();
      }
      newTabs = recalculateTabNames(newTabs);
      saveTabsToStorage(newTabs);
      setActiveTabId(newTab.id);
      return newTabs;
    });
  };

  const removeTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSavedTabs(prev => {
      const index = prev.findIndex((tab) => tab.id === tabId);
      if (index === -1) return prev;

      const newTabs = [...prev];
      newTabs.splice(index, 1);
      const recalculated = recalculateTabNames(newTabs);

      if (activeTabId === tabId) {
        if (recalculated.length > 0) {
          setActiveTabId(recalculated[recalculated.length - 1].id);
        } else {
          setActiveTabId(null);
        }
      }

      if (recalculated.length === 0 && onClearAll) {
        onClearAll();
      }

      saveTabsToStorage(recalculated);
      return recalculated;
    });
  };

  const clearAllTabs = () => {
    setSavedTabs([]);
    setActiveTabId(null);
    localStorage.removeItem(STORAGE_KEY);
    if (onClearAll) onClearAll();
  };

  // Watch for language changes
  useEffect(() => {
    clearAllTabs();
  }, [selectedLanguage]);

  // Notify parent of state changes
  useEffect(() => {
    if (activeTabId) {
      const tab = savedTabs.find(t => t.id === activeTabId);
      if (onCurrentOutputChange) onCurrentOutputChange(tab?.content || "");
    } else {
      if (onCurrentOutputChange) onCurrentOutputChange(output || "");
    }
  }, [activeTabId, savedTabs, onCurrentOutputChange, output]);

  useEffect(() => {
    if (onHasTabsChange) onHasTabsChange(savedTabs.length > 0);
  }, [savedTabs.length, onHasTabsChange]);

  useEffect(() => {
    loadTabsFromStorage();
  }, []);

  const currentOutputContent = useMemo(() => {
    if (activeTabId) {
      const tab = savedTabs.find(t => t.id === activeTabId);
      return tab?.content || "";
    }
    return output || "";
  }, [activeTabId, savedTabs, output]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentOutputContent, savedTabs]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // If there is a pending input request (we'll implement this prop next), call it
    if (onInput) {
      onInput(input);
      setInput('');
    }
  };

  return (
    <div className="flex h-full flex-col bg-black-out">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-vapor/30 overflow-x-auto bg-bg-secondary/50">
        {/* Live Tab */}
        <button
          type="button"
          className={clsx(
            "group relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
            activeTabId === null
              ? "border-b-2 border-hedera-green text-hedera-green bg-white/5"
              : "text-vapor/60 hover:text-vapor hover:bg-white/5"
          )}
          onClick={() => setActiveTabId(null)}
        >
          <span>Live Output</span>
        </button>

        {savedTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={clsx(
              "group relative flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
              activeTabId === tab.id
                ? "border-b-2 border-hedera-green text-hedera-green bg-white/5"
                : "text-vapor/60 hover:text-vapor hover:bg-white/5"
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span>{tab.name}</span>
            <span
              role="button"
              tabIndex={0}
              className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
              onClick={(e) => removeTab(tab.id, e)}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        ))}
        {/* Delete All Button */}
        {/* Actions Area */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-vapor/60 transition-colors hover:text-white whitespace-nowrap"
            onClick={onClearAll}
            title="Clear current terminal output"
          >
            <Trash className="h-3 w-3" />
            <span>Clear Terminal</span>
          </button>

          {savedTabs.length > 0 && (
            <>
              <div className="h-4 w-px bg-vapor/20 mx-1" />
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-vapor/60 transition-colors hover:text-white whitespace-nowrap"
                onClick={clearAllTabs}
                title="Delete all saved output history"
              >
                <Trash className="h-3 w-3 text-red-400" />
                <span className="text-red-400">Delete History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-grow overflow-y-auto px-4 py-2 pb-2 text-vapor font-mono text-xs">
        <pre className="whitespace-pre-wrap">{currentOutputContent}</pre>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Only show if waiting for input */}
      {isWaitingForInput && (
        <div className="border-t border-vapor/20 p-2 bg-bg-secondary/30">
          <form onSubmit={handleInputSubmit} className="flex gap-2 items-center">
            <span className="text-hedera-green font-bold">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-vapor font-mono text-xs focus:ring-0"
              placeholder="Type a command..."
              autoFocus
            />
          </form>
        </div>
      )}
    </div>
  );
};
