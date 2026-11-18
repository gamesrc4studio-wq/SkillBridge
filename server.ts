import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractReadableError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) return String(parsed.error.message);
  } catch {
    // Not JSON
  }
  return raw || 'AI request failed.';
}

async function callModelWithFallback<T>(
  runner: (model: string) => Promise<T>,
  models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']
): Promise<T> {
  let lastErr: unknown;
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await runner(model);
      } catch (err: unknown) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
        if (!isTransient) throw err;
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }
    }
  }
  throw lastErr;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

app.post('/api/ai/analyze-idea', async (req: Request, res: Response) => {
  try {
    const idea = typeof req.body?.idea === 'string' ? req.body.idea.trim() : '';
    const extraContext = typeof req.body?.context === 'string' ? req.body.context.trim() : '';

    if (idea.length < 10 || idea.length > 2000) {
      res.status(400).json({
        error: 'Please enter a project idea between 10 and 2000 characters.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const prompt = [
      'Analyze the following software/technical project idea for a developer team collaboration platform called SkillBridge.',
      `Project Idea: "${idea}"`,
      extraContext ? `Additional Context: "${extraContext}"` : '',
      'Choose the most fitting category strictly from: Web Development, Artificial Intelligence, Machine Learning, Mobile Applications, Data Science, Cybersecurity, Blockchain, Other.',
      'Provide a thorough, realistic, engineering-grade breakdown with actionable roles, realistic technical skills, complexity, roadmap phases, milestones, and initial sprint tasks.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await callModelWithFallback((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a principal software architect and engineering manager. Return strictly valid JSON matching the requested schema. Keep titles concise, descriptions practical, and requiredSkills canonical (e.g., React, TypeScript, Node.js, Python, PostgreSQL, Firebase, PyTorch, UI/UX, Docker, Tailwind CSS).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Concise project title (3 to 8 words).' },
              category: {
                type: Type.STRING,
                description:
                  'One of: Web Development, Artificial Intelligence, Machine Learning, Mobile Applications, Data Science, Cybersecurity, Blockchain, Other',
              },
              overview: { type: Type.STRING, description: '2-3 sentence executive summary of the project.' },
              problemStatement: { type: Type.STRING, description: 'Clear description of the core problem being solved.' },
              proposedSolution: { type: Type.STRING, description: 'Technical approach and how the product solves the problem.' },
              requiredSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5 to 8 key technical skills needed.',
              },
              suggestedRoles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    responsibilities: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                },
              },
              recommendedTeamSize: { type: Type.INTEGER, description: 'Recommended team size between 2 and 8.' },
              recommendedTechnologies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific frameworks, databases, APIs, and tooling.',
              },
              complexity: { type: Type.STRING, description: 'One of: Beginner, Intermediate, Advanced' },
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    focus: { type: Type.STRING },
                  },
                },
              },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    deliverable: { type: Type.STRING },
                    targetWeek: { type: Type.STRING },
                  },
                },
              },
              suggestedTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, description: 'Low, Medium, or High' },
                    role: { type: Type.STRING },
                  },
                },
              },
            },
            required: [
              'title',
              'category',
              'overview',
              'problemStatement',
              'proposedSolution',
              'requiredSkills',
              'suggestedRoles',
              'recommendedTeamSize',
              'recommendedTechnologies',
              'complexity',
              'roadmap',
              'milestones',
              'suggestedTasks',
            ],
          },
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
      return;
    }

    const parsed = JSON.parse(rawText);
    res.json({ analysis: parsed });
  } catch (err: unknown) {
    const message = extractReadableError(err);
    console.error('Gemini analyze-idea error:', err);
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/project-plan', async (req: Request, res: Response) => {
  try {
    const projectTitle = typeof req.body?.projectTitle === 'string' ? req.body.projectTitle.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : 'Web Development';
    const requiredSkills = Array.isArray(req.body?.requiredSkills) ? req.body.requiredSkills : [];
    const teamSize = typeof req.body?.teamSize === 'number' ? req.body.teamSize : 4;
    const duration = typeof req.body?.duration === 'string' ? req.body.duration.trim() : '6 weeks';

    if (!projectTitle || !description) {
      res.status(400).json({ error: 'Project title and description are required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const prompt = [
      `Generate a structured execution and development plan for the following team project:`,
      `Title: ${projectTitle}`,
      `Category: ${category}`,
      `Team Size: ${teamSize} members`,
      `Target Duration: ${duration}`,
      `Required Skills: ${requiredSkills.join(', ') || 'General Full-Stack'}`,
      `Description: ${description}`,
      `Provide concrete development phases, verifiable milestones, 6-10 actionable tasks with priority and suggested deadline offset in days, recommended technologies, and potential technical challenges with mitigations.`,
    ].join('\n');

    const response = await callModelWithFallback((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a technical delivery lead. Return strictly valid JSON matching the schema. Every array (phases, milestones, tasks, techRecommendations, challenges) MUST be non-empty. Priorities must be Low, Medium, or High.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              phases: {
                type: Type.ARRAY,
                description: '3 to 5 sequential development phases.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    goal: { type: Type.STRING },
                    timeframe: { type: Type.STRING },
                  },
                  required: ['name', 'goal', 'timeframe'],
                },
              },
              milestones: {
                type: Type.ARRAY,
                description: '3 to 5 verifiable milestones.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    criteria: { type: Type.STRING },
                    dueOffsetDays: { type: Type.INTEGER },
                  },
                  required: ['title', 'criteria', 'dueOffsetDays'],
                },
              },
              tasks: {
                type: Type.ARRAY,
                description: '6 to 10 concrete sprint tasks ready for a Kanban board.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    dueOffsetDays: { type: Type.INTEGER },
                    suggestedRole: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'priority', 'dueOffsetDays', 'suggestedRole'],
                },
              },
              techRecommendations: {
                type: Type.ARRAY,
                description: '3 to 6 recommended technologies and their purpose.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    technology: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                  },
                  required: ['technology', 'purpose'],
                },
              },
              challenges: {
                type: Type.ARRAY,
                description: '3 to 5 potential technical challenges and mitigations.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING },
                    mitigation: { type: Type.STRING },
                  },
                  required: ['risk', 'mitigation'],
                },
              },
            },
            required: ['phases', 'milestones', 'tasks', 'techRecommendations', 'challenges'],
          },
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      res.status(502).json({ error: 'Gemini returned an empty plan. Please try again.' });
      return;
    }

    const parsed = JSON.parse(rawText);
    res.json({ plan: parsed });
  } catch (err: unknown) {
    const message = extractReadableError(err);
    console.error('Gemini project-plan error:', err);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
