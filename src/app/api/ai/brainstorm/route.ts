import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasObject } from '@/types/canvas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const { objects }: { objects: CanvasObject[] } = await req.json();

    if (!objects?.length) {
      return NextResponse.json({ error: 'No objects provided' }, { status: 400 });
    }

    const sourceObject = objects[0];
    const sourceText = sourceObject.content || '(empty note)';

    const prompt = `You are a creative brainstorming assistant for an infinite canvas app.

Given this note: "${sourceText}"

Generate exactly 5 short, related ideas (each 3-10 words). Return ONLY valid JSON in this format:
{
  "ideas": ["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const { ideas } = JSON.parse(jsonMatch[0]);

    const OFFSETS = [
      { dx: -260, dy: -100 },
      { dx: 220, dy: -100 },
      { dx: -260, dy: 140 },
      { dx: 220, dy: 140 },
      { dx: -20, dy: 240 },
    ];

    const notes = ideas.map((idea: string, i: number) => ({
      type: 'sticky' as const,
      x: sourceObject.x + OFFSETS[i].dx,
      y: sourceObject.y + OFFSETS[i].dy,
      width: 200,
      height: 120,
      content: idea,
      style: {
        backgroundColor: '#f3e8ff',
        textColor: '#1a1a1a',
        fontFamily: 'caveat',
        fontSize: 18,
        opacity: 1,
      },
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
