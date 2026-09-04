import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Target,
  Smile,
  Calendar,
  BookmarkCheck,
  Volume2,
  VolumeX,
  Check
} from 'lucide-react';
import { DailyTask, DailyStudyLog, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { getPersonalizedDailyPlan, PersonalizedPlanTask } from '../utils/personalizationEngine';

interface DailyPlannerViewProps {
  state: AppState;
  onAddTask: (task: DailyTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateDailyLog: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
  onLaunchPracticeSession?: (subjectId: string, topicId: string, topicName: string, subtopic?: string) => void;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  state,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateDailyLog,
  onLaunchPracticeSession,
}) => {
  const { profile } = useAuth();
  const todayStr = getLocalDateKey();
  const todayLog = state.studyLogs[todayStr] || {
    date: todayStr,
    studyMinutes: 0,
    questionsSolved: 0,
    completedTaskIds: [],
    mood: 'great',
  };

  // Personalized plan for today — same source as the Dashboard "TODAY'S PLAN".
  const dailyPlan = useMemo(() => getPersonalizedDailyPlan(profile, state), [profile, state]);

  const planType = (activity: string): DailyTask['type'] => {
    if (activity === 'mcqs' || activity === 'errors') return 'qbank';
    if (activity === 'learn') return 'video';
    if (activity === 'recall' || activity === 'revision') return 'revision';
    return 'qbank';
  };

  const planPriority = (score: number): DailyTask['priority'] =>
    score >= 66 ? 'high' : score >= 33 ? 'medium' : 'low';

  const planToChecklist = (task: PersonalizedPlanTask): DailyTask => ({
    id: `plan-${task.id}`,
    title: `${task.activityLabel} — ${task.topicName}`,
    subjectId: task.subjectId,
    topicName: task.topicName,
    type: planType(task.activity),
    durationMinutes: task.durationMinutes,
    completed: false,
    priority: planPriority(task.priority),
  });

  const addPlanToChecklist = () => {
    const existingTitles = new Set(state.dailyTasks.map((t) => t.title));
    dailyPlan.tasks
      .map(planToChecklist)
      .filter((t) => !existingTitles.has(t.title))
      .forEach(onAddTask);
  };

  const startTopPriority = () => {
    const launchable = dailyPlan.tasks.find((t) =>
      ['learn', 'recall', 'mcqs', 'errors'].includes(t.activity)
    );
    if (launchable) onLaunchPracticeSession?.(launchable.subjectId, launchable.topicId, launchable.topicName);
  };

  // Pomodoro & Timer State
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short_break' | 'long_break' | 'stopwatch'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min default
  const [isRunning, setIsRunning] = useState(false);
  const [soundMode, setSoundMode] = useState<'off' | 'alpha' | 'whitenoise' | 'rain'>('off');

  // Ambient Web Audio context ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // New Task Form State
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('psm');
  const [newTaskType, setNewTaskType] = useState<DailyTask['type']>('qbank');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [newTaskPriority, setNewTaskPriority] = useState<DailyTask['priority']>('high');

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (timerMode === 'stopwatch') {
          setTimeLeft((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              stopAmbientSound();
              if (timerMode === 'pomodoro') {
                onUpdateDailyLog(todayStr, {
                  studyMinutes: todayLog.studyMinutes + 25,
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode, todayLog.studyMinutes, todayStr]);

  const startAmbientSound = (type: 'alpha' | 'whitenoise' | 'rain') => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopAmbientSound();

      if (type === 'alpha') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 200;
        osc2.frequency.value = 210;
        gain.gain.value = 0.04;
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        noiseNodeRef.current = gain;
      } else {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'rain' ? 800 : 1200;

        const gain = ctx.createGain();
        gain.gain.value = 0.03;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noiseNodeRef.current = gain;
      }
    } catch (e) {
      console.error('Web Audio error:', e);
    }
  };

  const stopAmbientSound = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
  };

  const handleSoundToggle = (mode: 'off' | 'alpha' | 'whitenoise' | 'rain') => {
    setSoundMode(mode);
    if (mode === 'off') {
      stopAmbientSound();
    } else {
      startAmbientSound(mode);
    }
  };

  const handleModeChange = (mode: 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch') => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    else if (mode === 'short_break') setTimeLeft(5 * 60);
    else if (mode === 'long_break') setTimeLeft(15 * 60);
    else if (mode === 'stopwatch') setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const task: DailyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      subjectId: newTaskSubject,
      type: newTaskType,
      durationMinutes: Number(newTaskDuration) || 45,
      completed: false,
      priority: newTaskPriority,
    };

    onAddTask(task);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Bento Header & Goals Banner */}
      <div className="bento-card p-6 bg-[#faf7f2] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#faf7f2] text-[#121e1b] font-bold">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-[#121e1b]">Daily Study Planner & Focus Engine</h2>
              <span className="rounded-full bg-[#f4eee7] text-[#121e1b] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-200 flex items-center space-x-1">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>Target: {state.settings.dailyStudyHourGoal}h / day</span>
              </span>
            </div>
            <p className="text-xs text-[#3d4947] mt-0.5">
              Maintain high-yield MCQ momentum and log structured focus blocks.
            </p>
          </div>
        </div>

        {/* Today's Stats Counters */}
        <div className="flex items-center space-x-3 self-start md:self-center">
          <div className="bg-[#f4eee7] px-4 py-2.5 rounded-2xl border border-[#e0d8cd] text-center">
            <span className="text-[10px] text-[#3d4947] font-bold uppercase block">Study Hours</span>
            <span className="font-display text-base font-extrabold text-[#121e1b]">
              {(todayLog.studyMinutes / 60).toFixed(1)} / {state.settings.dailyStudyHourGoal}h
            </span>
          </div>

          <div className="bg-[#f4eee7] px-4 py-2.5 rounded-2xl border border-[#e0d8cd] text-center">
            <span className="text-[10px] text-[#3d4947] font-bold uppercase block">MCQs Solved</span>
            <input
              type="number"
              min="0"
              value={todayLog.questionsSolved}
              onChange={(e) => onUpdateDailyLog(todayStr, { questionsSolved: Number(e.target.value) })}
              className="w-16 text-center font-display text-base font-extrabold text-[#121e1b] bg-[#faf7f2] border border-[#e0d8cd] rounded-xl py-0.5"
            />
          </div>
        </div>
      </div>

      {/* Personalized Plan Banner — generated from the onboarding profile + live performance */}
      {dailyPlan.tasks.length > 0 && (
        <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e0d8cd] text-[#121e1b]">
                <BookmarkCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-['Outfit'] text-[#121e1b]">Today&apos;s Personalized Plan</h3>
                  <span className="rounded-2xl bg-[#e0d8cd] text-[#121e1b] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Target className="h-3 w-3" /> {dailyPlan.phaseTitle}
                  </span>
                </div>
                <p className="text-xs text-[#3d4947] mt-0.5">
                  {dailyPlan.tasks.length} task{dailyPlan.tasks.length > 1 ? 's' : ''} · {dailyPlan.availableMinutes} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startTopPriority}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#e0d8cd] hover:bg-[#f4eee7] text-[#121e1b] px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Start Top Priority
              </button>
              <button
                type="button"
                onClick={addPlanToChecklist}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e0d8cd] bg-[#faf7f2] hover:bg-[#f4eee7] text-slate-700 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add to Checklist
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dailyPlan.tasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-2xl border border-[#e0d8cd]/80 bg-[#faf7f2] px-3.5 py-2.5"
              >
                <span
                  className="w-1.5 self-stretch rounded-full"
                  style={{ backgroundColor: task.subjectColor || '#4a3b32' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#3d4947]">{task.subjectCode}</span>
                    <span className="text-[11px] font-medium text-sky-600">{task.activityLabel}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#3d4947] truncate">{task.topicName}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#3d4947] tabular-nums shrink-0">{task.durationMinutes} min</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#3d4947] mt-3">{dailyPlan.phaseDescription}</p>
        </div>
      )}

      {/* Main Bento Grid: Pomodoro Focus Box & Task Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Span 4): Built-In Focus Pomodoro Timer */}
        <div className="lg:col-span-5 p-6 bg-[#faf7f2] text-[#121e1b] space-y-6 flex flex-col justify-between rounded-2xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                <h3 className="font-bold font-['Outfit'] text-[#121e1b] text-base">Study Focus Timer</h3>
              </div>

              {/* Ambient Sound Mode selector */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleSoundToggle(soundMode === 'alpha' ? 'off' : 'alpha')}
                  className={`text-[10px] font-bold font-['Outfit'] uppercase px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    soundMode === 'alpha' ? 'bg-sky-500 text-[#121e1b]' : 'bg-[#e0d8cd] text-[#3d4947] hover:text-[#121e1b]'
                  }`}
                  title="Alpha Waves (10Hz Focus)"
                >
                  Alpha
                </button>
                <button
                  onClick={() => handleSoundToggle(soundMode === 'rain' ? 'off' : 'rain')}
                  className={`text-[10px] font-bold font-['Outfit'] uppercase px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    soundMode === 'rain' ? 'bg-sky-500 text-[#121e1b]' : 'bg-[#e0d8cd] text-[#3d4947] hover:text-[#121e1b]'
                  }`}
                  title="Soft Rain"
                >
                  Rain
                </button>
                <button
                  onClick={() => handleSoundToggle(soundMode === 'whitenoise' ? 'off' : 'whitenoise')}
                  className={`text-[10px] font-bold font-['Outfit'] uppercase px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                    soundMode === 'whitenoise' ? 'bg-sky-500 text-[#121e1b]' : 'bg-[#e0d8cd] text-[#3d4947] hover:text-[#121e1b]'
                  }`}
                  title="White Noise"
                >
                  Noise
                </button>
              </div>
            </div>

            {/* Timer Modes */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#e0d8cd]/90 rounded-full mt-4 text-[11px] font-bold font-['Outfit'] text-center">
              <button
                onClick={() => handleModeChange('pomodoro')}
                className={`py-1.5 rounded-full transition-colors cursor-pointer ${
                  timerMode === 'pomodoro' ? 'bg-sky-500 text-[#121e1b] shadow-xs' : 'text-[#3d4947] hover:text-[#121e1b]'
                }`}
              >
                25m
              </button>
              <button
                onClick={() => handleModeChange('short_break')}
                className={`py-1.5 rounded-full transition-colors cursor-pointer ${
                  timerMode === 'short_break' ? 'bg-sky-500 text-[#121e1b] shadow-xs' : 'text-[#3d4947] hover:text-[#121e1b]'
                }`}
              >
                5m
              </button>
              <button
                onClick={() => handleModeChange('long_break')}
                className={`py-1.5 rounded-full transition-colors cursor-pointer ${
                  timerMode === 'long_break' ? 'bg-sky-500 text-[#121e1b] shadow-xs' : 'text-[#3d4947] hover:text-[#121e1b]'
                }`}
              >
                15m
              </button>
              <button
                onClick={() => handleModeChange('stopwatch')}
                className={`py-1.5 rounded-full transition-colors cursor-pointer ${
                  timerMode === 'stopwatch' ? 'bg-sky-500 text-[#121e1b] shadow-xs' : 'text-[#3d4947] hover:text-[#121e1b]'
                }`}
              >
                Watch
              </button>
            </div>

            {/* Giant Digital Clock Display */}
            <div className="text-center my-8">
              <div className="font-mono text-6xl sm:text-7xl font-bold tracking-tight text-sky-300">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-[#3d4947] mt-2 capitalize font-semibold">
                {timerMode === 'pomodoro' ? 'Deep Focus Sprint' : timerMode.replace('_', ' ')}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-14 h-14 rounded-full bg-[#faf7f2] text-[#121e1b] hover:bg-[#faf7f2] flex items-center justify-center font-bold shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                {isRunning ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => handleModeChange(timerMode)}
                className="p-3.5 bg-[#e0d8cd] hover:bg-slate-700 text-slate-300 hover:text-[#121e1b] rounded-full transition-colors cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-[#e0d8cd] text-[11px] text-[#3d4947]">
            Completing 25m focus automatically logs +25 min to today&apos;s study record.
          </div>
        </div>

        {/* Right Column (Span 7): Today's Tasks Checklist */}
        <div className="lg:col-span-7 rounded-2xl border border-[#e0d8cd]/80 bg-[#faf7f2] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-[#121e1b]">Today&apos;s Study Action Checklist</h3>
                <p className="text-xs text-[#3d4947]">
                  Completed {state.dailyTasks.filter((t) => t.completed).length} of {state.dailyTasks.length} tasks
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#e0d8cd] hover:bg-[#f4eee7] text-[#121e1b] px-4 py-2 text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Task Items List */}
          <div className="space-y-2.5">
            {state.dailyTasks.map((task) => {
              const sub = FMGE_SUBJECTS.find((s) => s.id === task.subjectId);

              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl border flex items-center items-start justify-between transition-all border-[#e0d8cd] ${
                    task.completed ? 'bg-[#f4eee7] text-[#3d4947]' : 'bg-[#faf7f2] text-[#121e1b]'
                  }"
                >
                  <div
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-start space-x-3 cursor-pointer flex-1"
                  >
                    <button
                      type="button"
                      className="h-5 w-5 rounded-full flex items-center justify-center transition-colors ${
                        task.completed ? 'bg-sky-600 text-[#121e1b]' : 'border border-slate-200 hover:border-slate-400'
                      }"
                    >
                      {task.completed && <Check className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#121e1b] uppercase"
                          style={{ backgroundColor: sub?.color || '#4a3b32' }}
                        >
                          {sub?.code || 'GEN'}
                        </span>
                        <span className="text-xs font-semibold truncate">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="capitalize font-medium text-[11px]">{task.type}</span>
                        <span className="mx-1">•</span>
                        <span className="text-[11px]">{task.durationMinutes} min</span>
                        {task.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-[#3d4947] hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {state.dailyTasks.length === 0 && (
            <div className="text-center py-10 bg-[#f4eee7] rounded-2xl border border-dashed border-slate-300">
              <p className="text-xs text-[#3d4947]">No tasks planned for today yet. Add your daily high-yield goals above!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD TASK */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-[#faf7f2]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e0d8cd]">
            <h3 className="text-lg font-bold text-[#121e1b]">Add Today's Study Task</h3>
            <p className="text-xs text-[#3d4947] mt-0.5">Plan a high-yield study or MCQ block.</p>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 50 MCQs of OBG Preeclampsia"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#f4eee7] border border-[#e0d8cd] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full p-2.5 bg-[#f4eee7] border border-[#e0d8cd] rounded-xl text-xs font-medium"
                  >
                    {FMGE_SUBJECTS.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (~{sub.weightage}M)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Task Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#f4eee7] border border-[#e0d8cd] rounded-xl text-xs font-medium"
                  >
                    <option value="qbank">QBank / MCQs</option>
                    <option value="video">Video / Notes</option>
                    <option value="revision">Rapid Revision</option>
                    <option value="gt_review">GT Review</option>
                    <option value="pearls">High-Yield Pearls</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#f4eee7] border border-[#e0d8cd] rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-[#f4eee7] border border-[#e0d8cd] rounded-xl text-xs font-medium"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 bg-[#faf7f2] hover:bg-slate-200 text-slate-700 rounded-full font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e0d8cd] hover:bg-[#f4eee7] text-[#121e1b] rounded-full font-bold shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
