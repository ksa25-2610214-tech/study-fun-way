import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Award, Hourglass, Camera, Upload, AlertCircle, FileText, Sparkles, ChevronLeft, Target } from "lucide-react";
import { Quest } from "../types";
import { INITIAL_QUESTS } from "../data/mockData";

interface QuestsListProps {
  currentPoints: number;
  addPoints: (p: number) => void;
  onBack: () => void;
  accumulateTimeSec: number;
}

export default function QuestsList({
  currentPoints,
  addPoints,
  onBack,
  accumulateTimeSec,
}: QuestsListProps) {
  // Quests list state with local storage persistence to prevent loss of completed quests
  const [quests, setQuests] = React.useState<Quest[]>(() => {
    const saved = localStorage.getItem("metique_quests_state");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_QUESTS;
  });
  const [filter, setFilter] = useState<"all" | "timer" | "attendance" | "homework">("all");

  // Sync attendance checked status directly into 'q-attendance' quest when viewing QuestsList
  React.useEffect(() => {
    const isChecked = localStorage.getItem("metique_last_attendance_date") === new Date().toLocaleDateString("ko-KR");
    if (isChecked) {
      setQuests(prev => {
        const next = prev.map(q =>
          q.id === "q-attendance" ? { ...q, isCompleted: true, progress: "1/1일 완료" } : q
        );
        localStorage.setItem("metique_quests_state", JSON.stringify(next));
        return next;
      });
    }
  }, []);

  // Homework Upload state
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [homeworkSubject, setHomeworkSubject] = useState("수학");
  const [homeworkText, setHomeworkText] = useState("");
  const [homeworkImage, setHomeworkImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);

  // Homework Drag/Drop / File Select handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHomeworkImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger AI Homework Check call
  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkText && !homeworkImage) {
      alert("숙제 풀이 내용 텍스트 기재나 촬영 이미지 중 하나는 첨부해야 합니다.");
      return;
    }

    setIsSubmitting(true);
    setReviewResult(null);

    try {
      const response = await fetch("/api/check-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkText,
          subject: homeworkSubject,
          imageBase64: homeworkImage
        })
      });

      const data = await response.json();
      setIsSubmitting(false);

      if (data.success) {
        setReviewResult(data);
        if (data.pass) {
          // Grant point reward for homework퀘스트 완료!
          addPoints(30);

          // Marks homework quest as completed in state
          setQuests(prev => {
            const next = prev.map(q =>
              q.category === "homework" ? { ...q, isCompleted: true, progress: "1/1회 완료" } : q
            );
            localStorage.setItem("metique_quests_state", JSON.stringify(next));
            return next;
          });
        }
      } else {
        alert("숙제 검사 생성 중 알 수 없는 에러 발생. 다시 전송해 주세요.");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      alert("서버 연결에 실패하여 모의 검사 모드를 실행합니다.");
    }
  };

  // Simulated Quest Reward Claim
  const handleClaimReward = (questId: string, pts: number) => {
    addPoints(pts);
    setQuests(prev => {
      const next = prev.map(q => (q.id === questId ? { ...q, isCompleted: true, progress: "완료됨" } : q));
      localStorage.setItem("metique_quests_state", JSON.stringify(next));
      return next;
    });
  };

  // Quick Auto Check progress for study timer quests under simulation
  const hoursLeft = Math.floor(accumulateTimeSec / 3600);
  const minutesLeft = Math.floor((accumulateTimeSec % 3600) / 60);

  const getTimerProgressString = (targetMinutes: number) => {
    const currentMins = Math.floor(accumulateTimeSec / 60);
    if (currentMins >= targetMinutes) return `${targetMinutes}/${targetMinutes} (완료!)`;
    return `${currentMins}/${targetMinutes} 분`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl p-5 md:p-8 text-gray-800">
      
      {/* Sub header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <button
          onClick={onBack}
          className="text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> 광장지도로 돌아가기
        </button>

        <span className="text-[11px] font-mono bg-yellow-100 text-yellow-700 font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
          🏆 누적 마일리지: {currentPoints} pts
        </span>
      </div>

      {/* Main Quest Banner resembling screen d */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="text-left">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-500" /> 일일 미션 및 퀘스트 <span className="text-sm font-mono text-gray-400">[d-Screen]</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            자기주도 훈련과 숙제인증, 누적 타이머 도전 달성을 통해 공부의 연속성을 증가시키고 보상을 받는 공간입니다.
          </p>
        </div>

        {/* Big Action button: Upload homework directly */}
        <button
          id="btn-upload-homework-trigger"
          onClick={() => {
            setShowHomeworkModal(true);
            setReviewResult(null);
          }}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-md text-white border-b-4 border-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4 animate-bounce" /> 숙제 카메라 찍어서 검사받기 (+30 pts)
        </button>
      </div>

      {/* Filter Tabs matching screen d (전체, 타이머, 출석) */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 pb-3 overflow-x-auto">
        {(["all", "timer", "attendance", "homework"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap
              ${filter === cat 
                ? "bg-gray-800 text-white shadow-sm"
                : "bg-gray-100 hover:bg-gray-200 text-gray-500"
              }`}
          >
            {cat === "all" ? "전체 목록" : cat === "timer" ? "타이머 미션 ⏳" : cat === "attendance" ? "출석 미션 📅" : "숙제 인증 카메라 📱"}
          </button>
        ))}
      </div>

      {/* Grid List view resembling image d */}
      <div className="flex flex-col gap-4">
        {quests
          .filter((q) => filter === "all" || q.category === filter)
          .map((q) => {
            // Under simulation, update progress bar dynamically based on global timer
            let computedProgress = q.progress;
            let currentPercentage = 0;

            if (q.category === "timer") {
              const targetMinutes = q.id === "q-timer-1" ? 60 : q.id === "q-timer-2" ? 120 : 240;
              computedProgress = getTimerProgressString(targetMinutes);
              const currentMins = Math.floor(accumulateTimeSec / 60);
              currentPercentage = Math.min((currentMins / targetMinutes) * 100, 100);
            } else if (q.id === "q-attendance") {
              currentPercentage = 100; // Simulated
            } else if (q.isCompleted) {
              currentPercentage = 100;
            }

            return (
              <div
                key={q.id}
                className={`bg-[#F9FAFB] rounded-2xl border p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all
                  ${q.isCompleted ? "border-emerald-200 bg-emerald-50/10 opacity-75" : "border-gray-100 hover:bg-gray-50/50"}`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Category icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0
                    ${q.category === "timer" ? "bg-amber-100 text-amber-700" : q.category === "attendance" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {q.category === "timer" ? "⏱️" : q.category === "attendance" ? "🗓️" : "📝"}
                  </div>

                  <div className="text-left flex-1">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 flex-wrap">
                      <span>{q.title}</span>
                      {q.isCompleted && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          참여완료 ✔️
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {q.description}
                    </p>

                    {/* Dynamic horizontal progress bar */}
                    <div className="w-full max-w-xs mt-3">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mb-1">
                        <span>진행 속도:</span>
                        <span className="font-bold">{computedProgress}</span>
                      </div>
                      <div className="bg-gray-200 h-1.5 w-full rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${q.isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
                          style={{ width: `${currentPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rightmost check/claim reward column */}
                <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-5 text-center min-w-[100px]">
                  <span className="text-[10px] text-amber-500 font-extrabold">보상 포인트</span>
                  <div className="text-md font-extrabold font-mono text-gray-800">
                    ⭐ {q.rewardPoints} pts
                  </div>

                  {q.isCompleted ? (
                    <span className="text-emerald-600 font-bold text-xs mt-2.5 flex items-center gap-1 bg-emerald-100/40 px-2 py-1 rounded">
                      획득완료 👌
                    </span>
                  ) : (() => {
                    // Check if eligible to claim reward
                    let isEligible = false;
                    if (q.category === "timer") {
                      const targetMinutes = q.id === "q-timer-1" ? 60 : q.id === "q-timer-2" ? 120 : 240;
                      const currentMins = Math.floor(accumulateTimeSec / 60);
                      isEligible = currentMins >= targetMinutes;
                    } else if (q.id === "q-attendance") {
                      const attendanceChecked = localStorage.getItem("metique_last_attendance_date") === new Date().toLocaleDateString("ko-KR");
                      isEligible = attendanceChecked;
                    } else if (q.category === "homework") {
                      // Homework gets marked isCompleted directly, so if not completed, it is not eligible
                      isEligible = false;
                    }

                    if (isEligible) {
                      return (
                        <button
                          id={`btn-quest-claim-${q.id}`}
                          onClick={() => handleClaimReward(q.id, q.rewardPoints)}
                          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg mt-2 transition-all shadow-sm animate-pulse"
                        >
                          보상 받기 ✨
                        </button>
                      );
                    } else {
                      return (
                        <button
                          disabled
                          className="bg-gray-100 text-gray-400 cursor-not-allowed text-[11px] font-bold py-1.5 px-3 rounded-lg mt-2 transition-all"
                        >
                          진행 중 ⏳
                        </button>
                      );
                    }
                  })()}
                </div>

              </div>
            );
          })}
      </div>

      {/* Gemini AI Homework Review Modal dialog */}
      <AnimatePresence>
        {showHomeworkModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 text-gray-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-black tracking-tight text-gray-900 border-b pb-3 flex items-center gap-2">
                📂 AI 숙제 분석 제출기 <span className="text-xs text-indigo-500 font-mono">[Core-1]</span>
              </h3>

              {!reviewResult ? (
                <form onSubmit={handleHomeworkSubmit} className="mt-4 flex flex-col gap-4 text-left">
                  
                  {/* Select Subject */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">과목 선택</label>
                    <select
                      value={homeworkSubject}
                      onChange={(e) => setHomeworkSubject(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
                    >
                      <option value="수학">수학 📐 (오답 뽀모도로 모아보기)</option>
                      <option value="영어">영어 🔤 (영작/독해 공부)</option>
                      <option value="국어/사회">국어 사회 📖 (독해 및 요약 정복)</option>
                      <option value="과학">과학 🔬 (원리 및 요약 백지노트)</option>
                    </select>
                  </div>

                  {/* Text 풀이 */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">
                      오늘 숙제 내용 풀어 쓰기 (또는 오답 고민 요점 기재)
                    </label>
                    <textarea
                      value={homeworkText}
                      onChange={(e) => setHomeworkText(e.target.value)}
                      placeholder="수학: 3단원 소수의 나눗셈 5문제를 스스로 해결하였습니다. 오답인 3번 문항은 약수 개념을 잘못 적용해 실수한 것을 발견 수정하였어요!"
                      rows={4}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 pointer-events-auto"
                    />
                  </div>

                  {/* Upload Image Frame */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">숙제 노트 찍어서 올리기 (사진인증 카메라)</label>
                    
                    <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 p-6 rounded-2xl text-center bg-gray-50 relative pointer-events-auto transition-colors">
                      <input
                        id="hw-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      {homeworkImage ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={homeworkImage}
                            alt="첨부된 숙제 이미지"
                            className="max-h-36 rounded-lg object-contain mb-2 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] text-indigo-600 font-bold">새로운 사진 업로드 / 교체하려면 클릭</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-xs font-bold text-gray-600">카메라 이미지 파일 선택(클릭/드래그)</span>
                          <span className="text-[10px] text-gray-400 mt-1">PNG, JPG 포맷 가능 (+30포인트 리워드)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission deck */}
                  <div className="flex gap-2 border-t pt-4 mt-2">
                    <button
                      id="btn-close-hw-modal"
                      type="button"
                      onClick={() => setShowHomeworkModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all outline-none"
                    >
                      취소
                    </button>
                    <button
                      id="btn-hw-review-submit-pro"
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 font-extrabold text-white py-3 rounded-xl text-xs active:scale-95 transition-all outline-none flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" /> AI 분석 생성 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> AI 튜터 소이에게 채점받기 ✨
                        </>
                      )}
                    </button>
                  </div>

                </form>
              ) : (
                /* Homework AI Analysis Report result! */
                <div className="flex flex-col text-left py-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 animate-ping">
                    🌸
                  </div>

                  <div className="bg-gradient-to-tr from-[#111827] to-[#1F2937] text-white p-5 rounded-2xl border border-emerald-500 relative mb-4">
                    <span className="absolute top-3 right-4 bg-emerald-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                      점수: {reviewResult.score} 점
                    </span>
                    <h4 className="font-extrabold text-sm text-yellow-300">
                      🎯 {reviewResult.aiTitle || "스스로 지킴이 AI"}
                    </h4>

                    {/* Feedback content */}
                    <div className="mt-3 text-xs text-gray-200 leading-relaxed font-sans border-t border-gray-700 pt-3">
                      {reviewResult.feedback}
                    </div>

                    <div className="mt-4 bg-gray-900 rounded-xl p-3 border border-indigo-500/30 text-[11px] font-mono">
                      <span className="text-indigo-300 uppercase font-bold block mb-1">🎒 추천 자율연속 퀘스트:</span>
                      <span className="text-white font-sans">{reviewResult.recommendedQuest}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 text-center">
                    <p className="text-xs text-emerald-800 font-bold">
                      🎉 축하합니다! 숙제 통과 기여금으로 +30 포인트와 메티큐 배지가 지급되었습니다.
                    </p>
                  </div>

                  <button
                    id="btn-complete-hw"
                    onClick={() => setShowHomeworkModal(false)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold py-3 rounded-xl text-xs transition-all outline-none"
                  >
                    확인 및 퀘스트 완료하기 ✔️
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
