import dotenv from 'dotenv';
dotenv.config();

// Unified usage counters for Gemini key rotation
class KeyRotationManager {
  private keys: string[];
  private lastResetDate: string;
  private counts: Record<string, { 'gemini-2.5-flash': number; 'gemini-2.5-flash-lite': number }>;
  private isRotationEnabled: boolean;

  constructor() {
    const rotatedKeys = [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_4,
      process.env.GEMINI_KEY_5,
    ].filter(Boolean) as string[];

    if (rotatedKeys.length > 0) {
      this.keys = rotatedKeys;
      this.isRotationEnabled = true;
    } else {
      this.keys = [process.env.GEMINI_API_KEY || ''].filter(Boolean);
      this.isRotationEnabled = false;
    }

    this.lastResetDate = new Date().toISOString().split('T')[0];
    this.counts = {};
    this.keys.forEach((k) => {
      this.counts[k] = { 'gemini-2.5-flash': 0, 'gemini-2.5-flash-lite': 0 };
    });
  }

  private checkReset() {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.lastResetDate = today;
      this.keys.forEach((k) => {
        this.counts[k] = { 'gemini-2.5-flash': 0, 'gemini-2.5-flash-lite': 0 };
      });
      console.log(`[KeyRotation] Usage counters reset for new UTC day: ${today}`);
    }
  }

  public getNextKey(model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'): string | null {
    if (!this.isRotationEnabled) {
      return this.keys[0] || null;
    }

    this.checkReset();
    for (const key of this.keys) {
      if (this.counts[key] && this.counts[key][model] < 20) {
        return key;
      }
    }
    return null;
  }

  public increment(key: string, model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite') {
    if (!this.isRotationEnabled) return;
    if (this.counts[key]) {
      this.counts[key][model]++;
      console.log(
        `[KeyRotation] Key ${key.substring(0, 10)}... incremented for ${model}: ${this.counts[key][model]}/20`
      );
    }
  }

  public exhaust(key: string, model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite') {
    if (!this.isRotationEnabled) return;
    if (this.counts[key]) {
      this.counts[key][model] = 20;
      console.log(`[KeyRotation] Key ${key.substring(0, 10)}... marked exhausted for ${model} today.`);
    }
  }
}

export const rotationManager = new KeyRotationManager();

/** True when at least one Gemini API key is configured (requestAI is Gemini-backed). */
export function isAIConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GEMINI_KEY_1 ||
      process.env.GEMINI_KEY_2 ||
      process.env.GEMINI_KEY_3 ||
      process.env.GEMINI_KEY_4 ||
      process.env.GEMINI_KEY_5
  );
}

// OCR & Diagram transcription using Gemini rotation
export async function transcribeImage(attachedImage: any): Promise<string> {
  const promptText =
    'Extract all text verbatim from this training doubt image. Write all mathematical equations, symbols, and formulas in standard LaTeX format. If there is a diagram, graph, or circuit, write a detailed textual description of its components, shapes, values, directions, and connections. Do not solve the question, only output the transcription.';

  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;

  for (const model of models) {
    let key = rotationManager.getNextKey(model);
    while (key !== null) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      try {
        console.log(`[AI Provider OCR] Translating image via Gemini (${model}) using key ${key.substring(0, 10)}...`);
        const geminiBody = {
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }, attachedImage],
            },
          ],
        };

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        });

        if (!res.ok) {
          const errData = await res.text();
          console.warn(`[AI Provider OCR] Gemini key error on ${model}: ${res.status} - ${errData}`);
          if (res.status === 429 || res.status === 403 || errData.includes('RESOURCE_EXHAUSTED')) {
            rotationManager.exhaust(key, model);
            key = rotationManager.getNextKey(model);
            continue;
          }
          break;
        }

        const data: any = await res.json();
        rotationManager.increment(key, model);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (err: any) {
        console.error(`[AI Provider OCR] Fetch exception on key ${key ? key.substring(0, 10) : 'unknown'}...:`, err.message);
        break;
      }
    }
  }

  return '';
}

/**
 * Speech-to-text for a live-class audio chunk, via Gemini audio understanding
 * (Phase 4). Mirrors transcribeImage's key rotation. Returns '' on any failure
 * or when no keys are configured, so the transcript pipeline degrades quietly
 * rather than throwing on a single dropped chunk.
 */
export async function transcribeAudio(base64Audio: string, mimeType = 'audio/wav'): Promise<string> {
  if (!base64Audio || !isAIConfigured()) return '';

  const promptText =
    'Transcribe this short audio clip from a live meteorology training class verbatim. ' +
    'Return only the spoken words as plain text, with no timestamps, speaker labels or commentary. ' +
    'If there is no intelligible speech, return an empty string.';
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;

  for (const model of models) {
    let key = rotationManager.getNextKey(model);
    while (key !== null) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      try {
        const geminiBody = {
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: base64Audio } }],
            },
          ],
        };
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        });
        if (!res.ok) {
          const errData = await res.text();
          console.warn(`[AI Provider STT] Gemini key error on ${model}: ${res.status} - ${errData}`);
          if (res.status === 429 || res.status === 403 || errData.includes('RESOURCE_EXHAUSTED')) {
            rotationManager.exhaust(key, model);
            key = rotationManager.getNextKey(model);
            continue;
          }
          break;
        }
        const data: any = await res.json();
        rotationManager.increment(key, model);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
        return '';
      } catch (err: any) {
        console.error(`[AI Provider STT] Fetch exception:`, err.message);
        break;
      }
    }
  }
  return '';
}

export async function requestAI(prompt: string, contextPrompt?: string, systemPrompt?: string): Promise<string> {
  const finalSystemPrompt =
    systemPrompt ||
    'You are an intelligent educational AI assistant for live training and capacity building. Be concise, precise, and supportive.';

  const geminiBody = {
    system_instruction: {
      parts: [{ text: finalSystemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: contextPrompt ? `${contextPrompt}\n\nUser Question:\n${prompt}` : prompt }],
      },
    ],
  };

  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;

  for (const model of models) {
    let key = rotationManager.getNextKey(model);
    while (key !== null) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      try {
        console.log(`[AI Provider] Querying Gemini (${model}) with key ${key.substring(0, 10)}...`);
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        });

        if (!res.ok) {
          const errData = await res.text();
          console.warn(`[AI Provider] Gemini error on ${model}: ${res.status} - ${errData}`);
          if (res.status === 429 || res.status === 403 || errData.includes('RESOURCE_EXHAUSTED')) {
            rotationManager.exhaust(key, model);
            key = rotationManager.getNextKey(model);
            continue;
          }
          break;
        }

        const data: any = await res.json();
        rotationManager.increment(key, model);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (err: any) {
        console.error(`[AI Provider] Fetch exception on key ${key ? key.substring(0, 10) : 'unknown'}...:`, err.message);
        break;
      }
    }
  }

  return 'AI Assistant is currently unavailable. Please check your Gemini API keys.';
}
