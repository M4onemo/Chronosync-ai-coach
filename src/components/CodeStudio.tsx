import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  Database,
  Cpu,
  Clock,
  Sparkles,
  ShieldCheck,
  FolderTree,
  Terminal
} from 'lucide-react';
import { ANDROID_FILES, AndroidFileItem } from '../data/androidFiles';
import { exportAndroidProjectZip } from '../utils/zipExporter';

export const CodeStudio: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('app-build-gradle');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const selectedFile = ANDROID_FILES.find(f => f.id === selectedFileId) || ANDROID_FILES[0];

  const filteredFiles = ANDROID_FILES.filter(
    f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const blob = await exportAndroidProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Aura-Android-Offline-AI-Coach.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export zip error", e);
    } finally {
      setIsExporting(false);
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    build: <Terminal className="w-3.5 h-3.5 text-yellow-400" />,
    manifest: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    database: <Database className="w-3.5 h-3.5 text-blue-400" />,
    alarm: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    ai: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
    repository: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
    viewmodel: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
    ui: <FileCode className="w-3.5 h-3.5 text-pink-400" />,
    app: <FileCode className="w-3.5 h-3.5 text-slate-400" />
  };

  return (
    <div className="flex flex-col h-[780px] bg-[#0c0e14] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#141824] border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Android Production Codebase
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                100% Kotlin • Jetpack Compose • MediaPipe 0.10.14
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Clean Architecture, Room SQLite, AlarmManager RTC_WAKEUP & On-device AI
            </p>
          </div>
        </div>

        {/* Download Zip CTA */}
        <button
          onClick={handleDownloadZip}
          disabled={isExporting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg border border-indigo-400/40 flex items-center space-x-2 transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? "Packaging ZIP..." : "Download Android Studio Project (.ZIP)"}</span>
        </button>
      </div>

      {/* Main Split Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left File Tree Sidebar */}
        <div className="w-80 bg-[#10141f] border-r border-slate-800/80 flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Kotlin files & DAOs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#090b10] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredFiles.map(file => {
              const isSelected = file.id === selectedFile.id;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left p-2 rounded-xl transition flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-indigo-600/15 border border-indigo-500/40 text-white'
                      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{categoryIcons[file.category]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate leading-tight">{file.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Architecture Status Badge */}
          <div className="p-3 bg-[#0c0e14] border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Target SDK:</span>
              <span className="font-mono text-slate-300">Android 14 (API 34)</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Min SDK:</span>
              <span className="font-mono text-slate-300">Android 8.0 (API 26)</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Offline Weights:</span>
              <span className="font-mono text-emerald-400">assets/models/model.bin</span>
            </div>
          </div>
        </div>

        {/* Right Code Display Area */}
        <div className="flex-1 flex flex-col bg-[#0c0e14]">
          {/* File Tab Bar */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-[#141824] border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-indigo-300">{selectedFile.path}</span>
              <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                {selectedFile.language.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="px-5 py-2 bg-indigo-950/20 border-b border-indigo-900/30 text-xs text-indigo-200 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{selectedFile.description}</span>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 bg-[#090b10] leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800">
            <pre>
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
