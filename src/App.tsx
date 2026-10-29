import React, { useState } from 'react';
import {
  Smartphone,
  GitBranch,
  Bell,
  FastForward,
  RotateCcw,
  Sparkles,
  Cpu,
  MessageSquare,
  Star,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { GeminiChatbot } from './components/GeminiChatbot';
import { ReflectionModeOverlay } from './components/ReflectionModeOverlay';
import { SimulatedTask, NotificationPayload } from './types';
import { addMinutesToTime } from './utils/timeHelpers';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'chat' | 'architecture'>('simulator');
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [coachInjectedPrompt, setCoachInjectedPrompt] = useState<string | undefined>(undefined);

  // Initial tasks state matching an intentional daily focus timetable
  const [tasks, setTasks] = useState<SimulatedTask[]>([
    {
      id: 1,
      title: "Architecture & Core Focus Blocks",
      startTime: "09:00",
      endTime: "10:30",
      category: "DEEP_WORK",
      status: "COMPLETED",
      bufferMinutes: 15,
      rescheduledCount: 0
    },
    {
      id: 2,
      title: "Strategic Contract Sync & Standup",
      startTime: "10:45",
      endTime: "11:30",
      category: "MEETING",
      status: "PENDING",
      bufferMinutes: 15,
      rescheduledCount: 0
    },
    {
      id: 3,
      title: "Autonomous AI Pipeline Validation",
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
  ]);

  // Active notification state for simulating high-priority check-in broadcast
  const [activeNotification, setActiveNotification] = useState<NotificationPayload | null>({
    taskId: 2,
    taskTitle: "Strategic Contract Sync & Standup",
    category: "MEETING",
    endTime: "11:30",
    timestamp: "11:30:00"
  });

  // Domino Rescheduling Logic
  const handleActionSnooze30 = (taskId: number) => {
    setActiveNotification(null);

    setTasks(prevTasks => {
      const currentTask = prevTasks.find(t => t.id === taskId);
      if (!currentTask) return prevTasks;

      return prevTasks.map(task => {
        // If it's the target task, extend its end time by +30m
        if (task.id === taskId) {
          return {
            ...task,
            endTime: addMinutesToTime(task.endTime, 30),
            status: 'RESCHEDULED',
            rescheduledCount: (task.rescheduledCount || 0) + 1
          };
        }

        // Domino effect: if downstream and starts at or after current task start, push both start and end by +30m
        if (task.startTime >= currentTask.startTime && task.status !== 'COMPLETED') {
          return {
            ...task,
            startTime: addMinutesToTime(task.startTime, 30),
            endTime: addMinutesToTime(task.endTime, 30),
            status: 'RESCHEDULED',
            rescheduledCount: (task.rescheduledCount || 0) + 1
          };
        }

        return task;
      });
    });
  };

  const handleActionDone = (taskId: number) => {
    setActiveNotification(null);
    setTasks(prevTasks =>
      prevTasks.map(task => (task.id === taskId ? { ...task, status: 'COMPLETED' } : task))
    );
  };

  const handleTriggerAlarm = (task?: SimulatedTask) => {
    const target = task || tasks.find(t => t.status !== 'COMPLETED') || tasks[0];
    if (target) {
      setActiveNotification({
        taskId: target.id,
        taskTitle: target.title,
        category: target.category,
        endTime: target.endTime,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  };

  const handleResetSchedule = () => {
    setTasks([
      {
        id: 1,
        title: "Architecture & Core Focus Blocks",
        startTime: "09:00",
        endTime: "10:30",
        category: "DEEP_WORK",
        status: "COMPLETED",
        bufferMinutes: 15,
        rescheduledCount: 0
      },
      {
        id: 2,
        title: "Strategic Contract Sync & Standup",
        startTime: "10:45",
        endTime: "11:30",
        category: "MEETING",
        status: "PENDING",
        bufferMinutes: 15,
        rescheduledCount: 0
      },
      {
        id: 3,
        title: "Autonomous AI Pipeline Validation",
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
    ]);
  };

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingCount = tasks.filter(t => t.status !== 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-[#0c0e14]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  Aura • AI Accountability & Timetable Coach
                </h1>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Reflection Mode Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Daily focus blocks, domino rescheduling, and nightly friction diagnostics
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center bg-[#141824] p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Interactive Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aura AI Coach (Gemini)</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>4 Behavioral Loops</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulator Quick Action Toolbar */}
      {activeTab === 'simulator' && (
        <div className="bg-[#10141f] border-b border-slate-800/80 py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-slate-400 font-medium">Interactive Behavioral Testing:</span>
              <div className="flex items-center space-x-2 text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700/60 font-mono">
                <span>{completedCount} Completed</span>
                <span className="text-slate-500">•</span>
                <span>{pendingCount} Pending</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => handleTriggerAlarm()}
                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulate Alarm Check-In</span>
              </button>

              <button
                onClick={() => {
                  const pending = tasks.find(t => t.status !== 'COMPLETED');
                  if (pending) handleActionSnooze30(pending.id);
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>+30m Domino Ripple</span>
              </button>

              {/* Dedicated Reflection Mode button */}
              <button
                onClick={() => setIsReflectionOpen(true)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />
                <span>Reflection Mode</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition active:scale-95 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                <span>Ask AI Coach</span>
              </button>

              <button
                onClick={handleResetSchedule}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl transition"
                title="Reset timetable to default state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Device Simulator */}
            <div className="lg:col-span-5 flex justify-center">
              <PhoneSimulator
                tasks={tasks}
                onTasksChange={setTasks}
                activeNotification={activeNotification}
                onTriggerNotification={handleTriggerAlarm}
                onDismissNotification={() => setActiveNotification(null)}
                onActionDone={handleActionDone}
                onActionSnooze30={handleActionSnooze30}
                onOpenReflection={() => setIsReflectionOpen(true)}
              />
            </div>

            {/* Right: Real-time System Telemetry & Behavioral Explainers */}
            <div className="lg:col-span-7 space-y-4">
              {/* Architecture Context Banner */}
              <div className="bg-[#141824] border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Cpu className="w-4 h-4" />
                  <span>Autonomous Accountability Engine Active</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Intentional Focus & Friction Diagnostics
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Aura operates on a proactive behavioral loop: plan bedtime blocks, execute with high-priority check-in alarms, adapt immediately to unexpected delay via domino rescheduling, and conduct nightly friction diagnostics to pinpoint root causes.
                </p>

                {/* Key Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Buffer Calibration</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">15–30 Min Resets</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Prevents cognitive debt</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Execution Check-In</div>
                    <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">Actionable Prompts</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Zero-latency Doze wakeups</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Domino Cascade</div>
                    <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">Downstream Ripple</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Eliminates failure panic</div>
                  </div>
                </div>
              </div>

              {/* Reflection Mode Promo Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-[#141824] border border-amber-500/30 shadow-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                      Evening Reflection Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Rate today's performance from 1 to 5 stars, log primary friction points, and review your historical accountability streak.
                  </p>
                </div>
                <button
                  onClick={() => setIsReflectionOpen(true)}
                  className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center space-x-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-black" />
                  <span>Rate Today →</span>
                </button>
              </div>

              {/* Chatbot Promo Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/20 border border-indigo-500/30 shadow-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                      Live AI Coaching Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Have questions about your schedule or feeling procrastination friction? Chat directly with Aura powered by Gemini 3.8 Flash.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open AI Chat →</span>
                </button>
              </div>

              {/* Behavioral Loops Step-by-Step Interactive Guide */}
              <div className="bg-[#141824] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  The 4 Autonomous Behavioral Steps:
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Bedtime Brain Dump</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Tap <span className="text-indigo-400 font-semibold">"Bedtime Brain Dump"</span> on the phone bottom bar. Input unstructured intentions and watch the AI extract scheduled blocks with realistic buffers.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Day Execution & Actionable Notifications</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Click <span className="text-indigo-400 font-semibold">"Simulate Alarm Check-In"</span> above to trigger the check-in notification tray with two instant actions: <strong>"Done"</strong> and <strong>"+30 Mins (Domino)"</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Domino Rescheduling Cascade</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Press <span className="text-amber-400 font-semibold">"+30 Mins"</span> on the notification tray or card. Watch the active block extend and all subsequent blocks automatically shift forward by 30 mins.
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0c0e14] border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Evening Friction Diagnostic & Reflection Mode</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Tap <span className="text-amber-400 font-semibold">"Reflection Mode"</span> above or on the phone. Rate performance (1–5 stars), record primary friction points, view your multi-day streak, and extract behavioral antidotes for tomorrow.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gemini Chatbot Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl w-full mx-auto">
            <GeminiChatbot
              tasks={tasks}
              initialPrompt={coachInjectedPrompt}
              onClearInitialPrompt={() => setCoachInjectedPrompt(undefined)}
            />
          </div>
        )}

        {/* 4 Behavioral Loops Architecture View */}
        {activeTab === 'architecture' && <ArchitectureDiagram />}
      </main>

      {/* Dedicated Reflection Mode Overlay */}
      <ReflectionModeOverlay
        isOpen={isReflectionOpen}
        onClose={() => setIsReflectionOpen(false)}
        tasks={tasks}
        onOpenCoachWithNote={(prompt) => {
          setCoachInjectedPrompt(prompt);
          setActiveTab('chat');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090b10] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Aura • Daily Accountability & Timetable Coach</span>
          <span className="font-mono text-slate-400">Gemini 3.8 Flash • Behavioral Loop System</span>
        </div>
      </footer>
    </div>
  );
}
