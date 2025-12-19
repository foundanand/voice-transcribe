
import React, { useState, useRef, useCallback } from 'react';
import { Mic, Square, Trash2, Github, Sparkles, MessageSquarePlus } from 'lucide-react';
import { transcribeAudio } from './services/geminiService';
import { Message } from './types';
import TranscriptCard from './components/TranscriptCard';
import AudioVisualizer from './components/AudioVisualizer';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to use VoxScribe.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

    setMessages(prev => [newMessage, ...prev]);

    try {
      const base64 = await blobToBase64(audioBlob);
      const result = await transcribeAudio(base64, audioBlob.type);
      
      setMessages(prev => prev.map(msg => 
        msg.id === id 
        ? { ...msg, verbatim: result.verbatim, concise: result.concise || '', isProcessing: false }
        : msg
      ));
    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === id 
        ? { ...msg, isProcessing: false, error: error.message || "Failed to transcribe audio." }
        : msg
      ));
    }
  };

  const clearHistory = () => {
    if (window.confirm("Clear all transcriptions?")) {
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VoxScribe
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {messages.length > 0 && (
            <button 
              onClick={clearHistory}
              className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
          <a href="#" className="text-slate-400 hover:text-white transition-colors">
            <Github size={20} />
          </a>
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
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all transform active:scale-95 shadow-xl ${
                isRecording 
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
    </div>
  );
};

export default App;
