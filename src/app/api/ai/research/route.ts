import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface ResearchResponse {
  pages: { title: string; contentHtml: string }[];
  media: { query: string; alt: string }[];
}

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  try {
    const { title }: { title: string } = await req.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'No book title provided' }, { status: 400 });
    }

    const prompt = `You are an expert researcher. The user is writing a book or compiling notes on the topic: "${title}".
Generate 3 to 5 highly informative, well-structured pages of content about this topic.
Also, suggest 1 to 3 visual media concepts that would look good on a moodboard for this topic.

Rules for pages:
- Each page needs a concise 'title'
- 'contentHtml' must use simple HTML tags compatible with a rich text editor (e.g., <h1>, <h2>, <p>, <ul>, <li>, <strong>). Do NOT use markdown.

Rules for media:
- Provide a short, descriptive 1-3 word 'query' that can be used to search for an image (e.g., "cyberpunk city", "vintage map").
- Provide a short 'alt' description.

Return ONLY valid JSON with no prose:
{
  "pages": [
    { "title": "Introduction to X", "contentHtml": "<h2>Overview</h2><p>...</p>" }
  ],
  "media": [
    { "query": "space nebula", "alt": "A colorful space nebula" }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 400 });
    }

    const data: ResearchResponse = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(data.pages) || data.pages.length === 0) {
      return NextResponse.json({ error: 'AI response missing pages' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Research AI Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
