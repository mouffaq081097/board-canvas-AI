import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TodoItem } from '@/types/canvas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface RoadmapNode {
  id: string;
  label: string;
  duration: string;
  depth: number;
  branch: number;
}

interface RoadmapEdge {
  from: string;
  to: string;
}

interface RoadmapResponse {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export async function POST(req: NextRequest) {
  try {
    const { todos }: { todos: TodoItem[] } = await req.json();

    if (!todos?.length) {
      return NextResponse.json({ error: 'No todos provided' }, { status: 400 });
    }

    const todoList = todos.map((t, i) => `${i + 1}. ${t.text}`).join('\n');

    const prompt = `You are a project planning assistant. Given these tasks, create a dependency graph.

Tasks:
${todoList}

Rules:
- Tasks that depend on others must come after them (higher depth)
- Tasks that can run in parallel share the same depth but different branch values
- depth starts at 0 (first column of tasks)
- branch starts at 0 within each depth level and increments by 1 for each parallel task
- Each (depth, branch) pair must be unique
- Estimate a realistic duration for each task (e.g. "2 days", "1 week", "3 hours")
- Keep labels concise (under 6 words)

Return ONLY valid JSON with no prose:
{
  "nodes": [
    { "id": "n1", "label": "short label", "duration": "X days", "depth": 0, "branch": 0 }
  ],
  "edges": [
    { "from": "n1", "to": "n2" }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 400 });
    }

    const data: RoadmapResponse = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return NextResponse.json({ error: 'AI response missing nodes or edges' }, { status: 400 });
    }

    // Validate unique (depth, branch) pairs
    const positions = new Set(data.nodes.map((n) => `${n.depth},${n.branch}`));
    if (positions.size !== data.nodes.length) {
      return NextResponse.json({ error: 'AI returned duplicate depth/branch positions' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Roadmap AI Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI error' },
      { status: 500 }
    );
  }
}
