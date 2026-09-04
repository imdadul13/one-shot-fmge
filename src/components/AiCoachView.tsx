import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stethoscope,
  Send,
  RotateCw,
  Copy,
  Check,
  Zap,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  ZoomIn,
  Eye,
  ShieldCheck,
  ExternalLink,
  ImageIcon,
  Paperclip,
  X,
  Maximize2,
  History,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  Search,
  Brain,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  getLearningContext,
  getPersonalizedDailyPlan,
} from '../utils/personalizationEngine';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { GrandTest, AppState, MedicalImageAsset } from '../types';
import { NewMcqAttemptInput } from '../utils/performanceEngine';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MedicalImageViewerModal } from './MedicalImageViewerModal';

export interface QuizQuestionItem {
  id: string;
  questionNumber?: number;
  totalQuestions?: number;
  subject: string;
  topic: string;
  stem?: string;
  scenario?: string;
  question: string;
  fullQuestionText?: string;
  options: { key: string; text: string }[];
  correctKey: string;
  correctAnswer?: string;
  explanation: string;
  distractorBreakdown?: Record<string, string>;
  distractorExplanations?: Record<string, string>;
  fmgeTakeaway?: string;
  memoryHook?: string;
  mnemonic?: string;
  trap?: string;
  userAnswer?: string;
  imageUrl?: string;
  cleanImageUrl?: string;
  annotatedImageUrl?: string;
  imageAsset?: MedicalImageAsset;
  whatToLookFor?: string;
  questionType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedFollowUps?: string[];
  singleQuiz?: QuizQuestionItem;
  userAttachedImage?: {
    url: string;
    fileName?: string;
  };
}

interface ActiveQuizSession {
  questions: QuizQuestionItem[];
  currentIndex: number;
  score: number;
  isComplete: boolean;
  userAnswers: Record<number, string>;
}

export interface CoachSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  quizSession?: ActiveQuizSession | null;
}

const COACH_STORAGE_KEY = 'fmge_ai_coach_sessions_v1';

export function createDefaultGreetingMessage(): ChatMessage {
  return {
    id: 'msg-welcome',
    role: 'assistant',
    content: `👋 Hello Doctor! I am your **FMGE AI Study Coach**.

I am grounded in high-yield NMC examination patterns and tailored to your live study tracker data.

### What would you like to do?
- **Concept explanations**: Ask any clinical breakdown or disease mechanism
- **Differentiating pairs**: Compare tricky conditions (e.g. *Crohn's vs Ulcerative Colitis*)
- **Clinical MCQs**: Test yourself with complete exam vignettes
- **Weak subject quiz**: Start a targeted practice drill`,
    timestamp: new Date(),
    suggestedFollowUps: [
      'Quiz me on high-yield questions from my weakest subjects',
      'What is the difference between Crohn\'s disease and ulcerative colitis?',
      'Explain nephrotic syndrome',
      'Give me an FMGE MCQ on heart blocks',
    ],
  };
}

function formatRelativeDate(isoString?: string): string {
  if (!isoString) return 'Earlier';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface AiCoachViewProps {
  state?: AppState;
  latestGT?: GrandTest | null;
  daysRemaining: number;
  initialQuery?: string;
  initialSubject?: string;
  initialTopic?: string;
  initialTab?: 'vignette' | 'concept' | 'diagnosis' | 'strategy';
  onRecordAttempt?: (input: NewMcqAttemptInput) => void;
  onClose?: () => void;
  onClearInitialTrigger?: () => void;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({
  state,
  latestGT,
  daysRemaining,
  initialQuery,
  initialSubject,
  initialTopic,
  initialTab,
  onRecordAttempt,
  onClose,
  onClearInitialTrigger,
}) => {
  const { profile } = useAuth();
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Persistent Consultation Session History & Memory State
  // Filter out any empty dummy sessions from prior runs
  const [sessions, setSessions] = useState<CoachSession[]>(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
          return valid;
        }
      }
    } catch (_) {}
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
          if (valid.length > 0) return valid[0].id;
        }
      }
    } catch (_) {}
    return `session-${Date.now()}`;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(COACH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((s: CoachSession) => s.messages && s.messages.some((m) => m.role === 'user'));
          if (valid.length > 0 && valid[0].messages && valid[0].messages.length > 0) {
            return valid[0].messages;
          }
        }
      }
    } catch (_) {}
    return [createDefaultGreetingMessage()];
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  
  // Interactive Multi-Question Quiz Mode State
  const [quizSession, setQuizSession] = useState<ActiveQuizSession | null>(null);

  // Student Image Attachment State
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachedImage({
        base64: result,
        mimeType: file.type || 'image/jpeg',
        previewUrl: result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real Medical Image Zoom Modal State
  const [activeModalImage, setActiveModalImage] = useState<{
    isOpen: boolean;
    imageUrl: string;
    annotatedImageUrl?: string;
    imageAsset?: MedicalImageAsset;
    title?: string;
    whatToLookFor?: string;
  }>({
    isOpen: false,
    imageUrl: '',
  });

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialTriggerHandledRef = useRef<string | null>(null);

  // Dynamically derive student learning context from actual AppState
  const computedStudentContext = React.useMemo(() => {
    let totalTopicsCount = 0;
    let notesCompletedCount = 0;
    let r1Count = 0;
    let r2Count = 0;
    let r3Count = 0;

    // Shared personalized context derived from the SAME engine the Dashboard uses
    // (single source of truth). If state is present it gives estimated score,
    // gap, baseline, phase, GT cadence and today's live plan.
    const profileCtx = state ? getLearningContext(profile, state) : null;
    const todayPlan = state ? getPersonalizedDailyPlan(profile, state) : null;

    FMGE_SUBJECTS.forEach((subject) => {
      subject.topics.forEach((topic) => {
        totalTopicsCount++;
        const key = `${subject.id}-${topic.id}`;
        const saved = state?.topicsState?.[key] || {};
        if (saved.notesDone ?? topic.notesDone) notesCompletedCount++;
        if (saved.r1Done ?? topic.r1Done) r1Count++;
        if (saved.r2Done ?? topic.r2Done) r2Count++;
        if (saved.r3Done ?? topic.r3Done) r3Count++;
      });
    });

    const syllabusCompletionPct = totalTopicsCount > 0
      ? Math.round((notesCompletedCount / totalTopicsCount) * 100)
      : 0;

    // Weak subjects derived from GT, Error Notebook, and uncompleted major subjects.
    // Preferences the shared engine's weak-subject list (same source as the Dashboard).
    let weakSubList: string[] = [];
    if (profileCtx && profileCtx.weakSubjects.length > 0) {
      weakSubList = profileCtx.weakSubjects.map((id) => FMGE_SUBJECTS.find((s) => s.id === id)?.name || id);
    } else if (latestGT?.weakSubjectIds && latestGT.weakSubjectIds.length > 0) {
      weakSubList = latestGT.weakSubjectIds.map((id) => FMGE_SUBJECTS.find((s) => s.id === id)?.name || id);
    }
    if (weakSubList.length === 0 && state?.errorNotebook && state.errorNotebook.length > 0) {
      const counts: Record<string, number> = {};
      state.errorNotebook.forEach((err) => {
        counts[err.subjectId] = (counts[err.subjectId] || 0) + 1;
      });
      weakSubList = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([sId]) => FMGE_SUBJECTS.find((s) => s.id === sId)?.name || sId);
    }
    if (weakSubList.length === 0) {
      weakSubList = ['General Medicine', 'Pharmacology', 'Obstetrics & Gynecology', 'Pathology'];
    }

    // Weak topics derived from Error Notebook and McqAttempts
    const weakTopicList: string[] = [];
    if (state?.errorNotebook && state.errorNotebook.length > 0) {
      state.errorNotebook.slice(-6).forEach(e => {
        if (e.topic && !weakTopicList.includes(e.topic)) weakTopicList.push(e.topic);
      });
    }

    // Recent errors
    const recentErrorList = state?.errorNotebook && state.errorNotebook.length > 0
      ? state.errorNotebook.slice(-5).map(e => `${e.topic}: ${e.questionGist || e.myMistake || e.correctConcept}`)
      : [];

    // Grand test average
    let avgGT = latestGT?.score || 0;
    if (state?.grandTests && state.grandTests.length > 0) {
      const sum = state.grandTests.reduce((acc, gt) => acc + (gt.score || 0), 0);
      avgGT = Math.round(sum / state.grandTests.length);
    }

    return {
      daysRemaining: profileCtx?.daysRemaining ?? daysRemaining ?? 60,
      targetScore: profileCtx?.targetScore ?? state?.settings?.targetScore ?? 185,
      averageGTScore: avgGT,
      weakSubjects: weakSubList,
      weakTopics: weakTopicList,
      recentErrors: recentErrorList,
      syllabusCompletion: syllabusCompletionPct,
      r1Done: r1Count,
      r2Done: r2Count,
      r3Done: r3Count,
      // Onboarding signals: student personalization context only — never medical facts.
      preparationStage: profile?.preparationStage || null,
      dailyStudyHours: profile?.dailyHoursTarget || state?.settings?.dailyStudyHourGoal || null,
      studyPreferences: profile?.studyPreferences || [],
      baselineScore: profile?.baselineScore,
      baselineQuestions: profile?.baselineQuestions,
      // Shared single-source-of-truth fields (same values the Dashboard uses).
      estimatedScore: profileCtx?.estimatedScore ?? null,
      scoreGap: profileCtx?.scoreGap ?? null,
      baselinePending: profileCtx?.baselinePending ?? false,
      availableMinutes: profileCtx?.availableMinutes ?? null,
      phase: profileCtx?.phase ?? null,
      phaseTitle: profileCtx?.phaseTitle ?? '',
      gtCadence: profileCtx?.gtCadenceDays ?? null,
      gtFrequencyLabel: profileCtx?.gtFrequencyLabel ?? '',
      daysToExam: profileCtx?.daysRemaining ?? null,
      todayPlan: todayPlan?.tasks.slice(0, 5).map((t) => ({
        activity: t.activity,
        subjectName: t.subjectName,
        topicName: t.topicName,
        durationMinutes: t.durationMinutes,
        reason: t.reason,
      })) ?? [],
    };
  }, [state, latestGT, daysRemaining, profile]);

  const weakSubjects = computedStudentContext.weakSubjects;
  const recentErrors = computedStudentContext.recentErrors;

  // Synchronize current messages and active quiz with localStorage memory (debounced)
  const saveTimeoutRef = useRef<any>(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    // Only persist if session contains at least one user question
    const hasUserMessage = messages.some((m) => m.role === 'user');
    if (!hasUserMessage || isStreamingRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === activeSessionId);
        let title = prev[idx]?.title || 'Clinical Consultation';
        if (!title || title === 'New Consultation' || title === 'Clinical Consultation') {
          const firstUser = messages.find((m) => m.role === 'user');
          if (firstUser && firstUser.content) {
            title = firstUser.content.slice(0, 42).trim() + (firstUser.content.length > 42 ? '...' : '');
          }
        }

        const updatedSession: CoachSession = {
          id: activeSessionId,
          title,
          createdAt: prev[idx]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages,
          quizSession,
        };

        let next: CoachSession[];
        if (idx >= 0) {
          next = [...prev];
          next[idx] = updatedSession;
        } else {
          next = [updatedSession, ...prev];
        }

        // Strictly persist sessions with actual student questions
        const validNext = next.filter((s) => s.messages && s.messages.some((m) => m.role === 'user'));
        try {
          localStorage.setItem(COACH_STORAGE_KEY, JSON.stringify(validNext));
        } catch (_) {}
        return next;
      });
    }, 400);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [messages, quizSession, activeSessionId]);

  // Direct Consultation Handler (Guarantees zero-latency startup from Predictor/Errors without race conditions)
  const executeDirectConsultation = async (topic: string, subject?: string, query?: string, tab?: string) => {
    const promptText = query || (tab === 'vignette'
      ? `Give me an FMGE clinical vignette MCQ on ${topic}`
      : `Explain ${topic} (${subject || 'High-Yield Medicine'}) with core FMGE clinical concepts, high-yield diagnostic criteria, and exam pearls`);

    const topicTitle = topic || 'Clinical Consultation';
    const newSessionId = `session-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date(),
    };
    const streamingMsgId = `ai-${Date.now() + 1}`;
    const placeholderMsg: ChatMessage = {
      id: streamingMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      suggestedFollowUps: [
        'What is the drug of choice?',
        'What are the common exam traps?',
        'Give me a clinical vignette MCQ on this'
      ],
    };

    const newSessionMessages = [createDefaultGreetingMessage(), userMsg, placeholderMsg];
    const newSession: CoachSession = {
      id: newSessionId,
      title: topicTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: newSessionMessages,
      quizSession: null,
    };

    setActiveSessionId(newSessionId);
    setMessages(newSessionMessages);
    setSessions((prev) => [
      newSession,
      ...prev.filter((s) => s.id !== newSessionId && s.messages && s.messages.some((m) => m.role === 'user')),
    ]);
    setIsLoading(false);
    isStreamingRef.current = true;

    try {
      const streamRes = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: [{ role: 'user', content: promptText }],
          studentContext: computedStudentContext,
        }),
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';
        let lastFlush = 0;

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let newTextAdded = false;
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              try {
                const payload = JSON.parse(trimmed.slice(6));
                if (payload.text) {
                  accumulated += payload.text;
                  newTextAdded = true;
                }
              } catch {}
            }

            const now = Date.now();
            if (newTextAdded && now - lastFlush > 60) {
              lastFlush = now;
              const currentText = accumulated;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === streamingMsgId ? { ...msg, content: currentText } : msg
                )
              );
            }
          }
        } finally {
          reader.releaseLock?.();
        }

        if (accumulated.trim().length > 20) {
          const finalMessages = [
            createDefaultGreetingMessage(),
            userMsg,
            { ...placeholderMsg, content: accumulated },
          ];
          setMessages(finalMessages);
          setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === newSessionId);
            if (idx < 0) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], messages: finalMessages };
            try {
              localStorage.setItem(
                COACH_STORAGE_KEY,
                JSON.stringify(updated.filter((s) => s.messages && s.messages.some((m) => m.role === 'user')))
              );
            } catch (_) {}
            return updated;
          });
          isStreamingRef.current = false;
          return;
        }
      }
    } catch (e) {
      console.warn('[DirectConsultation] Stream error, falling back to batch endpoint:', e);
    } finally {
      isStreamingRef.current = false;
    }

    handleSendMessage(promptText, true);
  };

  // Auto-send initial prompt if initialTopic or initialQuery is provided from external trigger (e.g. Predictor)
  useEffect(() => {
    if (!initialTopic && !initialQuery) return;
    const triggerKey = initialTopic
      ? `${initialTopic}__${initialTab || 'concept'}`
      : `query__${initialQuery}`;

    if (initialTriggerHandledRef.current === triggerKey) return;
    initialTriggerHandledRef.current = triggerKey;

    const topic = initialTopic || '';
    const query = initialQuery;
    const subject = initialSubject;
    const tab = initialTab;

    onClearInitialTrigger?.();
    executeDirectConsultation(topic, subject, query, tab);
  }, [initialTopic, initialQuery, initialSubject, initialTab]);

  const scrollRafRef = useRef<number | null>(null);

  // Scroll to bottom on new message with RAF throttle
  useEffect(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [messages, isLoading, quizSession]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Start Multi-Question Quiz Mode
  const startQuizMode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/quiz-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weakSubjects,
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuizSession({
          questions: data.questions,
          currentIndex: 0,
          score: 0,
          isComplete: false,
          userAnswers: {},
        });
      }
    } catch (e) {
      console.error('Failed to start quiz batch:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (queryText?: string, force = false) => {
    const text = (queryText !== undefined ? queryText : inputQuery).trim();
    if (!text && !attachedImage) return;
    if (isLoading && !force) return;

    const imageToSend = attachedImage;
    setAttachedImage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || (imageToSend ? `[Attached Investigation: ${imageToSend.fileName}]` : ''),
      timestamp: new Date(),
      userAttachedImage: imageToSend ? {
        url: imageToSend.previewUrl,
        fileName: imageToSend.fileName,
      } : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check if user is asking a direct follow-up about the active/previous MCQ
    const lowerText = text.toLowerCase();
    const lastQuestionMsg = [...newMessages].reverse().find(m => m.singleQuiz);
    const lastQ = lastQuestionMsg?.singleQuiz;

    if (lastQ && (lowerText.includes('other options') || lowerText.includes('why wrong') || lowerText.includes('why incorrect') || lowerText.includes('distractor') || lowerText.includes('why the other') || lowerText.includes('why others'))) {
      const qCorrectKey = lastQ.correctKey || (lastQ as any).correctAnswer || 'A';
      const db = lastQ.distractorBreakdown || lastQ.distractorExplanations || {};
      let distractorContent = `### 🔍 Detailed Analysis: Why Other Options Are Wrong\n\n`;
      distractorContent += `**Clinical Question:** ${lastQ.question}\n\n`;
      distractorContent += `**Correct Answer:** Option ${qCorrectKey} (${lastQ.options.find(o => o.key === qCorrectKey)?.text || ''})\n\n`;
      distractorContent += `---\n\n`;

      const incorrectOpts = lastQ.options.filter(o => o.key !== qCorrectKey);
      if (incorrectOpts.length > 0) {
        incorrectOpts.forEach(opt => {
          const reason = db[opt.key] || `Option ${opt.key} is not the primary diagnostic or therapeutic choice for this presentation.`;
          distractorContent += `#### ❌ Option ${opt.key}: ${opt.text}\n`;
          distractorContent += `**Why it is incorrect:** ${reason}\n\n`;
        });
      } else if (Object.keys(db).length > 0) {
        Object.entries(db).forEach(([k, exp]) => {
          distractorContent += `#### ❌ Option ${k}\n`;
          distractorContent += `**Why it is incorrect:** ${exp}\n\n`;
        });
      }

      if (lastQ.fmgeTakeaway) {
        distractorContent += `> 💡 **FMGE High-Yield Takeaway:** ${lastQ.fmgeTakeaway}\n\n`;
      }
      if (lastQ.memoryHook) {
        distractorContent += `🧠 **Memory Hook:** ${lastQ.memoryHook}`;
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: distractorContent,
        timestamp: new Date(),
        suggestedFollowUps: [
          'Why is this answer correct?',
          'Give me another MCQ on this topic',
          'Make this easier to remember'
        ]
      };
      setMessages([...newMessages, assistantMessage]);
      setIsLoading(false);
      return;
    }

    if (lastQ && (lowerText.includes('why is this answer correct') || lowerText.includes('why is it correct') || lowerText.includes('why correct') || lowerText.includes('explain correct answer'))) {
      const qCorrectKey = lastQ.correctKey || (lastQ as any).correctAnswer || 'A';
      const correctOptText = lastQ.options.find(o => o.key === qCorrectKey)?.text || '';
      let correctContent = `### ✅ Why Option ${qCorrectKey} is Correct\n\n`;
      correctContent += `**Correct Option ${qCorrectKey}:** ${correctOptText}\n\n`;
      correctContent += `**Clinical Explanation:**\n${lastQ.explanation}\n\n`;
      if (lastQ.fmgeTakeaway) {
        correctContent += `> 💡 **FMGE High-Yield Takeaway:** ${lastQ.fmgeTakeaway}\n\n`;
      }
      if (lastQ.memoryHook) {
        correctContent += `🧠 **Memory Hook:** ${lastQ.memoryHook}`;
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: correctContent,
        timestamp: new Date(),
        suggestedFollowUps: [
          'Explain why other options are wrong',
          'Give me another MCQ on this topic',
          'What is the classic exam trap?'
        ]
      };
      setMessages([...newMessages, assistantMessage]);
      setIsLoading(false);
      return;
    }

    const lower = (text || '').toLowerCase().trim();
    const isExplicitMcqOrQuiz =
      lower.includes('give me an mcq') ||
      lower.includes('give me a question') ||
      lower.includes('quiz') ||
      lower.includes('batch');

    // 1. For clinical explanations and medical queries, use real-time SSE streaming (<300ms time-to-first-token)
    if (!isExplicitMcqOrQuiz && !imageToSend) {
      const streamingMsgId = `ai-${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        suggestedFollowUps: [
          'What is the drug of choice?',
          'What are the common exam traps?',
          'Give me a clinical vignette MCQ on this'
        ],
      };

      setMessages([...newMessages, placeholderMsg]);
      setIsLoading(false); // streaming message itself shows live progress
      isStreamingRef.current = true;

      const streamController = new AbortController();
      const streamTimeout = setTimeout(() => streamController.abort(), 18000); // 18s max timeout

      try {
        const streamRes = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: streamController.signal,
          body: JSON.stringify({
            message: text,
            history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            studentContext: computedStudentContext,
          }),
        });

        clearTimeout(streamTimeout);

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';
          let lastFlush = 0;

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              let newTextAdded = false;

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                try {
                  const payload = JSON.parse(trimmed.slice(6));
                  if (payload.text) {
                    accumulated += payload.text;
                    newTextAdded = true;
                  }
                } catch {}
              }

              const now = Date.now();
              if (newTextAdded && now - lastFlush > 80) {
                lastFlush = now;
                const currentText = accumulated;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === streamingMsgId ? { ...msg, content: currentText } : msg
                  )
                );
              }
            }
          } finally {
            reader.releaseLock?.();
          }

          // If streaming delivered a solid response (>20 chars), finalize it
          if (accumulated.trim().length > 20) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingMsgId ? { ...msg, content: accumulated } : msg
              )
            );
            isStreamingRef.current = false;
            return;
          }
        }
      } catch (streamErr) {
        console.warn('[Streaming Chat] Stream error or timeout, falling back to standard endpoint:', streamErr);
      } finally {
        clearTimeout(streamTimeout);
        isStreamingRef.current = false;
      }

      // If streaming produced insufficient output, remove placeholder and fall through to robust batch endpoint
      setMessages(newMessages);
    }

    setIsLoading(true);

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text || 'Please examine the attached investigation image and provide a clinical breakdown or diagnostic question.',
            image: imageToSend ? {
              base64: imageToSend.base64,
              mimeType: imageToSend.mimeType,
              fileName: imageToSend.fileName,
            } : undefined,
            history: newMessages.slice(-8).map(m => {
              let content = m.content || '';
              if (m.singleQuiz) {
                const q = m.singleQuiz;
                content += `\n\n[Prior Quiz Turn: Subject: ${q.subject}, Topic: ${q.topic}, Key Takeaway: ${q.fmgeTakeaway || q.question}]`;
              }
              return { role: m.role, content };
            }),
            studentContext: computedStudentContext,
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('[AI Coach] Remote fetch failed, utilizing resilient offline synthesis:', fetchErr);
      }

      // If backend provided a multi-question interactive quiz session
      if (data?.quizSession && Array.isArray(data.quizSession.questions) && data.quizSession.questions.length > 1) {
        setQuizSession({
          questions: data.quizSession.questions,
          currentIndex: 0,
          score: 0,
          isComplete: false,
          userAnswers: {},
        });
        return;
      }

      // Format response text and single MCQ payload
      const rawMcq = data?.singleMcq || data?.quizSession?.questions?.[0];
      const normalizedCorrectKey = rawMcq?.correctKey || rawMcq?.correctAnswer || 'A';

      const singleQuizPayload: QuizQuestionItem | null = rawMcq ? {
        id: rawMcq.id || `single-mcq-${Date.now()}`,
        subject: rawMcq.subject || 'General Medicine',
        topic: rawMcq.topic || 'Clinical Medicine',
        stem: rawMcq.stem || '',
        question: rawMcq.question || '',
        options: rawMcq.options || [],
        correctKey: normalizedCorrectKey,
        correctAnswer: normalizedCorrectKey,
        explanation: rawMcq.explanation || '',
        distractorBreakdown: rawMcq.distractorBreakdown || rawMcq.distractorExplanations || {},
        distractorExplanations: rawMcq.distractorBreakdown || rawMcq.distractorExplanations || {},
        fmgeTakeaway: rawMcq.fmgeTakeaway || rawMcq.highYieldPearl || '',
        memoryHook: rawMcq.memoryHook || rawMcq.mnemonic || '',
        imageUrl: rawMcq.imageUrl || rawMcq.imageAsset?.imageUrl,
        cleanImageUrl: rawMcq.cleanImageUrl || rawMcq.imageUrl || rawMcq.imageAsset?.cleanImageUrl,
        annotatedImageUrl: rawMcq.annotatedImageUrl || rawMcq.imageAsset?.annotatedImageUrl,
        imageAsset: rawMcq.imageAsset,
        whatToLookFor: rawMcq.whatToLookFor || rawMcq.imageAsset?.whatToLookFor,
        questionType: rawMcq.questionType,
      } : null;

      const replyText =
        data?.reply ||
        (singleQuizPayload
          ? `Here is an authentic clinical MCQ on **${singleQuizPayload.subject}** (${singleQuizPayload.topic}):`
          : `### 🩺 Clinical High-Yield Review: ${text}\n\n**Core Approach:**\n- **Investigation of Choice:** Evaluate with first-line clinical examination and primary imaging/labs.\n- **Definitive Gold Standard:** Biopsy confirmation or definitive diagnostic imaging.\n- **Drug of Choice / Protocol:** Standard evidence-based guidelines for FMGE.\n\n> 💡 **FMGE Exam Pearl:** Review key differential diagnoses and classic exam buzzwords in your Error Notebook.`);

      const followUps = Array.isArray(data?.suggestedFollowUps) && data.suggestedFollowUps.length > 0
        ? data.suggestedFollowUps
        : [
            'Why is this answer correct?',
            'Explain why other options are wrong',
            'Give me another MCQ on this topic'
          ];

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
        singleQuiz: singleQuizPayload || undefined,
        suggestedFollowUps: followUps,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err: any) {
      console.error('[AI Coach] Request Error:', err);
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: err?.message?.includes('AI Service Notice')
          ? err.message
          : '⚠️ **AI response failed**. Please check your connection or GEMINI_API_KEY and try again.',
        timestamp: new Date(),
        suggestedFollowUps: [
          'Retry request',
          'What is nephrotic syndrome?',
          'Give me an FMGE MCQ on heart blocks'
        ]
      };
      setMessages([...newMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Single Question Answer Handler
  const handleSingleQuizAnswer = (msgId: string, selectedKey: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === msgId && msg.singleQuiz) {
          const isCorrect = selectedKey === msg.singleQuiz.correctKey;
          if (onRecordAttempt) {
            onRecordAttempt({
              questionId: msg.singleQuiz.id,
              subjectId: msg.singleQuiz.subject.toLowerCase().replace(/[^a-z]/g, '') || 'medicine',
              topicId: 'ai-coach-vignette',
              subtopic: msg.singleQuiz.topic,
              isCorrect,
              selectedAnswer: selectedKey,
              correctAnswer: msg.singleQuiz.correctKey,
              timeTakenSeconds: 45,
              source: 'custom',
              isImageBased: Boolean(msg.singleQuiz.imageUrl),
              imageCategory: msg.singleQuiz.imageAsset?.imageCategory,
              imageUrl: msg.singleQuiz.imageUrl,
              imageAssetId: msg.singleQuiz.imageAsset?.assetId,
            });
          }
          return {
            ...msg,
            singleQuiz: {
              ...msg.singleQuiz,
              userAnswer: selectedKey,
            }
          };
        }
        return msg;
      })
    );
  };

  // Quiz Mode Answer Handler
  const handleQuizSessionAnswer = (selectedKey: string) => {
    if (!quizSession || quizSession.isComplete) return;

    const currentQ = quizSession.questions[quizSession.currentIndex];
    const isCorrect = selectedKey === currentQ.correctKey;

    if (onRecordAttempt) {
      onRecordAttempt({
        questionId: currentQ.id,
        subjectId: currentQ.subject.toLowerCase().replace(/[^a-z]/g, '') || 'medicine',
        topicId: 'ai-quiz-mode',
        subtopic: currentQ.topic,
        isCorrect,
        selectedAnswer: selectedKey,
        correctAnswer: currentQ.correctKey,
        timeTakenSeconds: 35,
        source: 'custom',
      });
    }

    setQuizSession({
      ...quizSession,
      score: isCorrect ? quizSession.score + 1 : quizSession.score,
      userAnswers: {
        ...quizSession.userAnswers,
        [quizSession.currentIndex]: selectedKey,
      },
    });
  };

  const handleNextQuizQuestion = () => {
    if (!quizSession) return;
    if (quizSession.currentIndex + 1 < quizSession.questions.length) {
      setQuizSession({
        ...quizSession,
        currentIndex: quizSession.currentIndex + 1,
      });
    } else {
      setQuizSession({
        ...quizSession,
        isComplete: true,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuery(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleNewSession = () => {
    // If current session already has no user questions, just refresh it without adding clutter
    const hasUserMsg = messages.some((m) => m.role === 'user');
    if (!hasUserMsg) {
      setMessages([createDefaultGreetingMessage()]);
      setQuizSession(null);
      setIsHistoryOpen(false);
      return;
    }

    const newId = `session-${Date.now()}`;
    const defaultGreeting = createDefaultGreetingMessage();
    const newSession: CoachSession = {
      id: newId,
      title: 'New Consultation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [defaultGreeting],
      quizSession: null,
    };
    // Only keep previous sessions that have actual user questions
    const validPrev = sessions.filter((s) => s.messages && s.messages.some((m) => m.role === 'user'));
    const next = [newSession, ...validPrev];
    setSessions(next);
    setActiveSessionId(newId);
    setMessages([defaultGreeting]);
    setQuizSession(null);
    setIsHistoryOpen(false);
  };

  const handleSelectSession = (s: CoachSession) => {
    setActiveSessionId(s.id);
    setMessages(s.messages && s.messages.length > 0 ? s.messages : [createDefaultGreetingMessage()]);
    setQuizSession(s.quizSession || null);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    try {
      localStorage.setItem(
        COACH_STORAGE_KEY,
        JSON.stringify(filtered.filter((s) => s.messages && s.messages.some((m) => m.role === 'user')))
      );
    } catch (_) {}

    if (sessionId === activeSessionId) {
      if (filtered.length > 0) {
        handleSelectSession(filtered[0]);
      } else {
        handleNewSession();
      }
    }
  };

  const executeClearAllHistory = () => {
    try {
      localStorage.removeItem(COACH_STORAGE_KEY);
    } catch (_) {}
    setSessions([]);
    setConfirmClearHistory(false);
    const newId = `session-${Date.now()}`;
    const defaultGreeting = createDefaultGreetingMessage();
    setActiveSessionId(newId);
    setMessages([defaultGreeting]);
    setQuizSession(null);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || {
    id: activeSessionId,
    title: 'Current Consultation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages,
  };

  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return sessions;
    const q = historySearch.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.messages || []).some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, historySearch]);

  const quickActions = [
    { label: 'Quiz me on my weak areas', query: 'Quiz me on high-yield questions from my weakest subjects' },
    { label: 'Explain Nephrotic Syndrome', query: 'Explain nephrotic syndrome with high-yield points, biopsy findings, and classic exam traps.' },
    { label: 'Crohn\'s vs Ulcerative Colitis', query: 'What is the difference between Crohn\'s disease and ulcerative colitis?' },
    { label: 'MCQ on Heart Blocks', query: 'Give me an FMGE MCQ on heart blocks' },
  ];

  return (
    <div className="page-container space-y-8 font-sans text-slate-900">
      {/* ================= EDITORIAL HEADER ================= */}
      <header className="space-y-2 border-b border-slate-200/80 pb-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            CLINICAL MENTOR & COGNITIVE ENGINE
          </span>
          <div className="flex items-center gap-2">
            {state?.settings?.examDate && (
              <span className="text-xs font-mono font-medium text-slate-500">
                {daysRemaining} Days to Exam
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold font-display tracking-tight text-slate-900">
              Faculty Mentor
            </h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed mt-1">
              High-yield clinical explanations, complete exam vignettes, differential reasoning, and targeted weak-area remediation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 shadow-xs transition-all cursor-pointer hover:border-slate-400 active:scale-95"
              title="Open full consultation history"
            >
              <History className="h-4 w-4 text-sky-600" />
              <span>Saved History</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold font-mono">
                {sessions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={handleNewSession}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold font-['Outfit'] shadow-xs transition-all cursor-pointer active:scale-95"
              title="Start a new chat session"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= SPLIT VIEW: CHATGPT / GEMINI STYLE SIDEBAR + ACTIVE CHAT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Persistent Desktop Chat History & Memory Sidebar */}
        <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 space-y-3 sticky top-6 max-h-[calc(100vh-80px)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                <History className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 font-['Outfit']">Chat History</h3>
                <p className="text-[10px] text-slate-400 font-mono">{sessions.length} consultation{sessions.length === 1 ? '' : 's'}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
            />
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 space-y-1.5">
                <MessageSquare className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No chats found</p>
                <p className="text-[10px] text-slate-400">Ask a question to save it here</p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const messageCount = (s.messages || []).length;
                const firstUserMsg = s.messages?.find((m) => m.role === 'user');

                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-50/90 border-sky-300 ring-1 ring-sky-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/70 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-600 text-white text-[8px] font-bold font-mono">
                              ACTIVE
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono">
                            {formatRelativeDate(s.updatedAt || s.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 font-['Outfit'] truncate group-hover:text-sky-950">
                          {s.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {firstUserMsg?.content || 'Clinical consultation'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer shrink-0"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with bulletproof inline confirmation */}
          {sessions.length > 0 && (
            <div className="pt-2 border-t border-slate-100 shrink-0">
              {confirmClearHistory ? (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2 animate-fadeIn">
                  <p className="text-[11px] font-bold text-rose-950 font-['Outfit']">Clear all {sessions.length} consultation chats?</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={executeClearAllHistory}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold font-['Outfit'] transition-all cursor-pointer shadow-2xs"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold font-['Outfit'] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearHistory(true)}
                  className="w-full text-[11px] font-medium text-slate-400 hover:text-rose-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer py-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Right Column: Active Conversation & Workspace */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* 1. Active Consultation & Memory Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Active Consultation Memory
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit'] truncate max-w-xs sm:max-w-md">
                  {activeSession?.title || 'Current Consultation'}
                </h3>
              </div>
            </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title="View consultation history and past AI discussions"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
              {sessions.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Multi-Question Quiz Mode Shell */}
      {quizSession && (
        <div className="rounded-3xl border-2 border-sky-200 bg-white p-6 shadow-md space-y-5 animate-in fade-in-50">
          {!quizSession.isComplete ? (
            <div>
              {/* Top Progress & Classification */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full font-['Outfit']">
                    Question {quizSession.currentIndex + 1} of {quizSession.questions.length}
                  </span>
                  <span className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-full font-['Outfit']">
                    {quizSession.questions[quizSession.currentIndex].subject} · {quizSession.questions[quizSession.currentIndex].topic}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-500 font-['Outfit']">
                  Score: {quizSession.score} / {Object.keys(quizSession.userAnswers).length}
                </div>
              </div>

              {/* Clinical Question Stem */}
              <div className="py-4 space-y-4">
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {quizSession.questions[quizSession.currentIndex].question}
                </p>

                {/* 4 Selectable Options */}
                <div className="grid grid-cols-1 gap-2.5">
                  {quizSession.questions[quizSession.currentIndex].options.map((opt) => {
                    const currentQ = quizSession.questions[quizSession.currentIndex];
                    const selected = quizSession.userAnswers[quizSession.currentIndex];
                    const isAnswered = Boolean(selected);
                    const isSelected = selected === opt.key;
                    const isCorrect = opt.key === currentQ.correctKey;

                    let btnStyle = 'border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-white text-slate-800';
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold shadow-2xs';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold';
                      } else {
                        btnStyle = 'border-slate-200 bg-slate-50/50 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleQuizSessionAnswer(opt.key)}
                        className={`p-4 rounded-2xl border-2 text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold font-['Outfit'] ${
                            isAnswered && isCorrect
                              ? 'bg-emerald-500 text-white'
                              : isAnswered && isSelected && !isCorrect
                              ? 'bg-rose-500 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="leading-snug pt-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Post-Answer Comprehensive Rationale */}
                {quizSession.userAnswers[quizSession.currentIndex] && (
                  <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in-50">
                    <div className="flex items-center gap-2">
                      {quizSession.userAnswers[quizSession.currentIndex] === quizSession.questions[quizSession.currentIndex].correctKey ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs font-['Outfit']">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>✓ Correct Answer: Option {quizSession.questions[quizSession.currentIndex].correctKey}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs font-['Outfit']">
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>✗ Incorrect — Correct Answer: Option {quizSession.questions[quizSession.currentIndex].correctKey}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <p><strong>Why:</strong> {quizSession.questions[quizSession.currentIndex].explanation}</p>

                      {/* Distractor Breakdown */}
                      {quizSession.questions[quizSession.currentIndex].distractorExplanations && Object.keys(quizSession.questions[quizSession.currentIndex].distractorExplanations || {}).length > 0 && (
                        <div className="pt-2 border-t border-slate-200 space-y-1">
                          <p className="text-xs font-bold text-slate-900 font-['Outfit']">Why the others are wrong:</p>
                          {Object.entries(quizSession.questions[quizSession.currentIndex].distractorExplanations || {}).map(([k, exp]) => (
                            <p key={k} className="text-xs text-slate-600 pl-2">
                              <strong>Option {k}:</strong> {exp}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Mnemonic & Exam Trap */}
                      {quizSession.questions[quizSession.currentIndex].mnemonic && (
                        <div className="mt-2 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
                          🧠 <strong>Memory Hook:</strong> {quizSession.questions[quizSession.currentIndex].mnemonic}
                        </div>
                      )}
                      {quizSession.questions[quizSession.currentIndex].trap && (
                        <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                          ⚠️ <strong>FMGE Exam Trap:</strong> {quizSession.questions[quizSession.currentIndex].trap}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextQuizQuestion}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                      >
                        <span>{quizSession.currentIndex + 1 === quizSession.questions.length ? 'Finish Quiz' : 'Next Question'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed Summary */
            <div className="text-center py-6 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto shadow-sm">
                <Trophy className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">Practice Quiz Completed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  All attempts have been logged to your FMGE study performance tracker.
                </p>
              </div>

              <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-2xl font-bold font-['Outfit'] text-slate-900">
                    {quizSession.score} / {quizSession.questions.length}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-slate-400 font-['Outfit']">Score</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-2xl font-bold font-['Outfit'] text-emerald-700">
                    {Math.round((quizSession.score / quizSession.questions.length) * 100)}%
                  </span>
                  <p className="text-[10px] uppercase font-bold text-slate-400 font-['Outfit']">Accuracy</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuizSession(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-['Outfit'] cursor-pointer"
                >
                  Return to Chat
                </button>
                <button
                  type="button"
                  onClick={startQuizMode}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-['Outfit'] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Start Another Quiz</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Conversational Message Stream */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* User Bubble */}
            {msg.role === 'user' ? (
              <div className="max-w-2xl min-w-0 break-words bg-slate-900 text-white rounded-2xl rounded-tr-xs px-5 py-3.5 text-sm shadow-sm leading-relaxed space-y-2.5">
                {msg.userAttachedImage && (
                  <div
                    className="relative group rounded-xl overflow-hidden border border-slate-700/80 max-w-xs cursor-zoom-in bg-slate-950 shadow-inner"
                    onClick={() => setActiveModalImage({ isOpen: true, imageUrl: msg.userAttachedImage!.url, title: msg.userAttachedImage!.fileName || 'Uploaded Medical Investigation' })}
                  >
                    <img
                      src={msg.userAttachedImage.url}
                      alt={msg.userAttachedImage.fileName || 'Attached Investigation'}
                      className="w-full h-auto max-h-48 object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Click to Zoom</span>
                    </div>
                  </div>
                )}
                {msg.content && <p>{msg.content}</p>}
              </div>
            ) : (
              /* Assistant Card */
              <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold font-['Outfit']">
                      1S
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-['Outfit']">Study Coach</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy answer"
                  >
                    {copiedMessageId === msg.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Proper Markdown Output via MarkdownRenderer or Streaming Indicator */}
                {msg.content ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs font-medium text-sky-900">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                    </span>
                    <span className="font-semibold">Synthesizing clinical response...</span>
                  </div>
                )}

                {/* Single Clinical MCQ Card if present */}
                {msg.singleQuiz && (
                  <div className="mt-4 rounded-3xl border border-slate-200/90 bg-slate-50/80 p-5 sm:p-6 space-y-4 shadow-2xs">
                    {/* Header Classification Badge */}
                    {(() => {
                      const correctKey = msg.singleQuiz.correctKey || (msg.singleQuiz as any).correctAnswer || 'A';
                      const isUserCorrect = msg.singleQuiz.userAnswer === correctKey;
                      const correctOpt = msg.singleQuiz.options.find(o => o.key === correctKey);

                      return (
                        <>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold font-['Outfit'] uppercase tracking-wider">
                                {msg.singleQuiz.subject}
                              </span>
                              <span className="text-xs font-semibold text-slate-700 font-['Outfit']">
                                {msg.singleQuiz.topic}
                              </span>
                            </div>

                            {msg.singleQuiz.userAnswer && (
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${
                                  isUserCorrect
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {isUserCorrect ? '✓ Correct' : `✗ Incorrect (Ans: Option ${correctKey})`}
                              </span>
                            )}
                          </div>

                          {/* Real Medical Image Display (ECG, X-Ray, Pathology, Dermatology, Fundoscopy, etc.) */}
                          {msg.singleQuiz.imageUrl && (
                            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group shadow-sm">
                              <img
                                src={msg.singleQuiz.imageUrl}
                                alt={msg.singleQuiz.topic}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-full max-h-[360px] object-contain cursor-zoom-in bg-slate-950"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.src.includes('/assets/medical-images/')) {
                                    target.src = '/assets/medical-images/ecg-complete-heart-block.svg';
                                  }
                                }}
                                onClick={() =>
                                  setActiveModalImage({
                                    isOpen: true,
                                    imageUrl: msg.singleQuiz!.imageUrl!,
                                    imageAsset: msg.singleQuiz!.imageAsset,
                                    title: `${msg.singleQuiz!.subject} · ${msg.singleQuiz!.topic}`,
                                    whatToLookFor: msg.singleQuiz!.whatToLookFor,
                                  })
                                }
                              />
                              <div className="absolute top-3 right-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveModalImage({
                                      isOpen: true,
                                      imageUrl: msg.singleQuiz!.imageUrl!,
                                      imageAsset: msg.singleQuiz!.imageAsset,
                                      title: `${msg.singleQuiz!.subject} · ${msg.singleQuiz!.topic}`,
                                      whatToLookFor: msg.singleQuiz!.whatToLookFor,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                >
                                  <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                                  <span>Click to Zoom</span>
                                </button>
                              </div>
                              {msg.singleQuiz.imageAsset?.sourceName && (
                                <div className="absolute bottom-2 left-3 text-[10px] text-slate-300 bg-slate-900/85 px-2.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>{msg.singleQuiz.imageAsset.sourceName}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Clinical Scenario Stem Card */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                            {msg.singleQuiz.stem && (
                              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                                {msg.singleQuiz.stem}
                              </p>
                            )}
                            <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug font-['Outfit']">
                              {msg.singleQuiz.question}
                            </p>
                          </div>

                          {/* Options A, B, C, D */}
                          <div className="grid grid-cols-1 gap-2.5">
                            {msg.singleQuiz.options.map((opt) => {
                              const isSelected = msg.singleQuiz?.userAnswer === opt.key;
                              const isRevealed = Boolean(msg.singleQuiz?.userAnswer);
                              const isCorrectKey = opt.key === correctKey;

                              let btnStyle = 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-800';
                              if (isRevealed) {
                                if (isCorrectKey) {
                                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500 shadow-sm';
                                } else if (isSelected && !isCorrectKey) {
                                  btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-400';
                                } else {
                                  btnStyle = 'border-slate-200 bg-slate-50/70 text-slate-400 opacity-80';
                                }
                              }

                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  disabled={isRevealed}
                                  onClick={() => handleSingleQuizAnswer(msg.id, opt.key)}
                                  className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                                >
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold font-['Outfit'] ${
                                      isRevealed && isCorrectKey
                                        ? 'bg-emerald-600 text-white'
                                        : isRevealed && isSelected && !isCorrectKey
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {opt.key}
                                  </span>
                                  <span className="leading-relaxed pt-0.5">{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Post-Answer Comprehensive Rationale */}
                          {msg.singleQuiz.userAnswer && (
                            <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in-50">
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs sm:text-sm">
                                <div>
                                  <p className="text-sm font-bold text-slate-900 font-['Outfit'] mb-1">
                                    Correct Answer: Option {correctKey} {correctOpt ? `(${correctOpt.text})` : ''}
                                  </p>
                                  <p className="text-slate-700 leading-relaxed">
                                    <strong>Why it is correct:</strong> {msg.singleQuiz.explanation}
                                  </p>
                                </div>

                                {/* Visual Finding Breakdown for Image Questions */}
                                {(msg.singleQuiz.whatToLookFor || msg.singleQuiz.imageAsset?.whatToLookFor) && (
                                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs leading-relaxed space-y-2">
                                    <div className="space-y-1">
                                      <p className="font-bold flex items-center gap-1.5 text-sky-900 font-['Outfit']">
                                        <Eye className="w-4 h-4 text-sky-600" />
                                        What to look at in this image:
                                      </p>
                                      <p className="font-medium pl-5 text-slate-700">
                                        {msg.singleQuiz.whatToLookFor || msg.singleQuiz.imageAsset?.whatToLookFor}
                                      </p>
                                    </div>

                                    {/* Button to open Annotated Lightbox */}
                                    {msg.singleQuiz.imageUrl && (
                                      <div className="pt-2 border-t border-sky-100 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setActiveModalImage({
                                              isOpen: true,
                                              imageUrl: msg.singleQuiz!.imageUrl!,
                                              annotatedImageUrl: msg.singleQuiz!.annotatedImageUrl || msg.singleQuiz!.imageAsset?.annotatedImageUrl,
                                              imageAsset: msg.singleQuiz!.imageAsset,
                                              title: `${msg.singleQuiz!.subject} · ${msg.singleQuiz!.topic}`,
                                              whatToLookFor: msg.singleQuiz!.whatToLookFor,
                                            })
                                          }
                                          className="px-3 py-1.5 rounded-xl bg-sky-100/80 hover:bg-sky-200 text-sky-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                                          <span>Open Annotated Visual Inspection</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Why the other options are wrong */}
                                {(msg.singleQuiz.distractorBreakdown || msg.singleQuiz.distractorExplanations) && Object.keys(msg.singleQuiz.distractorBreakdown || msg.singleQuiz.distractorExplanations || {}).length > 0 && (
                                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                    <p className="text-xs font-bold text-slate-900 font-['Outfit'] uppercase tracking-wide">
                                      Why other options are wrong:
                                    </p>
                                    {Object.entries(msg.singleQuiz.distractorBreakdown || msg.singleQuiz.distractorExplanations || {}).map(([k, exp]) => (
                                      <p key={k} className="text-xs text-slate-600 pl-2 leading-relaxed">
                                        <strong>Option {k}:</strong> {String(exp)}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {/* High-Yield FMGE Takeaway */}
                                {msg.singleQuiz.fmgeTakeaway && (
                                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium leading-relaxed">
                                    💡 <strong>FMGE High-Yield Takeaway:</strong> {msg.singleQuiz.fmgeTakeaway}
                                  </div>
                                )}

                                {/* Memory Hook */}
                                {(msg.singleQuiz.memoryHook || msg.singleQuiz.mnemonic) && (
                                  <div className="mt-2 p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-medium leading-relaxed">
                                    🧠 <strong>Memory Hook:</strong> {msg.singleQuiz.memoryHook || msg.singleQuiz.mnemonic}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Suggested Follow-up Chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">Follow-up:</span>
                    {msg.suggestedFollowUps.map((followUp, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSendMessage(followUp)}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
                      >
                        {followUp} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm w-fit"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#006B63] text-white text-xs font-bold font-['Outfit']">
              1S
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#006B63]" />
              <span>Consulting National Board clinical faculty standards...</span>
            </div>
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Bottom Docked Search & Chat Input Bar (Clinical Desk Mechanism) */}
      <div className="sticky bottom-0 z-20 pt-3 pb-2 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent space-y-2.5">
        {/* Image Attachment Preview Badge */}
        {attachedImage && (
          <div className="flex items-center gap-3 p-2 bg-teal-50 border border-teal-200 rounded-2xl w-fit max-w-full shadow-2xs animate-fadeIn">
            <img
              src={attachedImage.previewUrl}
              alt="Investigation Preview"
              className="h-11 w-11 object-cover rounded-xl border border-teal-300 shadow-2xs cursor-zoom-in"
              onClick={() => setActiveModalImage({ isOpen: true, imageUrl: attachedImage.previewUrl, title: attachedImage.fileName })}
            />
            <div className="text-xs min-w-0 pr-2">
              <p className="font-semibold text-slate-800 truncate max-w-xs">{attachedImage.fileName}</p>
              <p className="text-[10px] text-teal-800 font-medium">Ready for clinical investigation review</p>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Remove attached image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick Action Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] text-slate-500 font-semibold shrink-0 flex items-center gap-1 mr-1">
            <Brain className="h-3.5 w-3.5 text-[#006B63]" />
            High-Yield:
          </span>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(action.query)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200/90 hover:border-slate-300 rounded-full text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Main Clinical Prompt & Inquiry Bar */}
        <div className="relative rounded-3xl border border-slate-300/90 bg-white p-2 sm:p-2.5 shadow-md focus-within:border-[#006B63] focus-within:ring-2 focus-within:ring-[#006B63]/10 transition-all">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center h-10 w-10 rounded-2xl transition-colors shrink-0 cursor-pointer ${
                attachedImage
                  ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Attach Medical Image (ECG, X-Ray, Slide, Histopathology, Clinical Photo)"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuery}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={attachedImage ? "Ask a question about this attached medical image..." : "Ask Clinical Faculty Mentor anything (e.g. CKD staging criteria, ECG findings, Drugs of Choice)..."}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none py-2.5 px-2 min-h-[44px] max-h-[160px] leading-relaxed"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!inputQuery.trim() && !attachedImage) || isLoading}
              className={`flex items-center justify-center h-10 px-4 rounded-2xl text-xs font-bold font-['Outfit'] transition-all shrink-0 cursor-pointer ${
                (inputQuery.trim() || attachedImage) && !isLoading
                  ? 'bg-[#006B63] text-white hover:bg-[#005049] shadow-xs active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Consult</span>
                  <Send className="h-3.5 w-3.5 sm:ml-1.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </main>
      </div>

      {/* Modal Image Zoom Lightbox */}
      <MedicalImageViewerModal
        isOpen={activeModalImage.isOpen}
        onClose={() => setActiveModalImage(prev => ({ ...prev, isOpen: false }))}
        imageUrl={activeModalImage.imageUrl}
        annotatedImageUrl={activeModalImage.annotatedImageUrl}
        imageAsset={activeModalImage.imageAsset}
        title={activeModalImage.title}
        whatToLookFor={activeModalImage.whatToLookFor}
      />

      {/* Consultation History & Memory Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col font-['Plus_Jakarta_Sans'] border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-['Outfit'] text-slate-900">
                      Consultation History
                    </h2>
                    <p className="text-xs text-slate-500">
                      {sessions.length} saved session{sessions.length === 1 ? '' : 's'} with memory
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Actions: New Chat & Search */}
              <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/70">
                <button
                  type="button"
                  onClick={handleNewSession}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-['Outfit'] shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  <Plus className="h-4 w-4" />
                  <span>Start New Consultation</span>
                </button>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search past consultations or topics..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  />
                </div>
              </div>

              {/* Session List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No matching consultations</p>
                    <p className="text-[11px] text-slate-400">Ask the coach a question to start your study history</p>
                  </div>
                ) : (
                  filteredSessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    const messageCount = (s.messages || []).length;
                    const firstUserMsg = s.messages?.find((m) => m.role === 'user');

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[9px] font-bold font-mono">
                                  ACTIVE
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatRelativeDate(s.updatedAt || s.createdAt)}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 font-['Outfit'] line-clamp-1 group-hover:text-sky-950">
                              {s.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {firstUserMsg?.content || 'Clinical consultation'}
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                              <Clock className="h-3 w-3" />
                              <span>{messageCount} turn{messageCount === 1 ? '' : 's'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(s.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                            title="Delete consultation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              {sessions.length > 0 && (
                <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={executeClearAllHistory}
                    className="font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Clear All History
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Persisted in Memory
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
