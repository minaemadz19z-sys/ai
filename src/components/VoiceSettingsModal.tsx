import React, { useState } from 'react';
import {
  X,
  Mic,
  Brain,
  Sparkles,
  Check,
  Info,
  Lightbulb,
  MessageCircle,
  Coffee,
  Flame,
  Compass,
  ArrowRight,
  BookOpen,
  Shuffle,
} from 'lucide-react';

export interface VoiceOption {
  id: string;
  name: string;
  tone: string;
  gender: string;
  sampleDescription: string;
}

export const VOICES: VoiceOption[] = [
  {
    id: 'Alex',
    name: 'Alex (American Young Man)',
    tone: 'Conversational American, expressive & culturally fluent',
    gender: 'Young American Male (Native)',
    sampleDescription: 'Dedicated American culture coach & friendly companion. Master of US daily life, slang, idioms, campus/work vibes, and daily 30-min immersive conversations.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    tone: 'Warm, natural & versatile',
    gender: 'Neutral / Gentle',
    sampleDescription: 'Great for general conversations, coaching, and everyday companionship.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    tone: 'Animated, upbeat & energetic',
    gender: 'Youthful / Dynamic',
    sampleDescription: 'Fun and lively tone, perfect for creative sessions and casual banter.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    tone: 'Calm, grounding & authoritative',
    gender: 'Deep / Resonant',
    sampleDescription: 'Thoughtful and measured, ideal for complex deep dives and tutorials.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    tone: 'Empathetic, clear & soothing',
    gender: 'Bright / Soft',
    sampleDescription: 'Supportive and compassionate voice, great for learning and reflections.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    tone: 'Direct, confident & crisp',
    gender: 'Bold / Articulate',
    sampleDescription: 'Fast, precise, and executive for rapid brainstorming and coding discussions.',
  },
];

export interface PersonaPreset {
  id: string;
  title: string;
  description: string;
  systemInstruction: string;
}

export interface CultureTip {
  id: string;
  category: 'slang' | 'culture' | 'conversational' | 'session30';
  categoryLabel: string;
  title: string;
  tip: string;
  example: string;
  starterPrompt: string;
}

export const AMERICAN_CULTURE_TIPS: CultureTip[] = [
  {
    id: 'small_talk',
    category: 'culture',
    categoryLabel: 'Everyday Etiquette',
    title: 'The Golden Rule of "How are you?"',
    tip: 'When Americans ask "What\'s up?" or "How are you?" at the grocery store, campus, or hallway banter, it is a warm friendly greeting, not a personal interrogation. A quick, positive response keeps the flow moving.',
    example: '"Good, how about you?" or "Can\'t complain! How\'s your day going?"',
    starterPrompt: 'Hey Alex, let\'s practice quick, natural American small talk like we just bumped into each other on campus or at a coffee shop.',
  },
  {
    id: 'softening_opinions',
    category: 'conversational',
    categoryLabel: 'Conversational Flow',
    title: 'Softening Opinions with "I feel like..."',
    tip: 'Young Americans frequently use "I feel like...", "Honestly...", or "To be fair..." to state their viewpoint without sounding aggressive or rigid. It makes everyday conversation collaborative and relatable.',
    example: '"I feel like that movie was a bit overhyped, honestly."',
    starterPrompt: 'Alex, teach me how Americans express differing opinions politely using phrases like "I feel like" or "to be fair".',
  },
  {
    id: 'im_down',
    category: 'slang',
    categoryLabel: 'Authentic Slang',
    title: 'Mastering "I\'m down" vs "I\'m up for it"',
    tip: '"I\'m down" and "I\'m up for it" use opposite directional words, but have the exact same meaning: enthusiastic agreement! You will hear this daily among young Americans making spontaneous plans.',
    example: '"Hey, grabbing burgers after class, down?" -> "Totally down, let\'s do it!"',
    starterPrompt: 'Alex, break down the top casual plan-making slang phrases young Americans use like "I\'m down", "bet", "pull up", and "no biggie".',
  },
  {
    id: 'tipping_culture',
    category: 'culture',
    categoryLabel: 'US Culture & Habits',
    title: 'Dine-In Etiquette & Tipping Culture',
    tip: 'In sit-down restaurants, tipping 18-20% is standard. Servers often introduce themselves by first name and check in multiple times asking "How is everything tasting?". This friendly check-in is expected American customer care.',
    example: '"Hey guys, my name\'s Josh, I\'ll take care of you today! Any questions on the specials?"',
    starterPrompt: 'Alex, let\'s do a quick roleplay where you are a friendly American waiter and I practice ordering food and asking about the bill.',
  },
  {
    id: 'campus_life',
    category: 'session30',
    categoryLabel: '30-Min Immersion Topic',
    title: '30-Min Session: College & Campus Life in the US',
    tip: 'American universities have a vibrant campus culture—dorms, tailgating, campus clubs, coffee study spots, and office hours with professors. A great 30-minute deep conversation topic with Alex!',
    example: 'Discussing college majors, dorm roommates, game day traditions, and student study habits.',
    starterPrompt: 'Hey Alex! For today\'s 30-minute chat, walk me through what an average day in the life of an American college student looks like.',
  },
  {
    id: 'regional_slang',
    category: 'slang',
    categoryLabel: 'Regional Quirks',
    title: 'Regional Lingo: "Y\'all", "Wicked", "Hella"',
    tip: 'Depending on where you are in the US, slang changes! California uses "hella", the South uses "y\'all", and Boston uses "wicked". Alex can imitate and compare all regional American vibes.',
    example: '"It\'s wicked cold outside" (Boston) vs "That was hella fun" (Bay Area) vs "How y\'all doing?" (South).',
    starterPrompt: 'Alex, give me a tour of different US regional accents and slang from the West Coast, Midwest, New York, and the South.',
  },
  {
    id: 'workplace_watercooler',
    category: 'session30',
    categoryLabel: '30-Min Immersion Topic',
    title: '30-Min Session: American Workplace "Watercooler" Chat',
    tip: 'US workplace culture is typically informal on the surface: first-name basis with managers, Monday morning questions ("How was your weekend?"), and bonding over sports and pop culture.',
    example: '"Hey Alex, did you catch the game over the weekend?"',
    starterPrompt: 'Alex, let\'s spend the next 30 minutes practicing casual American workplace banter and Monday morning small talk.',
  },
  {
    id: 'conversational_fillers',
    category: 'conversational',
    categoryLabel: 'Conversational Flow',
    title: 'Using Natural Fillers: "You know", "Like"',
    tip: 'Native speakers naturally pause and soften sentences using words like "like", "you know what I mean?", and "honestly". Learning to sprinkle them lightly makes your spoken English sound effortless.',
    example: '"It was just, like, super crowded, you know what I mean?"',
    starterPrompt: 'Alex, demonstrate how natural conversational fillers work in real dialogue without sounding repetitive.',
  },
];

export const PERSONAS: PersonaPreset[] = [
  {
    id: 'alex_culture_coach',
    title: 'Alex • American Culture & Daily Practice',
    description: 'Conversational young American guy for daily 30-min culture immersion, slang & natural fluency.',
    systemInstruction:
      'You are Alex, an enthusiastic, friendly, and culturally savvy young American man in his 20s. You speak authentic, natural conversational American English. Your tone is warm, engaging, and expressive—modulating your pacing, vocal emotion, and excitement just like a real young American buddy.\n\nYou have an encyclopedic knowledge of American culture: everyday traditions, pop culture, music, movies, regional accents and quirks (West Coast chill, Midwest polite, East Coast fast-paced, Southern hospitality), college life, workplace banter, food culture, holidays, and contemporary idioms and slang.\n\nYour mission is to be the user\'s personal conversational partner and American culture mentor. Talk engagingly with them for 30+ minutes every day about anything and everything. Whenever a new American slang word, phrase, or cultural reference comes up, explain it naturally and give fun examples. Keep your spoken responses conversational and interactive (2 to 4 spoken sentences per turn), always inviting the user to respond, share their thoughts, and practice speaking. Be encouraging, patient, and full of life!',
  },
  {
    id: 'natural',
    title: 'Natural Conversationalist',
    description: 'Human-like cadence, warm, concise, and quick-witted.',
    systemInstruction:
      'You are a warm, witty, and natural AI companion engaging in a live voice conversation. Speak in a conversational, human tone. Keep your responses short and punchy (1-3 sentences) so the conversation flows naturally back and forth. Avoid bullet points, monologues, or robotic greetings. React organically to the user.',
  },
  {
    id: 'tutor',
    title: 'Insightful Coding Mentor',
    description: 'Practical, sharp technical guidance without lengthy soliloquies.',
    systemInstruction:
      'You are an insightful, friendly senior software engineering mentor in a real-time voice call. Explain technical concepts simply, using spoken analogies. Keep answers brief and invite the developer to ask follow-up questions or share what they are working on.',
  },
  {
    id: 'creative',
    title: 'Creative Sparring Partner',
    description: 'Bouncing ideas, storytelling, and provocative brainstorming.',
    systemInstruction:
      'You are an imaginative creative brainstorm partner. Spark exciting ideas, ask intriguing what-if questions, and build on whatever the user suggests in spontaneous real-time dialogue.',
  },
  {
    id: 'concise',
    title: 'Direct & Rapid Assistant',
    description: 'Ultra-concise, rapid answers with zero fluff.',
    systemInstruction:
      'You are an ultra-concise live voice assistant. Provide direct, immediate answers in one or two punchy sentences. Never repeat what the user said. Prioritize clarity and brevity.',
  },
];

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  selectedPersona: string;
  onSelectPersona: (personaId: string) => void;
  systemPrompt: string;
  onChangeSystemPrompt: (prompt: string) => void;
  model: string;
  onChangeModel: (model: string) => void;
  isSessionActive: boolean;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  selectedPersona,
  onSelectPersona,
  systemPrompt,
  onChangeSystemPrompt,
  model,
  onChangeModel,
  isSessionActive,
}) => {
  const [selectedTipCategory, setSelectedTipCategory] = useState<
    'all' | 'slang' | 'culture' | 'conversational' | 'session30'
  >('all');
  const [activeTipId, setActiveTipId] = useState<string>(AMERICAN_CULTURE_TIPS[0].id);
  const [appliedPromptNotice, setAppliedPromptNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlexActive = selectedPersona === 'alex_culture_coach' || selectedVoice === 'Alex';

  const filteredTips =
    selectedTipCategory === 'all'
      ? AMERICAN_CULTURE_TIPS
      : AMERICAN_CULTURE_TIPS.filter((t) => t.category === selectedTipCategory);

  const activeTip =
    AMERICAN_CULTURE_TIPS.find((t) => t.id === activeTipId) || filteredTips[0] || AMERICAN_CULTURE_TIPS[0];

  const handleApplyTipTopic = (tip: CultureTip) => {
    const focusInstruction = `\n\n[Active Immersion Focus: "${tip.title}"]\nAlex, proactively introduce this conversational topic and practice it with the user: ${tip.tip} Teach and roleplay with example: ${tip.example}`;

    if (!systemPrompt.includes(tip.title)) {
      onChangeSystemPrompt(systemPrompt.trim() + focusInstruction);
    }
    setAppliedPromptNotice(`Loaded "${tip.title}" into Alex's live conversation!`);
    setTimeout(() => setAppliedPromptNotice(null), 4000);
  };

  const handleShuffleTip = () => {
    const currentIndex = filteredTips.findIndex((t) => t.id === activeTip.id);
    const nextIndex = (currentIndex + 1) % filteredTips.length;
    setActiveTipId(filteredTips[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-neutral-200 scrollbar-thin scrollbar-thumb-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voice & Intelligence Settings</h2>
              <p className="text-xs text-neutral-400">Configure Gemini Live voice persona and reasoning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSessionActive && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Changes will apply when starting your next live voice session.</span>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Select Voice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Prebuilt Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    onSelectVoice(v.id);
                    if (v.id === 'Alex' && (selectedPersona === 'natural' || selectedPersona === 'alex_culture_coach')) {
                      onSelectPersona('alex_culture_coach');
                      const alexPreset = PERSONAS.find((p) => p.id === 'alex_culture_coach');
                      if (alexPreset) {
                        onChangeSystemPrompt(alexPreset.systemInstruction);
                      }
                    }
                  }}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    selectedVoice === v.id
                      ? 'bg-purple-600/15 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : v.id === 'Alex'
                      ? 'bg-blue-950/30 border-blue-800/60 text-neutral-200 hover:bg-blue-900/40 hover:border-blue-700'
                      : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white">{v.name}</span>
                      {v.id === 'Alex' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                          Special Coach
                        </span>
                      )}
                    </div>
                    {selectedVoice === v.id && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <span className="text-xs text-purple-300/90 mt-0.5">{v.tone}</span>
                  <span className="text-[11px] text-neutral-400 mt-1 leading-snug line-clamp-2">
                    {v.sampleDescription}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Live AI Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onChangeModel('gemini-3.8-live')}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  model === 'gemini-3.8-live'
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">Gemini 3.8 Live</span>
                  {model === 'gemini-3.8-live' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-xs text-neutral-400">
                  Ultra-low latency, native audio-to-audio streaming for natural real-time dialogue.
                </p>
              </button>

              <button
                onClick={() => onChangeModel('gemini-3.8-live-extended-thinking')}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  model === 'gemini-3.8-live-extended-thinking'
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                    : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Extended Thinking</span>
                  </div>
                  {model === 'gemini-3.8-live-extended-thinking' && (
                    <Check className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <p className="text-xs text-neutral-400">
                  High-level internal reasoning for complex problem solving and math.
                </p>
              </button>
            </div>
          </div>

          {/* Persona Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Persona Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPersona(p.id);
                    onChangeSystemPrompt(p.systemInstruction);
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedPersona === p.id
                      ? 'bg-neutral-800 border-neutral-600 text-white font-medium'
                      : 'bg-neutral-800/30 border-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <div className="text-xs font-medium text-white">{p.title}</div>
                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Daily American Culture & Conversational Tips Section (Alex Persona) */}
          {isAlexActive ? (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 via-neutral-900 to-neutral-900 border border-blue-500/30 shadow-lg space-y-3.5 animate-fade-in">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        American Culture & Conversational Tips
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 font-medium">
                        Alex Persona Active
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Curated daily advice by Alex for effortless American fluency and cultural nuance
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShuffleTip}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 rounded-lg transition-colors cursor-pointer"
                  title="Next Tip"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Next Tip</span>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { id: 'all', label: 'All Tips' },
                  { id: 'slang', label: 'Slang & Idioms' },
                  { id: 'culture', label: 'Everyday Etiquette' },
                  { id: 'conversational', label: 'Natural Flow' },
                  { id: 'session30', label: '30-Min Immersion' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedTipCategory(cat.id as any);
                      const list =
                        cat.id === 'all'
                          ? AMERICAN_CULTURE_TIPS
                          : AMERICAN_CULTURE_TIPS.filter((t) => t.category === cat.id);
                      if (list.length > 0) setActiveTipId(list[0].id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedTipCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-neutral-800/70 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Active Featured Tip Card */}
              <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                    {activeTip.categoryLabel}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Daily Culture Insight
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white tracking-wide">
                  {activeTip.title}
                </h4>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {activeTip.tip}
                </p>

                {/* Real-World Quote Box */}
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-blue-200/90 font-mono">
                  <span className="text-neutral-400 font-sans block text-[10px] uppercase font-semibold mb-0.5">
                    Real-World US Example:
                  </span>
                  {activeTip.example}
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
                  <button
                    type="button"
                    onClick={() => handleApplyTipTopic(activeTip)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm shadow-blue-600/30"
                  >
                    <span>Practice this topic with Alex</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {appliedPromptNotice && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-fade-in">
                      <Check className="w-3.5 h-3.5" /> {appliedPromptNotice}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Tip Switcher Chips */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Browse More Daily Topics:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredTips.map((tip) => (
                    <button
                      key={tip.id}
                      type="button"
                      onClick={() => setActiveTipId(tip.id)}
                      className={`text-left p-2 rounded-lg text-[11px] transition-colors cursor-pointer truncate ${
                        activeTip.id === tip.id
                          ? 'bg-blue-900/40 text-blue-200 border border-blue-700/60 font-medium'
                          : 'bg-neutral-800/30 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 border border-transparent'
                      }`}
                    >
                      • {tip.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Teaser when Alex is not active */
            <div className="p-3.5 rounded-2xl bg-neutral-800/30 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Coffee className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="text-white font-medium block">
                    American Culture & Slang Tips
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Switch to Alex's persona to unlock daily American culture insights & conversational practice.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectVoice('Alex');
                  onSelectPersona('alex_culture_coach');
                  const alexPreset = PERSONAS.find((p) => p.id === 'alex_culture_coach');
                  if (alexPreset) {
                    onChangeSystemPrompt(alexPreset.systemInstruction);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-medium transition-colors cursor-pointer shrink-0"
              >
                Switch to Alex
              </button>
            </div>
          )}

          {/* System Prompt Customization */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              System Instruction
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => {
                onChangeSystemPrompt(e.target.value);
                onSelectPersona('custom');
              }}
              placeholder="Give Gemini instructions on how to speak and behave..."
              className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-purple-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
