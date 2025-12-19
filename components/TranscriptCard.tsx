
import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Repeat, Zap } from 'lucide-react';
import { Message, TranscriptionMode } from '../types';

interface TranscriptCardProps {
  message: Message;
}

const TranscriptCard: React.FC<TranscriptCardProps> = ({ message }) => {
  const [mode, setMode] = useState<TranscriptionMode>(TranscriptionMode.VERBATIM);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const text = mode === TranscriptionMode.VERBATIM ? message.verbatim : message.concise;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.isProcessing) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-2xl p-6">
        <p className="text-red-400 text-sm">Error: {message.error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-indigo-500/50 group">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode(TranscriptionMode.VERBATIM)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === TranscriptionMode.VERBATIM 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Word-for-Word
          </button>
          <button
            onClick={() => setMode(TranscriptionMode.CONCISE)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === TranscriptionMode.CONCISE 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Zap size={12} className={mode === TranscriptionMode.CONCISE ? 'text-yellow-300' : ''} />
            Concise (In your tone)
          </button>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[10px] font-mono">
                {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            <button
                onClick={copyToClipboard}
                className="p-2 bg-slate-700 rounded-lg hover:bg-indigo-600 transition-all text-slate-300 hover:text-white"
                title="Copy to clipboard"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
        </div>
      </div>

      <div className="relative">
        <p className="text-slate-100 leading-relaxed text-lg font-normal">
          {mode === TranscriptionMode.VERBATIM ? message.verbatim : message.concise}
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
           {mode === TranscriptionMode.VERBATIM ? <Repeat size={12} /> : <MessageSquare size={12} />}
           {mode === TranscriptionMode.VERBATIM ? 'Raw Stream' : 'Refined Voice'}
        </span>
      </div>
    </div>
  );
};

export default TranscriptCard;
