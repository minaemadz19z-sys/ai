import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Trash2,
  Copy,
  Check,
  Cpu,
  Shield,
  X,
  Mic,
  Database,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import {
  saveChatSessionToFirestore,
  getChatSessionsFromFirestore,
  FirestoreChatSession,
  FirestoreChatMessage,
} from '../services/firestoreService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type GeminiModelType =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite';

export interface ChatRolePreset {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
}

const CHAT_ROLES: ChatRolePreset[] = [
  {
    id: 'general',
    name: 'General Assistant',
    description: 'Helpful, concise, friendly, and knowledgeable',
    systemInstruction:
      'You are a helpful, versatile, and articulate AI assistant. Provide concise, clear, and well-structured responses.',
  },
  {
    id: 'tutor',
    name: 'Academic Tutor',
    description: 'Step-by-step explanations for coursework & concepts',
    systemInstruction:
      'You are an empathetic, encouraging academic tutor. Help the user learn by explaining complex topics step-by-step, providing examples, and checking for understanding.',
  },
  {
    id: 'coder',
    name: 'Senior Software Engineer',
    description: 'Clean TypeScript/React code, architecture & debugging',
    systemInstruction:
      'You are an expert senior software architect. Provide clean, secure, idiomatic code examples, architectural advice, and concise explanations.',
  },
  {
    id: 'researcher',
    name: 'Executive Analyst',
    description: 'Summarizes key points, synthesis & structured bullets',
    systemInstruction:
      'You are an executive research analyst. Provide high-density summaries, bulleted insights, and actionable conclusions.',
  },
];

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onOpenTranscriber?: () => void;
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  onOpenTranscriber,
}) => {
  const { user } = useAuth();

  // Model & System Instruction State
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<string>('general');
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(
    CHAT_ROLES[0].systemInstruction
  );
  const [showRoleCustomizer, setShowRoleCustomizer] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your Gemini assistant. How can I help you today? You can select specialized models (gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite) and customize my role anytime.',
      timestamp: new Date().toISOString(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Firestore Saved Sessions State
  const [savedSessions, setSavedSessions] = useState<FirestoreChatSession[]>([]);
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Handle incoming initial prompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Load user sessions from Firestore
  useEffect(() => {
    if (isOpen && user?.uid) {
      getChatSessionsFromFirestore(user.uid).then(setSavedSessions);
    }
  }, [isOpen, user?.uid]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const found = CHAT_ROLES.find((r) => r.id === roleId);
    if (found) {
      setCustomSystemInstruction(found.systemInstruction);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = inputPrompt.trim();
    if (!promptText || isSending) return;

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputPrompt('');
    setIsSending(true);

    try {
      // Send conversation history to /api/chat
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
          systemInstruction: customSystemInstruction,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get Gemini response');
      }

      const botMessage: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'model',
        text: data.text || '(Empty response received)',
        timestamp: new Date().toISOString(),
        modelUsed: data.model || selectedModel,
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Persist to Firestore if user is authenticated
      if (user?.uid) {
        const title = promptText.slice(0, 40) + (promptText.length > 40 ? '...' : '');
        const currentSessionId = sessionId || `session_${Date.now()}`;
        setSessionId(currentSessionId);

        await saveChatSessionToFirestore(user.uid, {
          id: currentSessionId,
          title,
          model: selectedModel,
          systemInstruction: customSystemInstruction,
          messages: finalMessages.map((m) => ({
            role: m.role,
            text: m.text,
            timestamp: m.timestamp,
          })),
        });

        setSaveStatus('Synced to Firestore');
        setTimeout(() => setSaveStatus(null), 3000);
        getChatSessionsFromFirestore(user.uid).then(setSavedSessions);
      }
    } catch (err: any) {
      console.error('Chat send error:', err);
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        text: `Error: ${err?.message || 'Failed to contact Gemini chat service. Please try again.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartNewChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'model',
        text: 'New chat started. How can I help you?',
        timestamp: new Date().toISOString(),
        modelUsed: selectedModel,
      },
    ]);
    setSessionId(null);
  };

  const handleLoadSavedSession = (session: FirestoreChatSession) => {
    setSessionId(session.id);
    setSelectedModel(
      (session.model as GeminiModelType) || 'gemini-3.5-flash'
    );
    if (session.systemInstruction) {
      setCustomSystemInstruction(session.systemInstruction);
    }
    setMessages(
      session.messages.map((m, idx) => ({
        id: `loaded_${idx}_${Date.now()}`,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp || new Date().toISOString(),
        modelUsed: session.model,
      }))
    );
    setShowSessionDrawer(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Chatbot Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Gemini Chatbot</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                  Multi-Turn
                </span>
                {saveStatus && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <Database className="w-3 h-3" /> {saveStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Context-aware conversational intelligence with role-based instructions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => setShowSessionDrawer(!showSessionDrawer)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                title="Saved Sessions in Firestore"
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Saved Sessions</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-neutral-700 rounded-full">
                  {savedSessions.length}
                </span>
              </button>
            )}

            <button
              onClick={handleStartNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
              title="Start New Conversation"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Model & Role Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-neutral-950/70 border-b border-neutral-800 text-xs">
          {/* Model Selector per requirement */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" /> Model:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as GeminiModelType)}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks - Fast & Balanced)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks & Deep Reasoning)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Responses & Quick Answers)</option>
            </select>
          </div>

          {/* Role / System Instruction selector */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Role:
            </span>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {CHAT_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowRoleCustomizer(!showRoleCustomizer)}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
            >
              {showRoleCustomizer ? 'Hide Instruction' : 'Edit Instruction'}
            </button>
          </div>
        </div>

        {/* System Instruction Customizer Drawer */}
        {showRoleCustomizer && (
          <div className="p-4 bg-neutral-950 border-b border-neutral-800 animate-fade-in">
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>System Instruction (Persona & Behavior)</span>
              <span className="text-[11px] text-neutral-500">
                Gives the Gemini chatbot its specific role
              </span>
            </label>
            <textarea
              rows={2}
              value={customSystemInstruction}
              onChange={(e) => setCustomSystemInstruction(e.target.value)}
              placeholder="Enter system instruction to direct how Gemini behaves..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        {/* Saved Sessions Drawer */}
        {showSessionDrawer && (
          <div className="absolute top-[108px] right-6 z-20 w-80 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                Firestore Chat History
              </span>
              <button
                onClick={() => setShowSessionDrawer(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            {savedSessions.length === 0 ? (
              <div className="text-xs text-neutral-500 text-center py-4">
                No saved chat sessions in Firestore yet.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin">
                {savedSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSavedSession(s)}
                    className="w-full text-left p-2.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 transition-colors cursor-pointer group"
                  >
                    <div className="text-xs font-medium text-white truncate group-hover:text-purple-300">
                      {s.title || 'Untitled Session'}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
                      <span>{s.model}</span>
                      <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 group animate-fade-in ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1.5 ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-tl-sm'
                  }`}
                >
                  {/* Model header on bot replies */}
                  {!isUser && (
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 pb-1 border-b border-neutral-800/70 mb-1">
                      <span className="font-semibold text-purple-300">
                        {msg.modelUsed || selectedModel}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap select-text">{msg.text}</div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-white/50">
                      {isUser && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/60 hover:text-white cursor-pointer"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-neutral-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Gemini ({selectedModel}) is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {onOpenTranscriber && (
              <button
                type="button"
                onClick={onOpenTranscriber}
                className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 text-neutral-400 hover:text-purple-400 transition-colors cursor-pointer shrink-0"
                title="Dictate with gemini-3.5-transcribe"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            <div className="relative flex-1">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={`Ask ${selectedModel}...`}
                disabled={isSending}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !inputPrompt.trim()}
              className="flex items-center justify-center p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-neutral-500">
            <span>Maintains complete conversation history across turns</span>
            <span>gemini-3.1-pro-preview • gemini-3.5-flash • gemini-3.1-flash-lite</span>
          </div>
        </div>
      </div>
    </div>
  );
};
