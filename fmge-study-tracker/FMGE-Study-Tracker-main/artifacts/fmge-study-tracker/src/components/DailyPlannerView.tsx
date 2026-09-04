import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';
import { DailyTask, DailyStudyLog, AppState } from '../types';
import { FMGE_SUBJECTS } from '../data/fmgeSubjects';
import { getLocalDateKey } from '../utils/date';

interface DailyPlannerViewProps {
  state: AppState;
  onAddTask: (task: DailyTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateDailyLog: (dateStr: string, updates: Partial<DailyStudyLog>) => void;
}

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  state,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateDailyLog,
}) => {
  const todayStr = getLocalDateKey();
  const todayLog = state.studyLogs[todayStr] || {
    date: todayStr,
    studyMinutes: 0,
    questionsSolved: 0,
    completedTaskIds: [],
    mood: 'great',
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
              // Add 25 minutes to today's study log if pomodoro
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

  // Audio synthesis helper for ambient focus sounds
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
        // Alpha Binaural Beat (10 Hz diff: 200 Hz & 210 Hz sine waves)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 200;
        osc2.frequency.value = 210;
        gain.gain.value = 0.04; // low gentle volume
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        noiseNodeRef.current = gain;
      } else {
        // White noise / Soft rain generator
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
    <div className="space-y-5 pb-12">
      {/* Top Bento Header & Goals Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Daily Study Planner & Focus Engine</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-200 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Target: {state.settings.dailyStudyHourGoal}h / day</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain high-yield MCQ momentum and log structured focus blocks.
            </p>
          </div>
        </div>

        {/* Today's Stats Counters */}
        <div className="flex items-center space-x-3 self-start md:self-center">
          <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Study Hours</span>
            <span className="text-base font-extrabold text-indigo-700">
              {(todayLog.studyMinutes / 60).toFixed(1)} / {state.settings.dailyStudyHourGoal}h
            </span>
          </div>

          <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">MCQs Solved</span>
            <input
              type="number"
              min="0"
              value={todayLog.questionsSolved}
              onChange={(e) => onUpdateDailyLog(todayStr, { questionsSolved: Number(e.target.value) })}
              className="w-16 text-center text-base font-extrabold text-indigo-700 bg-white border border-slate-200 rounded-xl py-0.5"
            />
          </div>
        </div>
      </div>

      {/* Main Bento Grid: Pomodoro Focus Box & Task Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (1 col): Built-In Focus Pomodoro Timer */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" />
                <h3 className="font-bold text-white text-base">Study Focus Timer</h3>
              </div>

              {/* Ambient Sound Mode selector */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleSoundToggle(soundMode === 'alpha' ? 'off' : 'alpha')}
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg transition-colors ${
                    soundMode === 'alpha' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Alpha Waves (10Hz Focus)"
                >
                  Alpha
                </button>
                <button
                  onClick={() => handleSoundToggle(soundMode === 'rain' ? 'off' : 'rain')}
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg transition-colors ${
                    soundMode === 'rain' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Soft Rain"
                >
                  Rain
                </button>
                <button
                  onClick={() => handleSoundToggle(soundMode === 'whitenoise' ? 'off' : 'whitenoise')}
                  className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg transition-colors ${
                    soundMode === 'whitenoise' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="White Noise"
                >
                  Noise
                </button>
              </div>
            </div>

            {/* Timer Modes */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-800/90 rounded-2xl mt-4 text-[11px] font-bold text-center">
              <button
                onClick={() => handleModeChange('pomodoro')}
                className={`py-1.5 rounded-xl transition-colors ${
                  timerMode === 'pomodoro' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                25m Focus
              </button>
              <button
                onClick={() => handleModeChange('short_break')}
                className={`py-1.5 rounded-xl transition-colors ${
                  timerMode === 'short_break' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                5m Break
              </button>
              <button
                onClick={() => handleModeChange('long_break')}
                className={`py-1.5 rounded-xl transition-colors ${
                  timerMode === 'long_break' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                15m Break
              </button>
              <button
                onClick={() => handleModeChange('stopwatch')}
                className={`py-1.5 rounded-xl transition-colors ${
                  timerMode === 'stopwatch' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stopwatch
              </button>
            </div>

            {/* Giant Digital Clock Display */}
            <div className="text-center my-8">
              <div className="text-6xl font-mono font-black tracking-tight text-indigo-300">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-slate-400 mt-2 capitalize font-semibold">
                {timerMode === 'pomodoro' ? 'Deep Work Interval' : timerMode.replace('_', ' ')}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-14 h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
              >
                {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>

              <button
                onClick={() => handleModeChange(timerMode)}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            Completing 25m focus automatically logs +25 min to today's study record.
          </div>
        </div>

        {/* Right Column (2 cols): Today's Tasks Checklist */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Today's Study Action Checklist</h3>
                <p className="text-xs text-slate-500">
                  Completed {state.dailyTasks.filter((t) => t.completed).length} of {state.dailyTasks.length} tasks
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddTask(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
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
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    task.completed
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800 shadow-xs'
                  }`}
                >
                  <div
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="h-4 w-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase"
                          style={{ backgroundColor: sub?.color || '#64748b' }}
                        >
                          {sub?.code || 'GEN'}
                        </span>
                        <span className={`text-xs font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                        <span className="capitalize font-medium">{task.type}</span>
                        <span>•</span>
                        <span>{task.durationMinutes} min</span>
                        {task.priority === 'high' && (
                          <span className="px-2 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-slate-300 hover:text-rose-600 p-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {state.dailyTasks.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-500">No tasks planned for today yet. Add your daily high-yield goals above!</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD TASK */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add Today's Study Task</h3>
            <p className="text-xs text-slate-500 mt-0.5">Plan a high-yield study or MCQ block.</p>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 50 MCQs of OBG Preeclampsia"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Subject</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
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
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Task Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[10px] uppercase">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
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
