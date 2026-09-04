import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Search,
  Star,
  Plus,
  Copy,
  Check,
  Tag,
  BookOpen,
  Brain,
  Pill,
  ShieldAlert,
  Flame,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { MedicalPearl, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { INITIAL_PEARLS } from '../data/initialPearls';
import {
  searchOrGenerateMedicalPearl,
  fetchOrGenerateMedicalPearl,
  COMPREHENSIVE_PEARL_REPOSITORY,
  DynamicPearlTopicPackage
} from '../utils/medicalPearlsEngine';

interface PearlsVaultViewProps {
  state: AppState;
  onToggleBookmark: (pearlId: string) => void;
  onAddCustomPearl: (pearl: MedicalPearl) => void;
}

export const PearlsVaultView: React.FC<PearlsVaultViewProps> = ({
  state,
  onToggleBookmark,
  onAddCustomPearl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mnemonics' | 'doc' | 'triads' | 'formulas' | 'traps'>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active On-Demand Topic Generator state
  const [activeTopicQuery, setActiveTopicQuery] = useState<string>('COPD');
  const [generatedTopic, setGeneratedTopic] = useState<DynamicPearlTopicPackage>(() =>
    searchOrGenerateMedicalPearl('COPD')
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQueryTopic = async (topic: string) => {
    if (!topic.trim()) return;
    setActiveTopicQuery(topic);
    setIsGenerating(true);
    try {
      const result = await fetchOrGenerateMedicalPearl(topic);
      setGeneratedTopic(result);
    } catch (err) {
      console.error('Pearl generation error:', err);
      const fallback = searchOrGenerateMedicalPearl(topic);
      setGeneratedTopic(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedToVault = () => {
    const pearl: MedicalPearl = {
      id: `dyn-pearl-${Date.now()}`,
      subjectId: generatedTopic.subjectId,
      title: generatedTopic.mnemonic.title,
      highYieldKey: `${generatedTopic.mnemonic.acronym}: ${generatedTopic.oneLineTakeaway}`,
      explanation: `${generatedTopic.mnemonic.breakdown.map((b) => `${b.letter} = ${b.meaning} (${b.clinicalNote})`).join('\n')}\n\nDOC: ${generatedTopic.drugOfChoice.firstLineDrug}\n\nTriad: ${generatedTopic.diagnosticTriad.components.join(', ')}`,
      tags: ['Mnemonic', 'DOC', 'High-Yield'],
      isHighYield: true,
      isBookmarked: true,
    };
    onAddCustomPearl(pearl);
    onToggleBookmark(pearl.id);
  };

  // Combine initial pearls, curated repository, and user's custom pearls
  const allPearls = useMemo(() => {
    const repositoryAsPearls: MedicalPearl[] = COMPREHENSIVE_PEARL_REPOSITORY.map((item, idx) => ({
      id: `repo-pearl-${idx}`,
      subjectId: item.subjectId,
      title: item.mnemonic.title,
      highYieldKey: `${item.mnemonic.acronym} • ${item.drugOfChoice.firstLineDrug}`,
      explanation: item.mnemonic.breakdown.map((b) => `• ${b.letter}: ${b.meaning} - ${b.clinicalNote}`).join('\n') + `\n\n📌 Triad: ${item.diagnosticTriad.components.join(' · ')}`,
      tags: ['Mnemonic', 'DOC', 'High-Yield'],
      isHighYield: true,
    }));

    const combined = [...INITIAL_PEARLS, ...repositoryAsPearls, ...(state.customPearls || [])];
    const bookmarkSet = new Set(state.bookmarkedPearlIds || []);
    
    // Deduplicate by title
    const seen = new Set<string>();
    const uniqueList: MedicalPearl[] = [];
    for (const p of combined) {
      if (!seen.has(p.title.toLowerCase())) {
        seen.add(p.title.toLowerCase());
        uniqueList.push({
          ...p,
          isBookmarked: bookmarkSet.has(p.id) || Boolean(p.isBookmarked),
        });
      }
    }
    return uniqueList;
  }, [state.customPearls, state.bookmarkedPearlIds]);

  // Filtered pearls
  const filteredPearls = useMemo(() => {
    return allPearls.filter((p) => {
      if (bookmarkedOnly && !p.isBookmarked) return false;
      if (selectedSubject !== 'all' && p.subjectId !== selectedSubject) return false;
      if (selectedCategory === 'mnemonics' && !p.tags.some((t) => t.toLowerCase().includes('mnemonic'))) return false;
      if (selectedCategory === 'doc' && !p.tags.some((t) => t.toLowerCase().includes('doc'))) return false;
      if (selectedCategory === 'formulas' && !p.tags.some((t) => t.toLowerCase().includes('formula') || t.toLowerCase().includes('rule'))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesKey = p.highYieldKey.toLowerCase().includes(q);
        const matchesExpl = p.explanation.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesExpl) return false;
      }
      return true;
    });
  }, [allPearls, bookmarkedOnly, selectedSubject, selectedCategory, searchQuery]);

  const bookmarkedCount = allPearls.filter((pearl) => pearl.isBookmarked).length;

  const handleCopy = (pearl: MedicalPearl) => {
    navigator.clipboard.writeText(`${pearl.title}\nKey Point: ${pearl.highYieldKey}\n\n${pearl.explanation}`);
    setCopiedId(pearl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyGenerated = () => {
    const text = `🧠 ${generatedTopic.mnemonic.title} (${generatedTopic.mnemonic.acronym})\n\n${generatedTopic.mnemonic.breakdown.map((b) => `• [${b.letter}] ${b.meaning}: ${b.clinicalNote}`).join('\n')}\n\n💊 Drug of Choice: ${generatedTopic.drugOfChoice.firstLineDrug}\nMechanism: ${generatedTopic.drugOfChoice.mechanism}\n\n🔍 Diagnostic Triad:\n${generatedTopic.diagnosticTriad.components.map((c) => `• ${c}`).join('\n')}\nSign: ${generatedTopic.diagnosticTriad.pathognomonicSign}\n\n⚠️ Exam Traps:\n${generatedTopic.examTraps.map((t) => `• Trap: ${t.trap} -> ${t.remedy}`).join('\n')}\n\n🎯 1-Line Key: ${generatedTopic.oneLineTakeaway}`;
    navigator.clipboard.writeText(text);
    setCopiedId('generated');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-20 font-['Plus_Jakarta_Sans'] max-w-6xl mx-auto px-2 sm:px-4">
      {/* Header Bento Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-xs shrink-0">
            <Brain className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-['Outfit'] text-xl font-bold text-slate-900">
                High-Yield Medical Pearls &amp; Mnemonics
              </h2>
              <span className="rounded-full bg-sky-50 text-sky-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-sky-200 font-mono">
                AI Generator
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant clinical mnemonics, Drugs of Choice (DOC), diagnostic triads, and high-yield exam traps.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-center">
          <button
            onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              bookmarkedOnly
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-white' : ''}`} />
            <span>Starred Vault ({bookmarkedCount})</span>
          </button>
        </div>
      </div>

      {/* ================= ON-DEMAND TOPIC SEARCH & GENERATOR ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="font-['Outfit'] text-base font-bold text-slate-900">
            Ask For Any Medical Concept, Disease, or Syndrome
          </h3>
          <p className="text-xs text-slate-500">
            Type any medical topic to synthesize structured mnemonics, drugs of choice, and NBE traps.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQueryTopic(activeTopicQuery);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={activeTopicQuery}
            onChange={(e) => setActiveTopicQuery(e.target.value)}
            placeholder="Type any medical topic (e.g. COPD, Celiac Disease, Asthma, Glaucoma, Tetralogy of Fallot, Leprosy...)"
            className="w-full h-13 pl-11 pr-9 sm:pr-14 md:pr-36 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
          />
          <Search className="absolute left-4 h-5 w-5 text-slate-400" />
          <button
            type="submit"
            disabled={isGenerating || !activeTopicQuery.trim()}
            className="absolute right-2 h-9 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
          >
            {isGenerating ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Synthesize ⚡</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Picks */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase font-mono shrink-0">Quick Picks:</span>
          {[
            'COPD',
            'Celiac Disease',
            'Asthma',
            'Multiple Myeloma',
            'Tetralogy of Fallot',
            'Burns Parkland Formula',
            'Monteggia vs Galeazzi',
            'Eclampsia Pritchard Regimen',
            'Glasgow Coma Scale',
            'Horner Syndrome',
            'MEN 1, 2A, 2B',
            'Poisoning Antidotes',
          ].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => handleQueryTopic(topic)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition-all cursor-pointer shrink-0"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* ================= GENERATED DYNAMIC RESULT CARD (EDITORIAL DESIGN) ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                {generatedTopic.subjectName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                {generatedTopic.mnemonic.acronym}
              </span>
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-slate-900">
              {generatedTopic.mnemonic.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleCopyGenerated}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              {copiedId === 'generated' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedId === 'generated' ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveGeneratedToVault}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all cursor-pointer"
            >
              <Star className="h-3.5 w-3.5 fill-slate-950" />
              <span>Save To Starred</span>
            </button>
          </div>
        </div>

        {/* Mnemonic Breakdown Cards Grid */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-slate-500" />
            <span>MNEMONIC CLINICAL BREAKDOWN</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {generatedTopic.mnemonic.breakdown.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-sky-100 text-sky-800 font-bold font-mono text-xs flex items-center justify-center border border-sky-200">
                    {item.letter}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate min-w-0 flex-1">{item.meaning}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                  {item.clinicalNote}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Bento Grid: Drug of Choice & Diagnostic Triad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Drug of Choice Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <Pill className="h-4 w-4 text-emerald-600" />
              <span className="uppercase font-mono tracking-wider">DRUG OF CHOICE (DOC) &amp; PROTOCOL</span>
            </div>
            <div className="text-sm font-extrabold text-emerald-950">
              {generatedTopic.drugOfChoice.firstLineDrug}
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              <span className="font-bold text-emerald-950">Mechanism:</span> {generatedTopic.drugOfChoice.mechanism}
            </p>
            {generatedTopic.drugOfChoice.alternative && (
              <p className="text-[11px] text-emerald-800/80 pt-1 border-t border-emerald-200/60">
                <span className="font-bold text-emerald-950">Alternative:</span> {generatedTopic.drugOfChoice.alternative}
              </p>
            )}
          </div>

          {/* Diagnostic Triad Card */}
          <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="uppercase font-mono tracking-wider">{generatedTopic.diagnosticTriad.triadName}</span>
            </div>
            <ul className="space-y-1.5">
              {generatedTopic.diagnosticTriad.components.map((comp, idx) => (
                <li key={idx} className="text-xs text-purple-950 flex items-start gap-1.5">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{comp}</span>
                </li>
              ))}
            </ul>
            <div className="text-[11px] text-purple-900 pt-1.5 border-t border-purple-200/60">
              <span className="font-bold text-purple-950">Pathognomonic Sign:</span> {generatedTopic.diagnosticTriad.pathognomonicSign}
            </div>
          </div>
        </div>

        {/* High-Frequency Exam Traps Card */}
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="uppercase font-mono tracking-wider">HIGH-FREQUENCY FMGE EXAM TRAPS</span>
          </div>
          {generatedTopic.examTraps.map((trap, idx) => (
            <div key={idx} className="text-xs text-slate-800 leading-relaxed">
              <span className="font-bold text-rose-700">Trap #{idx + 1}:</span> {trap.trap} — <span className="text-emerald-800 font-semibold">{trap.remedy}</span>
            </div>
          ))}
        </div>

        {/* 1-Line Memory Anchor Banner */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold uppercase">
              1-Line Key
            </span>
            <span className="text-slate-200 font-medium">{generatedTopic.oneLineTakeaway}</span>
          </div>
        </div>
      </div>

      {/* ================= REPOSITORY ARCHIVE & SEARCH ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h3 className="font-['Outfit'] text-base font-bold text-slate-900">
              Master Pearls Archive
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700">
              {filteredPearls.length} Pearls
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All 19 Subjects</option>
              {FMGE_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Category Filter Pills */}
            {[
              { id: 'all', label: 'All' },
              { id: 'mnemonics', label: '🧠 Mnemonics' },
              { id: 'doc', label: '💊 DOC' },
              { id: 'formulas', label: '⚡ Formulas' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pearls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPearls.map((pearl) => {
            const subject = FMGE_SUBJECTS.find((s) => s.id === pearl.subjectId);
            return (
              <div
                key={pearl.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700">
                      {subject?.name || pearl.subjectId}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(pearl)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Copy pearl"
                      >
                        {copiedId === pearl.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleBookmark(pearl.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          pearl.isBookmarked
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Star pearl"
                      >
                        <Star className={`h-4 w-4 ${pearl.isBookmarked ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-['Outfit'] text-sm font-bold text-slate-900 leading-snug">
                    {pearl.title}
                  </h4>

                  <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs font-bold text-sky-900 leading-relaxed font-mono">
                    {pearl.highYieldKey}
                  </div>

                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed break-words">
                    {pearl.explanation}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  {pearl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
