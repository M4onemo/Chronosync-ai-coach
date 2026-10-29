import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Compass,
  Zap,
  HeartHandshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  Calendar,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { SimulatedTask } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tasksSnapshot?: { title: string; time: string; status: string }[];
}

interface GeminiChatbotProps {
  tasks: SimulatedTask[];
  onApplySuggestedSchedule?: (newTasks: SimulatedTask[]) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  tasks,
  onApplySuggestedSchedule,
  initialPrompt,
  onClearInitialPrompt
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm **Aura**, your personal AI Accountability Coach. 

I'm here to help you protect your attention, calibrate realistic time buffers, and navigate schedule disruptions without falling into guilt or panic.

How can I help you sharpen your execution today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<'tactical' | 'discipline' | 'mindful'>('tactical');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare payload for multi-turn server endpoint
      const currentScheduleContext = tasks.map(t => ({
        id: t.id,
        title: t.title,
        time: `${t.startTime} - ${t.endTime}`,
        category: t.category,
        status: t.status,
        bufferMinutes: t.bufferMinutes,
        rescheduledCount: t.rescheduledCount || 0
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content
          })),
          coachPersona: persona,
          currentSchedule: currentScheduleContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error (${response.status})`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "I've reviewed your request. Let's make sure your next focus block starts strong.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err?.message || 'Unable to connect to Aura AI Coach right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat session cleared. I'm ready to assist with your timetable and focus. What's on your mind?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMessage(null);
  };

  // Quick prompt recommendations
  const quickPrompts = [
    { label: "Review my schedule", prompt: "Can you analyze my current schedule for today and tell me if my buffers and energy curve look realistic?" },
    { label: "Stuck procrastinating", prompt: "I am feeling resistance starting my next scheduled block. Give me a 3-step activation plan to begin right now." },
    { label: "Handle +30m delay", prompt: "I'm running 30 minutes behind schedule. How should I handle the domino effect without feeling guilty?" },
    { label: "Prevent 3 PM slump", prompt: "How can I structure my afternoon blocks so I don't hit a wall of exhaustion?" }
  ];

  // Helper to format basic markdown-style text safely
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-2" />;

          // Heading 3 or bullet
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-white text-base mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-extrabold text-white text-base mt-3 mb-1 border-b border-slate-700/50 pb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const bulletText = line.trim().replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-indigo-400 font-bold mt-1">•</span>
                <span>{renderFormattedInline(bulletText)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-indigo-400 font-mono font-bold">{numMatch[1]}.</span>
                <span>{renderFormattedInline(numMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{renderFormattedInline(line)}</p>;
        })}
      </div>
    );
  };

  const renderFormattedInline = (text: string) => {
    // Process **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 font-mono text-xs border border-indigo-500/30">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] bg-[#0c0e16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
      {/* Top Coach Header */}
      <div className="bg-[#121622] border-b border-slate-800/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0c0e16] rounded-[14px] flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Aura AI Accountability Coach</h2>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 3.8 Flash</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-turn conversational guide grounded in your live timetable
            </p>
          </div>
        </div>

        {/* Coach Persona Selector & Clear Action */}
        <div className="flex items-center space-x-2">
          <div className="bg-[#181d2c] p-1 rounded-2xl border border-slate-800 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setPersona('tactical')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                persona === 'tactical'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Balanced strategic advice, time blocks & buffers"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Strategist</span>
            </button>
            <button
              onClick={() => setPersona('discipline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                persona === 'discipline'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="High-standards accountability, zero excuses"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Discipline</span>
            </button>
            <button
              onClick={() => setPersona('mindful')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                persona === 'mindful'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Empathetic, reduces cognitive friction and guilt"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Mindful</span>
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition border border-transparent hover:border-slate-700"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Schedule Status Ribbon */}
      <div className="bg-[#0f121d] border-b border-slate-800/60 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Timetable Context:</span>
            <span className="font-semibold text-white">{tasks.length} Blocks</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center space-x-1">
            <span className="text-emerald-400 font-bold">{completedTasks.length} Done</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{pendingTasks.length} Pending</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-slate-400">
            Progress: <span className="font-semibold text-indigo-300">{completionRate}%</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Aura actively references your schedule in its replies</span>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start space-x-3.5 ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#1a2032] border border-slate-700 text-indigo-300 shadow-md'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-3xl p-4.5 shadow-md ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-[#131724] border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
                  <span className={`font-semibold ${isUser ? 'text-indigo-200' : 'text-indigo-400'}`}>
                    {isUser ? 'You' : 'Aura Coach'}
                  </span>
                  <span className="text-[10px] opacity-75">{message.timestamp}</span>
                </div>

                <div className="text-slate-100">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a2032] border border-slate-700 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-[#131724] border border-slate-800 rounded-3xl rounded-tl-none p-4 text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 ml-2 font-medium">Aura is reasoning...</span>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="text-xs font-semibold underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-6 py-2 bg-[#0e111a] border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0 uppercase tracking-wider flex items-center space-x-1">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Suggestions:</span>
        </span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(item.prompt)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-[#161a28] hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 text-xs transition active:scale-95 disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <div className="p-4 bg-[#121622] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end space-x-3"
        >
          <div className="flex-1 bg-[#0c0e16] border border-slate-800 focus-within:border-indigo-500 rounded-2xl p-2.5 transition">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aura: 'How do I start my next task?', 'Optimize my buffers', etc..."
              rows={2}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
          <span>Aura Coach • Multi-turn Gemini Intelligence</span>
        </div>
      </div>
    </div>
  );
};
