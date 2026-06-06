import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export type DeepSeekMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type DeepSeekResponse = {
  content: string;
  tokensUsed: number;
};

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

const FALLBACK_ERROR_MESSAGE = "AI is taking a nap. Try again! 😴";

async function checkRateLimit(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new AIError("Must be logged in to use AI");
  
  const today = new Date().toISOString().split('T')[0];
  const usageRef = doc(db, 'ai_usage', user.uid);
  
  try {
    const snap = await getDoc(usageRef);
    if (!snap.exists()) {
      await setDoc(usageRef, { [today]: 1 });
    } else {
      const data = snap.data();
      const currentCount = data[today] || 0;
      if (currentCount >= 500) {
        throw new Error("Daily limit reached");
      }
      await updateDoc(usageRef, { [today]: increment(1) });
    }
  } catch (error) {
    console.error("Rate limit check failed:", error);
    if (error instanceof Error && error.message === "Daily limit reached") {
      throw new AIError("Daily AI limit reached (500/500)! Try again tomorrow.");
    }
    console.warn("Allowing request to proceed despite rate limit check failure.");
  }
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<DeepSeekResponse> {
  await checkRateLimit();

  const temperature = options?.temperature ?? 0.85;
  const maxTokens = options?.maxTokens ?? 1000;

  try {
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AIError(errorData.error?.message || FALLBACK_ERROR_MESSAGE);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
    };
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }
    throw new AIError(FALLBACK_ERROR_MESSAGE);
  }
}

export async function callDeepSeekStream(
  messages: DeepSeekMessage[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    await checkRateLimit();
  } catch (error: any) {
    onError(error.message || FALLBACK_ERROR_MESSAGE);
    return;
  }

  try {
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      onError(errorData.error?.message || FALLBACK_ERROR_MESSAGE);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("Failed to read response stream");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
    
    if (buffer && buffer.startsWith('data: ')) {
       const data = buffer.slice(6);
       if (data === '[DONE]') {
         onDone();
         return;
       }
       try {
         const parsed = JSON.parse(data);
         const content = parsed.choices[0]?.delta?.content;
         if (content) onChunk(content);
       } catch (e) {}
    }
    onDone();
  } catch (error) {
    onError(FALLBACK_ERROR_MESSAGE);
  }
}
