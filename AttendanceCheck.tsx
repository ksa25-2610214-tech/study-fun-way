import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Check, HelpCircle, Sparkles, ChevronLeft, Award, Sun, Zap } from "lucide-react";

interface AttendanceCheckProps {
  currentPoints: number;
  addPoints: (p: number) => void;
  onBack: () => void;
}

export default function AttendanceCheck({
  currentPoints,
  addPoints,
  onBack,
}: AttendanceCheckProps) {
  const [isCheckedToday, setIsCheckedToday] = useState<boolean>(() => {
    const lastDate = localStorage.getItem("metique_last_attendance_date");
    const todayStr = new Date().toLocaleDateString("ko-KR");
    return lastDate === todayStr;
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem("metique_attendance_streak");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showCelebration, setShowCelebration] = useState(false);

  const [stampDays, setStampDays] = useState<boolean[]>(() => {
    const saved = localStorage.getItem("metique_attendance_stamps");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return Array(30).fill(false);
  }); // 30 Day calendar starting fresh on entry

  // Dynamic status monitoring for crossing midnight 00:00
  useEffect(() => {
    const checkMidnightReset = () => {
      const lastDate = localStorage.getItem("metique_last_attendance_date");
      const todayStr = new Date().toLocaleDateString("ko-KR");
      
      // If the date has rolled over to a new day, allow the student to check in today!
      if (lastDate && lastDate !== todayStr) {
        setIsCheckedToday(false);
        
        // Also verify if they missed a whole day, to update UI dynamically if they stayed on the page
        const parts = lastDate.split('.').map(s => parseInt(s.trim()));
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const lastDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDateObj.toLocaleDateString("ko-KR") !== yesterday.toLocaleDateString("ko-KR") && 
              lastDateObj.toLocaleDateString("ko-KR") !== todayStr) {
            setStreakDays(0);
            setStampDays(Array(30).fill(false));
          }
        }
      }
    };

    // Check every second to ensure a smooth transition exactly at 00:00:00 midnight!
    const intervalId = setInterval(checkMidnightReset, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAttendanceClick = () => {
    if (isCheckedToday) return;

    const todayStr = new Date().toLocaleDateString("ko-KR");
    localStorage.setItem("metique_last_attendance_date", todayStr);
    setIsCheckedToday(true);

    const nextStreak = streakDays + 1;
    setStreakDays(nextStreak);
    localStorage.setItem("metique_attendance_streak", String(nextStreak));

    // Update stamps
    const nextStamps = [...stampDays];
    // Stamp the slot corresponding to the sequential unchecked slot (0-indexed)
    const targetIdx = Math.min(nextStamps.length - 1, streakDays);
    nextStamps[targetIdx] = true;
    setStampDays(nextStamps);
    localStorage.setItem("metique_attendance_stamps", JSON.stringify(nextStamps));

    addPoints(10); // Attendance rule: +10 Points

    // Popup beautiful animation
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 text-gray-800 relative">
      
      {/* Upper sub-header bar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <button
          onClick={onBack}
          className="text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> 광장지도로 이동
        </button>

        <span className="text-[11px] font-mono bg-purple-100 text-purple-700 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-yellow-500 animate-bounce" /> 매일매일 자율공부 루틴 단련
        </span>
      </div>

      {/* Main Title Banner resembling Screen c */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-200">
          <Calendar className="w-8 h-8 text-amber-900" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">공부 시작 전 출석체크! 📅</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
          하루도 빼놓지 않는 출석 연속 유지를 통해 자기주도적 몰입 습관을 형성하고 리워드를 받으세요.
        </p>
      </div>

      {/* Streak Count card resembling textnow widget c */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/40 flex items-center justify-between mb-8 shadow-sm">
        <div className="text-left">
          <span className="text-[10px] text-indigo-500 font-bold tracking-widest uppercase block mb-1">나의 자율학습 연속 출석률</span>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black text-indigo-900 tracking-tight">{streakDays}일 연속</h3>
            <span className="text-xs text-indigo-400">/ 30일 목표</span>
          </div>
        </div>

        {/* Level tag icon */}
        <div className="bg-indigo-600 text-white rounded-xl px-3 py-2 flex flex-col items-center">
          <span className="text-lg font-bold">⭐</span>
          <span className="text-[9px] font-mono tracking-tight font-extrabold uppercase mt-0.5">Lv.2 정진</span>
        </div>
      </div>

      {/* 30-Day Stamp Grid */}
      <div className="grid grid-cols-5 gsm:grid-cols-6 md:grid-cols-7 gap-2.5 mb-8">
        {stampDays.slice(0, 14).map((isChecked, index) => {
          const dayNum = index + 1;
          // Today matches the next item in sequence based on verified checked state
          const isToday = isCheckedToday ? dayNum === streakDays : dayNum === streakDays + 1;

          return (
            <div
              key={index}
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 transition-all relative
                ${isChecked 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm" 
                  : isToday 
                    ? "bg-yellow-50 border-amber-300 text-amber-900 animate-pulse ring-2 ring-amber-300" 
                    : "bg-gray-50/50 border-gray-100 text-gray-400"
                }
              `}
            >
              {isChecked ? (
                <div className="absolute inset-0 bg-emerald-100/30 rounded-2xl flex items-center justify-center">
                  <span className="text-lg select-none">💯</span>
                </div>
              ) : null}

              <span className="text-[10px] font-bold font-mono text-gray-400 absolute top-1.5 left-2">
                D-{dayNum}
              </span>

              {isChecked ? (
                <Check className="w-5 h-5 text-emerald-600 mt-2 stroke-[3]" />
              ) : isToday ? (
                <div className="text-center font-bold text-xs mt-2 text-amber-600 animate-bounce">
                  오늘!
                </div>
              ) : (
                <span className="text-xs font-semibold mt-2 text-gray-300">대기</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive check-in action button (Screen c) */}
      <div className="w-full">
        {isCheckedToday ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-emerald-800 font-extrabold flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> 오늘 출석 완료! 보너스 +10 포인트가 지급되었습니다.
            </p>
          </div>
        ) : (
          <button
            id="btn-attendance-submit"
            onClick={handleAttendanceClick}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-md py-4 rounded-2xl shadow-lg border-b-4 border-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            🎯 오늘 출석 체크하고 10 포인트 획득하기
          </button>
        )}
      </div>

      {/* Points Reward Flying Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 rounded-3xl"
          >
            <div className="bg-gray-950 border border-yellow-500 rounded-3xl p-6 text-center max-w-sm w-full text-white shadow-2xl relative overflow-hidden">
              {/* Decorative particle backdrops */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-yellow-400/20 rounded-full filter blur-xl animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-yellow-400/20 rounded-full filter blur-xl animate-pulse"></div>

              <div className="text-5xl animate-bounce mb-3">🪙</div>
              <h3 className="text-lg font-black tracking-tight text-yellow-400 flex items-center justify-center gap-1">
                <Sparkles className="w-5 h-5 animate-spin" /> 출석 체크 성공!
              </h3>
              
              <div className="text-3xl font-mono font-black text-amber-300 my-2">
                +10 포인트 지급!
              </div>

              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                출석체크로 스스로 성취하는 보상 회수!<br />
                연속적인 학습은 학원에 안 가는 공부의 시작점입니다.<br />
                <span className="text-emerald-400 font-bold">연속 {streakDays}일 돌파! {new Date().getMonth() + 1}.{new Date().getDate()}</span>
              </p>

              <button
                id="btn-celebration-close"
                onClick={() => setShowCelebration(false)}
                className="mt-5 w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-extrabold py-2 rounded-xl text-xs active:scale-95 transition-all"
              >
                닫기 (확인)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
