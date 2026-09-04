import { TopicCategoryType } from '../types';

export interface TopicValidationResult {
  isValid: boolean;
  hasContamination: boolean;
  score: number;
  matchedKeywords: string[];
  disqualifyingTerms: string[];
  reason: string;
}

/**
 * Validates that generated medical content is strictly aligned with the target subject and topic,
 * rejecting content that contains cross-topic contamination (e.g., RV MI in an Asthma response).
 */
export function validateTopicContentConsistency(
  content: string,
  targetSubject: string,
  targetTopic: string,
  topicType?: TopicCategoryType
): TopicValidationResult {
  if (!content || !content.trim()) {
    return {
      isValid: false,
      hasContamination: false,
      score: 0,
      matchedKeywords: [],
      disqualifyingTerms: ['empty_content'],
      reason: 'Generated content is empty',
    };
  }

  const lowerContent = content.toLowerCase();
  const lowerTopic = targetTopic.toLowerCase();
  const lowerSub = targetSubject.toLowerCase();

  // Extract core keywords from target topic (words > 2 chars, omitting generic terms)
  const genericWords = new Set(['and', 'the', 'for', 'with', 'from', 'disease', 'syndrome', 'clinical', 'high', 'yield', 'core', 'guidelines']);
  const topicKeywords = lowerTopic
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !genericWords.has(w));

  // Subject-specific cross-contamination negative terms
  // If target topic is NOT cardiology, reject prominent cardiology acute terms
  const isCardiologyTopic = lowerTopic.includes('cardio') || lowerTopic.includes('stemi') || lowerTopic.includes('infarct') || lowerTopic.includes('heart') || lowerTopic.includes('ecg') || lowerTopic.includes('arrhythmia') || lowerTopic.includes('wpw') || lowerTopic.includes('rvmi');
  const isPulmonologyTopic = lowerTopic.includes('asthma') || lowerTopic.includes('copd') || lowerTopic.includes('pneumonia') || lowerTopic.includes('lung') || lowerTopic.includes('gina') || lowerTopic.includes('gold');
  const isBiochemistryTopic = lowerTopic.includes('kinetics') || lowerTopic.includes('lineweaver') || lowerTopic.includes('enzyme') || lowerTopic.includes('metabolism') || lowerTopic.includes('glycolysis') || lowerSub.includes('biochem');
  const isAnatomyTopic = lowerSub.includes('anatomy') || lowerTopic.includes('plexus') || lowerTopic.includes('nerve') || lowerTopic.includes('triangle') || lowerTopic.includes('canal') || lowerTopic.includes('peritoneum') || lowerTopic.includes('embryology');

  // Regional anatomy classifications
  const isAbdomenTopic = lowerTopic.includes('abdomen') || lowerTopic.includes('peritone') || lowerTopic.includes('celiac') || lowerTopic.includes('epiploic') || lowerTopic.includes('winslow') || lowerTopic.includes('morison') || lowerTopic.includes('gastroduodenal') || lowerTopic.includes('splenic artery') || lowerTopic.includes('pringle');
  const isEmbryologyTopic = lowerTopic.includes('embryo') || lowerTopic.includes('pharyngeal') || lowerTopic.includes('arch') || lowerTopic.includes('pouch') || lowerTopic.includes('digeorge') || lowerTopic.includes('heart dev');
  const isUpperLimbTopic = lowerTopic.includes('upper limb') || lowerTopic.includes('brachial') || lowerTopic.includes('erb') || lowerTopic.includes('klumpke') || lowerTopic.includes('axillary') || lowerTopic.includes('radial') || lowerTopic.includes('median') || lowerTopic.includes('ulnar');
  const isLowerLimbTopic = lowerTopic.includes('lower limb') || lowerTopic.includes('knee') || lowerTopic.includes('peroneal') || lowerTopic.includes('tibial') || lowerTopic.includes('popliteal') || lowerTopic.includes('femoral') || lowerTopic.includes('foot drop');

  const disqualifyingTerms: string[] = [];

  // Regional intra-anatomy cross-contamination checks
  if (isAbdomenTopic) {
    const upperLimbTerms = ['brachial plexus', 'erb-duchenne', 'erb palsy', 'klumpke', 'claw hand', 'waiter\'s tip', 'waiter tip', 'policeman\'s tip', 'wrist drop', 'froment', 'radial nerve in spiral groove', 'hand of benediction', 'ape thumb'];
    const lowerLimbTerms = ['common peroneal', 'peroneal nerve', 'fibular neck', 'foot drop', 'popliteal fossa', 'lachman test', 'mcmurray test', 'anterior cruciate ligament'];
    for (const term of [...upperLimbTerms, ...lowerLimbTerms]) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (isEmbryologyTopic) {
    const limbPalsyTerms = ['brachial plexus', 'erb-duchenne', 'erb palsy', 'klumpke', 'claw hand', 'waiter\'s tip', 'wrist drop', 'common peroneal', 'fibular neck', 'foot drop'];
    for (const term of limbPalsyTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (isUpperLimbTopic && !isAbdomenTopic) {
    const abdomenTerms = ['epiploic foramen of winslow', 'pringle maneuver', 'celiac trunk', 'morison pouch', 'pouch of douglas', 'lesser sac'];
    for (const term of abdomenTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (isLowerLimbTopic && !isUpperLimbTopic) {
    const upperLimbTerms = ['brachial plexus', 'erb-duchenne', 'erb palsy', 'klumpke', 'waiter\'s tip', 'wrist drop'];
    for (const term of upperLimbTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  // Check for severe cross-topic leaks
  if (!isCardiologyTopic) {
    const cardTerms = ['rv myocardial infarction', 'rv infarction', 'rca occlusion', 'right ventricular infarction', 'inferior wall mi', 'inferior stemi', 'wolff-parkinson-white'];
    for (const term of cardTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (!isPulmonologyTopic && !isCardiologyTopic) {
    if (lowerContent.includes('gina guidelines') && !lowerTopic.includes('gina')) {
      disqualifyingTerms.push('gina guidelines');
    }
  }

  if (isBiochemistryTopic) {
    // Biochemistry shouldn't have generic acute trauma / surgery resuscitations
    const surgicalTerms = ['parkland formula', 'tube thoracostomy', 'needle thoracostomy', 'pritchard regimen'];
    for (const term of surgicalTerms) {
      if (lowerContent.includes(term)) {
        disqualifyingTerms.push(term);
      }
    }
  }

  if (disqualifyingTerms.length > 0) {
    return {
      isValid: false,
      hasContamination: true,
      score: 0,
      matchedKeywords: [],
      disqualifyingTerms,
      reason: `Disqualified due to cross-topic contamination: found "${disqualifyingTerms.join(', ')}" in a "${targetTopic}" context.`,
    };
  }

  // Count topic keyword matches
  const matchedKeywords: string[] = [];
  for (const kw of topicKeywords) {
    if (lowerContent.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }

  // Check for topic type specific terms
  if (topicType === 'biochemical_concept') {
    const biochemTerms = ['km', 'vmax', 'substrate', 'inhibition', 'enzyme', 'allosteric', 'reaction', 'michaelis', 'lineweaver', 'intercept', 'slope', 'rate', 'pathway'];
    for (const term of biochemTerms) {
      if (lowerContent.includes(term) && !matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
      }
    }
  } else if (topicType === 'anatomical_structure') {
    const anatTerms = ['root', 'trunk', 'nerve', 'artery', 'vein', 'relation', 'branch', 'canal', 'muscle', 'innervation', 'insertion', 'origin', 'fossa'];
    for (const term of anatTerms) {
      if (lowerContent.includes(term) && !matchedKeywords.includes(term)) {
        matchedKeywords.push(term);
      }
    }
  }

  const keywordCoverage = topicKeywords.length > 0 ? matchedKeywords.length / topicKeywords.length : 1;
  const score = Math.min(100, Math.round(keywordCoverage * 70 + (matchedKeywords.length > 0 ? 30 : 0)));

  const isValid = matchedKeywords.length >= 1 || score >= 40;

  return {
    isValid,
    hasContamination: false,
    score,
    matchedKeywords,
    disqualifyingTerms: [],
    reason: isValid
      ? `Valid topic content (matched: ${matchedKeywords.slice(0, 4).join(', ')})`
      : `Insufficient target topic keywords found for "${targetTopic}"`,
  };
}

/**
 * Filters a set of generated study artifacts (slides, flashcards, cases, pearls, MCQs)
 * so that only artifacts that are clean of cross-topic contamination for the ACTIVE topic
 * are retained. This is the single consistent validation boundary applied at the end of
 * every topic-specific generation/retrieval path before content reaches the UI.
 *
 * `subjectId` and `topicId` remain authoritative for data lookup; `topicName` is the
 * semantic target used by the validator. Pass a `topicType` when available to sharpen
 * keyword matching.
 */
export function filterTopicSafeContent<T>(
  artifacts: T[],
  subjectId: string,
  topicId: string,
  topicName: string,
  extractText: (artifact: T) => string,
  topicType?: TopicCategoryType
): T[] {
  if (!Array.isArray(artifacts)) return [];
  const targetSubject = subjectId;
  const targetTopic = topicName || topicId;
  return artifacts.filter((artifact) => {
    const text = extractText(artifact);
    if (!text || !text.trim()) return false;
    const result = validateTopicContentConsistency(text, targetSubject, targetTopic, topicType);
    return !result.hasContamination;
  });
}
