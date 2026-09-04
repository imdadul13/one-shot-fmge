import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { GrandTest } from '../types';

interface AiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'vignette' | 'concept' | 'diagnosis';
  latestGT?: GrandTest | null;
  daysRemaining: number;
}

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'vignette',
  latestGT,
  daysRemaining,
}) => {
  const [activeTab, setActiveTab] = useState<'vignette' | 'concept' | 'diagnosis'>(initialTab);

  // Vignette State
  const [vignetteSubject, setVignetteSubject] = useState('psm');
  const [vignetteTopic, setVignetteTopic] = useState('Epidemiological Studies');
  const [difficulty, setDifficulty] = useState<'medium' | 'hard'>('medium');
  const [loadingVignette, setLoadingVignette] = useState(false);
  const [vignetteData, setVignetteData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Concept Simplifier State
  const [conceptSubject, setConceptSubject] = useState('medicine');
  const [conceptTopic, setConceptTopic] = useState('Multiple Myeloma diagnostic criteria (CRAB)');
  const [loadingConcept, setLoadingConcept] = useState(false);
  const [conceptData, setConceptData] = useState<any>(null);

  // GT Diagnosis State
  const [gtScore, setGtScore] = useState<number>(latestGT?.score || 142);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(
    latestGT?.weakSubjectIds || ['medicine', 'psm', 'obg']
  );
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);

  if (!isOpen) return null;

  // 1. Fetch Vignette Question
  const handleGenerateVignette = async () => {
    setLoadingVignette(true);
    setVignetteData(null);
    setSelectedOption(null);
    setShowAnswer(false);

    try {
      const res = await fetch('/api/ai/vignette-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: FMGE_SUBJECTS.find((s) => s.id === vignetteSubject)?.name || vignetteSubject,
          topic: vignetteTopic,
          difficulty,
        }),
      });
      const data = await res.json();
      setVignetteData(data);
    } catch (err) {
      console.error('Error fetching vignette:', err);
    } finally {
      setLoadingVignette(false);
    }
  };

  // 2. Fetch Concept Explanation
  const handleGenerateConcept = async () => {
    setLoadingConcept(true);
    setConceptData(null);

    try {
      const res = await fetch('/api/ai/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: FMGE_SUBJECTS.find((s) => s.id === conceptSubject)?.name || conceptSubject,
          topic: conceptTopic,
        }),
      });
      const data = await res.json();
      setConceptData(data);
    } catch (err) {
      console.error('Error fetching concept:', err);
    } finally {
      setLoadingConcept(false);
    }
  };

  // 3. Fetch GT Diagnosis
  const handleGenerateDiagnosis = async () => {
    setLoadingDiagnosis(true);
    setDiagnosisData(null);

    try {
      const res = await fetch('/api/ai/gt-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: gtScore,
          weakSubjects: weakSubjects.map((id) => FMGE_SUBJECTS.find((s) => s.id === id)?.name || id),
          daysRemaining,
        }),
      });
      const data = await res.json();
      setDiagnosisData(data);
    } catch (err) {
      console.error('Error fetching diagnosis:', err);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  const handleSelectOption = (optKey: string) => {
    if (showAnswer) return;
    setSelectedOption(optKey);
    setShowAnswer(true);

    if (vignetteData && optKey === vignetteData.correctAnswer) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const toggleWeakSubject = (id: string) => {
    if (weakSubjects.includes(id)) {
      setWeakSubjects(weakSubjects.filter((s) => s !== id));
    } else {
      setWeakSubjects([...weakSubjects, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">FMGE AI Medical Coach & Question Engine</h2>
              <p className="text-[11px] text-indigo-200">Powered by Gemini 3.6 Flash</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-mode Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-4 pt-2">
          <button
            onClick={() => setActiveTab('vignette')}
            className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'vignette'
                ? 'border-indigo-600 text-indigo-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Clinical Vignette MCQs</span>
          </button>

          <button
            onClick={() => setActiveTab('concept')}
            className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'concept'
                ? 'border-indigo-600 text-indigo-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>High-Yield Mnemonics</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center space-x-1.5 px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'diagnosis'
                ? 'border-indigo-600 text-indigo-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>GT Score Diagnostic</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: CLINICAL VIGNETTE PRACTICE */}
          {activeTab === 'vignette' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject</label>
                  <select
                    value={vignetteSubject}
                    onChange={(e) => setVignetteSubject(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {FMGE_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (~{s.weightage}M)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">High-Yield Topic</label>
                  <input
                    type="text"
                    value={vignetteTopic}
                    onChange={(e) => setVignetteTopic(e.target.value)}
                    placeholder="e.g. Parkland formula / Preeclampsia"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value="medium">Standard FMGE</option>
                      <option value="hard">Clinical Traps (Hard)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateVignette}
                    disabled={loadingVignette}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center space-x-1 shadow-xs"
                  >
                    {loadingVignette ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Question Render */}
              {loadingVignette && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Crafting authentic FMGE clinical scenario...</p>
                </div>
              )}

              {vignetteData && !loadingVignette && (
                <div className="space-y-4">
                  {/* Scenario Box */}
                  <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-indigo-300">
                      <span className="font-bold uppercase tracking-wider">{vignetteData.subject}</span>
                      <span className="text-[10px] bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 font-bold">
                        {vignetteData.topic}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-serif">
                      {vignetteData.scenario}
                    </p>
                  </div>

                  {/* MCQ Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vignetteData.options.map((opt: any) => {
                      const isSelected = selectedOption === opt.key;
                      const isCorrect = opt.key === vignetteData.correctAnswer;
                      let btnStyle = 'bg-white border-slate-200 hover:border-indigo-400 text-slate-800';

                      if (showAnswer) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 line-through';
                        } else {
                          btnStyle = 'bg-slate-50 border-slate-200 text-slate-400';
                        }
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectOption(opt.key)}
                          className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start space-x-2.5 ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {opt.key}
                          </span>
                          <span className="leading-snug font-medium">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback and Explanation */}
                  {showAnswer && (
                    <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-3">
                      <div className="flex items-center space-x-2">
                        {selectedOption === vignetteData.correctAnswer ? (
                          <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct! Excellent clinical judgment.</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-xs">
                            <XCircle className="w-4 h-4" />
                            <span>Incorrect. Correct Option is {vignetteData.correctAnswer}.</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">
                        <span className="font-bold block text-slate-900 mb-1">Clinical Explanation:</span>
                        {vignetteData.explanation}
                      </div>

                      {vignetteData.highYieldPearl && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-bold">
                          High-Yield Pearl: {vignetteData.highYieldPearl}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONCEPT SIMPLIFIER & MNEMONICS */}
          {activeTab === 'concept' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject</label>
                  <select
                    value={conceptSubject}
                    onChange={(e) => setConceptSubject(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {FMGE_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (~{s.weightage}M)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Topic / Hard Concept</label>
                    <input
                      type="text"
                      value={conceptTopic}
                      onChange={(e) => setConceptTopic(e.target.value)}
                      placeholder="e.g. Multiple Myeloma CRAB criteria or Vitamin Deficiencies"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <button
                    onClick={handleGenerateConcept}
                    disabled={loadingConcept}
                    className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center space-x-1 shadow-xs"
                  >
                    {loadingConcept ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Simplify</span>
                  </button>
                </div>
              </div>

              {loadingConcept && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Extracting core high-yield bullets & mnemonics...</p>
                </div>
              )}

              {conceptData && !loadingConcept && (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">{conceptData.topic}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                        {conceptData.subject}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-700 block">5 High-Yield Summary Bullets:</span>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                        {conceptData.highYieldBullets?.map((b: string, i: number) => (
                          <li key={i} className="leading-relaxed font-medium">{b}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Mnemonic Box */}
                    {conceptData.mnemonic && (
                      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900 block mb-0.5">Sticky Mnemonic:</span>
                        <p className="text-amber-950 font-bold">{conceptData.mnemonic}</p>
                      </div>
                    )}

                    {/* Exam Trap */}
                    {conceptData.commonTrap && (
                      <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs">
                        <span className="font-bold text-rose-900 block mb-0.5">Common FMGE Trap to Avoid:</span>
                        <p className="text-rose-950 font-medium">{conceptData.commonTrap}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GT SCORE RECOVERY DIAGNOSIS */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Your Latest GT Score (/ 300)</label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={gtScore}
                      onChange={(e) => setGtScore(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Days Remaining to Exam</label>
                    <div className="p-2.5 bg-slate-100 rounded-xl font-bold text-slate-800">
                      {daysRemaining} Days
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">
                    Select Weak Subjects from Test (Click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                    {FMGE_SUBJECTS.map((sub) => {
                      const isSelected = weakSubjects.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleWeakSubject(sub.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleGenerateDiagnosis}
                  disabled={loadingDiagnosis}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {loadingDiagnosis ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Generate 7-Day 150+ Passing Action Plan</span>
                </button>
              </div>

              {loadingDiagnosis && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Formulating clinical recovery roadmap...</p>
                </div>
              )}

              {diagnosisData && !loadingDiagnosis && (
                <div className="space-y-4">
                  {/* Diagnosis Header */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Passing Diagnosis</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        {diagnosisData.estimatedGapToPass}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">{diagnosisData.diagnosis}</p>
                  </div>

                  {/* 7-Day Recovery Roadmap */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      7-Day Intensive Action Schedule
                    </h4>
                    <div className="space-y-2">
                      {diagnosisData.sevenDayActionPlan?.map((item: any) => (
                        <div key={item.day} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                            <span className="text-indigo-700">{item.day}</span>
                            <span className="text-slate-500 text-[11px]">{item.subject}</span>
                          </div>
                          <p className="text-slate-700">{item.focus}</p>
                          <p className="text-[11px] text-indigo-800 mt-1 font-bold">Target: {item.target}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Advice */}
                  {diagnosisData.topAdvice && (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 font-bold">
                      Coach's Golden Advice: {diagnosisData.topAdvice}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
