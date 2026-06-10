import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Clock, Calendar, CheckCircle, Brain, CalendarRange, Star, 
  ArrowRight, Compass, HelpCircle, RefreshCw, BookOpen, ChevronLeft, 
  Trash2, Plus, PenSquare, Edit3, Save 
} from "lucide-react";

interface PlanItem {
  id: string;
  timeSlot: string;
  action: string;
  tip?: string;
  completed: boolean;
}

interface AiPlannerProps {
  currentPoints: number;
  addPoints: (pts: number) => void;
  onBack: () => void;
  studyTimes: Record<string, number>;
}

export default function AiPlanner({ currentPoints, addPoints, onBack, studyTimes }: AiPlannerProps) {
  // Mode state: "select" (choice) | "self" (내가 짜기) | "ai" (AI 플래너)
  const [plannerMode, setPlannerMode] = useState<"select" | "self" | "ai">("select");

  // Goals & target time input state for AI Planner
  const [goalsText, setGoalsText] = useState("");
  const [availableMins, setAvailableMins] = useState(120);
  const [activeTasks, setActiveTasks] = useState<PlanItem[]>([]);

  // Physical planner fields inspired by the uploaded picture (Motemote note book)
  const [plannerDDay, setPlannerDDay] = useState("");
  const [plannerComment, setPlannerComment] = useState("");
  const [plannerTotalTime, setPlannerTotalTime] = useState("");
  const [plannerMemo, setPlannerMemo] = useState("");

  // Custom coloring grid notes matching the 24-hours timetable in the image
  // slots index representing hours from 6 AM to 5 AM (total 24 slots)
  const HOURS_LABELS = [
    "6", "7", "8", "9", "10", "11", "12", "1", "2", "3", "4", "5",
    "6", "7", "8", "9", "10", "11", "12", "1", "2", "3", "4", "5"
  ];
  const [timetableBlocks, setTimetableBlocks] = useState<Record<number, string>>({});

  // AI Generated plan states
  const [cheeringQuote, setCheeringQuote] = useState("");
  const [weeklyAdvice, setWeeklyAdvice] = useState("");
  const [bonusClaimed, setBonusClaimed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Today helper
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);

  // Saved planner dates history list
  const [historyDates, setHistoryDates] = useState<string[]>(() => {
    const saved = localStorage.getItem("metique_planner_saved_dates");
    return saved ? JSON.parse(saved) : [];
  });

  const saveDateToHistory = (dateStr: string) => {
    setHistoryDates((prev) => {
      if (prev.includes(dateStr)) return prev;
      const next = [...prev, dateStr].sort();
      localStorage.setItem("metique_planner_saved_dates", JSON.stringify(next));
      return next;
    });
  };

  // Dynamic state loading based on selected date
  useEffect(() => {
    const dateStr = selectedDate;
    setGoalsText(localStorage.getItem(`metique_plan_goals_input_${dateStr}`) || "");
    
    const savedMins = localStorage.getItem(`metique_plan_time_input_${dateStr}`);
    setAvailableMins(savedMins ? parseInt(savedMins, 10) : 120);

    const savedTasks = localStorage.getItem(`metique_active_planner_tasks_${dateStr}`);
    if (savedTasks) {
      setActiveTasks(JSON.parse(savedTasks));
    } else {
      setActiveTasks([
        { id: "task-1", timeSlot: "1교시 (50분)", action: "수학 고난도 교재 3단원 풀이 및 개념 복습", completed: false },
        { id: "task-2", timeSlot: "2교시 (50분)", action: "영어 수능 연계 어휘 80개 완벽 동의어 암기", completed: false },
        { id: "task-3", timeSlot: "3교시 (40분)", action: "국어 비문학 구조독해 지문 3개 분석", completed: false }
      ]);
    }

    setPlannerDDay(localStorage.getItem(`metique_self_dday_${dateStr}`) || "D-30 기말고사 대박");
    setPlannerComment(localStorage.getItem(`metique_self_comment_${dateStr}`) || "완벽한 몰입감으로 오늘도 후회 없이!");
    setPlannerTotalTime(localStorage.getItem(`metique_self_totaltime_${dateStr}`) || "300분");
    setPlannerMemo(localStorage.getItem(`metique_self_memo_${dateStr}`) || "• 수학 17번 오답 체크하기\n• 모르는 단어는 책상 아래 메모장에 기록");

    const savedBlocks = localStorage.getItem(`metique_self_timetable_blocks_${dateStr}`);
    setTimetableBlocks(savedBlocks ? JSON.parse(savedBlocks) : {});

    setCheeringQuote(localStorage.getItem(`metique_generated_cheer_${dateStr}`) || "계획적인 시간 설계가 최고의 자습 실력을 발휘합니다.");
    setWeeklyAdvice(localStorage.getItem(`metique_generated_advice_${dateStr}`) || "매일 90분씩 연속 뽀모도로 학습을 수행하는 주간 몰입 기법 추천");
    setBonusClaimed(localStorage.getItem(`metique_generated_bonus_claimed_${dateStr}`) === "true");
  }, [selectedDate]);

  // Loading Encouragement cyles
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const loadingMessages = [
    "AI 에듀 플래너가 오늘의 집중 목표를 심화 분석하고 있습니다... 🧠",
    "망각곡선을 지연시키고 성취감을 올릴 최적의 시간 배분표 작성 중... 📈",
    "학원 과외 의존을 끊을 주도적인 공부 비법 멘토링 매칭 중... 💡",
    "오늘 정진을 극대화시켜줄 맞춤형 시간표 완성 직전! ✊"
  ];

  const getAutoColoredBlocks = () => {
    const blocks: Record<number, string> = {};
    let blockIndex = 0;
    
    const subColors: Record<string, string> = {
      math: "bg-orange-400",
      english: "bg-blue-400",
      korean: "bg-emerald-400",
      social: "bg-violet-400",
      science: "bg-pink-400",
      general: "bg-slate-400"
    };
    
    Object.entries(subColors).forEach(([subId, colorClass]) => {
      const seconds = studyTimes ? (studyTimes[subId] || 0) : 0;
      const mins = Math.floor(seconds / 60);
      // 1 block per 10 minutes of study
      const numBlocks = Math.floor(mins / 10);
      for (let i = 0; i < numBlocks && blockIndex < 24; i++) {
        blocks[blockIndex] = colorClass;
        blockIndex++;
      }
    });
    
    return blocks;
  };

  // Sounds Synthesizer Failsafe
  const playBeep = (freq: number, type: "sine" | "triangle" | "square", duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  };

  // State update helpers with localStorage synchronization
  const updateActiveTasks = (newTasks: PlanItem[]) => {
    setActiveTasks(newTasks);
    localStorage.setItem(`metique_active_planner_tasks_${selectedDate}`, JSON.stringify(newTasks));
    saveDateToHistory(selectedDate);

    // Sync with today's standard tasks for live study room compatibility
    if (selectedDate === getTodayString()) {
      localStorage.setItem("metique_active_planner_tasks", JSON.stringify(newTasks));
    }
  };

  // Add state trackers for self planning actions
  const [newSelfTime, setNewSelfTime] = useState("");
  const [newSelfAction, setNewSelfAction] = useState("");

  const addSelfTask = () => {
    if (!newSelfAction.trim()) return;
    const timeValue = newSelfTime.trim() || `${activeTasks.length + 1}교시`;
    const newTask: PlanItem = {
      id: "task-" + Date.now(),
      timeSlot: timeValue,
      action: newSelfAction.trim(),
      completed: false
    };
    updateActiveTasks([...activeTasks, newTask]);
    setNewSelfTime("");
    setNewSelfAction("");
    playBeep(587.33, "sine", 0.1);
  };

  const deleteSelfTask = (id: string) => {
    updateActiveTasks(activeTasks.filter(item => item.id !== id));
    playBeep(290, "triangle", 0.08);
  };

  const handleSelfRegister = () => {
    localStorage.setItem("metique_active_planner_type", "self");
    playBeep(523.25, "sine", 0.06);
    setTimeout(() => playBeep(659.25, "sine", 0.06), 65);
    setTimeout(() => playBeep(783.99, "sine", 0.06), 130);
    setTimeout(() => playBeep(1046.50, "sine", 0.25), 195);
    alert("내가 직접 세운 플래너가 성공적으로 등록되었습니다! 📝\n\n공부방(화상 스터디 룸)에 접속하시면, 우측 '📅 플래너' 탭에서 이 목표를 바로 확인하고 체크아웃할 수 있습니다.");
  };

  const colorSelectionOptions = [
    { name: "수학 (오렌지)", color: "bg-orange-400" },
    { name: "영어 (블루)", color: "bg-blue-400" },
    { name: "국어 (민트)", color: "bg-emerald-400" },
    { name: "탐구 (바이올렛)", color: "bg-violet-400" },
    { name: "자습 (슬레이트)", color: "bg-slate-400" },
    { name: "휴식 (그레이)", color: "bg-gray-200" }
  ];
  const [selectedPaintColor, setSelectedPaintColor] = useState("bg-orange-400");

  const clickTimetableBlock = (index: number) => {
    const next = { ...timetableBlocks };
    if (next[index] === selectedPaintColor) {
      delete next[index]; // Erase on double-click/toggle
    } else {
      next[index] = selectedPaintColor;
    }
    setTimetableBlocks(next);
    localStorage.setItem(`metique_self_timetable_blocks_${selectedDate}`, JSON.stringify(next));
    saveDateToHistory(selectedDate);
    playBeep(880, "sine", 0.05);
  };

  const handleGenerate = async () => {
    if (!goalsText.trim()) {
      playBeep(200, "square", 0.15);
      alert("오늘 성취하고자 하는 과목 목표를 상세히 써주세요!");
      return;
    }

    setIsLoading(true);
    playBeep(523.25, "sine", 0.1);

    try {
      const nickName = localStorage.getItem("metique_username") || "열공생";
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalsText,
          availableMins,
          nickName
        })
      });

      const data = await response.json();
      if (data.success) {
        const generated: PlanItem[] = data.plan.map((item: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          timeSlot: item.timeSlot,
          action: item.action,
          tip: item.tip,
          completed: false
        }));
        
        setCheeringQuote(data.cheeringQuote);
        localStorage.setItem(`metique_generated_cheer_${selectedDate}`, data.cheeringQuote);
        setWeeklyAdvice(data.weeklyAdvice);
        localStorage.setItem(`metique_generated_advice_${selectedDate}`, data.weeklyAdvice);
        setBonusClaimed(false);
        localStorage.setItem(`metique_generated_bonus_claimed_${selectedDate}`, "false");
        
        localStorage.setItem("metique_active_planner_type", "ai");
        updateActiveTasks(generated);

        playBeep(659.25, "sine", 0.15);
        setTimeout(() => playBeep(783.99, "sine", 0.25), 100);
        alert("AI 맞춤형 에듀 플래너 시간표 수립 완료! 🤖✨\n\n공부방(화상 스터디 룸) 우측 '📅 플래너' 탭에서도 완벽히 연동됩니다!");
      } else {
        alert("계획을 생성하는 중 일시적인 서버 지연이 발생했습니다. 다시 시도해보세요!");
      }
    } catch (err) {
      console.warn("AI Planner API failure:", err);
      // Client-side fallback generator
      const items = goalsText.split(/[,.\n;]/).map(g => g.trim()).filter(Boolean);
      const generated: PlanItem[] = items.map((g, idx) => ({
        id: `ai-fall-${Date.now()}-${idx}`,
        timeSlot: `${idx + 1}교시`,
        action: `${g} 완벽 암기 및 오답 피드백`,
        tip: "에빙하우스의 뇌 자극 주기(뽀모도로 기법)를 사용하면 학업 성취감이 25% 증대됩니다.",
        completed: false
      }));
      
      const fallCheer = "스스로 한 걸음 나아가는 기획의 길은 위대한 내일의 밑바탕이 됩니다.";
      const fallAdvice = "꾸준히 기록하는 습관이 실력 향상의 지름길입니다.";
      setCheeringQuote(fallCheer);
      localStorage.setItem(`metique_generated_cheer_${selectedDate}`, fallCheer);
      setWeeklyAdvice(fallAdvice);
      localStorage.setItem(`metique_generated_advice_${selectedDate}`, fallAdvice);
      setBonusClaimed(false);
      localStorage.setItem(`metique_generated_bonus_claimed_${selectedDate}`, "false");
      
      localStorage.setItem("metique_active_planner_type", "ai");
      updateActiveTasks(generated);
      playBeep(659.25, "sine", 0.15);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompleted = (id: string) => {
    const updated = activeTasks.map(task => {
      if (task.id === id) {
        const targetStatus = !task.completed;
        if (targetStatus) {
          playBeep(587.33, "sine", 0.08); 
          setTimeout(() => playBeep(880, "sine", 0.15), 60); 
        } else {
          playBeep(330, "triangle", 0.1);
        }
        return { ...task, completed: targetStatus };
      }
      return task;
    });
    updateActiveTasks(updated);
  };

  const handleClaimBonus = () => {
    if (bonusClaimed) return;
    setBonusClaimed(true);
    localStorage.setItem(`metique_generated_bonus_claimed_${selectedDate}`, "true");
    saveDateToHistory(selectedDate);
    playBeep(523.25, "sine", 0.06);
    setTimeout(() => playBeep(659.25, "sine", 0.06), 60);
    setTimeout(() => playBeep(783.99, "sine", 0.06), 120);
    setTimeout(() => playBeep(1046.50, "sine", 0.3), 180);
    alert("오늘의 AI 플래너 배지를 수확했습니다! 🎉");
  };

  const activePercent = activeTasks.length > 0 
    ? Math.round((activeTasks.filter(p => p.completed).length / activeTasks.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 text-gray-800">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span>자기주도 학습 플래너</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                PRO 2.0
              </span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              직접 사진 속 디자인에 일정을 작성하거나, 가용 시간을 기반으로 한 AI 지능형 코칭 리포트를 수공해보세요.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plannerMode !== "select" && (
            <button
              onClick={() => setPlannerMode("select")}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-black transition-all border border-slate-200 active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> 모드 선택으로
            </button>
          )}
          <button
            onClick={onBack}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-4.5 py-2 rounded-xl text-xs font-black transition-all border border-slate-200/50 active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" /> 광장으로 나가기
          </button>
        </div>
      </div>

      {/* Global Date Context / Navigation Selector */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm relative z-30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" /> 학습일자 필터:
          </span>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
            <button
              onClick={() => {
                const cur = new Date(selectedDate);
                cur.setDate(cur.getDate() - 1);
                const year = cur.getFullYear();
                const month = String(cur.getMonth() + 1).padStart(2, '0');
                const day = String(cur.getDate()).padStart(2, '0');
                setSelectedDate(`${year}-${month}-${day}`);
              }}
              className="px-2.5 py-1 text-xs font-bold hover:bg-white rounded-lg transition-all active:scale-95 cursor-pointer text-slate-700"
            >
              ◀ 어제
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-black px-2 py-0.5 border-none outline-none text-slate-800"
            />
            <button
              onClick={() => {
                const cur = new Date(selectedDate);
                cur.setDate(cur.getDate() + 1);
                const year = cur.getFullYear();
                const month = String(cur.getMonth() + 1).padStart(2, '0');
                const day = String(cur.getDate()).padStart(2, '0');
                setSelectedDate(`${year}-${month}-${day}`);
              }}
              className="px-2.5 py-1 text-xs font-bold hover:bg-white rounded-lg transition-all active:scale-95 cursor-pointer text-slate-700"
            >
              내일 ▶
            </button>
          </div>
          
          {selectedDate === getTodayString() ? (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200/50 font-extrabold px-2.5 py-1.5 rounded-xl">
              오늘의 플래너 작성 중 ✍️
            </span>
          ) : (
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 font-extrabold px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              오늘 플래너로 이동
            </button>
          )}
        </div>

        {/* Saved planner history shortcut list */}
        {historyDates.length > 0 && (
          <div className="flex items-center gap-1.5 flex-1 md:justify-end overflow-hidden">
            <span className="text-[10.5px] font-extrabold text-slate-400 shrink-0">기록 보관함:</span>
            <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-full md:max-w-[180px] lg:max-w-[320px]">
              {historyDates.map((dStr) => {
                const isSelected = selectedDate === dStr;
                return (
                  <button
                    key={dStr}
                    onClick={() => setSelectedDate(dStr)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all shrink-0 active:scale-95 cursor-pointer
                      ${isSelected
                        ? "bg-indigo-600 font-black text-white shadow-sm"
                        : "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600"}`}
                  >
                    {dStr.substring(5)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Switch Area */}
      <AnimatePresence mode="wait">
        {plannerMode === "select" && (
          <motion.div
            key="select-mode"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full py-6"
          >
            {/* Option 1: Self Planning Note */}
            <div 
              onClick={() => { setPlannerMode("self"); playBeep(523, "sine", 0.1); }}
              className="group cursor-pointer bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[320px]"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    내가 플래너 짜기
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">노트북 양식</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2.5 font-medium">
                    첨부해주신 모트모트 식 스프링 노트를 그대로 재현했습니다! D-Day, 오늘의 코멘트, 목표 시간 및 총 24시간 공부 타임 테이블에 직접 볼펜을 그리듯 작성하세요.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-indigo-600 mt-6 bg-slate-50 rounded-xl p-3 border border-slate-100/80 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                <span>직접 볼펜으로 그리러 가기</span> <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Option 2: AI Automated planner */}
            <div 
              onClick={() => { setPlannerMode("ai"); playBeep(587.33, "sine", 0.1); }}
              className="group cursor-pointer bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[320px]"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    AI 플래너 이용하기
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">지능형 자동 처방</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2.5 font-medium">
                    오늘 기말 공부를 하기를 원하는 시간과 구체적인 과목명 목표들을 적으면 주도적인 시간표를 추천하고, 전교 1등들이 사용하는 강력한 공부법 비법 팁까지 함께 처방해 수립해 드립니다.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-indigo-600 mt-6 bg-slate-50 rounded-xl p-3 border border-slate-100/80 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                <span>AI 플래너 소환하기</span> <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        )}

        {/* SELF-PLANNER PHYSICAL NOTEBOOK RECREATION */}
         {plannerMode === "self" && (
          <motion.div
            key="self-planner"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6"
          >
            {/* Header Hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-lg">📖</span>
              <p className="text-[11.5px] font-bold text-amber-950">
                실제 모트모트 노트를 완벽히 본뜬 디지털 스프링 노트 시스템입니다! 왼쪽 페이지에 공부할 목표를 적고 완료 시 체크박스로 지워보세요. 오른쪽에는 24시간 볼펜 색챌을 채워 완수하세요!
              </p>
            </div>

            {/* Simulated Spiral Ring Notebook layout container */}
            <div className="relative bg-[#eeeade] p-4 sm:p-6 rounded-[32px] border-4 border-slate-700 shadow-2xl flex flex-col lg:flex-row gap-0 overflow-hidden">
              
              {/* Left Page (Soft grid pattern) */}
              <div className="flex-1 bg-[#fbfbf6] p-5 sm:p-6 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none border-b lg:border-b-0 lg:border-r border-dotted border-gray-300 relative shadow-inner min-h-[500px]">
                {/* Thin pale blue grid line visual background */}
                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: "radial-gradient(#3b82f6 0.8px, transparent 0.8px)", backgroundColor: "#fbfbf6", backgroundSize: "16px 16px" }} />
                
                <div className="relative z-10 flex flex-col gap-4">
                  {/* Top physical notes metadata row */}
                  <div className="grid grid-cols-3 gap-3 border-b-2 border-slate-300 pb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-black text-gray-500 tracking-wider">YEAR / MONTH / DAY</span>
                      <input 
                        type="text" 
                        value={new Date(selectedDate).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
                        disabled
                        className="bg-transparent border-b border-gray-300 font-mono text-[11px] font-bold text-slate-800 outline-none pb-0.5 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-black text-gray-500 tracking-wider">D - DAY</span>
                      <input 
                        type="text" 
                        value={plannerDDay}
                        onChange={(e) => {
                          setPlannerDDay(e.target.value);
                          localStorage.setItem(`metique_self_dday_${selectedDate}`, e.target.value);
                          saveDateToHistory(selectedDate);
                        }}
                        placeholder="D-Day 기말준비"
                        className="bg-transparent border-b border-gray-400 font-extrabold text-[11px] text-red-600 outline-none pb-0.5 focus:border-red-500 placeholder:text-gray-300"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-black text-gray-500 tracking-wider">TOTAL TIME</span>
                      <input 
                        type="text" 
                        value={plannerTotalTime}
                        onChange={(e) => {
                          setPlannerTotalTime(e.target.value);
                          localStorage.setItem(`metique_self_totaltime_${selectedDate}`, e.target.value);
                          saveDateToHistory(selectedDate);
                        }}
                        placeholder="목표 분수"
                        className="bg-transparent border-b border-gray-400 font-mono text-[11px] font-black text-indigo-700 outline-none pb-0.5 focus:border-indigo-500 placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  {/* Comment Note Row */}
                  <div className="flex flex-col gap-1 border-b border-slate-200 pb-2.5">
                    <span className="text-[9px] font-mono font-black text-gray-500 tracking-wider">TODAY'S COMMENT / MENTAL FOCUS</span>
                    <input 
                      type="text" 
                      value={plannerComment}
                      onChange={(e) => {
                        setPlannerComment(e.target.value);
                        localStorage.setItem(`metique_self_comment_${selectedDate}`, e.target.value);
                        saveDateToHistory(selectedDate);
                      }}
                      placeholder="오늘 집중을 이끌어 줄 한줄 각오를 볼펜으로 적으세요."
                      className="bg-transparent font-sans text-xs font-bold text-slate-700 outline-none focus:text-indigo-600"
                    />
                  </div>

                  {/* Tasks List area */}
                  <div className="flex flex-col gap-3 py-1">
                    <span className="text-[10px] font-bold text-slate-800 bg-slate-200/50 px-2.5 py-1 rounded-md max-w-max flex items-center gap-1">
                      📋 TASKS (내가 할 공부 목록 작성)
                    </span>

                    {/* Task adding row */}
                    <div className="flex gap-1.5 items-center bg-white border border-gray-200 p-2 rounded-xl">
                      <input 
                        type="text" 
                        placeholder="시각/교시 (예: 1교시 또는 09:00)" 
                        value={newSelfTime}
                        onChange={e => setNewSelfTime(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10.5px] font-bold text-gray-800 outline-none w-28 focus:border-indigo-500"
                      />
                      <input 
                        type="text" 
                        placeholder="정확한 공부 내용 기입 (예: 수학 개념 요약 오답노트 정리)" 
                        value={newSelfAction}
                        onChange={e => setNewSelfAction(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10.5px] font-bold text-gray-800 outline-none flex-1 focus:border-indigo-500"
                      />
                      <button 
                        onClick={addSelfTask}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> 추가
                      </button>
                    </div>

                    {/* Chronological checklist */}
                    <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {activeTasks.length === 0 ? (
                        <p className="text-[10.5px] text-gray-400 text-center py-6">등록된 학습 목표가 없습니다. 위의 폼에 적어 목표를 추가하세요!</p>
                      ) : (
                        activeTasks.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-2 group p-1 hover:bg-slate-50 rounded-lg transition-colors">
                            <button
                              onClick={() => toggleTaskCompleted(item.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-black transition-all shrink-0 cursor-pointer
                                ${item.completed ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-400 text-transparent bg-white hover:border-gray-600"}`}
                            >
                              ✓
                            </button>
                            
                            <span className="text-[10.5px] font-mono font-black text-indigo-600 tracking-tight w-24 truncate">{item.timeSlot}</span>
                            
                            <p className={`text-[11px] font-bold text-left flex-1 line-clamp-1 ${item.completed ? "line-through text-slate-400 font-medium" : "text-gray-800"}`}>
                              {item.action}
                            </p>
                            
                            <button
                              onClick={() => deleteSelfTask(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* MEMO notebook section at bottom */}
                  <div className="flex flex-col gap-1 border-t border-dashed border-gray-300 pt-3 mt-2">
                    <span className="text-[9px] font-mono font-black text-gray-500 tracking-wide uppercase">MEMO / FREE SKETCH NOTE</span>
                    <textarea 
                      value={plannerMemo}
                      onChange={(e) => {
                        setPlannerMemo(e.target.value);
                        localStorage.setItem(`metique_self_memo_${selectedDate}`, e.target.value);
                        saveDateToHistory(selectedDate);
                      }}
                      placeholder="자유롭게 오늘 기억해야 할 핵심 암기 공식이나 영어 단어, 약속 등을 메모하세요."
                      rows={3}
                      className="w-full bg-transparent text-[11px] font-bold text-slate-600 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl p-2 outline-none resize-none transition-all placeholder:text-gray-300 font-sans leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* CENTER: Simulated Spiral Metal Binder Ring Effect (Absolutely incredible touch!) */}
              <div className="z-20 w-8 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 flex-col items-center justify-around py-6 gap-3 select-none flex shadow-md border-x border-slate-400">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center w-full gap-0.5">
                    {/* Ring Binder Loop */}
                    <div className="w-6 h-2 bg-gradient-to-b from-gray-500 via-gray-300 to-gray-600 rounded-full border border-slate-400 relative">
                      <div className="absolute top-0.5 right-0.5 left-0.5 h-0.5 bg-white/40 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Page (Chronological coloring grid / Timetable) */}
              <div className="flex-1 bg-[#fffdf9] p-5 sm:p-6 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none relative shadow-inner min-h-[500px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b-2 border-slate-300 pb-2 mb-4">
                    <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                      ⏱️ STUDY TIME LOG (공부방 자동 기록 연동)
                    </span>
                    <span className="text-[9px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full">실시간 연동중</span>
                  </div>

                  {/* Subject-wise study logs list with progress bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5">
                    {[
                      { id: "math", name: "수학", emoji: "📐", color: "bg-orange-400", border: "border-orange-200" },
                      { id: "english", name: "영어", emoji: "🗣️", color: "bg-blue-400", border: "border-blue-200" },
                      { id: "korean", name: "국어", emoji: "📖", color: "bg-emerald-400", border: "border-emerald-200" },
                      { id: "social", name: "사회", emoji: "🗺️", color: "bg-violet-400", border: "border-violet-200" },
                      { id: "science", name: "과학", emoji: "🔬", color: "bg-pink-400", border: "border-pink-200" },
                      { id: "general", name: "자습", emoji: "🚀", color: "bg-slate-400", border: "border-slate-200" },
                    ].map((sub) => {
                      const seconds = studyTimes ? (studyTimes[sub.id] || 0) : 0;
                      const hrs = Math.floor(seconds / 3600);
                      const mins = Math.floor((seconds % 3600) / 60);
                      const secs = seconds % 60;
                      const timeStr = hrs > 0 ? `${hrs}시간 ${mins}분 ${secs}초` : `${mins}분 ${secs}초`;
                      
                      const percent = Math.min((seconds / 3600) * 100, 100);

                      return (
                        <div key={sub.id} className="bg-slate-5/40 border border-slate-200/60 p-2.5 rounded-xl flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-gray-800 flex items-center gap-1">
                              <span>{sub.emoji}</span>
                              <span>{sub.name}</span>
                            </span>
                            <span className="text-indigo-700 font-mono font-black">{timeStr}</span>
                          </div>
                          
                          <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${sub.color} rounded-full transition-all duration-500`}
                              style={{ width: `${percent || 2}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 24 Hours auto-colored timeline grid */}
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <span className="text-[10px] font-black text-slate-700 block mb-2">
                      🎨 24H AUTO TIMELINE (공부량 비례 자동 색칠)
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-center text-xs text-gray-600">
                      {HOURS_LABELS.map((hr, index) => {
                        const hourNum = index < 12 ? index + 6 : (index - 12 === 0 ? 12 : index - 12);
                        const ampm = index < 6 ? "오전" : (index < 18 ? "오후" : "새벽");
                        
                        // Calculate auto-colored blocks based on actual recorded times!
                        const autoBlocks = getAutoColoredBlocks();
                        const filledColor = autoBlocks[index] || "bg-slate-100/60 hover:bg-slate-200/40";

                        return (
                          <div 
                            key={index}
                            className={`border border-slate-200 rounded-lg p-1.5 flex flex-col justify-center items-center h-[42px] select-none transition-all duration-300
                              ${filledColor}`}
                            title={`${ampm} ${hr}시 타임 자동색칠`}
                          >
                            <span className="text-[7.5px] text-slate-400 font-bold leading-none">{ampm}</span>
                            <span className="font-mono font-black text-[10px] text-slate-700 mt-0.5">{hr}시</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-2.5 leading-relaxed font-bold">
                      💡 공부방에서 10분 공부할 때마다 1칸씩 공부한 과목의 시그니처 색상으로 자동 색칠이 누적 연동됩니다.
                    </p>
                  </div>
                </div>

                {/* Confirm deployment action row */}
                <div className="border-t border-slate-200 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <h5 className="font-extrabold text-xs text-indigo-700">✍️ 내 플래너 공부방 동기화</h5>
                    <p className="text-[10px] text-gray-500 leading-snug">
                      등록 시 스터디 공부방에서도 바로 할 일들이 완벽하게 동기화됩니다.
                    </p>
                  </div>
                  <button
                    onClick={handleSelfRegister}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-6 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>공부방으로 이 플래너 보내기</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* AI PLANNED AUTOMATION PANEL */}
        {plannerMode === "ai" && (
          <motion.div
            key="ai-planner"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left AI Configuration Form */}
            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/10 border border-indigo-100/80 rounded-3xl p-5 shadow-sm flex flex-col gap-5">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <span className="text-indigo-600 animate-bounce">🤖</span> AI 공부 시간 & 과목 목표 설정
              </h3>

              {/* Text Input area */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  오늘 집중 정진할 과목과 세부 행동 (예: 미적분 20문제 풀이, 수능 영어 단어 암기)
                </span>
                <textarea
                  value={goalsText}
                  onChange={(e) => {
                    setGoalsText(e.target.value);
                    localStorage.setItem(`metique_plan_goals_input_${selectedDate}`, e.target.value);
                    saveDateToHistory(selectedDate);
                  }}
                  placeholder="과목과 성취하고자 하는 구체적인 목표를 자유롭게 써내려가세요. (예: 오늘 영어 수능 영단어 6회 복습하고 수학 기출 미적분 20문제 자율 풀이 예정)"
                  rows={5}
                  className="w-full text-xs font-medium text-slate-800 bg-white/90 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl p-3.5 outline-none resize-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Study Minutes Slider Input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] text-gray-500 font-bold">
                  <span>오늘 정진 예정 가용 시간</span>
                  <span className="text-indigo-600 font-mono font-black text-xs">{availableMins}분 ({Math.floor(availableMins / 60)}시간 {availableMins % 60}분)</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-extrabold">30분</span>
                  <input
                    type="range"
                    min={30}
                    max={480}
                    step={30}
                    value={availableMins}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAvailableMins(val);
                      localStorage.setItem(`metique_plan_time_input_${selectedDate}`, String(val));
                      saveDateToHistory(selectedDate);
                    }}
                    className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <span className="text-[10px] text-slate-400 font-extrabold">8시간</span>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {[60, 120, 180, 240, 360].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setAvailableMins(t);
                        localStorage.setItem(`metique_plan_time_input_${selectedDate}`, String(t));
                        saveDateToHistory(selectedDate);
                      }}
                      className={`px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-gray-600 tracking-tight transition-all active:scale-95 cursor-pointer
                        ${availableMins === t ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300" : ""}`}
                    >
                      {t >= 60 ? `${Math.floor(t / 60)}h` : `${t}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action trigger button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-md shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-center cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI가 최적 시간 조립 처방 수립 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-bounce text-yellow-300 fill-yellow-300" />
                    <span>맞춤형 AI 정진 플래너 생성하기</span>
                  </>
                )}
              </button>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex items-start gap-2.5">
                <div className="text-amber-500 font-bold mt-0.5 text-md">💡</div>
                <p className="text-[10.5px] leading-relaxed text-amber-900 font-semibold">
                  AI 플래너를 사용하면, 과목별 중요도 난도 비율과 최적의 뽀모도로 추천 공부법 기법을 직결 배정해 드립니다. 생성 즉시 공부방에 탑재됩니다.
                </p>
              </div>
            </div>

            {/* Right Output View Card */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  /* Loading screen */
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-slate-50 border border-slate-200/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[350px]"
                  >
                    <div className="relative flex justify-center items-center w-16 h-16 bg-white rounded-full shadow-lg border border-indigo-100">
                      <div className="absolute inset-0 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2 max-w-sm">
                      <h4 className="font-extrabold text-sm text-gray-900">AI 정진설계 비서 세팅 중</h4>
                      <p className="text-xs text-gray-500 font-bold animate-pulse text-indigo-700">
                        {loadingMessages[loadingStep]}
                      </p>
                    </div>
                  </motion.div>
                ) : activeTasks.length > 0 ? (
                  /* Daily lesson plan dashboard */
                  <motion.div
                    key="planner-dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-5"
                  >
                    {/* Stats Header Panel */}
                    <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-col gap-1 text-center sm:text-left">
                        <span className="text-[10px] text-indigo-300 font-black tracking-wider uppercase">AI Personalized Study Timetable</span>
                        <h4 className="text-base font-black">오늘 성취 보너스 획득 진행 현황</h4>
                        
                        {/* Tiny stats progress bar */}
                        <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                          <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                            <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${activePercent}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-black text-indigo-200">{activePercent}% 달성</span>
                        </div>
                      </div>

                      {/* Points Bonus claim area */}
                      <div className="flex flex-col items-center sm:items-end gap-1 shrink-0">
                        {!bonusClaimed ? (
                          <button
                            onClick={handleClaimBonus}
                            className="bg-gradient-to-tr from-yellow-500 to-amber-400 hover:from-yellow-600 hover:to-amber-500 text-slate-950 font-black text-xs py-2 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                            <span>기획 배지 수확</span>
                          </button>
                        ) : (
                          <div className="bg-slate-800 border border-slate-700 text-gray-400 font-black text-xs py-2 px-4 rounded-xl flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>기획 꿀꺽 완료!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Main chronological timeline */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                          <span>📆</span> AI가 정밀 배정한 공부 극치 리스트
                        </h4>
                        <span className="text-[9px] text-slate-400 font-extrabold">체크하면 실시간 완료 처리됩니다.</span>
                      </div>

                      <div className="flex flex-col gap-4 pl-1">
                        {activeTasks.map((item, idx) => (
                          <div key={item.id} className="flex gap-4 items-start group">
                            
                            {/* Timeline Side Marker */}
                            <div className="flex flex-col items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleTaskCompleted(item.id)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[10px] border tracking-tighter transition-all active:scale-90 shadow-sm cursor-pointer
                                  ${item.completed 
                                    ? "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600" 
                                    : "bg-white border-slate-300 text-slate-500 hover:border-slate-500 hover:bg-slate-50"}`}
                              >
                                {item.completed ? "✓" : idx + 1}
                              </button>
                              
                              {idx < activeTasks.length - 1 && (
                                <div className="w-0.5 bg-slate-100 flex-1 min-h-[50px] group-hover:bg-slate-200 transition-colors" />
                              )}
                            </div>

                            {/* Content text card */}
                            <div 
                              onClick={() => toggleTaskCompleted(item.id)}
                              className={`flex-1 p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-left
                                ${item.completed 
                                  ? "bg-slate-50 border-slate-200/70" 
                                  : "bg-[#fcfdfe] hover:bg-[#f6f9fe] border-slate-100 hover:border-indigo-100"}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-mono font-black ${item.completed ? "text-slate-400" : "text-indigo-600"}`}>
                                  {item.timeSlot}
                                </span>
                                {item.completed && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                                    정진완료 🔥
                                  </span>
                                )}
                              </div>
                              <h5 className={`font-extrabold text-xs mt-1 leading-snug ${item.completed ? "line-through text-slate-400" : "text-gray-900"}`}>
                                {item.action}
                              </h5>
                              {item.tip && (
                                <p className="text-[10px] leading-relaxed text-gray-500 mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2 font-medium">
                                  <span className="text-indigo-600 font-bold">공부법 팁: </span>{item.tip}
                                </p>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Cheer speech */}
                    {cheeringQuote && (
                      <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                        <div className="absolute -left-8 -top-8 w-24 h-24 bg-violet-500/15 rounded-full blur-2xl" />

                        <div className="relative flex flex-col gap-2 text-left">
                          <span className="text-[9px] text-[#818cf8] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 animate-spin-slow" /> Warm AI Encouragement Speech
                          </span>
                          <p className="text-xs font-bold leading-relaxed text-slate-100 italic pr-4">
                            &ldquo; {cheeringQuote} &rdquo;
                          </p>
                          
                          {weeklyAdvice && (
                            <div className="border-t border-slate-800/80 pt-3 mt-2 flex flex-col gap-1">
                              <span className="text-[10px] text-amber-300 font-bold">💡 자율 장기 습관 빌더 가이드</span>
                              <p className="text-[11px] leading-relaxed text-slate-300 font-semibold">{weeklyAdvice}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </motion.div>
                ) : (
                  /* Empty state */
                  <motion.div
                    key="empty-setup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white border border-dashed border-gray-300 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[350px] shadow-inner"
                  >
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100">
                      <CalendarRange className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col gap-1 max-w-sm">
                      <h4 className="font-extrabold text-sm text-gray-900">작성된 AI 일일 공부 계획이 없습니다.</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        좌측 패널에서 도달할 학습 과목 목표를 기입한 뒤 포인트를 획득하고 스마트 공부 시간표를 생성해 보세요!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
