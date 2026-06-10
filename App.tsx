/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, Volume2, Calendar, Link as LinkIcon, Compass, Star, BookOpen, Target, LogIn, CheckSquare, Plus, Clock, ShieldAlert, Sparkles, User, Zap, LayoutDashboard, X } from "lucide-react";

// Sub Modules
import LibraryMap from "./components/LibraryMap";
import DeskStudyRoom from "./components/DeskStudyRoom";
import AttendanceCheck from "./components/AttendanceCheck";
import QuestsList from "./components/QuestsList";
import StudyMethods from "./components/StudyMethods";
import PlayBattle from "./components/PlayBattle";
import KnowledgeBounty from "./components/KnowledgeBounty";
import LoginScreen from "./components/LoginScreen";
import AiPlanner from "./components/AiPlanner";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("metique_logged_in") === "true";
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("metique_username") || "";
  });

  // Global User State
  const [currentPoints, setCurrentPoints] = useState<number>(() => {
    const saved = localStorage.getItem("metique_study_points");
    return saved ? parseInt(saved, 10) : 120;
  });
  const [accumulateTimeSec, setAccumulateTimeSec] = useState<number>(() => {
    const saved = localStorage.getItem("metique_accum_time_sec");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Subject-specific study durations in seconds
  const [studyTimes, setStudyTimes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("metique_subject_study_times");
    return saved ? JSON.parse(saved) : {
      math: 0,
      english: 0,
      korean: 0,
      social: 0,
      science: 0,
      general: 0
    };
  });

  useEffect(() => {
    localStorage.setItem("metique_subject_study_times", JSON.stringify(studyTimes));
  }, [studyTimes]);
  
  // Navigation active tab
  // "map" (default metaverse) | "attendance" | "quests" | "methods" | "battle" | "planner"
  const [activeTab, setActiveTab] = useState<"map" | "attendance" | "quests" | "methods" | "battle" | "bounty" | "planner">("map");
  const [showNavMenu, setShowNavMenu] = useState(false);

  // Sit Down / Desk study room states
  const [seatedRoomId, setSeatedRoomId] = useState<string | null>(null);
  const [isSecretRoom, setIsSecretRoom] = useState<boolean>(false);

  // New productive student elements (To-Do & Goals)
  const [targetStudyMinutes, setTargetStudyMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("metique_target_minutes");
    return saved ? parseInt(saved, 10) : 30; // 30 minutes target by default
  });

  const [bonusClaimed, setBonusClaimed] = useState<boolean>(() => {
    return localStorage.getItem("metique_bonus_claimed") === "true";
  });

  // Daily reset checker at exactly 00:00 midnight (or date change) - keeping it ultra robust!
  useEffect(() => {
    const checkMidnightAndReset = () => {
      const now = new Date();
      const lastResetDate = localStorage.getItem("metique_last_reset_date");
      const todayString = now.toLocaleDateString("ko-KR");

      if (lastResetDate && lastResetDate !== todayString) {
        // Carry out 100% clean reset for the new day
        setAccumulateTimeSec(0);
        setBonusClaimed(false);
        setStudyTimes({
          math: 0,
          english: 0,
          korean: 0,
          social: 0,
          science: 0,
          general: 0
        });
        
        localStorage.setItem("metique_accum_time_sec", "0");
        localStorage.setItem("metique_subject_study_times", JSON.stringify({
          math: 0,
          english: 0,
          korean: 0,
          social: 0,
          science: 0,
          general: 0
        }));
        localStorage.removeItem("metique_bonus_claimed");
        
        // Check if attendance needs to be reset due to skipped day
        const lastAttendanceDate = localStorage.getItem("metique_last_attendance_date");
        if (lastAttendanceDate) {
          const parts = lastAttendanceDate.split('.').map(s => parseInt(s.trim()));
          if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            const lastDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const lastDateStr = lastDateObj.toLocaleDateString("ko-KR");
            const yesterdayStr = yesterday.toLocaleDateString("ko-KR");
            
            if (lastDateStr !== yesterdayStr && lastDateStr !== todayString) {
              // Missed a day! Reset streak!
              localStorage.setItem("metique_attendance_streak", "0");
              localStorage.setItem("metique_attendance_stamps", JSON.stringify(Array(30).fill(false)));
            }
          }
        }


        localStorage.setItem("metique_last_reset_date", todayString);
        alert("🌅 00:00 가 되어 새로운 공부 하루가 밝았습니다! 공부 과제 및 누적 타이머가 리셋되었습니다.");
      } else if (!lastResetDate) {
        localStorage.setItem("metique_last_reset_date", todayString);
      }
    };

    checkMidnightAndReset();
    const intervalId = setInterval(checkMidnightAndReset, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // State sync on update
  useEffect(() => {
    localStorage.setItem("metique_study_points", String(currentPoints));
  }, [currentPoints]);

  useEffect(() => {
    localStorage.setItem("metique_accum_time_sec", String(accumulateTimeSec));
    
    // Check target milestone study time (accumulateTimeSec / 60 >= targetStudyMinutes)
    const currentMins = accumulateTimeSec / 60;
    if (currentMins >= targetStudyMinutes && !bonusClaimed && targetStudyMinutes > 0) {
      setBonusClaimed(true);
      localStorage.setItem("metique_bonus_claimed", "true");
      setCurrentPoints((prev) => prev + 50);
      
      // Synthesize achievement chime directly in the browser!
      triggerMilestoneSound();
      alert(`🎯 축하합니다! 오늘의 공부 목표 ${targetStudyMinutes}분을 달성하셨습니다! +50 pts 보너스가 지급되었습니다.`);
    }
  }, [accumulateTimeSec, targetStudyMinutes, bonusClaimed]);

  useEffect(() => {
    localStorage.setItem("metique_target_minutes", String(targetStudyMinutes));
    // Reset bonus claim state only if time is below target
    if (accumulateTimeSec / 60 < targetStudyMinutes) {
      setBonusClaimed(false);
      localStorage.removeItem("metique_bonus_claimed");
    }
  }, [targetStudyMinutes]);

  // Client Web Audio synthesis of success chime
  const triggerMilestoneSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Sound scale "C5 - E5 - G5"
      playTone(523.25, 0.0, 0.35); // C5
      playTone(659.25, 0.15, 0.35); // E5
      playTone(783.99, 0.3, 0.5); // G5
    } catch (_) {}
  };

  // Score points handling
  const addPoints = (points: number) => {
    setCurrentPoints((prev) => prev + points);
  };

  const deductPoints = (points: number) => {
    setCurrentPoints((prev) => Math.max(prev - points, 0));
  };

  // When player decides to seat down in the main field grid
  const handleSitDown = (roomId: string, isSecret: boolean) => {
    setSeatedRoomId(roomId);
    setIsSecretRoom(isSecret);
  };

  // Exit study desk room and stand up in the map
  const handleStandUpAndExit = () => {
    if (isSecretRoom && seatedRoomId) {
      localStorage.removeItem(`metique_secret_code_${seatedRoomId}`);
    }
    setSeatedRoomId(null);
    setIsSecretRoom(false);
    setActiveTab("map"); // Return to map tab
  };

  const handleLogin = (name: string) => {
    localStorage.setItem("metique_logged_in", "true");
    localStorage.setItem("metique_username", name);
    setUserName(name);
    setIsLoggedIn(true);
  };

  // Navigation auto exit desk room if tab is switched manually to avoid state confusion
  const handleTabSwitch = (tab: typeof activeTab) => {
    if (seatedRoomId) {
      const confirmStandUp = window.confirm("공부 책상에서 일어나 다른 탭으로 이동하시겠습니까? (공부 시간이 리셋되지 않고 유지됩니다)");
      if (!confirmStandUp) return;
      if (isSecretRoom && seatedRoomId) {
        localStorage.removeItem(`metique_secret_code_${seatedRoomId}`);
      }
      setSeatedRoomId(null);
      setIsSecretRoom(false);
    }
    setActiveTab(tab);
  };

  // Math helper
  const totalMins = Math.floor(accumulateTimeSec / 60);
  const totalSecs = accumulateTimeSec % 60;
  const targetPercent = Math.min(Math.round((totalMins / targetStudyMinutes) * 100), 100);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900 font-sans text-gray-950 select-none relative">
      
      {/* Metaverse library map (Kept mounted for heartbeat & position persistence!) */}
      {/* Background layer */}
      <div className={`absolute inset-0 z-0 ${activeTab === "map" && seatedRoomId === null ? "block" : "hidden"}`}>
        <LibraryMap
          currentPoints={currentPoints}
          addPoints={addPoints}
          onSitDown={handleSitDown}
          seatId={seatedRoomId}
          accumulateTimeSec={accumulateTimeSec}
        />
      </div>

      {/* Focused Study Room Mode - Full screen takeover */}
      {seatedRoomId !== null && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-[#faf8f5]">
          <AnimatePresence mode="wait">
            <motion.div
              key="seated-room"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.23 }}
              className="w-full min-h-screen"
            >
              <DeskStudyRoom
                roomId={seatedRoomId}
                isSecret={isSecretRoom}
                onExit={handleStandUpAndExit}
                addPoints={addPoints}
                deductPoints={deductPoints}
                accumulateTimeSec={accumulateTimeSec}
                setAccumulateTimeSec={setAccumulateTimeSec}
                currentPoints={currentPoints}
                studyTimes={studyTimes}
                setStudyTimes={setStudyTimes}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* UI Overlays Layer (Header, Navigation, Sub-tabs, Dashboard) */}
      <div className={`absolute inset-0 z-20 pointer-events-none flex flex-col ${seatedRoomId !== null ? "hidden" : ""}`}>
        
        {/* Floating Top Nav Menu Toggle Button */}
        <div className="pointer-events-auto absolute top-4 left-4 z-50 flex flex-col items-start gap-2">
          <button
            onClick={() => setShowNavMenu(!showNavMenu)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-full flex justify-center items-center shadow-[0_5px_15px_-3px_rgba(79,70,229,0.5)] transition-transform hover:scale-110 active:scale-95 border-2 border-indigo-300 cursor-pointer"
            title="메뉴"
          >
            {showNavMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>

          <AnimatePresence>
            {showNavMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2 bg-white/90 backdrop-blur-md border border-gray-200/60 p-3 rounded-2xl shadow-xl w-48 pointer-events-auto"
              >
                <button
                  onClick={() => { handleTabSwitch("map"); setShowNavMenu(false); }}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer
                    ${activeTab === "map" && !seatedRoomId
                      ? "bg-slate-900 text-white shadow" 
                      : "text-gray-500 hover:bg-gray-50 bg-white"}`}
                >
                  <Compass className="w-4 h-4" /> 도서관 광장
                </button>

                <button
                  onClick={() => { handleTabSwitch("attendance"); setShowNavMenu(false); }}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer
                    ${activeTab === "attendance" 
                      ? "bg-slate-900 text-white shadow" 
                      : "text-gray-500 hover:bg-gray-50 bg-white"}`}
                >
                  <Calendar className="w-4 h-4" /> 출석 체크
                </button>

                <button
                  onClick={() => { handleTabSwitch("quests"); setShowNavMenu(false); }}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer
                    ${activeTab === "quests" 
                      ? "bg-slate-900 text-white shadow" 
                      : "text-gray-500 hover:bg-gray-50 bg-white"}`}
                >
                  <Target className="w-4 h-4" /> 일일 미션
                </button>

                <button
                  onClick={() => { handleTabSwitch("methods"); setShowNavMenu(false); }}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer
                    ${activeTab === "methods" 
                      ? "bg-slate-900 text-white shadow" 
                      : "text-gray-500 hover:bg-gray-50 bg-white"}`}
                >
                  <BookOpen className="w-4 h-4" /> 추천 공부법
                </button>
                
                <button
                  onClick={() => { handleTabSwitch("bounty" as any); setShowNavMenu(false); }}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer
                    ${activeTab === "bounty" 
                      ? "bg-stone-900 text-white shadow" 
                      : "text-gray-500 hover:bg-gray-50 bg-white"}`}
                >
                  <span className="w-4 h-4 text-center">🔥</span> 지식 현상금
                </button>

                <button
                  onClick={() => { handleTabSwitch("planner"); setShowNavMenu(false); }}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer
                    ${activeTab === "planner" 
                      ? "bg-indigo-600 text-white shadow ring-2 ring-indigo-500" 
                      : "text-indigo-600 hover:bg-indigo-50 bg-indigo-50 border border-indigo-200 animate-pulse"}`}
                >
                  <Sparkles className="w-4 h-4" /> AI 플래너
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Top Right Stats Block */}
        <div className="pointer-events-auto absolute top-4 right-4 z-50 flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-2 text-xs bg-slate-100/90 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono font-black text-emerald-700">
              {totalMins}분 {totalSecs}초
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs bg-amber-50/90 backdrop-blur border border-amber-200 px-3.5 py-2 rounded-xl text-amber-950 shadow-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-spin-slow" />
            <span className="font-bold">⭐ {currentPoints}</span>
          </div>
        </div>

        {/* Sub-tabs Content Area Overlay */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 mt-6 overflow-y-auto no-scrollbar pb-12">
          {activeTab !== "map" && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur shadow-2xl rounded-3xl p-4 sm:p-6 mb-12 border border-slate-200">
              <AnimatePresence mode="wait">
                
                {/* Attendance checklist scheduler */}
                {activeTab === "attendance" && (
                  <motion.div
                    key="attendance-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AttendanceCheck
                      currentPoints={currentPoints}
                      addPoints={addPoints}
                      onBack={() => setActiveTab("map")}
                    />
                  </motion.div>
                )}

                {/* Day quotas and homework check UI */}
                {activeTab === "quests" && (
                  <motion.div
                    key="quests-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <QuestsList
                      currentPoints={currentPoints}
                      addPoints={addPoints}
                      onBack={() => setActiveTab("map")}
                      accumulateTimeSec={accumulateTimeSec}
                    />
                  </motion.div>
                )}

                {/* Smart study methods library */}
                {activeTab === "methods" && (
                  <motion.div
                    key="methods-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StudyMethods
                      onBack={() => setActiveTab("map")}
                      addPoints={addPoints}
                    />
                  </motion.div>
                )}

                {/* Knowledge Bounty */}
                {activeTab === "bounty" && (
                  <motion.div
                    key="bounty-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KnowledgeBounty
                      currentPoints={currentPoints}
                      addPoints={addPoints}
                      deductPoints={deductPoints}
                    />
                  </motion.div>
                )}

                {/* AI Study Planner */}
                {activeTab === "planner" && (
                  <motion.div
                    key="planner-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AiPlanner
                      currentPoints={currentPoints}
                      addPoints={addPoints}
                      onBack={() => setActiveTab("map")}
                      studyTimes={studyTimes}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}
        </div>





      </div>
    </div>
  );
}
