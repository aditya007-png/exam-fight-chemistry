// aiService.ts – generates AI answer options for MCQ stems
import { McqOption } from '../types/mcq';

export async function generateAiOptions(stem: string): Promise<McqOption[]> {
  // Placeholder: real implementation would call an LLM endpoint
  const letters = ['A', 'B', 'C', 'D'];
  const preview = stem.length > 30 ? stem.substring(0, 30) + '...' : stem;
  return letters.map((l) => ({ text: 'Option ' + l + ': (AI-generated for: ' + preview + ')' }));
}

