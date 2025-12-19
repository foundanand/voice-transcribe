import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Sparkles, Copy, Check, Settings, X, Keyboard } from 'lucide-react';
import { transcribeAudio } from './services/geminiService';
import { Message } from './types';
import TranscriptCard from './components/TranscriptCard';
import AudioVisualizer from './components/AudioVisualizer';
import { emit, listen } from '@tauri-apps/api/event';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isNotch, setIsNotch] = useState(window.location.hash === '#notch');
  const [isConcise, setIsConcise] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSuperKeyActive, setIsSuperKeyActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [superKey, setSuperKey] = useState('CommandOrControl+Shift+X');
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef(false);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const handleHashChange = () => {
      setIsNotch(window.location.hash === '#notch');
    };

    const unlistenSync = listen<Message[]>('sync-messages', (event) => {
      setMessages(event.payload);
    });

    const unlistenIsRecording = listen<boolean>('sync-recording', (event) => {
      setIsRecording(event.payload);
    });

    const unlistenIsConcise = listen<boolean>('sync-concise', (event) => {
      setIsConcise(event.payload);
    });

    const unlistenSuperKey = listen('super-key-press', () => {
      // Use ref to avoid stale state in listener
      if (isRecordingRef.current) {
        stopRecording();
      } else {
        setIsSuperKeyActive(true);
        startRecording();
      }
    });

    const loadSettings = async () => {
      try {
        const { load } = await import('@tauri-apps/plugin-store');
        const store = await load('settings.json');
        const savedKey = await store.get<{ value: string }>('superKey');
        if (savedKey) {
          setSuperKey(savedKey.value);
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('update_super_key', { shortcutStr: savedKey.value });
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };

    loadSettings();

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isRecordingShortcut) return;
      e.preventDefault();

      const keys = [];
      if (e.ctrlKey) keys.push('Control');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Command');

      // Add the actual key
      const key = e.key.toUpperCase();
      if (['CONTROL', 'ALT', 'SHIFT', 'META'].indexOf(key) === -1) {
        keys.push(key);
      }

      if (keys.length > 0 && !['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) {
        let shortcut = keys.join('+');
        // Tauri uses CommandOrControl
        shortcut = shortcut.replace('Command', 'CommandOrControl').replace('Control', 'CommandOrControl');

        setSuperKey(shortcut);
        setIsRecordingShortcut(false);

        try {
          const { load } = await import('@tauri-apps/plugin-store');
          const store = await load('settings.json');
          await store.set('superKey', { value: shortcut });
          await store.save();

          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('update_super_key', { shortcutStr: shortcut });
        } catch (err) {
          console.error("Failed to save shortcut:", err);
        }
      }
    };

    if (isRecordingShortcut) {
      window.addEventListener('keydown', handleKeyDown);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
      unlistenSync.then(f => f());
      unlistenIsRecording.then(f => f());
      unlistenIsConcise.then(f => f());
      unlistenSuperKey.then(f => f());
    };
  }, [isRecordingShortcut]);

  const syncState = async (newMessages: Message[]) => {
    await emit('sync-messages', newMessages);
  };

  const syncRecording = async (recording: boolean) => {
    await emit('sync-recording', recording);
  };

  const syncConcise = async (concise: boolean) => {
    await emit('sync-concise', concise);
  };

  const toggleConcise = () => {
    const next = !isConcise;
    setIsConcise(next);
    syncConcise(next);
  };

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        }
      });
      setStream(audioStream);

      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);

        // Cleanup stream
        audioStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      syncRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to use LazyTyper.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      syncRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (audioBlob: Blob) => {
    const id = Math.random().toString(36).substring(7);
    const newMessage: Message = {
      id,
      timestamp: Date.now(),
      verbatim: '',
      concise: '',
      isProcessing: true
    };

    setMessages(prev => {
      const nextMessages = [newMessage, ...prev];
      syncState(nextMessages);
      return nextMessages;
    });

    try {
      const base64 = await blobToBase64(audioBlob);
      const result = await transcribeAudio(base64, audioBlob.type);

      setMessages(prev => {
        const nextMessages = prev.map(msg =>
          msg.id === id
            ? { ...msg, verbatim: result.verbatim, concise: result.concise || '', isProcessing: false }
            : msg
        );
        syncState(nextMessages);

        // Auto-copy if super key was used
        if (isSuperKeyActive) {
          handleCopy(isConcise ? (result.concise || result.verbatim) : result.verbatim);
          setIsSuperKeyActive(false);
        }

        return nextMessages;
      });
    } catch (error: any) {
      setMessages(prev => {
        const nextMessages = prev.map(msg =>
          msg.id === id
            ? { ...msg, isProcessing: false, error: error.message || "Failed to transcribe audio." }
            : msg
        );
        syncState(nextMessages);
        return nextMessages;
      });
    }
  };

  const updateTranscription = (id: string, text: string) => {
    setMessages(prev => {
      const nextMessages = prev.map(msg => {
        if (msg.id === id) {
          return isConcise ? { ...msg, concise: text } : { ...msg, verbatim: text };
        }
        return msg;
      });
      syncState(nextMessages);
      return nextMessages;
    });
  };

  const handleCopy = async (text: string) => {
    try {
      if (!text) return;
      await writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy via Tauri plugin:", e);
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard fallback failed:", err);
      }
    }
  };

  const clearHistory = async () => {
    try {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      const confirmed = await ask('Are you sure you want to clear all transcriptions?', {
        title: 'Clear History',
        kind: 'warning',
      });
      if (confirmed) {
        setMessages([]);
        syncState([]);
      }
    } catch (e) {
      // Fallback if plugin is not available
      if (window.confirm("Clear all transcriptions?")) {
        setMessages([]);
        syncState([]);
      }
    }
  };

  const latestMessage = messages[0];

  if (isNotch) {
    return (
      <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden border border-white/10 rounded-2xl shadow-2xl active:cursor-grabbing select-none" data-tauri-drag-region>
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-slate-800/50" data-tauri-drag-region>
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400" data-tauri-drag-region>
              {isRecording ? "Listening" : "LazyTyper"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isRecording && latestMessage && !latestMessage.isProcessing && (
              <button
                onClick={toggleConcise}
                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${isConcise
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
              >
                {isConcise ? "Concise" : "Verbatim"}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950" data-tauri-drag-region>
          <div className="flex-1 flex flex-col min-h-0" data-tauri-drag-region>
            {isRecording ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-4">
                <AudioVisualizer stream={stream} isRecording={isRecording} />
                <span className="text-xs text-slate-400 font-medium">Recording audio...</span>
              </div>
            ) : latestMessage?.isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-4">
                <div className="relative">
                  <Sparkles className="text-indigo-500 animate-pulse" size={32} />
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                </div>
                <span className="text-xs text-slate-400 font-medium animate-pulse">Gemini is transcribing...</span>
              </div>
            ) : latestMessage ? (
              <textarea
                autoFocus
                value={isConcise ? (latestMessage.concise || '') : latestMessage.verbatim}
                onChange={(e) => updateTranscription(latestMessage.id, e.target.value)}
                className="w-full h-full bg-transparent text-sm leading-relaxed text-slate-200 outline-none resize-none placeholder-slate-700 scrollbar-hide"
                placeholder={isConcise ? "No concise summary yet..." : "Transcription will appear here..."}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Mic size={32} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 font-medium max-w-[200px]">Click the mic to start your first transcription.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 flex items-center justify-between bg-slate-900/50" data-tauri-drag-region>
          <div className="flex items-center gap-3">
            {latestMessage && !latestMessage.isProcessing && (
              <button
                onClick={() => handleCopy(isConcise ? (latestMessage.concise || '') : latestMessage.verbatim)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${copied
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-xl transition-all transform active:scale-95 shadow-xl ${isRecording
              ? 'bg-red-500 text-white shadow-red-500/20'
              : 'bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
          >
            {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            LazyTyper
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <Settings size={20} />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium p-2"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col gap-8">

        {/* Empty State */}
        {messages.length === 0 && !isRecording && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-700/50">
            <div className="bg-slate-800 p-6 rounded-full mb-6">
              <Mic size={48} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Your voice, converted to text.</h2>
            <p className="text-slate-400 max-w-xs leading-relaxed">
              Record audio in any language. Gemini will transcribe it word-for-word and offer a concise version.
            </p>
          </div>
        )}

        {/* Message Feed */}
        <div className="space-y-6">
          {messages.map(msg => (
            <TranscriptCard key={msg.id} message={msg} />
          ))}
        </div>
      </main>

      {/* Floating Control Bar */}
      <footer className="fixed bottom-8 w-full max-w-lg px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-4 shadow-2xl flex flex-col gap-4">

          {isRecording && (
            <div className="px-4 py-2 bg-slate-800/50 rounded-2xl">
              <AudioVisualizer stream={stream} isRecording={isRecording} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 px-3">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="text-sm font-medium text-slate-300">
                {isRecording ? "Recording Audio..." : "Ready to Scribe"}
              </span>
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-xl ${isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
            >
              {isRecording ? (
                <>
                  <Square size={20} fill="currentColor" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  <span>Record Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Spacer for sticky footer */}
      <div className="h-32"></div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowSettings(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-indigo-500" />
                Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">
                  Global Super Key
                </label>
                <div className="flex flex-col gap-3">
                  <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${isRecordingShortcut
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}>
                    <div className="flex items-center gap-3">
                      <Keyboard className={isRecordingShortcut ? 'text-indigo-400' : 'text-slate-500'} size={20} />
                      <span className={`font-mono text-sm ${isRecordingShortcut ? 'text-indigo-200' : 'text-slate-300'}`}>
                        {isRecordingShortcut ? 'Recording...' : superKey.replace('CommandOrControl', 'Cmd/Ctrl')}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRecordingShortcut(!isRecordingShortcut)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isRecordingShortcut
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                        }`}
                    >
                      {isRecordingShortcut ? 'Cancel' : 'Change'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Pressing this combination anywhere will toggle LazyTyper recording and auto-copy the result.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
