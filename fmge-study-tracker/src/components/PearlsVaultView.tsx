import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Search,
  Star,
  Plus,
  Copy,
  Check,
  Sparkles,
  Tag,
  BookOpen
} from 'lucide-react';
import { MedicalPearl, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { INITIAL_PEARLS } from '../data/initialPearls';

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
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPearl, setNewPearl] = useState<Partial<MedicalPearl>>({
    subjectId: 'psm',
    title: '',
    highYieldKey: '',
    explanation: '',
    tags: ['DOC'],
    isHighYield: true,
  });

  // Combine initial pearls and user's custom pearls
  const allPearls = useMemo(() => {
    const combined = [...INITIAL_PEARLS, ...(state.customPearls || [])];
    const bookmarkSet = new Set(state.bookmarkedPearlIds || []);
    return combined.map((p) => ({
      ...p,
      isBookmarked: bookmarkSet.has(p.id) || Boolean(p.isBookmarked),
    }));
  }, [state.customPearls, state.bookmarkedPearlIds]);

  // Filtered pearls
  const filteredPearls = useMemo(() => {
    return allPearls.filter((p) => {
      if (bookmarkedOnly && !p.isBookmarked) return false;
      if (selectedSubject !== 'all' && p.subjectId !== selectedSubject) return false;
      if (selectedTag !== 'all' && !p.tags.includes(selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesKey = p.highYieldKey.toLowerCase().includes(q);
        const matchesExpl = p.explanation.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey && !matchesExpl) return false;
      }
      return true;
    });
  }, [allPearls, bookmarkedOnly, selectedSubject, selectedTag, searchQuery]);

  const bookmarkedCount = allPearls.filter((pearl) => pearl.isBookmarked).length;

  const handleCopy = (pearl: MedicalPearl) => {
    navigator.clipboard.writeText(`${pearl.title}\nKey Point: ${pearl.highYieldKey}\n${pearl.explanation}`);
    setCopiedId(pearl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveCustomPearl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPearl.title || !newPearl.highYieldKey) return;

    const pearl: MedicalPearl = {
      id: `pearl-${Date.now()}`,
      subjectId: newPearl.subjectId || 'medicine',
      title: newPearl.title || '',
      highYieldKey: newPearl.highYieldKey || '',
      explanation: newPearl.explanation || '',
      tags: newPearl.tags || ['High-Yield'],
      isHighYield: true,
    };

    onAddCustomPearl(pearl);
    setShowAddModal(false);
    setNewPearl({
      subjectId: 'psm',
      title: '',
      highYieldKey: '',
      explanation: '',
      tags: ['DOC'],
      isHighYield: true,
    });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bento Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">High-Yield Medical Pearls Vault</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                Volatile Formulas & DOCs
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid-fire review of Drugs of Choice (DOC), diagnostic triads, Parkland formulas, and high-frequency traps.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-center">
          <button
            onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              bookmarkedOnly
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${bookmarkedOnly ? 'fill-white' : ''}`} />
            <span>Starred ({bookmarkedCount})</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pearl</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pearl, disease, drug, formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All 19 Subjects</option>
            {FMGE_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (~{s.weightage}M)
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="DOC">Drug of Choice (DOC)</option>
            <option value="Triad/Sign">Triad / Sign</option>
            <option value="Rule/Formula">Rule / Formula</option>
            <option value="Classification">Classification</option>
            <option value="Mnemonic">Mnemonic</option>
          </select>
        </div>
      </div>

      {/* Pearls Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPearls.map((pearl) => {
          const sub = FMGE_SUBJECTS.find((s) => s.id === pearl.subjectId);
          const isCopied = copiedId === pearl.id;

          return (
            <div
              key={pearl.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase"
                      style={{ backgroundColor: sub?.color || '#4f46e5' }}
                    >
                      {sub?.code || pearl.subjectId}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {pearl.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onToggleBookmark(pearl.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        pearl.isBookmarked ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-500'
                      }`}
                      title={pearl.isBookmarked ? 'Remove Star' : 'Star Pearl'}
                    >
                      <Star className={`w-4 h-4 ${pearl.isBookmarked ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleCopy(pearl)}
                      className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg transition-colors"
                      title="Copy to Clipboard"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5">{pearl.title}</h3>

                {/* High Yield Key Rule Box */}
                <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs font-bold text-amber-950 leading-snug">
                  {pearl.highYieldKey}
                </div>

                {/* Detailed Medical Explanation */}
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-medium">
                  {pearl.explanation}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold">{sub?.name}</span>
                {pearl.isHighYield && <span className="font-bold text-indigo-600">High Yield</span>}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPearls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
          <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Medical Pearls Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query or subject filters.
          </p>
        </div>
      )}

      {/* MODAL: ADD CUSTOM PEARL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add High-Yield Medical Pearl</h3>
            <p className="text-xs text-slate-500 mt-0.5">Save volatile facts, formulas, or drug DOCs.</p>

            <form onSubmit={handleSaveCustomPearl} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject</label>
                  <select
                    value={newPearl.subjectId}
                    onChange={(e) => setNewPearl({ ...newPearl, subjectId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {FMGE_SUBJECTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (~{sub.weightage}M)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Title / Disease</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parkland Formula for Burns"
                    value={newPearl.title}
                    onChange={(e) => setNewPearl({ ...newPearl, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-800 mb-1 text-[10px] uppercase">High-Yield Key Rule / Formula</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 mL x weight (kg) x % TBSA (Ringer Lactate; 1/2 in first 8h from injury)"
                  value={newPearl.highYieldKey}
                  onChange={(e) => setNewPearl({ ...newPearl, highYieldKey: e.target.value })}
                  className="w-full p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs font-bold text-amber-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Explanation & Clinical Trap</label>
                <textarea
                  rows={3}
                  placeholder="Provide clinical details, common MCQ traps, and caveats..."
                  value={newPearl.explanation}
                  onChange={(e) => setNewPearl({ ...newPearl, explanation: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Pearl
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
