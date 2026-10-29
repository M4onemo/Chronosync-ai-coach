export type TaskStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'RESCHEDULED';

export type FrictionReason = 'LOW_ENERGY' | 'DISTRACTION' | 'POOR_ESTIMATION' | 'EMERGENCY';

export interface SimulatedTask {
  id: number;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  category: 'DEEP_WORK' | 'MEETING' | 'HEALTH' | 'ADMIN' | 'PERSONAL';
  status: TaskStatus;
  frictionReason?: FrictionReason;
  bufferMinutes: number;
  rescheduledCount?: number;
  originalStartTime?: string;
}

export interface DailyReflection {
  date: string;
  winsSummary: string;
  frictionAnalysis: string;
  completionRate: number;
  dominantFriction?: FrictionReason;
  actionableTip: string;
}

export interface NotificationPayload {
  taskId: number;
  taskTitle: string;
  category: string;
  endTime: string;
  timestamp: string;
}

export interface UserDayReflection {
  id: string;
  date: string;
  rating: number; // 1 to 5 stars
  frictionNote: string;
  primaryFrictionTag?: FrictionReason;
  completionRate: number;
  completedTasksCount: number;
  totalTasksCount: number;
  aiAntidote?: string;
  timestamp: string;
}

