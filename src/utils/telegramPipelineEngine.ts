import {
  CanonicalQuestion,
  CanonicalQuestionType,
  QuestionSource,
  RawTelegramMessage,
  TelegramChannelConfig,
  TelegramMCQ,
  TelegramMediaRecord,
  TelegramProcessingStatus,
  TelegramSyncDiagnostics,
} from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';

// ============================================================================
const MEDICAL_ABBREVIATIONS: Record<string, string> = {
  mgso4: 'magnesium sulfate',
  psvt: 'paroxysmal supraventricular tachycardia',
  ecg: 'electrocardiogram',
  cxr: 'chest xray',
  sle: 'systemic lupus erythematosus',
  dka: 'diabetic ketoacidosis',
  mi: 'myocardial infarction',
  pph: 'postpartum hemorrhage',
  vvm: 'vaccine vial monitor',
  ilr: 'ice lined refrigerator',
  atls: 'advanced trauma life support',
};

const STOP_WORDS = new Set([
  'which', 'is', 'the', 'of', 'in', 'a', 'an', 'to', 'for', 'at', 'on', 'with', 'by',
  'following', 'what', 'who', 'how', 'when', 'where', 'and', 'or', 'not', 'most', 'best',
  'initial', 'patient', 'case', 'presents', 'presented', 'presents with',
]);

/**
 * Normalizes question stem text for Tier 1 & Tier 2 deduplication:
 * - Converts to lowercase
 * - Strips leading "Q.", "Q1.", "Question 1:", "1."
 * - Strips Markdown formatting (*, _, `, ~, #, >, -)
 * - Strips HTML tags
 * - Expands common medical abbreviations
 * - Strips punctuation and non-alphanumeric characters
 * - Normalizes multiple spaces into a single space
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  let cleaned = text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ') // remove HTML tags
    .replace(/[\*\_`~#>]/g, '') // remove markdown syntax
    .replace(/^(?:q(?:uestion)?[\s\.\:\d\-\)]+|[0-9]{1,3}[\.\)\:\-\s]+)/i, '') // strip leading Q., Q1., 1.
    .replace(/[^a-z0-9\s]/g, ' ') // strip punctuation
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();

  // Expand medical abbreviations
  for (const [abbr, expansion] of Object.entries(MEDICAL_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    cleaned = cleaned.replace(regex, expansion);
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Computes a deterministic normalized content hash for Tier 1 exact-match deduplication.
 */
export function computeNormalizedQuestionHash(text: string): string {
  const normalized = normalizeQuestionText(text);
  if (!normalized) return 'q_empty_hash';

  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return `qhash_${Math.abs(hash >>> 0).toString(16)}`;
}

// ============================================================================
// 2. NEAR-DUPLICATE SIMILARITY DETECTION (TIER 2 DEDUPLICATION)
// ============================================================================

/**
 * Generates character bigrams for robust fuzzy string similarity comparison.
 */
function getBigrams(str: string): Set<string> {
  const s = normalizeQuestionText(str);
  const bigrams = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * Computes hybrid bigram + token Jaccard similarity between two text strings (0.0 to 1.0).
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);

  if (normA === normB) return 1.0;
  if (normA.length < 5 || normB.length < 5) return 0.0;

  // Direct substring containment for long questions
  if (normA.includes(normB) || normB.includes(normA)) {
    const minLen = Math.min(normA.length, normB.length);
    const maxLen = Math.max(normA.length, normB.length);
    if (minLen / maxLen > 0.8) return minLen / maxLen;
  }

  // 1. Character Bigram Similarity (Dice's Coefficient)
  const bigramsA = getBigrams(normA);
  const bigramsB = getBigrams(normB);
  let bigramSim = 0;
  if (bigramsA.size > 0 && bigramsB.size > 0) {
    let intersectionSize = 0;
    for (const b of bigramsA) {
      if (bigramsB.has(b)) intersectionSize++;
    }
    bigramSim = (2.0 * intersectionSize) / (bigramsA.size + bigramsB.size);
  }

  // 2. Meaningful Token-level Jaccard Similarity (ignoring stop words)
  const tokensA = new Set(normA.split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w)));
  const tokensB = new Set(normB.split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w)));
  let tokenSim = 0;

  if (tokensA.size > 0 && tokensB.size > 0) {
    let tokenOverlap = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) tokenOverlap++;
    }
    const unionSize = tokensA.size + tokensB.size - tokenOverlap;
    tokenSim = unionSize > 0 ? tokenOverlap / unionSize : 0;
  }

  return Math.max(bigramSim, tokenSim, (bigramSim + tokenSim) / 2);
}

/**
 * Searches an existing canonical question bank for Tier 2 near-duplicate candidates.
 * Conservative threshold (default: 0.85) to avoid false positives.
 */
export function findNearDuplicateQuestion(
  newStem: string,
  existingQuestions: CanonicalQuestion[],
  threshold = 0.85
): { matchedQuestion: CanonicalQuestion; similarity: number } | null {
  const normNew = normalizeQuestionText(newStem);
  if (!normNew) return null;

  let bestMatch: CanonicalQuestion | null = null;
  let highestSimilarity = 0;

  for (const candidate of existingQuestions) {
    const sim = calculateTextSimilarity(normNew, candidate.stem);
    if (sim >= threshold && sim > highestSimilarity) {
      highestSimilarity = sim;
      bestMatch = candidate;
    }
  }

  if (bestMatch && highestSimilarity >= threshold) {
    return { matchedQuestion: bestMatch, similarity: highestSimilarity };
  }
  return null;
}

// ============================================================================
// 3. CLINICAL TAXONOMY CLASSIFICATION
// ============================================================================

const TAXONOMY_ANCHORS: Array<{
  keywords: string[];
  subjectId: string;
  topicName: string;
  subtopic: string;
}> = [
  {
    keywords: ['stemi', 'nstemi', 'ecg', 'infarction', 'coronary artery', 'troponin', 'arrhythmia', 'heart block', 'wpw', 'lead ii', 'lead iii', 'avf', 'cardiac arrest', 'angina'],
    subjectId: 'medicine',
    topicName: 'Cardiology (ECG, MI, Arrhythmias, Heart Failure)',
    subtopic: 'Cardiology',
  },
  {
    keywords: ['diabetes', 'hba1c', 'insulin', 'metformin', 'dka', 'ketoacidosis', 'cushing', 'addison', 'thyroid', 'graves', 'pheochromocytoma', 'hashimoto'],
    subjectId: 'medicine',
    topicName: 'Endocrinology & Diabetes Mellitus',
    subtopic: 'Endocrinology',
  },
  {
    keywords: ['parkland', 'burn', 'burns', 'rule of nines', 'escharotomy', 'fast exam', 'trauma', 'tension pneumothorax', 'atls', 'chest tube', 'leriche'],
    subjectId: 'surgery',
    topicName: 'Burns - Parkland Formula & Resuscitation',
    subtopic: 'Burns & Trauma',
  },
  {
    keywords: ['appendicitis', 'cholecystitis', 'pancreatitis', 'ranson', 'hernia', 'intussusception', 'volvulus', 'mesenteric ischemia', 'biliary atresia'],
    subjectId: 'surgery',
    topicName: 'Acute Abdomen & GI Surgery',
    subtopic: 'Gastrointestinal Surgery',
  },
  {
    keywords: ['drug of choice', 'psvt', 'adenosine', 'amiodarone', 'antidote', 'atropine', 'beta blocker', 'cholinergic', 'adrenergic', 'organophosphate', 'pralidoxime'],
    subjectId: 'pharmacology',
    topicName: 'Autonomic Nervous System Drugs',
    subtopic: 'Autonomic Pharmacology',
  },
  {
    keywords: ['antimicrobial', 'cephalosporin', 'penicillin', 'aminoglycoside', 'macrolide', 'fluoroquinolone', 'vancomycin', 'tb regimen', 'isoniazid', 'rifampicin'],
    subjectId: 'pharmacology',
    topicName: 'Antimicrobial Agents & Resistance',
    subtopic: 'Chemotherapy',
  },
  {
    keywords: ['vaccine', 'vvm', 'cold chain', 'immunization', 'ice lined refrigerator', 'screening', 'sensitivity', 'specificity', 'ppv', 'npv', 'biostatistics', 'epidemiology'],
    subjectId: 'psm',
    topicName: 'Vaccine Storage & Cold Chain Management',
    subtopic: 'Immunization & Cold Chain',
  },
  {
    keywords: ['preeclampsia', 'eclampsia', 'pritchard', 'mgso4', 'hellp', 'postpartum hemorrhage', 'pph', 'oxytocin', 'placenta previa', 'abruptio', 'ctg', 'partograph'],
    subjectId: 'obg',
    topicName: 'Obstetric Emergencies & High-Risk Pregnancy',
    subtopic: 'Obstetrics',
  },
  {
    keywords: ['brachial plexus', 'erbs palsy', 'klumpkes palsy', 'radial nerve', 'median nerve', 'ulnar nerve', 'peroneal nerve', 'femoral nerve', 'carpal tunnel'],
    subjectId: 'anatomy',
    topicName: 'Upper & Lower Limb Neuroanatomy',
    subtopic: 'Gross Anatomy',
  },
  {
    keywords: ['neoplasia', 'oncogene', 'tumor suppressor', 'p53', 'rb gene', 'hallmarks of cancer', 'carcinoma in situ', 'staging', 'grading'],
    subjectId: 'pathology',
    topicName: 'Neoplasia & Tumor Genetics',
    subtopic: 'General Pathology',
  },
  {
    keywords: ['chest x-ray', 'pneumoperitoneum', 'pneumothorax', 'sail sign', 'steeple sign', 'ct scan', 'mri', 'ultrasound', 'hounsfield'],
    subjectId: 'radiology',
    topicName: 'Diagnostic Radiology & High-Yield Signs',
    subtopic: 'Emergency Imaging',
  },
];

export function classifyClinicalText(text: string): {
  subjectId: string;
  topicName: string;
  subtopic: string;
} {
  const lower = text.toLowerCase();

  for (const anchor of TAXONOMY_ANCHORS) {
    const matchCount = anchor.keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount > 0) {
      return {
        subjectId: anchor.subjectId,
        topicName: anchor.topicName,
        subtopic: anchor.subtopic,
      };
    }
  }

  // Fallback match against FMGE subject names
  for (const sub of FMGE_SUBJECTS) {
    if (lower.includes(sub.name.toLowerCase())) {
      return {
        subjectId: sub.id,
        topicName: sub.topics[0]?.name || `${sub.name} Core Concepts`,
        subtopic: sub.name,
      };
    }
  }

  return {
    subjectId: 'medicine',
    topicName: 'Clinical Medicine Core',
    subtopic: 'General Medicine',
  };
}

// ============================================================================
// 4. QUESTION & MEDIA EXTRACTION
// ============================================================================

export interface ExtractedQuestionData {
  stem: string;
  options: { key: string; text: string; percentage?: number }[];
  correctAnswer: string | null;
  explanation: string;
  highYieldPearl?: string;
  questionType: CanonicalQuestionType;
  difficulty: 'standard' | 'high-yield' | 'trap';
  hasSufficientInfoForMCQ: boolean;
  needsVerification: boolean;
}

/**
 * Analyzes raw Telegram text/caption/media and extracts structured question data.
 * Adheres strictly to Zero-Hallucination Policy:
 * If there is insufficient info, `hasSufficientInfoForMCQ` is set to false.
 */
export function extractQuestionDataFromMessage(
  rawText: string,
  mediaType: string,
  pollOptions?: Array<{ text: string; percent?: number; isCorrect?: boolean }>
): ExtractedQuestionData {
  const text = (rawText || '').trim();

  // Handle Telegram native polls
  if (pollOptions && pollOptions.length >= 2) {
    const options = pollOptions.map((opt, i) => ({
      key: ['A', 'B', 'C', 'D', 'E', 'F'][i] || String(i + 1),
      text: opt.text,
      percentage: opt.percent,
    }));

    const correctOpt = pollOptions.find((p) => p.isCorrect);
    const correctKey = correctOpt
      ? ['A', 'B', 'C', 'D', 'E', 'F'][pollOptions.indexOf(correctOpt)] || 'A'
      : null;

    return {
      stem: text || 'Community Clinical Poll',
      options,
      correctAnswer: correctKey,
      explanation: correctKey
        ? 'Verified Telegram poll answer. Review clinical rationale.'
        : 'Community poll answer pending verified faculty confirmation.',
      questionType: 'POLL',
      difficulty: 'high-yield',
      hasSufficientInfoForMCQ: true,
      needsVerification: correctKey === null,
    };
  }

  // Parse lines for MCQ structure
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const options: { key: string; text: string }[] = [];
  const stemLines: string[] = [];
  let answerKey: string | null = null;
  let explanation: string | null = null;

  const optionRegex = /^([A-Da-d1-4])[\.\)\:\-\s]\s*(.+)$/;
  const answerRegex = /(?:Ans|Answer|Correct Option|Key)[\s\:\-\=]+([A-Da-d])/i;
  const explanationRegex = /(?:Exp|Explanation|Discussion|Rationale|Pearl)[\s\:\-\=]+([\s\S]+)/i;

  for (const line of lines) {
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      answerKey = ansMatch[1].toUpperCase();
      continue;
    }

    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      explanation = expMatch[1].trim();
      continue;
    }

    const optMatch = line.match(optionRegex);
    if (optMatch && options.length < 4) {
      const idx = options.length;
      const keyLetter = ['A', 'B', 'C', 'D'][idx] || 'A';
      options.push({
        key: keyLetter,
        text: optMatch[2].trim(),
      });
      continue;
    }

    if (options.length === 0) {
      stemLines.push(line);
    } else if (!explanation) {
      explanation = line;
    }
  }

  const stem = stemLines.join(' ').trim() || lines[0] || '';

  // Classify Question Type
  let questionType: CanonicalQuestionType = 'TEXT';
  if (mediaType === 'VIDEO') {
    questionType = 'VIDEO';
  } else if (mediaType === 'IMAGE') {
    questionType = 'IMAGE';
  }

  // Check if we have a valid MCQ
  if (options.length >= 2 && stem.length >= 10) {
    return {
      stem,
      options,
      correctAnswer: answerKey,
      explanation: explanation || 'High-yield FMGE community question.',
      questionType,
      difficulty: 'high-yield',
      hasSufficientInfoForMCQ: true,
      needsVerification: answerKey === null,
    };
  }

  // If text is short or purely media caption without options:
  return {
    stem: text,
    options: [],
    correctAnswer: null,
    explanation: '',
    questionType: mediaType === 'VIDEO' ? 'VIDEO' : mediaType === 'IMAGE' ? 'IMAGE' : 'OTHER',
    difficulty: 'standard',
    hasSufficientInfoForMCQ: false,
    needsVerification: true,
  };
}

// ============================================================================
// 5. INGESTION PIPELINE & TWO-TIER DEDUPLICATION CORE
// ============================================================================

export interface PipelineExecutionResult {
  rawMessage: RawTelegramMessage;
  canonicalQuestion?: CanonicalQuestion;
  newSource?: QuestionSource;
  status: TelegramProcessingStatus;
  isDuplicate: boolean;
  isNearDuplicate?: boolean;
  matchedQuestionId?: string;
  error?: string;
}

/**
 * Ingests a raw Telegram message idempotently through the data pipeline:
 * 1. Checks message idempotency (telegramChatId + telegramMessageId)
 * 2. Extracts media metadata
 * 3. Classifies content & taxonomy
 * 4. Applies Two-Tier Deduplication (Tier 1 hash + Tier 2 similarity)
 * 5. Returns canonical question & source records
 */
export function ingestTelegramMessagePipeline(
  input: {
    channelId: string;
    channelTitle?: string;
    telegramMessageId: string | number;
    telegramChatId: string | number;
    messageDate: string;
    text: string;
    caption?: string;
    mediaType?: string;
    photoUrl?: string;
    videoUrl?: string;
    videoThumbUrl?: string;
    pollOptions?: Array<{ text: string; percent?: number; isCorrect?: boolean }>;
    sourceUrl?: string;
    rawPayload?: any;
  },
  existingRawMessages: RawTelegramMessage[] = [],
  existingQuestions: CanonicalQuestion[] = [],
  existingSources: QuestionSource[] = []
): PipelineExecutionResult {
  const compositeKey = `${input.telegramChatId}:${input.telegramMessageId}`;
  const now = new Date().toISOString();

  // 1. Idempotency Check on Raw Telegram Message
  const existingRaw = existingRawMessages.find((m) => m.compositeKey === compositeKey);
  if (existingRaw) {
    return {
      rawMessage: existingRaw,
      status: 'DUPLICATE',
      isDuplicate: true,
    };
  }

  // 2. Media Extraction
  const mediaRecords: TelegramMediaRecord[] = [];
  let detectedMediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'POLL' | 'NONE' = 'NONE';

  if (input.videoUrl || input.videoThumbUrl || input.mediaType === 'VIDEO') {
    detectedMediaType = 'VIDEO';
    mediaRecords.push({
      id: `media-vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'VIDEO',
      url: input.videoUrl || '',
      thumbnailUrl: input.videoThumbUrl || '',
      sourceMessageId: String(input.telegramMessageId),
      mimeType: 'video/mp4',
    });
  } else if (input.photoUrl || input.mediaType === 'IMAGE') {
    detectedMediaType = 'IMAGE';
    mediaRecords.push({
      id: `media-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'IMAGE',
      url: input.photoUrl || '',
      sourceMessageId: String(input.telegramMessageId),
      mimeType: 'image/jpeg',
    });
  } else if (input.pollOptions && input.pollOptions.length > 0) {
    detectedMediaType = 'POLL';
  }

  // 3. Raw Message Creation
  const fullText = (input.text || input.caption || '').trim();
  const rawMessage: RawTelegramMessage = {
    id: `raw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    channelId: input.channelId,
    telegramMessageId: input.telegramMessageId,
    telegramChatId: input.telegramChatId,
    messageDate: input.messageDate || now,
    text: input.text || '',
    caption: input.caption,
    mediaType: detectedMediaType,
    media: mediaRecords,
    sourceUrl: input.sourceUrl || `https://t.me/${input.channelId}/${input.telegramMessageId}`,
    rawPayload: input.rawPayload,
    ingestedAt: now,
    processingStatus: 'RECEIVED',
    compositeKey,
  };

  // 4. Question Extraction & Taxonomy
  const extracted = extractQuestionDataFromMessage(fullText, detectedMediaType, input.pollOptions);
  const taxonomy = classifyClinicalText(extracted.stem);

  // 5. Zero-Hallucination Guard: If insufficient information for an MCQ, preserve media without inventing
  if (!extracted.hasSufficientInfoForMCQ) {
    rawMessage.processingStatus = detectedMediaType !== 'NONE' ? 'MEDIA_ONLY' : 'NEEDS_REVIEW';
    rawMessage.processedAt = now;

    return {
      rawMessage,
      status: rawMessage.processingStatus,
      isDuplicate: false,
    };
  }

  // 6. Tier 1 Deduplication (Exact Normalized Hash)
  const normHash = computeNormalizedQuestionHash(extracted.stem);
  const exactMatch = existingQuestions.find((q) => q.normalizedQuestionHash === normHash);

  if (exactMatch) {
    // Attach source to existing question without creating duplicate question record
    const newSource: QuestionSource = {
      questionId: exactMatch.id,
      telegramMessageId: input.telegramMessageId,
      telegramChatId: input.telegramChatId,
      channelId: input.channelId,
      channelTitle: input.channelTitle,
      sourceUrl: rawMessage.sourceUrl,
      sourceDate: rawMessage.messageDate,
      isPrimary: false,
    };

    rawMessage.processingStatus = 'DUPLICATE';
    rawMessage.processedAt = now;

    return {
      rawMessage,
      newSource,
      canonicalQuestion: exactMatch,
      status: 'DUPLICATE',
      isDuplicate: true,
      matchedQuestionId: exactMatch.id,
    };
  }

  // 7. Tier 2 Deduplication (Near-Duplicate Similarity >= 0.85)
  const nearMatch = findNearDuplicateQuestion(extracted.stem, existingQuestions, 0.85);
  if (nearMatch) {
    const newSource: QuestionSource = {
      questionId: nearMatch.matchedQuestion.id,
      telegramMessageId: input.telegramMessageId,
      telegramChatId: input.telegramChatId,
      channelId: input.channelId,
      channelTitle: input.channelTitle,
      sourceUrl: rawMessage.sourceUrl,
      sourceDate: rawMessage.messageDate,
      isPrimary: false,
    };

    rawMessage.processingStatus = 'DUPLICATE';
    rawMessage.processedAt = now;

    return {
      rawMessage,
      newSource,
      canonicalQuestion: nearMatch.matchedQuestion,
      status: 'DUPLICATE',
      isDuplicate: true,
      isNearDuplicate: true,
      matchedQuestionId: nearMatch.matchedQuestion.id,
    };
  }

  // 8. Create New Canonical Question Record
  const questionId = `q-tg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const primarySource: QuestionSource = {
    questionId,
    telegramMessageId: input.telegramMessageId,
    telegramChatId: input.telegramChatId,
    channelId: input.channelId,
    channelTitle: input.channelTitle,
    sourceUrl: rawMessage.sourceUrl,
    sourceDate: rawMessage.messageDate,
    isPrimary: true,
  };

  const canonicalQuestion: CanonicalQuestion = {
    id: questionId,
    stem: extracted.stem,
    options: extracted.options,
    correctAnswer: extracted.correctAnswer,
    explanation: extracted.explanation,
    subject: taxonomy.subjectId,
    topic: taxonomy.topicName,
    subtopic: taxonomy.subtopic,
    questionType: extracted.questionType,
    difficulty: extracted.difficulty,
    highYield: true,
    media: mediaRecords,
    sources: [primarySource],
    needsVerification: extracted.needsVerification,
    normalizedQuestionHash: normHash,
    tags: [taxonomy.subjectId.toUpperCase(), taxonomy.subtopic, 'Telegram'],
    highYieldPearl: extracted.highYieldPearl,
    createdAt: now,
    updatedAt: now,
    userStatus: 'unsolved',
  };

  rawMessage.processingStatus = 'QUESTION_CREATED';
  rawMessage.processedAt = now;

  return {
    rawMessage,
    canonicalQuestion,
    newSource: primarySource,
    status: 'QUESTION_CREATED',
    isDuplicate: false,
  };
}

// ============================================================================
// 6. SYNC CURSOR & DIAGNOSTICS HELPERS
// ============================================================================

/**
 * Updates channel synchronization cursor and counters safely.
 */
export function updateChannelSyncCursor(
  channel: TelegramChannelConfig,
  processedBatch: RawTelegramMessage[],
  latestCursor?: string | number
): TelegramChannelConfig {
  let highestMsgId = channel.lastSyncedMessageId || 0;

  for (const msg of processedBatch) {
    const numId = Number(msg.telegramMessageId);
    if (!isNaN(numId) && numId > Number(highestMsgId)) {
      highestMsgId = numId;
    }
  }

  if (latestCursor !== undefined) {
    highestMsgId = latestCursor;
  }

  return {
    ...channel,
    lastSyncedMessageId: highestMsgId,
    lastSyncedAt: new Date().toISOString(),
    lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'live',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates an observability diagnostic record for a channel sync.
 */
export function generateSyncDiagnostics(
  channel: TelegramChannelConfig,
  batchResults: PipelineExecutionResult[],
  error?: string
): TelegramSyncDiagnostics {
  const now = new Date().toISOString();
  const created = batchResults.filter((r) => r.status === 'QUESTION_CREATED').length;
  const duplicates = batchResults.filter((r) => r.status === 'DUPLICATE').length;
  const mediaOnly = batchResults.filter((r) => r.status === 'MEDIA_ONLY').length;
  const failed = batchResults.filter((r) => r.status === 'FAILED').length;

  return {
    channelId: channel.id,
    channelHandle: channel.handle,
    channelTitle: channel.name,
    lastSuccessfulSync: error ? undefined : now,
    lastAttemptedSync: now,
    lastSyncedCursor: channel.lastSyncedMessageId,
    messagesReceivedCount: batchResults.length,
    messagesProcessedCount: batchResults.length,
    questionsCreatedCount: created,
    duplicatesDetectedCount: duplicates,
    mediaProcessedCount: mediaOnly,
    failedCount: failed,
    lastError: error,
    status: error ? 'error' : 'live',
  };
}

// ============================================================================
// 7. CANONICAL QUESTION <-> TELEGRAM MCQ ADAPTERS
// ============================================================================

/**
 * Adapts a CanonicalQuestion into the TelegramMCQ interface for backward compatibility.
 */
export function canonicalQuestionToTelegramMcq(q: CanonicalQuestion): TelegramMCQ {
  const primarySource = q.sources[0];
  const firstImage = q.media.find((m) => m.type === 'IMAGE');
  const firstVideo = q.media.find((m) => m.type === 'VIDEO');

  let legacyType: 'mcq' | 'ibq' | 'video' | 'poll' | 'pearl' = 'mcq';
  if (q.questionType === 'VIDEO') legacyType = 'video';
  else if (q.questionType === 'IMAGE') legacyType = 'ibq';
  else if (q.questionType === 'POLL') legacyType = 'poll';

  return {
    id: q.id,
    sourceChannel: primarySource?.channelTitle || primarySource?.channelId || '@telegram',
    channelTitle: primarySource?.channelTitle || primarySource?.channelId || 'Telegram Channel',
    rawText: q.stem,
    subjectId: q.subject,
    topic: q.topic,
    question: q.stem,
    options: q.options,
    correctKey: q.correctAnswer || 'A',
    explanation: q.explanation,
    highYieldPearl: q.highYieldPearl,
    difficulty: q.difficulty,
    tags: q.tags,
    questionType: legacyType,
    imageUrl: firstImage?.url,
    videoUrl: firstVideo?.url,
    videoThumbUrl: firstVideo?.thumbnailUrl,
    datePulled: q.createdAt,
    userStatus: q.userStatus || 'unsolved',
    userSelectedOption: q.userSelectedOption,
    sources: q.sources,
    normalizedHash: q.normalizedQuestionHash,
  };
}
