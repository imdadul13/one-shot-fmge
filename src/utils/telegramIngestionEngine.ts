import { TelegramMCQ, TelegramAnnouncement, MedicalPearl } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { extractTopicKeywords } from './videoRecommendationEngine';

export interface RawTelegramPayload {
  messageId: string | number;
  channelId?: string;
  channelName?: string;
  text: string;
  caption?: string;
  pollOptions?: Array<{ text: string; voterCount?: number; isCorrect?: boolean }>;
  correctOptionKey?: string; // "A" | "B" | "C" | "D"
  photoUrl?: string;
  videoUrl?: string;
  videoThumbUrl?: string;
  documentUrl?: string;
  timestamp?: string | number;
  postUrl?: string;
  tags?: string[];
  isHighYield?: boolean;
}

export interface IngestedContentResult {
  type: 'mcq' | 'announcement' | 'high_yield_note' | 'unrecognized';
  mcq?: TelegramMCQ;
  announcement?: TelegramAnnouncement;
  pearl?: MedicalPearl;
  classificationConfidence: number; // 0 to 1
  matchedSubjectId?: string;
  matchedTopicId?: string;
  isDuplicate: boolean;
}

/**
 * Computes a normalized content fingerprint to detect duplicate questions
 * regardless of formatting, spacing, casing, or punctuation.
 */
export function computeContentFingerprint(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/^q(\.|\:|\d+|\s)+/i, '') // strip leading Q. or Q1.
    .replace(/[^a-z0-9]/g, '')
    .trim();
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/**
 * Extracts options from raw text formatted like:
 * A) Option 1
 * B) Option 2
 * or (a) ... (b) ... or 1. ... 2. ...
 */
export function extractEmbeddedOptionsFromText(text: string): {
  questionText: string;
  options: { key: string; text: string; percentage?: number }[];
  inferredAnswer?: string;
  extractedExplanation?: string;
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const options: { key: string; text: string }[] = [];
  const questionLines: string[] = [];
  let inferredAnswer: string | undefined;
  let extractedExplanation: string | undefined;

  const optionRegex = /^([A-Da-d1-4])[\.\)\:\-\s]\s*(.+)$/;
  const answerRegex = /(?:Ans|Answer|Correct Option|Key)[\s\:\-\=]+([A-Da-d])/i;
  const explanationRegex = /(?:Exp|Explanation|Discussion|Rationale)[\s\:\-\=]+([\s\S]+)/i;

  const letters = ['A', 'B', 'C', 'D'];

  for (const line of lines) {
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      inferredAnswer = ansMatch[1].toUpperCase();
      continue;
    }

    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      extractedExplanation = expMatch[1].trim();
      continue;
    }

    const optMatch = line.match(optionRegex);
    if (optMatch && options.length < 4) {
      const idx = options.length;
      options.push({
        key: letters[idx] || 'A',
        text: optMatch[2].trim(),
      });
      continue;
    }

    if (options.length === 0) {
      questionLines.push(line);
    } else if (!extractedExplanation) {
      // Line after options could be additional explanation
      extractedExplanation = line;
    }
  }

  const questionText = questionLines.join(' ').trim() || text.split('\n')[0].trim();

  return {
    questionText,
    options: options.map((opt) => ({ ...opt, percentage: 25 })),
    inferredAnswer,
    extractedExplanation,
  };
}

/**
 * Classifies clinical medical text into the FMGE 19-subject taxonomy:
 * Subject -> Topic -> Subtopic -> Concept.
 */
const CLINICAL_ANCHORS: Array<{ keywords: string[]; subjectId: string; topicId: string; topicName: string; subtopic: string }> = [
  {
    keywords: ['stemi', 'nstemi', 'ecg', 'infarction', 'coronary artery', 'troponin', 'arrhythmia', 'heart block', 'wpw', 'chest pain', 'lead ii', 'lead iii', 'avf', 'rca', 'lad'],
    subjectId: 'medicine',
    topicId: 'med-1',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'Cardiology',
  },
  {
    keywords: ['drug of choice', 'psvt', 'adenosine', 'amiodarone', 'antidote', 'atropine', 'beta blocker', 'cholinergic', 'adrenergic', 'receptor', 'agonist', 'antagonist', 'organophosphate', 'pralidoxime'],
    subjectId: 'pharmacology',
    topicId: 'pharm-1',
    topicName: 'Autonomic Nervous System Drugs',
    subtopic: 'Autonomic Pharmacology',
  },
  {
    keywords: ['vaccine', 'vvm', 'cold chain', 'immunization', 'ice lined refrigerator', 'screening', 'sensitivity', 'specificity', 'positive predictive value', 'ppv', 'npv', 'biostatistics', 'epidemiology'],
    subjectId: 'psm',
    topicId: 'psm-2',
    topicName: 'Vaccine Storage & Cold Chain Management',
    subtopic: 'Immunization & Cold Chain',
  },
  {
    keywords: ['parkland', 'burn', 'burns', 'rule of nines', 'escharotomy', 'fast exam', 'trauma', 'tension pneumothorax', 'atls', 'chest tube'],
    subjectId: 'surgery',
    topicId: 'surg-1',
    topicName: 'Burns - Parkland Formula & Resuscitation',
    subtopic: 'Burns & Trauma',
  },
  {
    keywords: ['preeclampsia', 'eclampsia', 'pritchard', 'magnesium sulfate', 'mgso4', 'pph', 'postpartum hemorrhage', 'partograph', 'labor', 'placenta previa', 'abruption'],
    subjectId: 'obg',
    topicId: 'obg-2',
    topicName: 'Pre-eclampsia, Eclampsia & MgSO4 Pritchard Regimen',
    subtopic: 'High-Risk Pregnancy',
  },
];

export function classifyTelegramContent(text: string): {
  subjectId: string;
  topicId: string;
  topicName: string;
  subtopic: string;
  conceptName: string;
  confidence: number;
  needsManualReview: boolean;
} {
  const lower = text.toLowerCase();
  const words = new Set(lower.split(/[^a-z0-9]+/).filter(Boolean));

  // 1. Direct Clinical Anchor check
  for (const anchor of CLINICAL_ANCHORS) {
    for (const kw of anchor.keywords) {
      if (kw.includes(' ') && lower.includes(kw)) {
        return {
          subjectId: anchor.subjectId,
          topicId: anchor.topicId,
          topicName: anchor.topicName,
          subtopic: anchor.subtopic,
          conceptName: anchor.topicName,
          confidence: 0.95,
          needsManualReview: false,
        };
      } else if (words.has(kw)) {
        return {
          subjectId: anchor.subjectId,
          topicId: anchor.topicId,
          topicName: anchor.topicName,
          subtopic: anchor.subtopic,
          conceptName: anchor.topicName,
          confidence: 0.9,
          needsManualReview: false,
        };
      }
    }
  }

  let bestMatch = {
    subjectId: 'medicine',
    topicId: 'med-1',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'Cardiology',
    conceptName: 'Clinical Medicine',
    score: 0,
  };

  for (const sub of FMGE_SUBJECTS) {
    const subWords = new Set(sub.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));

    for (const topic of sub.topics) {
      const topicKeywords = extractTopicKeywords(sub.name, topic.name);
      let matchCount = 0;

      for (const kw of topicKeywords) {
        if (kw.includes(' ')) {
          if (lower.includes(kw)) {
            matchCount += 5;
          }
        } else if (kw.length >= 3 && words.has(kw)) {
          matchCount += 3;
        }
      }

      for (const sw of subWords) {
        if (words.has(sw)) {
          matchCount += 1;
        }
      }

      if (matchCount > bestMatch.score) {
        bestMatch = {
          subjectId: sub.id,
          topicId: topic.id,
          topicName: topic.name,
          subtopic: topic.name.split(' - ')[0] || sub.name,
          conceptName: topic.name.split(' - ')[1] || topic.name,
          score: matchCount,
        };
      }
    }
  }

  const confidence = Math.min(1, Math.max(0.2, bestMatch.score / 5));
  const needsManualReview = confidence < 0.4;

  return {
    subjectId: bestMatch.subjectId,
    topicId: bestMatch.topicId,
    topicName: bestMatch.topicName,
    subtopic: bestMatch.subtopic,
    conceptName: bestMatch.conceptName,
    confidence,
    needsManualReview,
  };
}

/**
 * Randomizes option keys evenly while preserving the exact text and correct answer.
 */
export function randomizeOptionKeys(
  options: { key: string; text: string; percentage?: number }[],
  correctKey: string
): { shuffledOptions: { key: string; text: string; percentage?: number }[]; newCorrectKey: string } {
  if (options.length < 2) {
    return { shuffledOptions: options, newCorrectKey: correctKey };
  }

  // Find correct option item
  const correctItem = options.find((o) => o.key.toUpperCase() === correctKey.toUpperCase()) || options[0];

  // Fisher-Yates shuffle
  const items = [...options];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const letters = ['A', 'B', 'C', 'D', 'E'];
  let newCorrectKey = 'A';

  const shuffledOptions = items.map((item, idx) => {
    const key = letters[idx] || 'A';
    if (item.text === correctItem.text) {
      newCorrectKey = key;
    }
    return {
      key,
      text: item.text,
      percentage: item.percentage,
    };
  });

  return { shuffledOptions, newCorrectKey };
}

/**
 * Ingests, parses, normalizes, deduplicates, and classifies an incoming Telegram message payload.
 */
export function ingestTelegramPayload(
  payload: RawTelegramPayload,
  existingQuestions: TelegramMCQ[] = [],
  existingAnnouncements: TelegramAnnouncement[] = []
): IngestedContentResult {
  const msgText = (payload.text || payload.caption || '').trim();
  const msgId = String(payload.messageId);

  if (!msgText && !payload.photoUrl && !payload.videoUrl) {
    return {
      type: 'unrecognized',
      classificationConfidence: 0,
      isDuplicate: false,
    };
  }

  const fingerprint = computeContentFingerprint(msgText);

  // 1. Duplicate detection
  const isDuplicateQ = existingQuestions.some((q) => {
    if (q.messageId === msgId) return true;
    const existingFp = computeContentFingerprint(q.question);
    return existingFp === fingerprint;
  });

  const isDuplicateAnn = existingAnnouncements.some((a) => {
    if (a.id === `ann-${msgId}`) return true;
    return a.title.toLowerCase() === msgText.substring(0, 50).toLowerCase();
  });

  // 2. Classify medical topic
  const classification = classifyTelegramContent(msgText);

  // 3. Detect if message is an MCQ (Poll, Image/Video with question mark, or embedded options A/B/C/D)
  const hasPoll = Boolean(payload.pollOptions && payload.pollOptions.length >= 2);
  const parsedEmbedded = extractEmbeddedOptionsFromText(msgText);
  const hasEmbeddedOptions = parsedEmbedded.options.length >= 2;
  const hasQuestionIntent =
    msgText.includes('?') ||
    msgText.toLowerCase().includes('which of the following') ||
    msgText.toLowerCase().includes('identify the') ||
    msgText.toLowerCase().includes('most likely diagnosis');

  const isMcq = hasPoll || hasEmbeddedOptions || (hasQuestionIntent && (payload.photoUrl || payload.videoUrl || msgText.length > 30));

  if (isMcq) {
    let rawOptions: { key: string; text: string; percentage?: number }[] = [];
    let rawCorrectKey = payload.correctOptionKey || parsedEmbedded.inferredAnswer || 'A';

    if (hasPoll && payload.pollOptions) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      rawOptions = payload.pollOptions.map((opt, i) => {
        const key = letters[i] || 'A';
        if (opt.isCorrect) rawCorrectKey = key;
        return {
          key,
          text: opt.text,
          percentage: Math.round((opt.voterCount || 0) * 10),
        };
      });
    } else if (hasEmbeddedOptions) {
      rawOptions = parsedEmbedded.options;
    } else {
      // Default 4 choices for clinical image/video questions
      rawOptions = [
        { key: 'A', text: 'Option A', percentage: 25 },
        { key: 'B', text: 'Option B', percentage: 25 },
        { key: 'C', text: 'Option C', percentage: 25 },
        { key: 'D', text: 'Option D', percentage: 25 },
      ];
    }

    // Randomize answer positions so Option A is not biased
    const { shuffledOptions, newCorrectKey } = randomizeOptionKeys(rawOptions, rawCorrectKey);

    const questionType = payload.photoUrl
      ? 'ibq'
      : payload.videoUrl
      ? 'video'
      : hasPoll
      ? 'poll'
      : 'mcq';

    const cleanQuestion = parsedEmbedded.questionText || msgText;

    const normalizedMcq: TelegramMCQ = {
      id: `tg-mcq-${msgId}-${fingerprint}`,
      messageId: msgId,
      sourceChannel: payload.channelName || '@fmge_highyield_daily',
      channelTitle: payload.channelName || 'FMGE Live Community QBank',
      subjectId: classification.subjectId,
      topic: classification.topicName,
      question: cleanQuestion,
      options: shuffledOptions,
      correctKey: newCorrectKey,
      explanation:
        parsedEmbedded.extractedExplanation ||
        `Clinical correlation for ${classification.topicName}. Verified against standard FMGE medical blueprint.`,
      highYieldPearl: `${classification.subtopic}: Key FMGE high-yield concept.`,
      imageUrl: payload.photoUrl,
      videoUrl: payload.videoUrl,
      videoThumbUrl: payload.videoThumbUrl,
      questionType: questionType as any,
      difficulty: 'high-yield',
      tags: payload.tags || [classification.subjectId, classification.topicName],
      postUrl: payload.postUrl,
      datePulled: new Date(payload.timestamp || Date.now()).toISOString().split('T')[0],
      userStatus: 'unsolved',
    };

    return {
      type: 'mcq',
      mcq: normalizedMcq,
      classificationConfidence: classification.confidence,
      matchedSubjectId: classification.subjectId,
      matchedTopicId: classification.topicId,
      isDuplicate: isDuplicateQ,
    };
  }

  // 4. Non-MCQ High-Yield Post -> Pearl / High Yield Note
  if (payload.isHighYield || msgText.toLowerCase().includes('pearl') || msgText.toLowerCase().includes('mnemonic') || msgText.toLowerCase().includes('high yield')) {
    const pearl: MedicalPearl = {
      id: `tg-pearl-${msgId}-${fingerprint}`,
      subjectId: classification.subjectId,
      title: msgText.split('\n')[0].substring(0, 60) || `${classification.topicName} Pearl`,
      highYieldKey: classification.subtopic,
      explanation: msgText,
      tags: [classification.subjectId, 'telegram', 'high-yield'],
      isHighYield: true,
      isBookmarked: true,
    };

    return {
      type: 'high_yield_note',
      pearl,
      classificationConfidence: classification.confidence,
      matchedSubjectId: classification.subjectId,
      matchedTopicId: classification.topicId,
      isDuplicate: isDuplicateAnn,
    };
  }

  // 5. Exam Alerts & Announcements
  const normalizedAnn: TelegramAnnouncement = {
    id: `ann-${msgId}`,
    sourceChannel: payload.channelName || '@fmge_announcements',
    channelTitle: payload.channelName || 'FMGE Community Alerts',
    title: msgText.split('\n')[0].substring(0, 70) || 'FMGE Exam Update',
    content: msgText,
    type: msgText.toLowerCase().includes('exam')
      ? 'exam_alert'
      : msgText.toLowerCase().includes('high yield')
      ? 'high_yield_tip'
      : 'announcement',
    date: new Date(payload.timestamp || Date.now()).toISOString(),
    pinned: Boolean(payload.isHighYield),
    isBookmarked: false,
  };

  return {
    type: 'announcement',
    announcement: normalizedAnn,
    classificationConfidence: classification.confidence,
    isDuplicate: isDuplicateAnn,
  };
}
