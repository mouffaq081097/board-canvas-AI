import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasObject } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const { objects }: { objects: CanvasObject[] } = await req.json();

    if (!objects?.length) {
      return NextResponse.json({ error: 'No objects provided' }, { status: 400 });
    }

    const allText = objects
      .map((o) => o.content || o.metadata?.pages?.map((p) => p.content).join('\n') || '')
      .filter(Boolean)
      .join('\n\n---\n\n');

    const prompt = `Summarize these notes into a structured book with 3-5 sections.

Notes:
${allText}

Return ONLY valid JSON in this format:
{
  "title": "Book Title",
  "pages": [
    { "heading": "Introduction", "content": "..." },
    { "heading": "Section 1", "content": "..." }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const { title, pages } = JSON.parse(jsonMatch[0]);

    // Find a good position (near the selected objects)
    const avgX = objects.reduce((s, o) => s + o.x, 0) / objects.length;
    const avgY = objects.reduce((s, o) => s + o.y, 0) / objects.length;

    const book: Omit<CanvasObject, 'id'> = {
      type: 'book',
      x: avgX + 300,
      y: avgY,
      width: 160,
      height: 220,
      content: title,
      style: {
        backgroundColor: '#4f46e5',
        spineColor: '#3730a3',
      },
      metadata: {
        pages: pages.map((p: { heading: string; content: string }) => ({
          id: uuidv4(),
          content: `# ${p.heading}\n\n${p.content}`,
        })),
      },
    };

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
