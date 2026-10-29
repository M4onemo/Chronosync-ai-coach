import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_ROLES: Record<string, string> = {
  tactical: `You are Aura, an elite AI Accountability Coach and Timetable Optimization Strategist.
Your mission is to help the user design, protect, and execute an intentional daily focus schedule without burnout or friction.

Core Coaching Directives:
1. Schedule Awareness: Deep work blocks need 10-15m recovery buffers. Help the user prioritize high-impact cognitively demanding work during morning peaks.
2. Domino Mindset: When delays happen, shift downstream blocks gracefully instead of giving up.
3. Behavioral Diagnostics: Address root causes of procrastination (Low Energy, Distraction, Poor Estimation, or Emergency).
4. Formatting: Keep answers actionable, concise, and structured with bold highlights and crisp bullet points.`,

  discipline: `You are Aura in "High Discipline & Action" mode.
You are a firm, high-standards accountability partner. You cut through hesitation, overthinking, and rationalizations with direct, respectful clarity.

Core Directives:
1. Bias toward immediate action (e.g., 5-minute activation threshold).
2. Challenge excuses calmly and push the user to start their current task right now.
3. Keep answers punchy, motivating, and focused on physical and digital environment lockdown.`,

  mindful: `You are Aura in "Habit Scientist & Mindful Performance" mode.
You provide compassionate, neuroscience-grounded guidance to reduce guilt, anxiety, and task friction.

Core Directives:
1. Normalize imperfect execution and eliminate all-or-nothing thinking.
2. Recommend nervous system regulation (box breathing, quick walk, hydration) before starting intimidating tasks.
3. Help the user break overwhelming tasks into micro-steps.`
};

function getTacticalFallbackReply(
  prompt: string,
  persona: string,
  schedule: Array<{ title: string; time?: string; status?: string; bufferMinutes?: number }>
): string {
  const p = prompt.toLowerCase();

  if (p.includes('procrastinat') || p.includes('start') || p.includes('resist') || p.includes('begin')) {
    if (persona === 'discipline') {
      return `**Action beats overthinking every single time.**

Here is what you do right now:
1. **Zero Multitasking**: Close every browser tab except the one needed for your task. Put your phone in another room.
2. **The 3-Minute Rule**: Don't commit to finishing the block. Commit to typing the first sentence or opening the file for 180 seconds.
3. **Timer On**: Set a 25-minute timer. Move immediately. Momentum starts with motion.`;
    }
    return `### 3-Step Low-Friction Activation Protocol

When you feel friction starting a focus block, your brain perceives high cognitive startup cost:
1. **Micro-Step Reduction**: Shrink the first step down until resistance disappears (e.g. "open the document and write 1 line").
2. **Regulate Nervous System**: Take 3 physiological sighs (two quick inhales through the nose, long sigh out through the mouth) to drop cortisol.
3. **Protect the First 5 Minutes**: Commit to just 5 minutes of low-pressure engagement. Once dopamine kicks in, continuation is effortless.`;
  }

  if (p.includes('delay') || p.includes('30') || p.includes('domino') || p.includes('behind') || p.includes('late')) {
    return `### Managing the Domino Effect Without Guilt

A schedule delay is **data, not failure**. Here is how to recalibrate:
* **Apply the +30m Ripple**: Shift your downstream start and end times by 30 minutes. Notice that your buffers absorb some of the shock.
* **Triage the Non-Negotiable**: Identify the 1 most critical remaining block for today. Keep that sacred.
* **Compress Administrative Work**: If needed, shave 15 minutes off email/admin blocks later in the afternoon rather than sacrificing sleep or recovery.`;
  }

  if (p.includes('slump') || p.includes('afternoon') || p.includes('energy') || p.includes('tired')) {
    return `### Preventing the Circadian Afternoon Dip

Around 14:00 - 15:30, core body temperature drops naturally:
* **Cognitive Downgrade**: Move intense analytical deep work to the morning window. Reserve afternoons for execution, meetings, or administrative triage.
* **15-Minute Sunlight Walk**: Natural light and optical flow reset adenosine levels and restore mental clarity.
* **Calibrate Buffers**: Ensure you have a 15–20 minute buffer between your afternoon blocks rather than back-to-back scheduling.`;
  }

  if (p.includes('review') || p.includes('schedule') || p.includes('timetable') || p.includes('today') || p.includes('buffer')) {
    const total = schedule.length;
    const completed = schedule.filter(s => s.status === 'COMPLETED').length;
    const pending = schedule.filter(s => s.status !== 'COMPLETED').length;

    return `### Daily Timetable Assessment (${total} Blocks Total)

* **Current Progress**: **${completed} completed** / **${pending} pending**.
* **Buffer Quality**: Your schedule includes 15–30 minute buffers between key focus sessions. This protects your nervous system from cognitive task-switching drag.
* **Strategic Recommendation**: Focus exclusively on your next pending block. When that concludes, take your scheduled transition buffer before touching anything else.`;
  }

  if (persona === 'discipline') {
    return `**Direct Accountability Assessment:**
* Your focus is your highest leverage asset. What block is currently scheduled?
* If you have an active task right now, close this window and put your hands on the keyboard.
* If you need a schedule adjustment, trigger the **+30m Domino** ripple and get back into execution mode.`;
  }

  return `### Aura Coaching Guidance

I'm monitoring your daily timetable. Here are two strategic focus principles for your day:
1. **Protect Deep Work**: Guard your morning focus blocks against casual Slack messages and notifications.
2. **Honor Buffers**: Use your 15-minute buffers for physical movement or eyes-closed breathing—not scrolling on your phone.

Would you like to analyze a specific block or adjust your afternoon timeline?`;
}

// Multi-turn chat endpoint using gemini-3.8-flash with resilient fallback
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, coachPersona = 'tactical', currentSchedule = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastMessage = messages[messages.length - 1];

    if (!apiKey) {
      const fallback = getTacticalFallbackReply(lastMessage.content, coachPersona, currentSchedule);
      return res.json({ reply: fallback });
    }

    const baseInstruction = SYSTEM_ROLES[coachPersona] || SYSTEM_ROLES.tactical;
    const scheduleContext = currentSchedule.length > 0
      ? `\n\nACTIVE USER SCHEDULE TODAY:\n${JSON.stringify(currentSchedule, null, 2)}\n\nRefer to their actual tasks, times, and completion status when relevant.`
      : '';

    const systemInstruction = `${baseInstruction}${scheduleContext}`;

    // Map conversation history
    const history = messages.slice(0, -1).map((m: { role: 'user' | 'model' | 'assistant'; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      history,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // 8-second timeout race to guarantee instant snappy user feedback
    const geminiPromise = chat.sendMessage({
      message: lastMessage.content,
    });

    const timeoutPromise = new Promise<{ text?: string }>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_OR_NETWORK_LATENCY')), 8000);
    });

    try {
      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const reply = result.text || getTacticalFallbackReply(lastMessage.content, coachPersona, currentSchedule);
      return res.json({ reply });
    } catch (genErr) {
      console.warn('Gemini 3.8 Flash API latency fallback:', genErr);
      const fallback = getTacticalFallbackReply(lastMessage.content, coachPersona, currentSchedule);
      return res.json({ reply: fallback });
    }
  } catch (err: any) {
    console.error('Chat error in /api/chat:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate response from Gemini AI.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Server running on port ${PORT}`);
  });
}

startServer();
