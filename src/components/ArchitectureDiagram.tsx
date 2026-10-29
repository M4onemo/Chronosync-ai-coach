import React from 'react';
import {
  Moon,
  Clock,
  FastForward,
  TrendingUp,
  Database,
  Cpu,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="bg-[#141824] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            System Architecture & The 4 Daily Behavioral Loops
          </h3>
          <p className="text-xs text-slate-400">
            Offline Android system integration: Clean Architecture, Jetpack Compose, Room SQLite, AlarmManager & MediaPipe
          </p>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-semibold">
          100% Offline • Zero Network Traffic
        </span>
      </div>

      {/* Grid of the 4 loops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Loop 1: Bedtime Planning */}
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-purple-500/30 hover:border-purple-500/50 transition">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Moon className="w-4 h-4" />
            <span>1. Bedtime Planning Loop</span>
          </div>
          <div className="text-xs font-semibold text-white mb-1">
            Freeform Brain Dump → Memory-Mapped MediaPipe GenAI
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            User voice or text dump is processed by on-device <code className="text-purple-300 font-mono">model.bin</code> via MediaPipe Tasks GenAI. Outputs strict JSON timetable with 10–15m buffers between blocks.
          </p>
          <div className="bg-slate-900/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between">
            <span>BedtimePlannerBottomSheet</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mx-1" />
            <span>MediaPipeAIEngine</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mx-1" />
            <span className="text-emerald-400">Room SQLite</span>
          </div>
        </div>

        {/* Loop 2: Day Execution & Alarms */}
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-blue-500/30 hover:border-blue-500/50 transition">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" />
            <span>2. Day Execution & Actionable Alarms</span>
          </div>
          <div className="text-xs font-semibold text-white mb-1">
            AlarmManager RTC_WAKEUP → Actionable Notification Tray
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Exact alarms fire at each block's completion time, piercing Doze mode via <code className="text-blue-300 font-mono">setExactAndAllowWhileIdle</code>. Posts high-priority notification with "Done" and "+30 Mins" tray buttons.
          </p>
          <div className="bg-slate-900/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between">
            <span>AlarmScheduler</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mx-1" />
            <span>CheckInReceiver</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mx-1" />
            <span className="text-cyan-400">Notification Tray</span>
          </div>
        </div>

        {/* Loop 3: Domino Rescheduling Engine */}
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-amber-500/30 hover:border-amber-500/50 transition">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <FastForward className="w-4 h-4" />
            <span>3. Domino Rescheduling Cascade</span>
          </div>
          <div className="text-xs font-semibold text-white mb-1">
            Zero-Latency Ripple via TaskActionReceiver (goAsync)
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Clicking "+30m" in notification executes <code className="text-amber-300 font-mono">TaskActionReceiver</code> on Dispatchers.IO: extends active task, shifts all downstream tasks forward by 30m, and re-registers future alarms.
          </p>
          <div className="bg-slate-900/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between">
            <span>Notification Tray</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mx-1" />
            <span>TaskActionReceiver</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mx-1" />
            <span className="text-amber-300">Reschedule Alarms</span>
          </div>
        </div>

        {/* Loop 4: Evening Friction Diagnostic */}
        <div className="p-4 rounded-2xl bg-[#0c0e14] border border-emerald-500/30 hover:border-emerald-500/50 transition">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>4. Evening Friction Diagnostic</span>
          </div>
          <div className="text-xs font-semibold text-white mb-1">
            Friction Tagging → 1 Tactical Tip for Tomorrow
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Incomplete tasks are tagged by root cause (Low Energy, Distraction, Poor Estimation, Emergency). On-device LLM summarizes wins and prescribes 1 concrete behavioral intervention for tomorrow.
          </p>
          <div className="bg-slate-900/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between">
            <span>EveningReviewDialog</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mx-1" />
            <span>AI Friction Diagnostic</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mx-1" />
            <span className="text-emerald-300">DailyReflectionEntity</span>
          </div>
        </div>
      </div>

      {/* Architecture Highlights Bar */}
      <div className="p-4 rounded-2xl bg-[#0c0e14] border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-white">Room SQLite 2.6.1:</span>
          <span className="text-slate-400">TypeConverters for java.time.LocalDate & LocalTime</span>
        </div>
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white">MediaPipe GenAI:</span>
          <span className="text-slate-400">aaptOptions noCompress model.bin memory mapping</span>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">AlarmManager:</span>
          <span className="text-slate-400">Exact RTC_WAKEUP alarms in Doze mode</span>
        </div>
      </div>
    </div>
  );
};
