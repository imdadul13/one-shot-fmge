import { AppState, FMGESubject, TopicItem } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { calculateTopicPerformanceMetrics } from './performanceEngine';
import { calculateTopicAdaptivePriority } from './adaptivePriorityEngine';
import { VERIFIED_TOPIC_PEARLS } from './pearlEngine';

export interface SearchResultItem {
  id: string;
  type: 'topic' | 'concept' | 'subject' | 'error' | 'mcq' | 'pearl' | 'flashcard';
  title: string;
  subtitle: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  topicId?: string;
  topicName?: string;
  conceptId?: string;
  matchedText: string;
  matchScore: number;
  priorityScore?: number;
  masteryPct?: number;
  isHighYield?: boolean;
  action: {
    tab: 'syllabus' | 'practice' | 'errors' | 'dashboard';
    subjectId?: string;
    topicId?: string;
    topicName?: string;
  };
}

export function searchFmgeStudyData(
  query: string,
  state: AppState,
  limit = 8
): SearchResultItem[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const results: SearchResultItem[] = [];
  const seenIds = new Set<string>();

  // 1. SEARCH ACROSS 19 SUBJECTS & 200 TOPICS
  for (const subject of FMGE_SUBJECTS) {
    // Subject Match
    const subjectNameLower = subject.name.toLowerCase();
    const subjectDescLower = subject.description.toLowerCase();
    const isSubjectMatch = tokens.every(
      (t) => subjectNameLower.includes(t) || subject.code.toLowerCase().includes(t) || subjectDescLower.includes(t)
    );

    if (isSubjectMatch && !seenIds.has(`sub-${subject.id}`)) {
      seenIds.add(`sub-${subject.id}`);
      results.push({
        id: `sub-${subject.id}`,
        type: 'subject',
        title: subject.name,
        subtitle: `${subject.weightage} Marks • ${subject.phase.toUpperCase()} • ${subject.topics.length} High-Yield Topics`,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        matchedText: subject.description,
        matchScore: subjectNameLower.startsWith(cleanQuery) ? 100 : 80,
        action: {
          tab: 'syllabus',
          subjectId: subject.id,
        },
      });
    }

    // Topics Match
    for (const topic of subject.topics) {
      const topicNameLower = topic.name.toLowerCase();
      let matchScore = 0;

      if (topicNameLower === cleanQuery) {
        matchScore = 120;
      } else if (topicNameLower.startsWith(cleanQuery)) {
        matchScore = 95;
      } else if (topicNameLower.includes(cleanQuery)) {
        matchScore = 80;
      } else {
        const matchedTokens = tokens.filter((t) => topicNameLower.includes(t));
        if (matchedTokens.length === tokens.length) {
          matchScore = 60 + matchedTokens.length * 5;
        } else if (matchedTokens.length > 0) {
          matchScore = 30 + matchedTokens.length * 5;
        }
      }

      if (matchScore > 0 && !seenIds.has(`topic-${topic.id}`)) {
        seenIds.add(`topic-${topic.id}`);

        const perf = calculateTopicPerformanceMetrics(subject.id, topic.id, state.mcqAttempts);
        const priority = calculateTopicAdaptivePriority(subject, topic, state, 60);

        results.push({
          id: `topic-${topic.id}`,
          type: 'topic',
          title: topic.name,
          subtitle: `${subject.name} (${subject.code}) • Priority ${priority.priorityScore}/100 • Accuracy ${perf.accuracy}%`,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          topicId: topic.id,
          topicName: topic.name,
          matchedText: topic.name,
          matchScore,
          priorityScore: priority.priorityScore,
          masteryPct: priority.masteryScore,
          isHighYield: topic.isHighYield,
          action: {
            tab: 'syllabus',
            subjectId: subject.id,
            topicId: topic.id,
            topicName: topic.name,
          },
        });
      }
    }
  }

  // 2. SEARCH ACROSS ERROR VAULT
  for (const err of state.errorNotebook || []) {
    const gistLower = (err.questionGist || '').toLowerCase();
    const mistakeLower = (err.myMistake || '').toLowerCase();
    const conceptLower = (err.correctConcept || '').toLowerCase();
    const topicLower = (err.topic || '').toLowerCase();

    const matches = tokens.some(
      (t) =>
        gistLower.includes(t) ||
        mistakeLower.includes(t) ||
        conceptLower.includes(t) ||
        topicLower.includes(t)
    );

    if (matches && !seenIds.has(`err-${err.id}`)) {
      seenIds.add(`err-${err.id}`);
      const subject = FMGE_SUBJECTS.find((s) => s.id === err.subjectId);
      results.push({
        id: `err-${err.id}`,
        type: 'error',
        title: `Error: ${err.questionGist || err.topic}`,
        subtitle: `Missed Concept: ${err.correctConcept || 'Review required'} • ${subject?.name || err.subjectId}`,
        subjectId: err.subjectId,
        subjectName: subject?.name || err.subjectId,
        subjectCode: subject?.code || 'ERR',
        topicId: err.topicId,
        topicName: err.topic,
        matchedText: err.correctConcept || err.myMistake || err.questionGist,
        matchScore: 75,
        action: {
          tab: 'errors',
          subjectId: err.subjectId,
          topicId: err.topicId,
        },
      });
    }
  }

  // 3. SEARCH ACROSS HIGH-YIELD PEARLS & MNEMONICS
  for (const [topicId, pearls] of Object.entries(VERIFIED_TOPIC_PEARLS)) {
    for (const pearl of pearls) {
      const statementLower = pearl.statement.toLowerCase();
      const catLower = pearl.category.toLowerCase();
      const trapLower = (pearl.examTrapWarning || '').toLowerCase();

      const matches = tokens.some(
        (t) => statementLower.includes(t) || catLower.includes(t) || trapLower.includes(t)
      );

      if (matches && !seenIds.has(pearl.id)) {
        seenIds.add(pearl.id);
        const subject = FMGE_SUBJECTS.find((s) => s.id === pearl.subjectId);
        const topic = subject?.topics.find((t) => t.id === pearl.topicId);

        results.push({
          id: pearl.id,
          type: 'pearl',
          title: `Pearl: ${pearl.statement.substring(0, 75)}...`,
          subtitle: `${pearl.category} • ${subject?.name || pearl.subjectId} → ${topic?.name || pearl.topicId}`,
          subjectId: pearl.subjectId,
          subjectName: subject?.name || pearl.subjectId,
          subjectCode: subject?.code || 'MED',
          topicId: pearl.topicId,
          topicName: topic?.name,
          matchedText: pearl.statement,
          matchScore: 70,
          action: {
            tab: 'syllabus',
            subjectId: pearl.subjectId,
            topicId: pearl.topicId,
            topicName: topic?.name,
          },
        });
      }
    }
  }

  // 4. SEARCH ACROSS TELEGRAM SAVED QUESTIONS
  for (const q of state.telegramQuestions || []) {
    const qLower = (q.question || '').toLowerCase();
    const topicLower = (q.topic || '').toLowerCase();
    const explanationLower = (q.explanation || '').toLowerCase();

    const matches = tokens.some(
      (t) => qLower.includes(t) || topicLower.includes(t) || explanationLower.includes(t)
    );

    if (matches && !seenIds.has(`tg-${q.id}`)) {
      seenIds.add(`tg-${q.id}`);
      const subject = FMGE_SUBJECTS.find((s) => s.id === q.subjectId);

      results.push({
        id: `tg-${q.id}`,
        type: 'mcq',
        title: `MCQ: ${q.question.substring(0, 80)}...`,
        subtitle: `Community QBank • ${subject?.name || q.subjectId} → ${q.topic}`,
        subjectId: q.subjectId || 'medicine',
        subjectName: subject?.name || 'Medicine',
        subjectCode: subject?.code || 'QBANK',
        matchedText: q.question,
        matchScore: 65,
        action: {
          tab: 'practice',
          subjectId: q.subjectId,
        },
      });
    }
  }

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
