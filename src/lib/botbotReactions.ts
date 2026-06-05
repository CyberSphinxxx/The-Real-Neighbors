import { callDeepSeek } from './deepseek';
import { Botbot_SYSTEM_PROMPT } from './botbotPersonality';
import type { Post } from '../types';

export const generateBotbotReaction = async (post: Post, reactionCount: number): Promise<string> => {
  const userPrompt = `React to this post from our friend group with a short casual comment. Post content: '${post.content}'
${post.imageUrl ? 'It has an image attached.' : ''}
${post.linkUrl ? 'It includes a link.' : ''}
Total reactions so far: ${reactionCount}

Write a SINGLE short reaction comment (max 15 words).
Casual Taglish. Funny or hype or relatable — match the post's energy. No explanation. Just the comment itself.
Examples of good reactions:
- 'grabe itong to pre 😭'
- 'solid lodi 🔥'
- 'need. sobrang need.'
- 'eto na ang sign na pinaghihintay ko'
- 'charot pero totoo 😂'`;

  const response = await callDeepSeek(
    [
      { role: 'system', content: Botbot_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    {
      temperature: 0.85,
      maxTokens: 50 // Keep it short
    }
  );

  let result = response.content.trim();
  // Clean up any quotes if DeepSeek wrapped the result in them
  if (result.startsWith('"') && result.endsWith('"')) {
    result = result.slice(1, -1);
  }
  if (result.startsWith("'") && result.endsWith("'")) {
    result = result.slice(1, -1);
  }
  
  return result;
};
