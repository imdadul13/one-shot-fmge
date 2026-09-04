import { PreparationPhase } from '../types';

/**
 * PHASE MANAGEMENT ENGINE
 * Automatically determines preparation phase based on days remaining to exam.
 *
 * NOTE: The former backward-planning, marks-at-risk, recoverable-marks, daily-mission,
 * readiness-trend, and weekly-command-report engines lived here but were superseded by
 * personalizationEngine and the active Progress/Revision/Daily views. Only
 * getPreparationPhase is still consumed in production (by personalizationEngine).
 */
export function getPreparationPhase(daysRemaining: number): {
  phase: PreparationPhase;
  phaseTitle: string;
  phaseBadge: string;
  phaseColor: string;
  phaseDescription: string;
  phaseRule: string;
} {
  if (daysRemaining <= 1) {
    return {
      phase: 'FINAL_1_DAY',
      phaseTitle: 'Exam Eve (Day 0)',
      phaseBadge: 'EXAM EVE',
      phaseColor: '#e11d48',
      phaseDescription: 'Zero new material. Light pearl skim, admit card check, sleep and mental calm.',
      phaseRule: 'Do not study late. Review high-yield Drug-of-Choice tables and rest.',
    };
  }
  if (daysRemaining <= 3) {
    return {
      phase: 'FINAL_3_DAYS',
      phaseTitle: 'Final Review Phase',
      phaseBadge: 'FINAL 3 DAYS',
      phaseColor: '#f43f5e',
      phaseDescription: '20th notebook review, high-yield image drills, formula recaps, mental conditioning.',
      phaseRule: 'Focus purely on volatile numerical facts, PSM formulas, and error notebook.',
    };
  }
  if (daysRemaining <= 7) {
    return {
      phase: 'FINAL_7_DAYS',
      phaseTitle: 'Final 7 Days Hyper-Revision',
      phaseBadge: 'FINAL 7 DAYS',
      phaseColor: '#ea580c',
      phaseDescription: 'No new low-yield material. Rapid recall of high-yield tables, mnemonics, and image bank.',
      phaseRule: 'Master high-frequency repeat topics across the Big 4 (Medicine, Surgery, OBG, PSM).',
    };
  }
  if (daysRemaining <= 14) {
    return {
      phase: 'FINAL_14_DAYS',
      phaseTitle: 'Final 14-Day Sprint',
      phaseBadge: 'FINAL 14 DAYS',
      phaseColor: '#d97706',
      phaseDescription: 'Rapid 19-subject speed sweep + repeated mistakes + volatile numerical/DOC facts.',
      phaseRule: 'Complete R2/R3 sweeps of high-weightage subjects; stop reading lengthy new texts.',
    };
  }
  if (daysRemaining <= 30) {
    return {
      phase: 'FINAL_30_DAYS',
      phaseTitle: '30-Day Intensive Sprint',
      phaseBadge: '30-DAY SPRINT',
      phaseColor: '#0284c7',
      phaseDescription: 'High-yield topics + personal vulnerabilities + full GT simulations + error notebook.',
      phaseRule: 'Take 1 GT every 5 days; spend 8 hours reviewing mistakes and weak subjects.',
    };
  }
  if (daysRemaining <= 60) {
    return {
      phase: 'PHASE_3_EXAM_CONDITIONING',
      phaseTitle: 'Phase 3 — Exam Conditioning',
      phaseBadge: 'EXAM CONDITIONING',
      phaseColor: '#4f46e5',
      phaseDescription: 'Full 300Q Grand Tests + deep error logging + rapid R1/R2 revision cycles.',
      phaseRule: 'Shift time distribution: 40% MCQs/GTs, 40% Revisions, 20% Notes completion.',
    };
  }
  if (daysRemaining <= 120) {
    return {
      phase: 'PHASE_2_CONSOLIDATION',
      phaseTitle: 'Phase 2 — Consolidation',
      phaseBadge: 'CONSOLIDATION',
      phaseColor: '#059669',
      phaseDescription: 'R1/R2 spaced active recall + targeted MCQ drills + high-risk weakness repair.',
      phaseRule: 'Consolidate the Big 4 subjects (125M) and high-yield clinical systems.',
    };
  }

  return {
    phase: 'PHASE_1_COVERAGE',
    phaseTitle: 'Phase 1 — Syllabus Coverage',
    phaseBadge: 'COVERAGE',
    phaseColor: '#2563eb',
    phaseDescription: 'Comprehensive high-value syllabus coverage, foundation video notes & subject QBanks.',
    phaseRule: 'Prioritize notes completion + immediate 50-MCQ active recall for every topic.',
  };
}
