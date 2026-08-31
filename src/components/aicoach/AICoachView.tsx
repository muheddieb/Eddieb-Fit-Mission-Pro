import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Cpu, 
  ShieldCheck, 
  Flame, 
  Utensils, 
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { AIChatMessage, UserProfile, WorkoutSession, BodyMeasurement } from '../../types';
import { translations } from '../../i18n/translations';
import { GeminiService } from '../../services/geminiService';
import { StorageService } from '../../services/storage';

interface AICoachViewProps {
  profile: UserProfile;
  history: WorkoutSession[];
  measurements: BodyMeasurement[];
}

type CoachPersona = 'sports_scientist' | 'egyptian_nutritionist' | 'recomp_specialist' | 'drill_coach';

export const AICoachView: React.FC<AICoachViewProps> = ({
  profile,
  history,
  measurements,
}) => {
  const t = translations[profile.language];
  const isAr = profile.language === 'ar';

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedPersona, setSelectedPersona] = useState<CoachPersona>('sports_scientist');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from storage on mount
  useEffect(() => {
    const saved = StorageService.getChatHistory();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      // Welcome seed message
      const welcome: AIChatMessage = {
        id: 'msg_welcome',
        role: 'assistant',
        content: isAr
          ? `مرحباً يا بطل! أنا مدربك الذكي المخصص لبرنامج EDDIEB FIT MISSION. 
نظامك الحالي: ${profile.mode === 'muscle_recomp' ? 'بناء العضلات وإعادة التشكيل' : 'حرق الدهون المنضبط'}.
كيف يمكنني مساعدتك اليوم في تمرينك، أوزانك، تغذيتك، أو استشفائك؟`
          : `Welcome, Athlete! I am your EDDIEB FIT AI Sports Science Coach.
Current Program Mode: ${profile.mode === 'muscle_recomp' ? 'Muscle / Recomposition' : 'Controlled Fat-Loss'}.
How can I assist you today with progressive overload, exercise biomechanics, Egyptian meal planning, or recovery?`,
        timestamp: Date.now(),
        model: selectedModel,
      };
      setMessages([welcome]);
      StorageService.saveChatHistory([welcome]);
    }
  }, [profile.language]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Persona System Instructions
  const getSystemInstruction = (): string => {
    const baseContext = `You are EDDIEB FIT AI Coach, an elite personal trainer and sports scientist.
The user is ${profile.name}, Age ${profile.age}, Height ${profile.heightCm}cm, Current Weight ${profile.currentWeightKg}kg, Target Weight ${profile.goalWeightKg}kg, Waist ${profile.currentWaistCm}cm.
Training Mode: ${profile.mode}.
Equipment: ${profile.availableEquipment.join(', ')}.
Language preference: ${profile.language === 'ar' ? 'Arabic (Modern, professional, athletic Egyptian/Standard Arabic)' : 'English (Direct, scientific, motivational)'}.`;

    switch (selectedPersona) {
      case 'sports_scientist':
        return `${baseContext}\nFocus strictly on biomechanics, muscle recruitment, progressive overload calculations (RPE, RIR, rep ranges), and scientific recovery. Provide structured step-by-step guidance.`;
      case 'egyptian_nutritionist':
        return `${baseContext}\nFocus on realistic sports nutrition with emphasis on Egyptian staples (Ful Mudammas, Gebna Areesh, Baladi Bread, Lentils, Molokhia, grilled chicken) and precise macro targets (${profile.dailyProteinTargetGrams}g protein, ${profile.dailyCalorieTarget} kcal).`;
      case 'recomp_specialist':
        return `${baseContext}\nFocus on body recomposition, 7-day rolling weight averages, waist circumference interpretation, and steady fat loss while preserving muscle tissue.`;
      case 'drill_coach':
        return `${baseContext}\nBe intense, disciplined, motivational, and direct. Push the user to maintain unbroken consistency, sleep discipline, and ruthless effort in every working set.`;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt.trim();
    if (!query || loading) return;

    const userMsg: AIChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setLoading(true);

    const contextData = {
      profile,
      workoutCount: history.length,
      recentMeasurements: measurements.slice(0, 3),
      language: profile.language,
      mode: profile.mode,
    };

    const response = await GeminiService.sendChatMessage(
      newMessages,
      getSystemInstruction(),
      selectedModel,
      contextData
    );

    const assistantMsg: AIChatMessage = {
      id: 'msg_res_' + Date.now(),
      role: 'assistant',
      content: response.text,
      timestamp: Date.now(),
      model: response.modelUsed || selectedModel,
    };

    const finalMessages = [...newMessages, assistantMsg];
    setMessages(finalMessages);
    StorageService.saveChatHistory(finalMessages);
    setLoading(false);
  };

  const handleClearChat = () => {
    StorageService.clearChatHistory();
    setMessages([]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick suggestion chips
  const quickChips = isAr
    ? [
        'كيف أرجع للتدريب بأمان بعد انقطاع؟',
        'كيف أطبق زيادة الحمل التدريبي بأمان؟',
        'خطة وجبات مصرية غنية بالبروتين (160 جم)',
        'تقييم نزول محيط الخصر مقابل الوزن',
        'بدائل تمرين السكوات لحماية أسفل الظهر',
      ]
    : [
        'How to safely return to training after a break?',
        'How do I calculate progressive overload for my bench press?',
        'High-protein Egyptian meal plan (165g protein)',
        'Interpret my waist circumference vs weight trend',
        'Back-safe quad isolation alternatives',
      ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-border bg-card shadow-lg overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Coach Header & Controls */}
      <div className="flex flex-col gap-3 border-b border-border bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-foreground">{t.aiCoach.title}</h2>
              <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sports Science
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t.aiCoach.subtitle}</p>
          </div>
        </div>

        {/* Model & Persona Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Persona Selector */}
          <div className="flex items-center gap-1">
            <select
              id="select-coach-persona"
              value={selectedPersona}
              onChange={e => setSelectedPersona(e.target.value as CoachPersona)}
              className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="sports_scientist">🔬 Sports Science</option>
              <option value="egyptian_nutritionist">🥙 Egyptian Nutrition</option>
              <option value="recomp_specialist">⚖️ Recomp Specialist</option>
              <option value="drill_coach">⚡ High Discipline</option>
            </select>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1">
            <select
              id="select-gemini-model"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 text-xs font-semibold text-primary focus:border-primary focus:outline-none"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (General & Fast)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex Reasoning)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Speed)</option>
            </select>
          </div>

          {/* Clear history button */}
          <button
            id="btn-clear-chat-history"
            onClick={handleClearChat}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-red-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-background/40">
        {messages.map(msg => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? (isAr ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row-reverse') : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary border border-border text-foreground'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Bubble Footer info */}
                <div className={`mt-2 flex items-center justify-between text-[10px] ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{msg.model || selectedModel}</span>
                      <button
                        id={`btn-copy-${msg.id}`}
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3 max-w-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl border border-border bg-card p-3.5 text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              <span>{isAr ? 'جاري تحليل المعطيات التدريبية...' : 'Analyzing biomechanics & programming...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="border-t border-border bg-card/60 px-4 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-[10px] font-bold uppercase text-muted-foreground shrink-0">
          <Zap className="h-3 w-3 inline mr-1 text-primary" />
          {t.common.quick}:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            id={`chip-coach-${idx}`}
            onClick={() => handleSendMessage(chip)}
            className="shrink-0 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary hover:text-foreground transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="border-t border-border bg-card p-3 sm:p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-ai-coach-prompt"
            type="text"
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            placeholder={t.aiCoach.inputPlaceholder}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            disabled={loading}
          />

          <button
            id="btn-send-coach-message"
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-40 transition-colors"
            title="Send Message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
