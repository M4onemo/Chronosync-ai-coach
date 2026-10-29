import { SimulatedTask, DailyReflection, FrictionReason } from '../types';
import { addMinutesToTime } from './timeHelpers';

export async function simulateMediaPipeInference(
  brainDump: string,
  onTokenChunk?: (chunk: string) => void
): Promise<SimulatedTask[]> {
  // Simulate on-device token generation latency
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Determine tasks based on user input keywords or smart heuristic parser
  const lines = brainDump
    .split(/\n|\.|\band\b/i)
    .map(s => s.trim().replace(/^[-*•\d.)\s]+/, ''))
    .filter(s => s.length > 3);

  const fallbackTasks = [
    { title: "Core Architecture Refactoring", category: "DEEP_WORK" as const, duration: 90, buffer: 15 },
    { title: "Stakeholder API Sync", category: "MEETING" as const, duration: 45, buffer: 15 },
    { title: "MediaPipe GenAI On-Device Testing", category: "DEEP_WORK" as const, duration: 90, buffer: 30 },
    { title: "Interval Cardio & Mobility Session", category: "HEALTH" as const, duration: 60, buffer: 15 },
    { title: "Evening Code Review & PR Triage", category: "ADMIN" as const, duration: 45, buffer: 15 }
  ];

  const generatedItems = lines.length >= 2 ? lines.slice(0, 5).map((line, idx) => {
    const isMeeting = /meet|sync|call|discuss|standup/i.test(line);
    const isHealth = /gym|workout|run|walk|exercise|cardio|recovery/i.test(line);
    const isAdmin = /email|slack|triage|review|admin|organize|ticket/i.test(line);
    const isPersonal = /dinner|read|family|relax|meditate/i.test(line);

    const category = isMeeting
      ? ('MEETING' as const)
      : isHealth
      ? ('HEALTH' as const)
      : isAdmin
      ? ('ADMIN' as const)
      : isPersonal
      ? ('PERSONAL' as const)
      : ('DEEP_WORK' as const);

    const duration = isMeeting ? 45 : isHealth ? 60 : isAdmin ? 30 : 90;

    return {
      title: line.charAt(0).toUpperCase() + line.slice(1),
      category,
      duration,
      buffer: 15
    };
  }) : fallbackTasks;

  // Simulate token stream
  const jsonMock = JSON.stringify(generatedItems, null, 2);
  for (let i = 0; i < jsonMock.length; i += 24) {
    if (onTokenChunk) {
      onTokenChunk(jsonMock.slice(0, i + 24));
    }
    await delay(25);
  }

  // Build chronological blocks starting at 09:00
  let cursorTime = "09:00";
  const tasks: SimulatedTask[] = [];

  generatedItems.forEach((item, index) => {
    const startTime = cursorTime;
    const endTime = addMinutesToTime(startTime, item.duration);
    tasks.push({
      id: Date.now() + index,
      title: item.title,
      startTime,
      endTime,
      category: item.category,
      status: 'PENDING',
      bufferMinutes: item.buffer,
      rescheduledCount: 0
    });
    cursorTime = addMinutesToTime(endTime, item.buffer);
  });

  return tasks;
}

export function generateDailyReflection(tasks: SimulatedTask[]): DailyReflection {
  const completed = tasks.filter(t => t.status === 'COMPLETED');
  const incomplete = tasks.filter(t => t.status !== 'COMPLETED');
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Determine dominant friction
  const frictionCounts: Record<FrictionReason, number> = {
    LOW_ENERGY: 0,
    DISTRACTION: 0,
    POOR_ESTIMATION: 0,
    EMERGENCY: 0
  };

  incomplete.forEach(t => {
    if (t.frictionReason) {
      frictionCounts[t.frictionReason] = (frictionCounts[t.frictionReason] || 0) + 1;
    }
  });

  let dominantFriction: FrictionReason | undefined = undefined;
  let maxCount = 0;
  const reasons: FrictionReason[] = ['LOW_ENERGY', 'DISTRACTION', 'POOR_ESTIMATION', 'EMERGENCY'];
  for (const reason of reasons) {
    if (frictionCounts[reason] > maxCount) {
      maxCount = frictionCounts[reason];
      dominantFriction = reason;
    }
  }

  if (!dominantFriction && incomplete.length > 0) {
    dominantFriction = 'POOR_ESTIMATION';
  }

  let winsSummary = "High focus execution across scheduled morning blocks.";
  if (completed.length > 0) {
    winsSummary = `Conquered ${completed.length} scheduled focus blocks today including '${completed[0].title}'. Protected key cognitive energy windows.`;
  } else {
    winsSummary = "Maintained awareness to initiate the evening diagnostic cycle and analyze friction honestly.";
  }

  let frictionAnalysis = "Identified smooth day execution with minimal disruptions.";
  let actionableTip = "Maintain this exact sleep and morning routine tomorrow to preserve psychological momentum.";

  if (dominantFriction === 'LOW_ENERGY') {
    frictionAnalysis = "Energy depletion occurred during afternoon blocks. Tasks required more stamina than scheduled.";
    actionableTip = "Cap deep cognitive sessions at 75 minutes maximum and insert a mandatory 20-minute physical walk at 14:00.";
  } else if (dominantFriction === 'DISTRACTION') {
    frictionAnalysis = "Context switching and unshielded digital notifications fragmented sustained attention.";
    actionableTip = "Enable Android Do Not Disturb work profile 10 minutes before your first morning block starts.";
  } else if (dominantFriction === 'POOR_ESTIMATION') {
    frictionAnalysis = "Task scopes exceeded planned block allocations, triggering downstream domino delays.";
    actionableTip = "Apply a 25% extra buffer to your primary deep work task tomorrow evening during bedtime planning.";
  } else if (dominantFriction === 'EMERGENCY') {
    frictionAnalysis = "Unanticipated external interruptions derailed afternoon commitments.";
    actionableTip = "Leave a dedicated 45-minute blank 'Buffer & Triage' block at 15:30 tomorrow to absorb shocks.";
  }

  return {
    date: new Date().toISOString().split('T')[0],
    winsSummary,
    frictionAnalysis,
    completionRate,
    dominantFriction,
    actionableTip
  };
}
