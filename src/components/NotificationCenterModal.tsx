import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppState } from '../types';
import {
  buildNotifications,
  loadDismissals,
  saveDismissals,
  shouldShow,
  type DismissalRecord,
  type SmartNotification,
} from '../utils/notificationEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onNavigateTab: (tab: any) => void;
  onSelectSubject?: (subjectId: string) => void;
  onLaunchPracticeSession?: (
    subjectId: string,
    topicId: string,
    topicName: string
  ) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  state,
  onNavigateTab,
  onSelectSubject,
  onLaunchPracticeSession,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'clinical' | 'wellness'>('all');
  const [dismissals, setDismissals] = useState<Record<string, DismissalRecord>>(loadDismissals);
  const [wellnessLoggedToast, setWellnessLoggedToast] = useState<string | null>(null);

  useEffect(() => {
    saveDismissals(dismissals);
  }, [dismissals]);

  const persistDismiss = (id: string, condition: string) =>
    setDismissals((prev) => ({ ...prev, [id]: { hiddenAt: Date.now(), condition } }));

  const allNotifications: SmartNotification[] = useMemo(
    () =>
      buildNotifications(
        state,
        dismissals,
        {
          onClose,
          onNavigateTab,
          onSelectSubject,
          onLaunchPracticeSession,
          onDismiss: persistDismiss,
          onBreakLogged: (msg) => {
            setWellnessLoggedToast(msg);
            setTimeout(() => setWellnessLoggedToast(null), 3500);
          },
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, dismissals, onClose, onNavigateTab, onSelectSubject, onLaunchPracticeSession]
  );

  if (!isOpen) return null;

  const visibleNotifications = allNotifications.filter((n) => shouldShow(n, dismissals));

  const filteredNotifications = visibleNotifications.filter((n) => {
    if (activeFilter === 'clinical') return ['revision', 'error', 'exam'].includes(n.category);
    if (activeFilter === 'wellness') return ['wellness', 'focus'].includes(n.category);
    return true;
  });

  const handleDismiss = (n: SmartNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    persistDismiss(n.id, n.condition);
  };

  const handleDismissAll = () => {
    setDismissals((prev) => {
      const next = { ...prev };
      visibleNotifications.forEach((n) => {
        next[n.id] = { hiddenAt: Date.now(), condition: n.condition };
      });
      return next;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-xs overflow-y-auto font-['Plus_Jakarta_Sans'] text-slate-900">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full my-auto shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-['Outfit'] text-base font-bold text-slate-900 flex items-center gap-2">
                Study Intelligence
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200">
                  {visibleNotifications.length} Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sensed from your actual progress, mistakes & schedule
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: `All (${visibleNotifications.length})` },
              { id: 'clinical', label: 'Clinical' },
              { id: 'wellness', label: 'Wellness' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {visibleNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
            >
              Dismiss All
            </button>
          )}
        </div>

        {/* Wellness Toast Feedback */}
        {wellnessLoggedToast && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{wellnessLoggedToast}</span>
          </div>
        )}

        {/* List of Smart Notifications */}
        <div className="p-5 divide-y divide-slate-100 space-y-4 min-h-0 flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">All Caught Up!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No overdue mistakes, open priorities, or due recalls right now. Your schedule is clear — keep the momentum.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="pt-4 first:pt-0 space-y-3 group">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${n.iconColor}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {n.title}
                          {n.priority === 'high' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              PRIORITY
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDismiss(n, e)}
                            className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            title="Dismiss for now"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {n.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pl-12">
                    <button
                      type="button"
                      onClick={n.onAction}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                    >
                      <span>{n.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Sensed from your live state · resurfaced only when relevant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
};
