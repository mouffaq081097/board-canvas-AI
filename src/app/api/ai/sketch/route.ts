import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasObject } from '@/types/canvas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const { objects }: { objects: CanvasObject[] } = await req.json();
    const obj = objects?.[0];

    if (!obj || obj.type !== 'drawing' || !obj.metadata?.pathData) {
      return NextResponse.json({ error: 'Select a drawing to clean up' }, { status: 400 });
    }

    const prompt = `You are an SVG vector graphics expert. A user drew a rough sketch described by this SVG path (in a ${obj.width}x${obj.height} space):

${obj.metadata.pathData}

Identify the intended shape (circle, rectangle, triangle, arrow, etc.) and return a clean, symmetrical SVG path that fits within a ${obj.width}x${obj.height} bounding box.

Return ONLY valid JSON in this format:
{
  "shapeType": "circle",
  "pathData": "M ... (clean SVG path)"
}
The shapeType should be one of: "circle", "rectangle", "arrow", "triangle".`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const res = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      object: {
        type: 'shape',
        metadata: {
          shapeType: res.shapeType,
          pathData: res.pathData,
        },
      },
    });
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
