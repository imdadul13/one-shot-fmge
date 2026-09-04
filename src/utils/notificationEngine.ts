import type React from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Droplet,
  RotateCcw,
} from 'lucide-react';
import { AppState } from '../types';
import { getLocalDateKey } from '../utils/date';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

export const NOTIFICATION_STORAGE_KEY = 'fmge_notification_center_v1';
const DEFAULT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export type NotificationCategory = 'revision' | 'wellness' | 'focus' | 'error' | 'exam';

export interface SmartNotification {
  id: string;
  category: NotificationCategory;
  priority: 'high' | 'medium' | 'low';
  condition: string;
  cooldownMs: number;
  title: string;
  description: string;
  time: string;
  actionLabel: string;
  onAction: () => void;
  icon: React.ElementType;
  iconColor: string;
}

export type DismissalRecord = { hiddenAt: number; condition: string };

export function loadDismissals(): Record<string, DismissalRecord> {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DismissalRecord>) : {};
  } catch {
    return {};
  }
}

export function saveDismissals(dismissals: Record<string, DismissalRecord>): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(dismissals));
  } catch {
    /* storage unavailable */
  }
}

export function shouldShow(n: SmartNotification, dismissals: Record<string, DismissalRecord>): boolean {
  const rec = dismissals[n.id];
  if (!rec) return true;
  if (rec.condition !== n.condition) return true; // underlying condition changed -> resurface
  if (Date.now() - rec.hiddenAt > n.cooldownMs) return true; // cooldown elapsed
  return false;
}

function timeAgo(minutes: number): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export interface NotificationActions {
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectSubject?: (subjectId: string) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string) => void;
  onDismiss?: (id: string, condition: string) => void;
  onBreakLogged?: (message: string) => void;
}

export function buildNotifications(
  state: AppState,
  dismissals: Record<string, DismissalRecord>,
  actions: NotificationActions
): SmartNotification[] {
  const list: SmartNotification[] = [];
  const now = Date.now();
  const todayKey = getLocalDateKey();

  const unreviewedMistakes = Object.values(state.errorNotebook || {}).filter(
    (m) => m && !m.isReviewed
  );
  const highPriorityOpen = Object.values(state.dailyTasks || {}).filter(
    (t) => t && !t.completed && t.priority === 'high'
  );
  const todayLog = state.studyLogs?.[todayKey];
  const didStudyToday = !!todayLog && (todayLog.studyMinutes || 0) > 0;
  const subjectName = (id?: string) =>
    FMGE_SUBJECTS.find((s) => s.id === id)?.name || id || 'a clinical subject';

  // 1. Unreviewed mistakes
  if (unreviewedMistakes.length > 0) {
    const mistake = unreviewedMistakes[0];
    list.push({
      id: 'notif-error-vault',
      category: 'error',
      priority: 'high',
      condition: `mistakes:${unreviewedMistakes.length}`,
      cooldownMs: 2 * 60 * 60 * 1000,
      title:
        unreviewedMistakes.length === 1
          ? '1 Mistake Needs Remediation'
          : `${unreviewedMistakes.length} Mistakes Need Remediation`,
      description: `Start in ${subjectName(mistake.subjectId)} — ${mistake.topic || 'clinical concept'}. Close the loop to lock in the correct concept before it slips away.`,
      time: timeAgo(Math.max(1, Math.round((now - new Date(mistake.dateAdded).getTime()) / 60000))),
      actionLabel: 'Remediate Now',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('errors');
      },
      icon: AlertTriangle,
      iconColor: 'text-rose-600 bg-rose-50 border-rose-200/80',
    });
  }

  // 2. High-priority task left open
  if (highPriorityOpen.length > 0) {
    const task = highPriorityOpen[0];
    list.push({
      id: 'notif-high-task',
      category: 'focus',
      priority: 'high',
      condition: `tasks:${highPriorityOpen.length}`,
      cooldownMs: 4 * 60 * 60 * 1000,
      title:
        highPriorityOpen.length === 1
          ? '1 High-Priority Task Open'
          : `${highPriorityOpen.length} High-Priority Tasks Open`,
      description: task.topicName
        ? `Ready when you are: ${task.topicName} (${task.durationMinutes} min). Knock it out to protect today's momentum.`
        : `${task.title} is still open. Start it now to protect today's momentum.`,
      time: 'Today',
      actionLabel: 'Open Planner',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('daily');
      },
      icon: ClipboardList,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    });
  }

  // 3. Revisions due at or before today
  const dueSubjects = Object.values(state.subjectProgress || {}).filter(
    (s) => s && s.targetRevisionDate && s.targetRevisionDate <= todayKey
  );
  if (dueSubjects.length > 0) {
    const conditionKey = `revision:${dueSubjects.length}:${dueSubjects
      .map((s) => s.subjectId)
      .sort()
      .join(',')}`;
    list.push({
      id: 'notif-revision-due',
      category: 'revision',
      priority: 'medium',
      condition: conditionKey,
      cooldownMs: DEFAULT_COOLDOWN_MS,
      title:
        dueSubjects.length === 1
          ? '1 Subject Is Due for Recall'
          : `${dueSubjects.length} Subjects Due for Recall`,
      description: `Active recall is due for ${dueSubjects.map((s) => subjectName(s.subjectId)).join(', ')}. Reviewing now cements retention and lightens exam-week load.`,
      time: 'Due today',
      actionLabel: 'Start Revision',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('revision');
      },
      icon: RotateCcw,
      iconColor: 'text-sky-600 bg-sky-50 border-sky-200/80',
    });
  }

  // 4. Grand Test milestone from exam proximity
  if (state.settings.examDate) {
    const msLeft = new Date(state.settings.examDate).getTime() - now;
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (daysLeft >= 0 && (daysLeft <= 45 || daysLeft % 30 === 0)) {
      const lastGt = (state.grandTests || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      list.push({
        id: 'notif-exam-milestone',
        category: 'exam',
        priority: 'medium',
        condition: `exam:${daysLeft}`,
        cooldownMs: DEFAULT_COOLDOWN_MS,
        title: `${daysLeft} Days to the Board`,
        description: lastGt
          ? `Your latest full-length was ${lastGt.title} (${lastGt.score}/${lastGt.totalMarks} on ${lastGt.platform}). A timed mock now sharpens pacing and test-day stamina.`
          : `Consider running a timed full-length mock to validate pacing and identify weak papers before exam day.`,
        time: `T-${daysLeft}`,
        actionLabel: 'Open Grand Tests',
        onAction: () => {
          actions.onClose();
          actions.onNavigateTab('grandtests');
        },
        icon: CalendarDays,
        iconColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
      });
    }
  }

  // 5. No study logged today (only for established routines)
  const hasRoutine = state.studyLogs && Object.keys(state.studyLogs).length >= 1;
  if (!didStudyToday && hasRoutine) {
    list.push({
      id: 'notif-no-study-today',
      category: 'focus',
      priority: 'medium',
      condition: `nostudy:${todayKey}`,
      cooldownMs: 3 * 60 * 60 * 1000,
      title: 'No Study Session Logged Yet Today',
      description:
        'A 15-minute active-recall block now compounds better than a long passive session later. Start with one high-yield topic.',
      time: 'Today',
      actionLabel: 'Start a Block',
      onAction: () => {
        actions.onClose();
        actions.onNavigateTab('dashboard');
      },
      icon: BookOpen,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    });
  }

  // 6. Cognitive micro-break — refreshes on its own interval, dismisses on actioning
  const breakMinutes = state.settings.breakReminderInterval || 45;
  const breakRec = dismissals['notif-break'];
  const breakDue = !breakRec || Date.now() - breakRec.hiddenAt >= breakMinutes * 60000;
  if (breakDue) {
    list.push({
      id: 'notif-break',
      category: 'wellness',
      priority: 'low',
      condition: `break:${breakMinutes}`,
      cooldownMs: breakMinutes * 60000,
      title: 'Micro-Break Protocol',
      description: `You're due a ${breakMinutes}-minute cognitive reset: stand, hydrate, and let your eyes rest 20 feet away for 20 seconds.`,
      time: timeAgo(Math.round(breakMinutes)),
      actionLabel: 'Hydrate & Reset',
      onAction: () => {
        actions.onBreakLogged?.('Logged a healthy reset. Cognitive stamina restored — back to high-yield work.');
        // Actioning a break completes it: dismiss until the next interval
        actions.onDismiss?.('notif-break', `break:${breakMinutes}`);
      },
      icon: Droplet,
      iconColor: 'text-sky-600 bg-sky-50 border-sky-200/80',
    });
  }

  return list;
}

/** Lightweight check for rendering the unread badge — reads persisted dismissals. */
export function hasUnreadNotifications(state: AppState): boolean {
  const dismissals = loadDismissals();
  const noop: NotificationActions = {
    onClose: () => {},
    onNavigateTab: () => {},
    onSelectSubject: () => {},
    onLaunchPracticeSession: () => {},
    onDismiss: () => {},
    onBreakLogged: () => {},
  };
  const all = buildNotifications(state, dismissals, noop);
  return all.some((n) => shouldShow(n, dismissals));
}
