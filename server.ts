import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Google Gen AI helper with telemetry header
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// YouTube Search API with official key support or curated search metadata
app.post('/api/youtube/search', async (req, res) => {
  try {
    const { query, exerciseName } = req.body;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (apiKey && query) {
      try {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
            query + ' form exercise technique tutorial'
          )}&type=video&key=${apiKey}`
        );
        if (ytRes.ok) {
          const data = await ytRes.json();
          if (data.items && data.items.length > 0) {
            const results = data.items.map((item: any) => ({
              videoId: item.id?.videoId,
              title: item.snippet?.title,
              channel: item.snippet?.channelTitle,
              thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
              publishedAt: item.snippet?.publishedAt,
              videoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
              status: 'available',
            }));
            return res.json({ success: true, source: 'official_api', results });
          }
        }
      } catch (ytErr) {
        console.warn('YouTube API call failed, falling back to query search:', ytErr);
      }
    }

    // Safe fallback search response
    const sanitizedQuery = encodeURIComponent(query || exerciseName || 'fitness exercise technique');
    res.json({
      success: true,
      source: 'search_fallback',
      searchUrl: `https://www.youtube.com/results?search_query=${sanitizedQuery}`,
      query: query || exerciseName,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'YouTube search error' });
  }
});

// Multi-turn Gemini AI Coach API
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model, contextData } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured. Please configure your key in Secrets.',
        fallbackRequired: true,
      });
    }

    // Model selection based on user request / feature specification
    // Default: gemini-3.5-flash for general, gemini-3.1-pro-preview for complex reasoning, gemini-3.1-flash-lite for fast
    let selectedModel = model || 'gemini-3.5-flash';
    if (!['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'].includes(selectedModel)) {
      selectedModel = 'gemini-3.5-flash';
    }

    // Build context string from user's current workout state
    let fullSystemInstruction = systemInstruction || 
      'You are EDDIEB FIT MISSION AI Coach, an elite personal fitness coach and sports scientist.';
    
    if (contextData) {
      fullSystemInstruction += `\n\n[USER CURRENT FITNESS DATA CONTEXT]:\n` +
        `Current Mode: ${contextData.mode || 'Muscle / Recomposition'}\n` +
        `Current Phase: ${contextData.currentPhase || 'Phase 1: Foundation & Progression'}\n` +
        `Training Days/Week: ${contextData.trainingDays || 4}\n` +
        `Weight Trend: Current ${contextData.currentWeight || 'N/A'} kg (7-day avg: ${contextData.avgWeight || 'N/A'} kg)\n` +
        `Waist Trend: ${contextData.waist || 'N/A'} cm\n` +
        `Recent Completed Workouts: ${contextData.completedWorkoutsCount || 0} sessions\n` +
        `Current Streak: ${contextData.streak || 0} days\n` +
        `Language: ${contextData.language === 'ar' ? 'Arabic (Respond in Arabic)' : 'English (Respond in English)'}\n` +
        `Rules: Prioritize resistance training & progressive overload. If Controlled Fat-Loss mode is active, focus on steady waist/weight trends and preserving strength. Never make fake claims about spot reduction or magic fat-loss drinks. Be encouraging, concise, evidence-based, and actionable.`;
    }

    // Format chat contents for generateContent or multi-turn
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const m of messages) {
        contents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content || m.text || '' }],
        });
      }
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || '';
    res.json({
      success: true,
      text,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: error.message || 'Error generating AI response',
      fallbackRequired: true,
    });
  }
});

// Image Generation API using gemini-3-pro-image-preview with 1K, 2K, 4K affordance
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '1:1' } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured.',
      });
    }

    // Validate size: 1K, 2K, 4K
    const validSizes = ['1K', '2K', '4K'];
    const validSize = validSizes.includes(imageSize) ? imageSize : '1K';
    const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const validRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    // Model required by feature instruction: gemini-3-pro-image-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `High-quality fitness visual: ${prompt}. Professional athletic lighting, realistic anatomy, motivational fitness discipline aesthetic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: validRatio as any,
          imageSize: validSize as any,
        },
      },
    });

    let imageUrl: string | null = null;
    let descriptionText = '';

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(422).json({
        error: 'Model did not return image data',
        text: descriptionText,
      });
    }

    res.json({
      success: true,
      imageUrl,
      imageSize: validSize,
      aspectRatio: validRatio,
      prompt,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// Daily AI Briefing generation
app.post('/api/gemini/briefing', async (req, res) => {
  try {
    const { userStats, language = 'en' } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY missing' });
    }

    const prompt = language === 'ar'
      ? `قم بإنشاء إحاطة تدريبية يومية ملهمة ومختصرة (3-4 جمل قصيرة) للمستخدم في تطبيق EDDIEB FIT MISSION.
البيانات:
- نظام التدريب: ${userStats?.mode || 'بناء العضلات وإعادة التشكيل'}
- تمرينة اليوم: ${userStats?.todayWorkout || 'Push Focus'}
- الأيام المتتالية: ${userStats?.streak || 0} أيام
- الوزن الحالي: ${userStats?.weight || 0} كجم (معدل 7 أيام: ${userStats?.avgWeight || 0} كجم)
ركز على التحفيز والانضباط وتطبيق الحمل التدريبي المتدرج.`
      : `Create a brief, punchy, high-energy 3-4 sentence daily fitness briefing for the EDDIEB FIT MISSION athlete.
Stats:
- Training Mode: ${userStats?.mode || 'Muscle / Recomposition'}
- Today's Workout: ${userStats?.todayWorkout || 'Push Session'}
- Streak: ${userStats?.streak || 0} days
- Current Weight: ${userStats?.weight || 0} kg (7-day avg: ${userStats?.avgWeight || 0} kg)
Focus on progressive overload, recovery discipline, and consistency.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      briefing: response.text || '',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware / production serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EDDIEB FIT MISSION] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
