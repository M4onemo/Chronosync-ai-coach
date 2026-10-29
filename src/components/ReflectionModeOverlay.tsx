import React, { useState, useEffect } from 'react';
import {
  Star,
  X,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  History,
  TrendingUp,
  MessageSquare,
  Flame,
  Calendar,
  Save,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SimulatedTask, FrictionReason, UserDayReflection } from '../types';

interface ReflectionModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: SimulatedTask[];
  onOpenCoachWithNote?: (note: string) => void;
}

const RATING_DESCRIPTIONS: Record<number, { title: string; color: string; feedback: string }> = {
  1: {
    title: "High Friction & Derailed",
    color: "text-rose-400",
    feedback: "A tough day is honest diagnostic data. Tomorrow starts with zero carried guilt and smaller activation thresholds."
  },
  2: {
    title: "Struggled with Momentum",
    color: "text-amber-400",
    feedback: "Identified resistance points early. Let's calibrate wider buffers and lock down morning focus."
  },
  3: {
    title: "Moderate Execution",
    color: "text-yellow-400",
    feedback: "Maintained baseline commitments despite friction. Good foundation to protect tomorrow's peak hours."
  },
  4: {
    title: "Strong Focus & Flow",
    color: "text-emerald-400",
    feedback: "High execution across primary focus blocks. Keep the exact sleep and morning routine tonight."
  },
  5: {
    title: "Flawless Discipline",
    color: "text-indigo-300",
    feedback: "Peak cognitive flow achieved! Protected every buffer and executed all scheduled non-negotiables."
  }
};

const QUICK_FRICTION_TAGS: { label: string; tag: FrictionReason; text: string }[] = [
  { label: "⚡ Low Energy / Exhaustion", tag: "LOW_ENERGY", text: "Felt mentally depleted in the afternoon; stamina ran out before scheduled blocks ended." },
  { label: "📱 Digital Distraction / Slack", tag: "DISTRACTION", text: "Context switching and unshielded notifications fragmented sustained focus." },
  { label: "⏳ Underestimated Task Scope", tag: "POOR_ESTIMATION", text: "Tasks took significantly longer than scheduled, causing domino delays across subsequent blocks." },
  { label: "🚨 Urgent Interruption / Fire", tag: "EMERGENCY", text: "Unexpected urgent requests derailed afternoon focus." }
];

export const ReflectionModeOverlay: React.FC<ReflectionModeOverlayProps> = ({
  isOpen,
  onClose,
  tasks,
  onOpenCoachWithNote
}) => {
  const [rating, setRating] = useState<number>(4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [frictionNote, setFrictionNote] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<FrictionReason | undefined>(undefined);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'reflect' | 'history'>('reflect');
  const [history, setHistory] = useState<UserDayReflection[]>([]);

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const rescheduledCount = tasks.reduce((acc, t) => acc + (t.rescheduledCount || 0), 0);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aura_day_reflections');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load reflections history', e);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentActiveRating = hoverRating !== null ? hoverRating : rating;

  const handleSelectTag = (item: typeof QUICK_FRICTION_TAGS[0]) => {
    setSelectedTag(item.tag);
    if (!frictionNote.trim()) {
      setFrictionNote(item.text);
    } else if (!frictionNote.includes(item.text)) {
      setFrictionNote(prev => `${prev.trim()}\n${item.text}`);
    }
  };

  const handleSaveReflection = () => {
    const newReflection: UserDayReflection = {
      id: `reflection-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      rating,
      frictionNote: frictionNote.trim() || "Smooth execution without significant friction.",
      primaryFrictionTag: selectedTag,
      completionRate,
      completedTasksCount: completedCount,
      totalTasksCount: totalCount,
      aiAntidote: RATING_DESCRIPTIONS[rating]?.feedback,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newReflection, ...history.filter(h => h.date !== newReflection.date)].slice(0, 14);
    setHistory(updated);
    try {
      localStorage.setItem('aura_day_reflections', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }

    if (rating >= 4) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setViewTab('history');
    }, 1200);
  };

  const handleAskCoach = () => {
    if (onOpenCoachWithNote) {
      onClose();
      onOpenCoachWithNote(
        `I just completed my Reflection Mode for today. I rated my performance ${rating}/5 stars. My primary friction note: "${frictionNote || 'No specific friction noted'}". What is your recommended adjustment for tomorrow's schedule?`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e121d] border border-slate-700/80 rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#141826] px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Star className="w-5 h-5 fill-amber-300 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">Reflection Mode</h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Evening Diagnostic
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Close today's loop, log primary friction points, and prime tomorrow's timetable
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-[#1c2236] p-1 rounded-xl border border-slate-700/60 flex items-center text-xs">
              <button
                onClick={() => setViewTab('reflect')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewTab === 'reflect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rate Today
              </button>
              <button
                onClick={() => setViewTab('history')}
                className={`px-3 py-1 rounded-lg font-medium flex items-center space-x-1 transition ${
                  viewTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3 h-3" />
                <span>History ({history.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close overlay (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {viewTab === 'reflect' ? (
            <>
              {/* Day Performance Snapshot */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#131724] border border-slate-800">
                <div className="text-center sm:text-left">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completion Rate</div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">{completionRate}%</div>
                  <div className="text-[11px] text-slate-400">{completedCount} of {totalCount} blocks</div>
                </div>

                <div className="text-center sm:text-left border-x border-slate-800/80 px-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Domino Shifts</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                    {rescheduledCount > 0 ? `+${rescheduledCount * 30}m` : '0m'}
                  </div>
                  <div className="text-[11px] text-slate-400">{rescheduledCount} delays absorbed</div>
                </div>

                <div className="text-center sm:text-left">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">Active Session</div>
                </div>
              </div>

              {/* 1 to 5 Star Rating Section */}
              <div className="p-5 rounded-3xl bg-[#141826] border border-slate-800 text-center space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Step 1: Rate Your Day's Execution
                  </span>
                  <h3 className="text-sm font-extrabold text-white">
                    How intentionally did you protect and execute your focus today?
                  </h3>
                </div>

                {/* Stars Container */}
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 py-2">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= currentActiveRating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 sm:p-2 rounded-2xl hover:bg-slate-800/80 transition-all transform hover:scale-110 active:scale-95 focus:outline-none"
                      >
                        <Star
                          className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                              : 'text-slate-600 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label & Description */}
                <div className="inline-block px-4 py-1.5 rounded-full bg-[#1b2234] border border-slate-700/80 text-xs font-bold">
                  <span className={`${RATING_DESCRIPTIONS[currentActiveRating]?.color || 'text-white'}`}>
                    ★ {currentActiveRating} of 5: {RATING_DESCRIPTIONS[currentActiveRating]?.title}
                  </span>
                </div>
              </div>

              {/* Text Note on Primary Friction Points */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>Step 2: Note Primary Friction Points</span>
                    <span className="text-[10px] text-slate-500 font-normal lowercase">(what drained or derailed focus?)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {frictionNote.length} characters
                  </span>
                </div>

                {/* Quick Friction Tags */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                    Tap to add common behavioral friction points:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_FRICTION_TAGS.map((item, idx) => {
                      const isChosen = selectedTag === item.tag;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectTag(item)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition active:scale-98 ${
                            isChosen
                              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-sm'
                              : 'bg-[#121622] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Friction Note Textarea */}
                <div className="bg-[#121622] border border-slate-700/80 rounded-2xl p-3 focus-within:border-indigo-500 transition">
                  <textarea
                    rows={4}
                    value={frictionNote}
                    onChange={(e) => setFrictionNote(e.target.value)}
                    placeholder="E.g., I skipped my 13:00 deep work block because I checked Slack notifications after lunch. Next time I will keep Slack closed until 16:00..."
                    className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* AI Coaching Takeaway Preview */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-200">
                    Aura Behavioral Antidote for Tomorrow:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {RATING_DESCRIPTIONS[rating]?.feedback}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Past Reflections Streak ({history.length} logged)</span>
                <button
                  onClick={() => setViewTab('reflect')}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  + Rate Today's Performance
                </button>
              </div>

              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No Reflections Logged Yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete your first 1-5 star rating and friction note above to build your accountability streak.
                  </p>
                  <button
                    onClick={() => setViewTab('reflect')}
                    className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Start Reflection
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#131724] border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{item.date}</span>
                          <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-extrabold text-amber-300">{item.rating}/5</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 bg-[#0c0e15] p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Primary Friction Note:
                        </div>
                        {item.frictionNote}
                      </div>

                      {item.aiAntidote && (
                        <div className="text-[11px] text-indigo-300 flex items-center space-x-1.5 pl-1">
                          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{item.aiAntidote}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#121622] px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {viewTab === 'reflect' ? 'Reflections help calibrate buffers and eliminate recurring friction' : `${history.length} days recorded in local streak`}
          </div>

          <div className="flex items-center space-x-2.5">
            {viewTab === 'reflect' && (
              <>
                <button
                  type="button"
                  onClick={handleAskCoach}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  title="Discuss friction note with Gemini AI coach"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Discuss with Coach</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveReflection}
                  disabled={isSaved}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center space-x-1.5 transition active:scale-95 disabled:bg-emerald-600"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Logged!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Log Reflection</span>
                    </>
                  )}
                </button>
              </>
            )}

            {viewTab === 'history' && (
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
