import { AppState, FMGESubject, TopicItem, MedicalPearl, TelegramChannelConfig, TelegramMCQ, TelegramAnnouncement } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getInitialAppState } from '../data/sampleData';
import { INITIAL_PEARLS } from '../data/initialPearls';
import { DEFAULT_TELEGRAM_CHANNELS, INITIAL_TELEGRAM_MCQS, DEFAULT_TELEGRAM_ANNOUNCEMENTS } from '../data/telegramPresetData';
import { getDaysUntilDateKey, getLocalDateKey } from './date';
import { calculateStudyReadiness } from './readinessEngine';

const STORAGE_KEY = 'fmge_study_tracker_v2';

export function normalizeQuestionStem(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function deduplicateQuestions(questions: TelegramMCQ[]): TelegramMCQ[] {
  const seenIds = new Set<string>();
  const seenStems = new Set<string>();
  const deduped: TelegramMCQ[] = [];

  for (const q of questions) {
    if (!q || !q.question) continue;
    const stem = normalizeQuestionStem(q.question);
    if (seenIds.has(q.id) || (stem.length > 15 && seenStems.has(stem))) {
      continue;
    }
    seenIds.add(q.id);
    if (stem.length > 15) {
      seenStems.add(stem);
    }
    deduped.push(q);
  }
  return deduped;
}

export function deduplicateAnnouncements(announcements: TelegramAnnouncement[]): TelegramAnnouncement[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped: TelegramAnnouncement[] = [];

  for (const a of announcements) {
    if (!a || !a.title) continue;
    const normTitle = a.title.toLowerCase().trim();
    if (seenIds.has(a.id) || seenTitles.has(normTitle)) {
      continue;
    }
    seenIds.add(a.id);
    seenTitles.add(normTitle);
    deduped.push(a);
  }
  return deduped;
}

export function normalizeAppState(value: unknown): AppState | null {
  if (!value || typeof value !== 'object') return null;

  const parsed = value as Partial<AppState>;
  if (!parsed.settings || typeof parsed.settings !== 'object' || !parsed.topicsState || typeof parsed.topicsState !== 'object') {
    return null;
  }

  const defaults = getInitialAppState();
  const existingChannels = Array.isArray(parsed.telegramChannels)
    ? parsed.telegramChannels.filter((channel): channel is TelegramChannelConfig =>
        Boolean(channel && typeof channel.handle === 'string')
      )
    : [];
  const existingChannelHandles = new Set(
    existingChannels.map((channel) => channel.handle.toLowerCase().replace(/^@/, ''))
  );
  const mergedChannels = [...existingChannels];
  DEFAULT_TELEGRAM_CHANNELS.forEach((preset) => {
    const cleanPresetHandle = preset.handle.toLowerCase().replace(/^@/, '');
    if (!existingChannelHandles.has(cleanPresetHandle)) {
      mergedChannels.push(preset);
      existingChannelHandles.add(cleanPresetHandle);
    }
  });

  const existingQuestions = Array.isArray(parsed.telegramQuestions) ? parsed.telegramQuestions : [];
  const existingAnnouncements = Array.isArray(parsed.telegramAnnouncements)
    ? parsed.telegramAnnouncements
    : [];

  return {
    ...defaults,
    ...parsed,
    settings: {
      ...defaults.settings,
      ...parsed.settings,
      autoSaveHighYield: parsed.settings.autoSaveHighYield ?? true,
    },
    subjectProgress: parsed.subjectProgress && typeof parsed.subjectProgress === 'object'
      ? parsed.subjectProgress
      : {},
    topicsState: parsed.topicsState,
    grandTests: Array.isArray(parsed.grandTests) ? parsed.grandTests : [],
    errorNotebook: Array.isArray(parsed.errorNotebook) ? parsed.errorNotebook : [],
    dailyTasks: Array.isArray(parsed.dailyTasks) ? parsed.dailyTasks : [],
    studyLogs: parsed.studyLogs && typeof parsed.studyLogs === 'object' ? parsed.studyLogs : {},
    customPearls: Array.isArray(parsed.customPearls) ? parsed.customPearls : [],
    bookmarkedPearlIds: Array.isArray(parsed.bookmarkedPearlIds) ? parsed.bookmarkedPearlIds : [],
    completedMissionIds: parsed.completedMissionIds && typeof parsed.completedMissionIds === 'object'
      ? parsed.completedMissionIds
      : {},
    telegramChannels: mergedChannels,
    telegramQuestions: deduplicateQuestions([...existingQuestions, ...INITIAL_TELEGRAM_MCQS]),
    telegramAnnouncements: deduplicateAnnouncements([
      ...existingAnnouncements,
      ...DEFAULT_TELEGRAM_ANNOUNCEMENTS,
    ]),
  };
}

export function loadAppState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const normalized = normalizeAppState(JSON.parse(saved));
      if (normalized) return normalized;
    }
  } catch (err) {
    console.error('Failed to load app state from localStorage:', err);
  }
  return getInitialAppState();
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save app state to localStorage:', err);
  }
}

export function exportAppStateToJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function downloadBackupFile(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportAppStateToJSON(state));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `FMGE_Study_Tracker_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Compute comprehensive statistics
export interface AppStats {
  totalTopics: number;
  completedNotesTopics: number;
  completedQBankTopics: number;
  completedR1Topics: number;
  completedR2Topics: number;
  completedR3Topics: number;
  notesPercentage: number;
  qBankPercentage: number;
  r1Percentage: number;
  r2Percentage: number;
  r3Percentage: number;
  overallReadinessScore: number;
  
  // High Yield specifics
  totalHighYieldTopics: number;
  completedHighYieldNotes: number;
  completedHighYieldR1: number;
  highYieldReadinessScore: number;

  // Total Estimated Marks in syllabus
  totalMarksInSyllabus: number; // 300
  estimatedMasteredMarks: number;

  // Grand Test statistics
  latestGTScore: number | null;
  highestGTScore: number | null;
  averageGTScore: number | null;
  passedGTCount: number;
  totalGTsCount: number;

  // Today's goals
  todayStudyMinutes: number;
  todayQuestionsSolved: number;
  daysRemaining: number;
}

export function calculateAppStats(state: AppState): AppStats {
  let totalTopics = 0;
  let completedNotesTopics = 0;
  let completedQBankTopics = 0;
  let completedR1Topics = 0;
  let completedR2Topics = 0;
  let completedR3Topics = 0;

  let totalHighYieldTopics = 0;
  let completedHighYieldNotes = 0;
  let completedHighYieldR1 = 0;

  let totalWeightedProgressSum = 0;

  FMGE_SUBJECTS.forEach((subject) => {
    const customTopics = state.subjectProgress[subject.id]?.customTopics || [];
    const allTopics = [...subject.topics, ...customTopics];
    let subjectNotesDone = 0;
    let subjectR1Done = 0;

    allTopics.forEach((topic) => {
      totalTopics++;
      if (topic.isHighYield) totalHighYieldTopics++;

      const key = `${subject.id}-${topic.id}`;
      const savedTopic = state.topicsState[key] || {};
      const isNotes = savedTopic.notesDone ?? topic.notesDone;
      const isQBank = savedTopic.qBankDone ?? topic.qBankDone;
      const isR1 = savedTopic.r1Done ?? topic.r1Done;
      const isR2 = savedTopic.r2Done ?? topic.r2Done;
      const isR3 = savedTopic.r3Done ?? topic.r3Done;

      if (isNotes) {
        completedNotesTopics++;
        subjectNotesDone++;
        if (topic.isHighYield) completedHighYieldNotes++;
      }
      if (isQBank) completedQBankTopics++;
      if (isR1) {
        completedR1Topics++;
        subjectR1Done++;
        if (topic.isHighYield) completedHighYieldR1++;
      }
      if (isR2) completedR2Topics++;
      if (isR3) completedR3Topics++;
    });

    const subjectCompletionFraction = allTopics.length > 0
      ? (subjectNotesDone * 0.4 + subjectR1Done * 0.6) / allTopics.length
      : 0;
    totalWeightedProgressSum += subjectCompletionFraction * subject.weightage;
  });

  const notesPercentage = totalTopics > 0 ? Math.round((completedNotesTopics / totalTopics) * 100) : 0;
  const qBankPercentage = totalTopics > 0 ? Math.round((completedQBankTopics / totalTopics) * 100) : 0;
  const r1Percentage = totalTopics > 0 ? Math.round((completedR1Topics / totalTopics) * 100) : 0;
  const r2Percentage = totalTopics > 0 ? Math.round((completedR2Topics / totalTopics) * 100) : 0;
  const r3Percentage = totalTopics > 0 ? Math.round((completedR3Topics / totalTopics) * 100) : 0;

  // Single canonical readiness calculation, shared with the transparent
  // readiness engine. A new user with no real study data is therefore 0.
  const overallReadinessScore = calculateStudyReadiness(state).score ?? 0;

  const highYieldReadinessScore = totalHighYieldTopics > 0
    ? Math.round(((completedHighYieldNotes * 0.5 + completedHighYieldR1 * 0.5) / totalHighYieldTopics) * 100)
    : 0;

  // Estimated mastered marks (out of 300)
  const estimatedMasteredMarks = Math.min(300, Math.round(totalWeightedProgressSum));

  // GT stats
  const gts = state.grandTests || [];
  const totalGTsCount = gts.length;
  let latestGTScore: number | null = null;
  let highestGTScore: number | null = null;
  let averageGTScore: number | null = null;
  let passedGTCount = 0;

  if (gts.length > 0) {
    // sort by date ascending
    const sorted = [...gts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    latestGTScore = sorted[sorted.length - 1].score;
    highestGTScore = Math.max(...gts.map((g) => g.score));
    const totalScore = gts.reduce((sum, g) => sum + g.score, 0);
    averageGTScore = Math.round(totalScore / gts.length);
    passedGTCount = gts.filter((g) => g.score >= 150).length;
  }

  // Today study log
  const todayStr = getLocalDateKey();
  const todayLog = state.studyLogs[todayStr];
  const todayStudyMinutes = todayLog?.studyMinutes || 0;
  const todayQuestionsSolved = todayLog?.questionsSolved || 0;

  // Days remaining until exam
  const daysRemaining = getDaysUntilDateKey(state.settings.examDate || getLocalDateKey());

  return {
    totalTopics,
    completedNotesTopics,
    completedQBankTopics,
    completedR1Topics,
    completedR2Topics,
    completedR3Topics,
    notesPercentage,
    qBankPercentage,
    r1Percentage,
    r2Percentage,
    r3Percentage,
    overallReadinessScore,
    totalHighYieldTopics,
    completedHighYieldNotes,
    completedHighYieldR1,
    highYieldReadinessScore,
    totalMarksInSyllabus: 300,
    estimatedMasteredMarks,
    latestGTScore,
    highestGTScore,
    averageGTScore,
    passedGTCount,
    totalGTsCount,
    todayStudyMinutes,
    todayQuestionsSolved,
    daysRemaining,
  };
}

export function getAllPearls(state: AppState): MedicalPearl[] {
  const custom = state.customPearls || [];
  const initial = INITIAL_PEARLS;
  const combined = [...initial, ...custom];
  const bookmarkedSet = new Set(state.bookmarkedPearlIds || []);
  return combined.map((p) => ({
    ...p,
    isBookmarked: bookmarkedSet.has(p.id) || Boolean(p.isBookmarked),
  }));
}
