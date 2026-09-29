import React, { useState } from 'react';
import {
  X,
  Brain,
  History,
  Sparkles,
  User,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  BookOpen,
  Compass,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Award,
  Zap,
} from 'lucide-react';
import { UserProfileMemory, FirestoreConversation } from '../services/firestoreService';

interface UserMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: UserProfileMemory;
  onUpdateMemory: (updated: UserProfileMemory) => void;
  conversations: FirestoreConversation[];
  onLoadSessionContext?: (summary: string) => void;
}

export const UserMemoryModal: React.FC<UserMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onUpdateMemory,
  conversations,
  onLoadSessionContext,
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'history'>('memory');
  const [newFact, setNewFact] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(memory.name || '');
  const [expandedConvId, setExpandedConvId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSaveName = () => {
    onUpdateMemory({
      ...memory,
      name: tempName.trim() || 'Friend',
      updatedAt: new Date().toISOString(),
    });
    setEditingName(false);
    showFeedback('Updated your name in Alex’s memory');
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    const facts = [...memory.facts, newFact.trim()];
    onUpdateMemory({
      ...memory,
      facts,
      updatedAt: new Date().toISOString(),
    });
    setNewFact('');
    showFeedback('Added new fact to Alex’s memory');
  };

  const handleRemoveFact = (index: number) => {
    const facts = memory.facts.filter((_, i) => i !== index);
    onUpdateMemory({
      ...memory,
      facts,
      updatedAt: new Date().toISOString(),
    });
    showFeedback('Fact removed');
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterest.trim()) return;
    const interests = [...memory.interests, newInterest.trim()];
    onUpdateMemory({
      ...memory,
      interests,
      updatedAt: new Date().toISOString(),
    });
    setNewInterest('');
    showFeedback('Added interest');
  };

  const handleRemoveInterest = (index: number) => {
    const interests = memory.interests.filter((_, i) => i !== index);
    onUpdateMemory({
      ...memory,
      interests,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const goals = [...memory.goals, newGoal.trim()];
    onUpdateMemory({
      ...memory,
      goals,
      updatedAt: new Date().toISOString(),
    });
    setNewGoal('');
    showFeedback('Added learning goal');
  };

  const handleRemoveGoal = (index: number) => {
    const goals = memory.goals.filter((_, i) => i !== index);
    onUpdateMemory({
      ...memory,
      goals,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleLevelChange = (level: string) => {
    onUpdateMemory({
      ...memory,
      englishLevel: level,
      updatedAt: new Date().toISOString(),
    });
    showFeedback(`English level updated to ${level}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl text-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">User Memory & Conversation History</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  English Primary
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Alex continuously remembers your background, interests, and past conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-neutral-800/60 bg-neutral-950/40 text-xs">
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Alex's Memory of You ({memory.facts.length} facts)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Conversation History ({conversations.length} sessions)</span>
          </button>

          {notice && (
            <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1 animate-fade-in font-medium">
              <Check className="w-3.5 h-3.5" /> {notice}
            </span>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-neutral-700">
          {activeTab === 'memory' ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-neutral-900 to-purple-950/20 border border-blue-500/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg">
                      {memory.name ? memory.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            placeholder="Your Name / Nickname"
                            className="px-2.5 py-1 bg-neutral-950 border border-blue-500 rounded-lg text-sm text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">
                            {memory.name || 'Friend'}
                          </h3>
                          <button
                            onClick={() => {
                              setTempName(memory.name || '');
                              setEditingName(true);
                            }}
                            className="text-xs text-neutral-400 hover:text-blue-300 underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>Primary Language: <strong className="text-neutral-200">English</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Level Selector */}
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                      English Proficiency
                    </span>
                    <div className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
                      {['Beginner', 'Intermediate', 'Advanced', 'Fluent'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleLevelChange(lvl)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                            memory.englishLevel === lvl
                              ? 'bg-blue-600 text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/60 text-center">
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-800/40">
                    <span className="text-xs text-neutral-400 block">Total Sessions</span>
                    <span className="text-sm font-bold text-white">
                      {Math.max(memory.totalSessions, conversations.length)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-800/40">
                    <span className="text-xs text-neutral-400 block">Practice Time</span>
                    <span className="text-sm font-bold text-blue-300">
                      {formatDuration(memory.totalDurationSeconds || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-950/40 border border-neutral-800/40">
                    <span className="text-xs text-neutral-400 block">Facts Remembered</span>
                    <span className="text-sm font-bold text-purple-300">
                      {memory.facts.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Facts Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Facts & Details Alex Remembers About You
                    </h4>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    Injected into Alex's live memory prompt
                  </span>
                </div>

                {memory.facts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-800/60 text-center text-xs text-neutral-500">
                    No facts learned yet. Have a voice conversation with Alex or add facts manually below!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {memory.facts.map((fact, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 group"
                      >
                        <span className="leading-relaxed flex-1">• {fact}</span>
                        <button
                          onClick={() => handleRemoveFact(index)}
                          className="text-neutral-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove fact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Fact Form */}
                <form onSubmit={handleAddFact} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    placeholder="Add a fact (e.g. 'Lives in Dubai', 'Software engineer', 'Planning trip to Miami')..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Fact</span>
                  </button>
                </form>
              </div>

              {/* Interests & Topics Explored */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Interests */}
                <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Interests & Hobbies</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                    {memory.interests.map((interest, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(i)}
                          className="hover:text-red-300 cursor-pointer ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleAddInterest} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add interest (e.g. basketball, tech)..."
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg cursor-pointer"
                    >
                      +
                    </button>
                  </form>
                </div>

                {/* Goals */}
                <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>English Goals</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                    {memory.goals.map((goal, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs"
                      >
                        {goal}
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(i)}
                          className="hover:text-red-300 cursor-pointer ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleAddGoal} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add goal (e.g. fluent small talk)..."
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg cursor-pointer"
                    >
                      +
                    </button>
                  </form>
                </div>
              </div>

              {/* Cultural Topics Explored */}
              {memory.culturalTopicsExplored.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-neutral-950/50 border border-neutral-800 space-y-2">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    American Culture Topics You Discussed
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {memory.culturalTopicsExplored.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-blue-950/50 border border-blue-800/40 text-blue-200 text-xs"
                      >
                        ✓ {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              {conversations.length === 0 ? (
                <div className="p-8 rounded-2xl bg-neutral-950/40 border border-neutral-800 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">No Recorded Conversations Yet</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Start a live conversation with Alex. When you finish, the full transcript and AI memory recap will appear here!
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isExpanded = expandedConvId === conv.id;
                  const dateStr = new Date(conv.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={conv.id}
                      className="rounded-2xl bg-neutral-950/80 border border-neutral-800/90 overflow-hidden transition-all"
                    >
                      {/* Session Header Card */}
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white truncate">
                              {conv.title || 'Voice Session with Alex'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {conv.voiceModel || 'Alex'}
                            </span>
                          </div>

                          {conv.summary && (
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              "{conv.summary}"
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(conv.durationSeconds)}
                            </span>
                            <span>•</span>
                            <span>{conv.totalTurns} Spoken Turns</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {conv.summary && onLoadSessionContext && (
                            <button
                              onClick={() => {
                                onLoadSessionContext(conv.summary || '');
                                showFeedback('Context loaded for next chat!');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-800/60 text-blue-300 text-xs font-medium cursor-pointer transition-colors"
                              title="Instruct Alex to remember and continue this conversation"
                            >
                              Continue Topic
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setExpandedConvId(isExpanded ? null : conv.id)
                            }
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer transition-colors"
                            title="View dialogue turns"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Dialog Turns */}
                      {isExpanded && conv.turns && conv.turns.length > 0 && (
                        <div className="p-4 border-t border-neutral-800/70 bg-neutral-900/50 space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block mb-1">
                            Full Dialogue Transcript ({conv.turns.length} turns)
                          </span>
                          {conv.turns.map((turn, tIdx) => (
                            <div
                              key={tIdx}
                              className={`p-2.5 rounded-xl text-xs flex gap-2.5 ${
                                turn.role === 'user'
                                  ? 'bg-blue-950/30 border border-blue-900/40 text-blue-100 ml-4'
                                  : 'bg-neutral-800/60 border border-neutral-700/50 text-neutral-200 mr-4'
                              }`}
                            >
                              <span className="font-semibold shrink-0 text-[11px] text-neutral-400">
                                {turn.role === 'user' ? 'You:' : 'Alex:'}
                              </span>
                              <p className="leading-relaxed flex-1">{turn.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Memory is automatically remembered and spoken by Alex during voice calls.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-blue-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
