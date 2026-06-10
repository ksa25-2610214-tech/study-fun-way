import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, CheckCircle, Lightbulb, Compass, Award, Star, ChevronLeft } from "lucide-react";
import { RECOMMENDED_METHODS } from "../data/mockData";
import { StudyMethod } from "../types";

interface StudyMethodsProps {
  onBack: () => void;
  addPoints: (p: number) => void;
}

export default function StudyMethods({ onBack, addPoints }: StudyMethodsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("common");
  const filteredMethods = RECOMMENDED_METHODS.filter(m => m.category === selectedCategory);
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod | null>(filteredMethods[0]);
  const [hasStudiedMethod, setHasStudiedMethod] = useState<Record<string, boolean>>({});

  // Reset selected method when category changes
  React.useEffect(() => {
    if (filteredMethods.length > 0 && !filteredMethods.find(m => m.id === selectedMethod?.id)) {
      setSelectedMethod(filteredMethods[0]);
    }
  }, [selectedCategory, filteredMethods, selectedMethod]);

  const handleApplyMethod = (methodId: string) => {
    if (hasStudiedMethod[methodId]) return;

    setHasStudiedMethod(prev => ({ ...prev, [methodId]: true }));
    alert(`🎉 [${selectedMethod?.title}] 적용 완료! 오늘도 유익한 공부법으로 실천해 보세요!`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl p-5 md:p-8 text-gray-800">
      
      {/* Sub menu header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <button
          onClick={onBack}
          className="text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> 광장지도로 돌아가기
        </button>

        <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full">
          💡 과학적 자기주도 공부 비책
        </span>
      </div>

      {/* Hero Intro */}
      <div className="text-left mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          📚 자기주도학습 추천 공부 비결 <span className="text-xs text-indigo-500 font-mono">[기능-2]</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed mb-4">
          학원에 가던 습관을 끊고, 효과가 입증된 4대 과학적 공부 방식으로 집중 시간의 퀄리티를 폭증시켜 보세요.
        </p>
        
        {/* Category Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: "common", label: "공통 (공부법창)" },
            { id: "korean", label: "국어" },
            { id: "english", label: "영어" },
            { id: "math", label: "수학" },
            { id: "social", label: "사회" },
            { id: "science", label: "과학" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === tab.id 
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subject-specific fixed tips */}
        {selectedCategory === "korean" && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-4">
            <h4 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-1">💡 국어 핵심 Tip</h4>
            <p className="text-xs text-amber-800 leading-relaxed break-keep">
              틈틈이 책을 읽어서 문해력을 기르면 지문은 무의식적으로 빨리 읽히기에 틈틈이 읽는 것이 좋고, 
              문법은 강의로는 개념의 나비 효과가 좋지만, 실제로 자기가 예시를 만들고 여러번 반복해서 그걸 자기 것으로 만드는 게 중요함.
            </p>
          </div>
        )}

        {selectedCategory === "math" && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-4">
            <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-1">💡 수학 핵심 Tip</h4>
            <p className="text-xs text-blue-800 leading-relaxed break-keep">
              개념이 아무리 잘 되어있어도, 수학은 문제 유형이 다양하기도 하고 또한 한정적이기에, 문제를 많이 푸는 게 중요함. 
              시험 기간때는 개념이 부족해서 문제를 못 푸는 것이 아닌, 개념은 이미 끝내놓고 문제를 왕창푸는 게 좋다
            </p>
          </div>
        )}

        {selectedCategory === "english" && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mt-4">
            <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-1">💡 영어 핵심 Tip</h4>
            <p className="text-xs text-emerald-800 leading-relaxed break-keep">
              영단어가 기본적으로 깔려 있어야 되서 영단어는 매일 최소 30개는 외운다고 생각하고 악착같이 외워야 한다. 
              만약 국어에서 문해력이 완성되면, 영어는 단어랑 해석법이 어느 정도만 갖춰져도 쉽게 독해를 할 수 있다.
            </p>
          </div>
        )}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Study method Selector Sidebar list */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          {filteredMethods.map((method) => {
            const isSelected = selectedMethod?.id === method.id;
            const isCompleted = hasStudiedMethod[method.id];

            return (
              <button
                key={method.id}
                id={`btn-method-select-${method.id}`}
                onClick={() => setSelectedMethod(method)}
                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-98 flex items-center justify-between gap-3
                  ${isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-100"
                    : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.emoji}</span>
                  <div>
                    <h3 className="text-xs font-bold leading-tight">{method.title}</h3>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? "text-indigo-200" : "text-gray-400"}`}>
                      {method.timeInfo}
                    </p>
                  </div>
                </div>

                {isCompleted && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 rounded-full w-4 h-4 flex items-center justify-center">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed content canvas */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedMethod && (
              <motion.div
                key={selectedMethod.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-gray-50 border border-gray-100 rounded-3xl p-5 md:p-6 text-left flex flex-col h-full justify-between"
              >
                <div>
                  {/* Title and tags */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-3xl">{selectedMethod.emoji}</span>
                    <div>
                      <h3 className="text-md font-bold text-gray-900 tracking-tight">
                        {selectedMethod.title}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {selectedMethod.timeInfo}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation core */}
                  <div className="bg-white border rounded-2xl p-4 mb-4">
                    <h4 className="text-xs font-extrabold text-amber-500 flex items-center gap-1 mb-1">
                      <Lightbulb className="w-3.5 h-3.5" /> 이런 학생에게 추천해요!
                    </h4>
                    <p className="text-xs text-gray-600 leading-normal">
                      {selectedMethod.pros}
                    </p>
                  </div>

                  {/* Detailed Step list */}
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-700 mb-2 uppercase tracking-wide">
                      실행 방식 및 상세 가이드라인
                    </h4>
                    <div className="flex flex-col gap-2 font-sans">
                      {selectedMethod.steps.map((step, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl shadow-sm"
                        >
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Apply method to learn */}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  {hasStudiedMethod[selectedMethod.id] ? (
                    <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold p-3 rounded-2xl text-xs text-center flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> 오늘 공부법 학습 및 적용을 선택하셨습니다!
                    </div>
                  ) : (
                    <button
                      id={`btn-apply-study-method-${selectedMethod.id}`}
                      onClick={() => handleApplyMethod(selectedMethod.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-2xl text-xs active:scale-95 transition-all outline-none"
                    >
                      🚀 위 공부법으로 숙제/공부 적용하기
                    </button>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
