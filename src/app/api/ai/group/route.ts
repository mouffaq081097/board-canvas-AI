import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasObject } from '@/types/canvas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const { objects }: { objects: CanvasObject[] } = await req.json();

    if (!objects || objects.length < 2) {
      return NextResponse.json({ error: 'Select at least 2 objects' }, { status: 400 });
    }

    const noteList = objects
      .map((o, i) => `[${i}] id="${o.id}": "${o.content || '(empty)'}"`)
      .join('\n');

    const prompt = `You are organizing notes on an infinite canvas.

Group these notes into 2-4 thematic clusters:
${noteList}

Return ONLY valid JSON in this format:
{
  "clusters": [
    { "title": "Cluster Name", "ids": ["id1", "id2"] }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const { clusters } = JSON.parse(jsonMatch[0]);
    const objMap = new Map(objects.map((o) => [o.id, o]));

    // Position objects in their clusters
    const CLUSTER_SPACING = 300;
    const moves: { id: string; x: number; y: number }[] = [];

    clusters.forEach((cluster: { title: string; ids: string[] }, ci: number) => {
      const clusterX = ci * CLUSTER_SPACING;
      cluster.ids.forEach((id: string, ri: number) => {
        const obj = objMap.get(id);
        if (!obj) return;
        moves.push({
          id,
          x: clusterX + (ri % 2) * 220,
          y: Math.floor(ri / 2) * 220,
        });
      });
    });

    return NextResponse.json({ moves, clusters });
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
