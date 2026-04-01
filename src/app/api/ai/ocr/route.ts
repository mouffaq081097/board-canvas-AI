import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CanvasObject } from '@/types/canvas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function POST(req: NextRequest) {
  try {
    const { objects, imageBase64 }: { objects: CanvasObject[]; imageBase64?: string } =
      await req.json();
    const obj = objects?.[0];

    if (!obj && !imageBase64) {
      return NextResponse.json({ error: 'No object provided' }, { status: 400 });
    }

    let text = '';

    if (imageBase64) {
      // Remove data:image/png;base64, prefix if it exists
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        },
        { text: 'Extract any handwritten or drawn text from this image. Return just the extracted text, nothing else. If no text is found, return "No text found".' },
      ]);
      text = result.response.text().trim();
    } else if (obj?.metadata?.pathData) {
      const prompt = `This SVG path represents a hand-drawn element: ${obj.metadata.pathData.slice(0, 500)}. If this looks like handwritten text, guess what letters/words it represents. Otherwise return "No text detected".`;
      const result = await model.generateContent(prompt);
      text = result.response.text().trim();
    } else {
      return NextResponse.json({ error: 'No drawable content found' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
