import { AIChatMessage, UserProfile, BodyMeasurement, WorkoutSession } from '../types';

export interface ChatResponse {
  success: boolean;
  text: string;
  modelUsed?: string;
  fallback?: boolean;
}

export interface ImageGenResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  imageSize?: string;
}

export const GeminiService = {
  // Multi-turn chat with AI Coach
  async sendChatMessage(
    messages: AIChatMessage[],
    systemInstruction: string,
    model: string,
    contextData: any
  ): Promise<ChatResponse> {
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          systemInstruction,
          model,
          contextData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          text: data.text,
          modelUsed: data.model,
        };
      }
    } catch (e) {
      console.warn('Backend Gemini API call failed, invoking expert sports science fallback:', e);
    }

    // Local rules-based intelligent fallback
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const fallbackText = generateLocalCoachResponse(lastUserMsg, contextData);
    return {
      success: true,
      text: fallbackText,
      modelUsed: 'Local Fitness Engine (Offline Safe)',
      fallback: true,
    };
  },

  // High-Resolution Image Generation (gemini-3-pro-image-preview with 1K, 2K, 4K affordance)
  async generateHighQualityImage(
    prompt: string,
    imageSize: '1K' | '2K' | '4K' = '1K',
    aspectRatio: string = '1:1'
  ): Promise<ImageGenResponse> {
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageSize,
          aspectRatio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          imageUrl: data.imageUrl,
          imageSize: data.imageSize,
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error || 'Image generation failed',
        };
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Network error generating image',
      };
    }
  },

  // Daily briefing generator
  async getDailyBriefing(userStats: any, language: string = 'en'): Promise<string> {
    try {
      const res = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStats, language }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.briefing;
      }
    } catch (e) {}

    // Fallback briefing
    if (language === 'ar') {
      return `مرحباً يا بطل! أنت اليوم في ${userStats.mode || 'نظام بناء العضلات'}. تركيزنا اليوم على الالتزام بالأوزان وتطبيق الحمل التدريبي المتدرج. تأكد من شرب 3.5 لتر ماء والنوم 8 ساعات كاملة لتسريع الاستشفاء.`;
    }
    return `Welcome back, Athlete! Today's mission is in ${userStats.mode || 'Muscle / Recomposition Mode'}. Prioritize pristine lifting mechanics, progressive overload on working sets, and hitting your 3.5L hydration target.`;
  },

  // YouTube search / verified video fetcher
  async searchYoutubeVideo(query: string, exerciseName: string): Promise<any> {
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, exerciseName }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const sanitized = encodeURIComponent(query || exerciseName + ' exercise form');
    return {
      success: true,
      source: 'search_fallback',
      searchUrl: `https://www.youtube.com/results?search_query=${sanitized}`,
    };
  },
};

// Sports science rule-based fallback response engine
function generateLocalCoachResponse(userQuery: string, context: any): string {
  const q = userQuery.toLowerCase();
  const isArabic = context?.language === 'ar' || /[\u0600-\u06FF]/.test(userQuery);

  if (q.includes('weight') || q.includes('overload') || q.includes('increase') || q.includes('وزن') || q.includes('أوزان') || q.includes('زيادة')) {
    if (isArabic) {
      return `نصيحة مدرب القوة:
1. إذا حققت الحد الأقصى من التكرارات المطلوبة في كافة المجموعات بمعدل RPE لا يتجاوز 8، قم بزيادة الوزن بمقدار 2.5 كجم في التمارين المركبة و 1.25 كجم في تمارين العزل.
2. إذا كان معدل RPE بين 9 إلى 10، فثبّت الوزن الحالي حتى تتقن التحكم في المسار الحركي والنزول السلبي.
3. تذكر: جودة التكنيك والشد العضلي الصافي أهم من الوزن الزائف.`;
    }
    return `Strength Coach Directive on Progressive Overload:
1. If you achieved the top of your target rep range across all working sets with an RPE ≤ 8, increment the load by +2.5kg for compound lifts and +1.25kg for isolation movements.
2. If your RPE was 9–10 or form broke down, maintain your current load to solidify mechanical tension and neural drive.
3. Never sacrifice range of motion or eccentric control merely to add weight to the bar.`;
  }

  if (q.includes('fat') || q.includes('waist') || q.includes('دهون') || q.includes('خصر') || q.includes('تنشيف')) {
    if (isArabic) {
      return `نصيحة أخصائي حرق الدهون المنضبط:
1. لا تعتمد على رقم الميزان اليومي، بل اعتمد على متوسط الـ 7 أيام ومحيط الخصر عند السرة.
2. إذا نزل مقاس الخصر مع ثبات الوزن أو نزوله ببطء (0.5% من وزنك أسبوعياً)، فهذا مؤشر مثالي على خسارة الدهون وبناء/حفظ العضلات.
3. احرص على تناول 2.0 جم بروتين لكل كجم من وزنك مع 8,000 خطوة يومياً وكارديو منخفض الشدة.`;
    }
    return `Controlled Fat-Loss Directive:
1. Never judge progress by single-day scale fluctuations; evaluate your 7-day rolling weight average alongside your morning navel waist circumference.
2. If your waist is trending downward while lifting numbers remain stable, you are successfully losing body fat while preserving lean contractile tissue.
3. Keep daily protein at 2.0g per kg of bodyweight, sustain 8,000+ daily steps, and rely on Zone 2 low-impact cardio.`;
  }

  if (q.includes('food') || q.includes('eat') || q.includes('egyptian') || q.includes('meal') || q.includes('أكل') || q.includes('وجبة') || q.includes('مصرية') || q.includes('بروتين')) {
    if (isArabic) {
      return `دليل التغذية الرياضية:
1. وجبة مثالية بعد التمرين: 150 جم صدور دجاج مشوية + كوب ونصف أرز بسمتي/مصري مطهو + طبق سلطة خضراء غنية بالليمون.
2. وجبة عشاء استشفائية: 200 جم جبنة قريش مع ملعقة زيت زيتون وزعتر وخيار + رغيف عيش بلدي كامل الحبة.
3. شرب 500 مل ماء فور الاستيقاظ وقبل كل وجبة لتنشيط الأيض وتغذية العضلات.`;
    }
    return `Sports Nutrition Strategy:
1. Optimal Post-Workout: 150g grilled skinless chicken breast + 1.5 cups steamed rice + colorful vegetable salad.
2. Evening Recovery Meal: 200g Egyptian Areesh cheese with 1 tbsp extra virgin olive oil, oregano (zaatar), and 1 whole-grain Baladi bread.
3. Drink 500ml water upon waking and ensure your daily protein target (160g+) is evenly distributed across 3-4 meals.`;
  }

  if (isArabic) {
    return `المدرب الذكي معك دائماً:
- تم فحص بياناتك الحالية: نظامك هو ${context?.mode || 'بناء العضلات وإعادة التشكيل'}، والتزامك مستمر.
- ركز اليوم على الانضباط في التمرين، والراحة الكافية بين المجموعات (90-120 ثانية)، والترطيب المستمر.
- لا تتردد في سؤالي عن أي تمرين، تعديل أوزان، أو خطة وجبات!`;
  }

  return `EDDIEB FIT AI Coach Directive:
- Current training mode: ${context?.mode || 'Muscle / Recomposition'}.
- Priority: Execute your scheduled lifting volume with strict mind-muscle connection, rest 90-120 seconds between heavy compound sets, and log every RPE honestly.
- Consistency and progressive overload are your guarantees of athletic transformation. Ask me anytime about weight progression, recovery, or nutrition!`;
}
