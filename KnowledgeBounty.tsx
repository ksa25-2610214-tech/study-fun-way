import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, PenSquare, Coins, CheckCircle, Image as ImageIcon, Flame } from "lucide-react";

interface BountyAnswer {
  id: string;
  author: string;
  avatar: string;
  content: string;
  isAccepted: boolean;
  time: string;
}

interface BountyQuestion {
  id: string;
  author: string;
  avatar: string;
  subject: string;
  title: string;
  content: string;
  bounty: number;
  isSolved: boolean;
  time: string;
  answers: BountyAnswer[];
}

interface KnowledgeBountyProps {
  currentPoints: number;
  addPoints: (p: number) => void;
  deductPoints: (p: number) => void;
}

export default function KnowledgeBounty({ currentPoints, addPoints, deductPoints }: KnowledgeBountyProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unsolved" | "mine">("all");
  const [questions, setQuestions] = useState<BountyQuestion[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<BountyQuestion | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newBounty, setNewBounty] = useState(50);
  const [selectedSubject, setSelectedSubject] = useState("수학");

  const getMyProfile = () => {
    const name = typeof window !== "undefined" ? (localStorage.getItem("metique_player_name") || "스스로공부러") : "스스로공부러";
    const title = typeof window !== "undefined" ? (localStorage.getItem("metique_active_title") || "자도학습 지망생") : "자도학습 지망생";
    const emoji = typeof window !== "undefined" ? (localStorage.getItem("metique_player_emoji") || "🚀") : "🚀";
    return {
      displayName: `${name} (${title})`,
      emoji
    };
  };

  const { displayName, emoji } = getMyProfile();

  // Load and sync questions
  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/bounty/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (e) {
      console.warn("Failed to retrieve bounty questions:", e);
    }
  };

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAskSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    if (newBounty < 50) {
      alert("최소 현상금은 50P 이상이어야 합니다!");
      return;
    }
    if (currentPoints < newBounty) {
      alert("포인트가 부족합니다!");
      return;
    }

    try {
      const res = await fetch("/api/bounty/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: displayName,
          avatar: emoji,
          subject: selectedSubject,
          title: newTitle,
          content: newContent,
          bounty: newBounty
        })
      });

      if (res.ok) {
        deductPoints(newBounty);
        const data = await res.json();
        if (data.success) {
          setQuestions(data.allQuestions);
        }
        setShowAskModal(false);
        setNewTitle("");
        setNewContent("");
        setNewBounty(50);
        alert(`질문이 성공적으로 등록되었습니다! (현상금 -${newBounty}p)`);
      }
    } catch (err) {
      alert("질문 등록에 실패했습니다.");
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answerContent.trim() || !answeringQuestion) return;

    try {
      const res = await fetch("/api/bounty/questions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: answeringQuestion.id,
          author: displayName,
          avatar: emoji,
          content: answerContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Sync immediately
          fetchQuestions();
        }
        setAnsweringQuestion(null);
        setAnswerContent("");
        alert(`답변이 성공적으로 등록되었습니다! 질문 게시자가 답변을 채택할 시 현상금 ${answeringQuestion.bounty}p를 받게 됩니다!`);
      }
    } catch (err) {
      alert("답변 등록 중 에러가 발생했습니다.");
    }
  };

  const handleAcceptAnswer = async (questionId: string, answerId: string, bountyValue: number, answerAuthor: string) => {
    try {
      const res = await fetch("/api/bounty/questions/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answerId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchQuestions();
        }
        
        // Award the person who answered this question
        // If the answer was posted by themselves (for testing), they get it, or if it is someone else, they get rewarded.
        // For the current UI context, if the answer is by the current player they gets bountyValue points!
        if (answerAuthor === displayName) {
          addPoints(bountyValue);
          alert(`답변 채택 완료! 내가 등록한 답변이 채택되어 현상금 ${bountyValue}p를 획득했습니다! 🎉`);
        } else {
          alert(`답변을 채택했습니다! 답변자 [${answerAuthor}]님께 현상금 ${bountyValue}P가 정산 배달됩니다.`);
        }
      }
    } catch (err) {
      alert("채택 처리 중 에러가 발생했습니다.");
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (activeTab === "unsolved") return !q.isSolved;
    if (activeTab === "mine") return q.author === displayName;
    return true;
  });

  return (
    <div className="w-full h-[650px] flex flex-col bg-slate-50 border-2 border-slate-200 rounded-3xl shadow-xl overflow-hidden relative text-left">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-900/50 text-amber-100 text-[10px] font-black px-2 py-0.5 rounded-sm tracking-wider uppercase border border-amber-400/30">
                Knowledge Bounty
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Flame className="w-7 h-7 text-yellow-300 fill-yellow-300" />
              지식 거래소 / 현상금 게시판
            </h2>
            <p className="text-amber-100 text-xs mt-1 font-medium">유저끼리 질문을 해결하고 코인을 획득하세요!</p>
          </div>
          
          <button 
            onClick={() => setShowAskModal(true)}
            className="bg-white text-orange-600 hover:bg-orange-50 font-black px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PenSquare className="w-4 h-4" /> 질문 등록하기
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: "all", label: "전체 질문" },
            { id: "unsolved", label: "미해결 현상금" },
            { id: "mine", label: "내 질문" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-slate-800 text-white shadow-md" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 flex items-center gap-2">
          <Coins className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-black text-orange-700">지식을 나누고 포인트를 획득하세요!</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredQuestions.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                  q.isSolved ? "border-slate-200 opacity-70" : "border-orange-200 hover:border-orange-400"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{q.avatar}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{q.author}</span>
                      <span className="text-xs text-slate-400">{q.time}</span>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    q.isSolved ? "bg-slate-100 text-slate-400" : "bg-orange-100 text-orange-600 border border-orange-200 shadow-sm"
                  }`}>
                    {q.isSolved ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> 채택 완료</>
                    ) : (
                      <><Coins className="w-3.5 h-3.5" /> 현상금 {q.bounty}P</>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{q.subject}</span>
                  {q.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">{q.content}</p>

                {q.answers && q.answers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-slate-500 mb-1">등록된 답변 {q.answers.length}개</h4>
                    {q.answers.map(ans => (
                      <div key={ans.id} className={`p-4 rounded-xl border ${ans.isAccepted ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-55 border-slate-200 bg-slate-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{ans.avatar}</span>
                            <div>
                              <span className="text-xs font-bold text-slate-700 block">{ans.author}</span>
                              <span className="text-[10px] text-slate-400">{ans.time}</span>
                            </div>
                          </div>
                          {ans.isAccepted && (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                              <CheckCircle className="w-3 h-3" /> 채택됨
                            </span>
                          )}
                          {!q.isSolved && q.author === displayName && (
                            <button
                              onClick={() => handleAcceptAnswer(q.id, ans.id, q.bounty, ans.author)}
                              className="text-[10px] font-black bg-orange-150 hover:bg-orange-200 bg-orange-100 text-orange-750 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-orange-850 font-black border border-orange-200"
                            >
                              이 답변 채택하기
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{ans.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {!q.isSolved && q.author !== displayName && !q.answers.find(a => a.author === displayName) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => setAnsweringQuestion(q)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PenSquare className="w-3.5 h-3.5" /> 답변 달고 현상금 받기
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-20 text-slate-400 font-bold">
              등록된 질문 게시물이 없습니다. 질문 등록하기를 통해 첫 질문을 남겨보세요!
            </div>
          )}
        </div>
      </div>

      {/* Ask Modal */}
      <AnimatePresence>
        {showAskModal && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <PenSquare className="w-5 h-5 text-orange-400" />
                  새 질문 등록 (지식 현상금)
                </h3>
                <button onClick={() => setShowAskModal(false)} className="text-slate-400 hover:text-white font-bold p-1 text-2xl">&times;</button>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">과목</label>
                    <select 
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:outline-none focus:border-indigo-400"
                    >
                      <option>수학</option>
                      <option>영어</option>
                      <option>과학</option>
                      <option>국어</option>
                      <option>기타</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600">현상금 (Points)</label>
                    <input 
                      type="number" 
                      min={50}
                      step={10}
                      value={newBounty}
                      onChange={(e) => setNewBounty(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-orange-600 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">제목</label>
                  <input 
                    type="text" 
                    placeholder="핵심 질문을 한 줄로 축약하세요!"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">상세 내용 및 답변 유인 사항</label>
                  <textarea 
                    rows={4}
                    placeholder="공부하다가 어떤 공식이나 풀이 과정이 헷갈리는지 적어주세요!"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                {/* Cam mockup info banner */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs font-bold">문제 실물 스캔하기 (카메라 인증)</span>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-200 text-indigo-800 px-2 py-1 rounded">자동인식 지원</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 font-bold text-sm text-slate-500 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={handleAskSubmit}
                  className="px-6 py-2 font-black text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  제출하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Answer Modal */}
      <AnimatePresence>
        {answeringQuestion && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <PenSquare className="w-5 h-5 text-indigo-400" />
                  답변 작성하기
                </h3>
                <button onClick={() => setAnsweringQuestion(null)} className="text-slate-400 hover:text-white font-bold p-1 text-2xl">&times;</button>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-left">
                  <h4 className="font-black text-indigo-900 text-sm mb-1">{answeringQuestion.title}</h4>
                  <p className="text-xs text-indigo-700/80 leading-normal">{answeringQuestion.content}</p>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">나의 답변 (풀이과정 해설 및 노하우 입력)</label>
                  <textarea 
                    rows={5}
                    placeholder="이해하기 쉽게 단계별로 가이드를 남겨주세요!"
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  onClick={() => setAnsweringQuestion(null)}
                  className="px-4 py-2 font-bold text-sm text-slate-500 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={handleAnswerSubmit}
                  className="px-6 py-2 font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Coins className="w-4 h-4" /> 현상금 {answeringQuestion.bounty}P 답변 등록
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
