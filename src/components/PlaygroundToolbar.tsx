// Basic implementation of the toolbar, inferring from usage in the snippet
import React from 'react';
import { Share2, Copy, Download, Trash2, MessageSquare, Eraser } from 'lucide-react';
import { type SupportedLanguage, SUPPORTED_LANGUAGES } from '@/utils/constants';

interface PlaygroundToolbarProps {
  selectedLanguage: SupportedLanguage;
  onLanguageClick: (lang: SupportedLanguage) => void;
  onShareClick: () => void;
  onCopyClick: () => void;
  onDownloadClick: () => void;
  onClearClick: () => void;
  onClearLastMethodClick: () => void;
  isClearLastMethodDisabled: boolean;
  onOpenChatClick: () => void;
  isChatOpen: boolean;
}

export const PlaygroundToolbar: React.FC<PlaygroundToolbarProps> = ({
  selectedLanguage,
  onLanguageClick,
  onShareClick,
  onCopyClick,
  onDownloadClick,
  onClearClick,
  onClearLastMethodClick,
  isClearLastMethodDisabled,
  onOpenChatClick,
  isChatOpen,
}) => {
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="mr-2 flex gap-1">
        {SUPPORTED_LANGUAGES.map(lang => (
          <button
            key={lang}
            className={`px-2 py-1 text-xs rounded ${selectedLanguage === lang ? 'bg-primary/20 text-primary' : 'text-vapor/60 hover:text-vapor'}`}
            onClick={() => onLanguageClick(lang)}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-vapor/20" />

      <button onClick={onShareClick} className="p-1 text-vapor/60 hover:text-vapor" title="Share">
        <Share2 className="h-4 w-4" />
      </button>
      <button onClick={onCopyClick} className="p-1 text-vapor/60 hover:text-vapor" title="Copy Code">
        <Copy className="h-4 w-4" />
      </button>
      <button onClick={onDownloadClick} className="p-1 text-vapor/60 hover:text-vapor" title="Download">
        <Download className="h-4 w-4" />
      </button>
      <div className="h-4 w-px bg-vapor/20" />

      <button onClick={onClearClick} className="p-1 text-vapor/60 hover:text-vapor" title="Clear Code">
        <Trash2 className="h-4 w-4" />
      </button>

      <button
        onClick={onClearLastMethodClick}
        disabled={isClearLastMethodDisabled}
        className="p-1 text-vapor/60 hover:text-vapor disabled:opacity-50"
        title="Clear Last Method"
      >
        <Eraser className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-vapor/20" />

      <button
        onClick={onOpenChatClick}
        className={`p-1 ${isChatOpen ? 'text-primary' : 'text-vapor/60 hover:text-vapor'}`}
        title="Toggle Chat"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
    </div>
  );
};
