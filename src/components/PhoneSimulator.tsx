import React, { useState } from 'react';
import {
  Sparkles,
  Moon,
  Clock,
  CheckCircle2,
  AlertCircle,
  FastForward,
  ChevronRight,
  RefreshCw,
  Bell,
  Play,
  RotateCcw,
  Plus,
  Flame,
  ArrowRight,
  TrendingUp,
  Sliders,
  Check,
  X,
  Zap,
  Info,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SimulatedTask, DailyReflection, FrictionReason, NotificationPayload, TaskStatus } from '../types';
import { addMinutesToTime } from '../utils/timeHelpers';
import { simulateMediaPipeInference, generateDailyReflection } from '../utils/aiSimulator';

interface PhoneSimulatorProps {
  tasks: SimulatedTask[];
  onTasksChange: (tasks: SimulatedTask[]) => void;
  activeNotification: NotificationPayload | null;
  onTriggerNotification: (task: SimulatedTask) => void;
  onDismissNotification: () => void;
  onActionDone: (taskId: number) => void;
  onActionSnooze30: (taskId: number) => void;
  onOpenReflection?: () => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  tasks,
  onTasksChange,
  activeNotification,
  onTriggerNotification,
  onDismissNotification,
  onActionDone,
  onActionSnooze30,
  onOpenReflection
}) => {
  const [isBedtimeOpen, setIsBedtimeOpen] = useState(false);
  const [isEveningReviewOpen, setIsEveningReviewOpen] = useState(false);
  const [brainDumpInput, setBrainDumpInput] = useState(
    "Need to review Android Room migrations first thing at 9am. Client sync on API contracts at 11am. Gym session at 4pm for 1 hour. Finish PR review before dinner."
  );
  const [isInferencing, setIsInferencing] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<SimulatedTask[]>([]);
  const [streamedTokenPreview, setStreamedTokenPreview] = useState('');
  const [dominoAlert, setDominoAlert] = useState<{ count: number; minutes: number } | null>(null);
  const [reflection, setReflection] = useState<DailyReflection | null>(null);

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Domino reschedule helper
  const handleDominoExtend = (task: SimulatedTask) => {
    onActionSnooze30(task.id);
    setDominoAlert({ count: tasks.filter(t => t.startTime >= task.startTime && t.status !== 'COMPLETED').length, minutes: 30 });
    setTimeout(() => setDominoAlert(null), 5000);
  };

  const handleToggleComplete = (taskId: number) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus: TaskStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        if (nextStatus === 'COMPLETED') {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onTasksChange(updated);
  };

  const handleRunBrainDump = async () => {
    setIsInferencing(true);
    setStreamedTokenPreview('');
    try {
      const generated = await simulateMediaPipeInference(brainDumpInput, chunk => {
        setStreamedTokenPreview(chunk);
      });
      setPreviewTasks(generated);
    } finally {
      setIsInferencing(false);
    }
  };

  const handleCommitPreview = () => {
    onTasksChange(previewTasks);
    setPreviewTasks([]);
    setIsBedtimeOpen(false);
    setDominoAlert({ count: previewTasks.length, minutes: 0 });
    setTimeout(() => setDominoAlert(null), 4000);
  };

  const handleOpenEveningReview = () => {
    const diag = generateDailyReflection(tasks);
    setReflection(diag);
    setIsEveningReviewOpen(true);
  };

  const handleTagFriction = (taskId: number, reason: FrictionReason) => {
    const updated = tasks.map(t => (t.id === taskId ? { ...t, frictionReason: reason, status: 'FAILED' as const } : t));
    onTasksChange(updated);
    setReflection(generateDailyReflection(updated));
  };

  const handleSeedSample = () => {
    const sample: SimulatedTask[] = [
      {
        id: 1,
        title: "Architecture & Room SQLite Migrations",
        startTime: "09:00",
        endTime: "10:30",
        category: "DEEP_WORK",
        status: "COMPLETED",
        bufferMinutes: 15,
        rescheduledCount: 0
      },
      {
        id: 2,
        title: "API Contract Sync & Team Standup",
        startTime: "10:45",
        endTime: "11:30",
        category: "MEETING",
        status: "PENDING",
        bufferMinutes: 15,
        rescheduledCount: 0
      },
      {
        id: 3,
        title: "MediaPipe GenAI Model Pipeline Testing",
        startTime: "13:00",
        endTime: "14:30",
        category: "DEEP_WORK",
        status: "PENDING",
        bufferMinutes: 30,
        rescheduledCount: 0
      },
      {
        id: 4,
        title: "Cardio Run & Mobility Recovery",
        startTime: "16:00",
        endTime: "17:00",
        category: "HEALTH",
        status: "PENDING",
        bufferMinutes: 20,
        rescheduledCount: 0
      }
    ];
    onTasksChange(sample);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Emulator Hardware Shell */}
      <div className="relative w-[375px] h-[780px] bg-[#0c0e14] rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10 flex flex-col overflow-hidden select-none">
        {/* Dynamic Island / Android Camera & Speaker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full flex items-center justify-center space-x-2 z-40 border border-white/5 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-indigo-500/40"></div>
          </div>
          <div className="w-8 h-1 rounded-full bg-slate-800"></div>
        </div>

        {/* Android 14 System Status Bar */}
        <div className="pt-2 px-6 pb-1 flex justify-between items-center text-[11px] font-semibold text-slate-400 z-30 tracking-tight">
          <span>09:41</span>
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="text-[10px] bg-slate-800/80 px-1 rounded text-emerald-400 font-mono">OFFLINE</span>
            <div className="w-3.5 h-2 border border-slate-400 rounded-sm p-[1px] flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Actionable Heads-up Notification (Simulating BroadcastReceiver Alarm trigger) */}
        {activeNotification && (
          <div className="absolute top-12 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-[#1c2233] border border-indigo-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                      AURA CHECK-IN
                      <span className="text-[9px] bg-indigo-950 text-indigo-200 px-1.5 py-0.2 rounded font-mono">
                        RTC_WAKEUP
                      </span>
                    </div>
                    <div className="text-[13px] font-bold text-white leading-tight mt-0.5">
                      Time's up: {activeNotification.taskTitle}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onDismissNotification}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-slate-300 mt-1.5 ml-8">
                Scheduled block ended at {activeNotification.endTime}. Did you complete it, or domino extend schedule?
              </div>

              {/* Notification Action Buttons */}
              <div className="mt-3 flex items-center justify-end space-x-2">
                <button
                  onClick={() => onActionDone(activeNotification.taskId)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow transition-colors active:scale-95"
                >
                  <Check className="w-3 h-3" />
                  <span>Done</span>
                </button>
                <button
                  onClick={() => {
                    onActionSnooze30(activeNotification.taskId);
                    setDominoAlert({ count: tasks.length, minutes: 30 });
                    setTimeout(() => setDominoAlert(null), 5000);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow transition-colors active:scale-95"
                >
                  <FastForward className="w-3 h-3" />
                  <span>+30 Mins (Domino)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Phone Viewport (Jetpack Compose Layout) */}
        <div className="flex-1 overflow-y-auto px-4 py-2 text-slate-100 flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 pt-1 border-b border-slate-800/80">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">Aura</span>
                <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  OFFLINE AI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Wednesday, Oct 28 • Local Engine
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {onOpenReflection && (
                <button
                  onClick={onOpenReflection}
                  className="px-2 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition-colors border border-amber-500/30 flex items-center gap-1 text-[11px] font-semibold"
                  title="Open Reflection Mode (1-5 Stars & Friction Note)"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Reflect</span>
                </button>
              )}

              <button
                onClick={handleOpenEveningReview}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 transition-colors border border-slate-700 flex items-center gap-1 text-[11px] font-semibold"
                title="Open Evening Friction Review"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Diagnostic</span>
              </button>
            </div>
          </div>

          {/* Discipline Score Progress Banner */}
          <div className="mt-3 p-3.5 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-bold text-slate-200">Daily Execution Score</div>
                <div className="text-[11px] text-slate-400">
                  {completedCount} of {totalCount} blocks completed
                </div>
              </div>
              <div
                className={`text-base font-extrabold px-2.5 py-1 rounded-xl font-mono ${
                  completionRate >= 75
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {completionRate}%
              </div>
            </div>
            <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  completionRate >= 75 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Domino Rescheduling Notification Alert */}
          {dominoAlert && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center space-x-2 animate-pulse">
              <FastForward className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px] leading-tight font-medium">
                <span className="font-bold text-amber-300">Domino Rescheduling: </span>
                {dominoAlert.count} downstream tasks rippled forward by +{dominoAlert.minutes}m. Room DB & Alarms updated.
              </div>
            </div>
          )}

          {/* Timetable Header */}
          <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Today's Time Blocks</span>
            <span className="font-mono text-slate-500">{tasks.length} items</span>
          </div>

          {/* Timeline Cards */}
          <div className="mt-2 space-y-2.5 pb-20">
            {tasks.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Moon className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
                <div className="text-sm font-bold text-slate-200">No Schedule Built Yet</div>
                <div className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                  Run a bedtime brain dump to parse freeform text into realistic time-blocks with buffers.
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setIsBedtimeOpen(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-3 rounded-xl transition"
                  >
                    Start Bedtime Brain Dump
                  </button>
                  <button
                    onClick={handleSeedSample}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-3 rounded-xl transition"
                  >
                    Load Sample Schedule
                  </button>
                </div>
              </div>
            ) : (
              tasks.map(task => {
                const isCompleted = task.status === 'COMPLETED';
                const isRescheduled = task.status === 'RESCHEDULED' || (task.rescheduledCount || 0) > 0;
                const isFailed = task.status === 'FAILED';

                const categoryColors: Record<string, string> = {
                  DEEP_WORK: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
                  MEETING: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
                  HEALTH: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
                  ADMIN: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
                  PERSONAL: 'bg-pink-900/40 text-pink-300 border-pink-700/50'
                };

                return (
                  <div
                    key={task.id}
                    className={`relative p-3 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-[#121620] border-emerald-500/30 opacity-70'
                        : isRescheduled
                        ? 'bg-[#161c2b] border-amber-500/40 shadow-sm'
                        : isFailed
                        ? 'bg-[#18151c] border-rose-500/30'
                        : 'bg-[#141824] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {/* Interactive Compose-style Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-slate-600 hover:border-indigo-400 bg-transparent'
                        }`}
                      >
                        {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                isCompleted ? 'text-slate-500 line-through' : 'text-indigo-300'
                              }`}
                            >
                              {task.startTime} - {task.endTime}
                            </span>
                            {isRescheduled && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                                +30m domino
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              categoryColors[task.category] || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {task.category}
                          </span>
                        </div>

                        <div
                          className={`text-xs font-semibold mt-1 leading-snug truncate ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </div>

                        {task.frictionReason && (
                          <div className="mt-1 text-[10px] text-rose-400 font-medium">
                            Friction: {task.frictionReason.replace('_', ' ')}
                          </div>
                        )}

                        {task.bufferMinutes > 0 && !isCompleted && (
                          <div className="mt-1 text-[10px] text-slate-500 flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Includes {task.bufferMinutes}m buffer</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons (Simulate Alarm or Trigger +30m) */}
                      {!isCompleted && (
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleDominoExtend(task)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                            title="Extend +30m & shift downstream tasks"
                          >
                            <FastForward className="w-3 h-3" />
                            <span>+30m</span>
                          </button>
                          <button
                            onClick={() => onTriggerNotification(task)}
                            className="p-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 text-[9px] font-medium flex items-center justify-center"
                            title="Trigger simulated AlarmManager check-in"
                          >
                            <Bell className="w-2.5 h-2.5 mr-0.5" />
                            <span>Alarm</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Floating Action Button (Bedtime Planner) */}
        <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-center">
          <button
            onClick={() => setIsBedtimeOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-2xl shadow-xl border border-indigo-400/30 flex items-center justify-center space-x-2 active:scale-95 transition"
          >
            <Moon className="w-4 h-4 text-indigo-200" />
            <span className="text-xs">Bedtime Brain Dump (Plan Day)</span>
          </button>
        </div>

        {/* Android Navigation Bar */}
        <div className="pb-1 pt-1 flex justify-center z-30">
          <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>

      {/* Bedtime Brain Dump Bottom Sheet / Modal */}
      {isBedtimeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141824] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bedtime Brain Dump</h3>
                  <p className="text-xs text-slate-400">Local MediaPipe GenAI timetable synthesis</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBedtimeOpen(false);
                  setPreviewTasks([]);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewTasks.length === 0 ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Freeform evening brain dump (unstructured text or speech):
                  </label>
                  <textarea
                    rows={4}
                    value={brainDumpInput}
                    onChange={e => setBrainDumpInput(e.target.value)}
                    placeholder="Dump everything on your mind: gym, meetings, coding PR, dinner..."
                    className="w-full bg-[#0c0e14] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Quick Templates:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBrainDumpInput(
                          "Deep focus sprint on Android Room DB at 9am. Team sync on API at 11am. MediaPipe testing in afternoon. 45m workout at 5pm."
                        )
                      }
                      className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                    >
                      Engineering Sprint
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBrainDumpInput(
                          "High stakes pitch review 10am. Strategy deck polish. Gym cardio at 2pm. Read 2 chapters in evening."
                        )
                      }
                      className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                    >
                      High Leverage Day
                    </button>
                  </div>
                </div>

                {isInferencing && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40">
                    <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold mb-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>On-Device MediaPipe Inference Running...</span>
                    </div>
                    <pre className="text-[10px] text-slate-400 font-mono bg-black/50 p-2 rounded max-h-24 overflow-y-auto">
                      {streamedTokenPreview || "Mapping model weights & extracting timetable JSON..."}
                    </pre>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setIsBedtimeOpen(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRunBrainDump}
                    disabled={isInferencing || !brainDumpInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isInferencing ? "Synthesizing..." : "Parse Timetable & Set Alarms"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                    Generated Timetable Preview
                  </span>
                  <span className="text-[11px] text-slate-400">{previewTasks.length} blocks allocated</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {previewTasks.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0c0e14] border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{pt.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {pt.startTime} - {pt.endTime} (+{pt.bufferMinutes}m buffer)
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 font-bold px-2 py-0.5 rounded border border-slate-700">
                        {pt.category}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setPreviewTasks([])}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleCommitPreview}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Commit to Timetable & Alarms</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evening Reflection & Friction Diagnostic Dialog */}
      {isEveningReviewOpen && reflection && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141824] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Evening Friction Diagnostic</h3>
                  <p className="text-xs text-slate-400">Behavioral loop closure & AI reflection</p>
                </div>
              </div>
              <button
                onClick={() => setIsEveningReviewOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Score header */}
              <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Execution Rate</div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">{reflection.completionRate}%</div>
                  <div className="text-xs text-slate-400">
                    {tasks.filter(t => t.status === 'COMPLETED').length} done •{' '}
                    {tasks.filter(t => t.status !== 'COMPLETED').length} uncompleted
                  </div>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                  <div
                    className={`w-full h-full rounded-full border-4 border-emerald-500 absolute inset-0 transition-all`}
                    style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)` }}
                  ></div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{reflection.completionRate}%</span>
                </div>
              </div>

              {/* Wins Summary */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Wins Summary</span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{reflection.winsSummary}</p>
              </div>

              {/* Friction Tagging for Uncompleted Tasks */}
              {tasks.filter(t => t.status !== 'COMPLETED').length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">
                    Tag Friction Causes (Missed Blocks)
                  </div>
                  <div className="space-y-2">
                    {tasks
                      .filter(t => t.status !== 'COMPLETED')
                      .map(uncompletedTask => (
                        <div
                          key={uncompletedTask.id}
                          className="p-3 rounded-xl bg-[#0c0e14] border border-slate-800"
                        >
                          <div className="text-xs font-semibold text-white">{uncompletedTask.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Scheduled: {uncompletedTask.startTime} - {uncompletedTask.endTime}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(
                              [
                                { key: 'LOW_ENERGY', label: 'Low Energy' },
                                { key: 'DISTRACTION', label: 'Distraction' },
                                { key: 'POOR_ESTIMATION', label: 'Estimation' },
                                { key: 'EMERGENCY', label: 'Emergency' }
                              ] as const
                            ).map(f => {
                              const isSelected = uncompletedTask.frictionReason === f.key;
                              return (
                                <button
                                  key={f.key}
                                  onClick={() => handleTagFriction(uncompletedTask.id, f.key)}
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                                    isSelected
                                      ? 'bg-amber-500/30 text-amber-300 border-amber-500'
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actionable Tip for Tomorrow */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                <div className="flex items-center space-x-1.5 text-indigo-300 text-xs font-bold uppercase tracking-wide">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1 Concrete Tip For Tomorrow</span>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
                  {reflection.actionableTip}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsEveningReviewOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
