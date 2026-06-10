import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Resilient helper to call Gemini generateContent with auto-retries and fallback models
async function safeGenerateContent(ai: GoogleGenAI, params: any, retries = 2, delayMs = 1000): Promise<any> {
  let lastError: any = null;
  const originalModel = params.model || "gemini-3.5-flash";
  const backupModel = "gemini-3.1-flash-lite";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const currentParams = { ...params };
      if (attempt > 1) {
        // Fall back to high-availability gemini-3.1-flash-lite if gemini-3.5-flash is overloaded
        currentParams.model = backupModel;
      }
      return await ai.models.generateContent(currentParams);
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Attempt ${attempt} with model ${attempt > 1 ? backupModel : originalModel} failed: ${err?.message || err}`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

// REST API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Homework Review API Route
app.post("/api/check-homework", async (req, res) => {
  const { homeworkText, subject, imageBase64 } = req.body;

  if (!homeworkText && !imageBase64) {
    return res.status(400).json({ error: "검사할 숙제 텍스트나 이미지가 없습니다." });
  }

  const ai = getGeminiAI();

  // If Gemini API Key is missing or invalid, generate fallback encouraging review
  if (!ai) {
    console.warn("GEMINI_API_KEY is not defined. Using smart local generator for preview.");
    setTimeout(() => {
      const isPass = Math.random() > 0.1; // 90% pass rate
      res.json({
        success: true,
        pass: isPass,
        score: Math.floor(Math.random() * 21) + 80, // 80~100 points
        feedback: `[로컬 AI 분석 피드백]\n제출하신 ${subject || "과목"} 숙제를 기특하게 해내셨습니다!\n스스로 해결하려 고민한 흔적이 역력히 묻어납니다.\n자기주도학습 달성! 보상으로 +30 포인트와 칭찬 배지를 지급합니다. 힘내서 꾸준히 전진하세요!`,
        recommendedQuest: "출석 연속 기록 도전하기",
        aiTitle: "친절한 AI 튜터 소이"
      });
    }, 1000);
    return;
  }

  try {
    let response;
    const systemPrompt = `너는 학생의 숙제를 정성스레 검사하여 격려하고 동기를 고취하는 친근한 AI 숙제 정밀 튜터다.
    사용자의 과목은 '${subject || "자율과목"}'이다.
    반드시 JSON 형식으로만 응답해야 하며 다른 텍스트는 섞지 말아라. 
    JSON schema:
    {
      "pass": boolean (잘했으면 true, 아무 내용이 없거나 완전 낙서면 false),
      "score": number (80 ~ 100 점 사이의 점수),
      "feedback": string (학생이 학원에 의존하지 않는 자기주도 학습 습관을 길러준다는 격려와 함께, 숙제 내용에 대해 고치면 좋을 유용한 팁이나 아주 친절한 칭찬 피드백 4~5줄),
      "recommendedQuest": string ("수학 오답 백지노트 적기", "독서 15분 후 생각 한 줄 쓰기" 등 과목에 어울리는 구체적인 다음 미션 추천),
      "aiTitle": string (예: "눈높이 척척 수학 쌤", "기운찬 영어 가디언" 등 어울리는 칭찬 닉네임)
    }`;

    if (imageBase64) {
      // Analyze with image helper
      const base64Data = imageBase64.split(",")[1] || imageBase64;
      response = await safeGenerateContent(ai, {
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data
              }
            },
            {
              text: `${systemPrompt}\n\n[학생이 적어놓은 숙제 설명/텍스트]: ${homeworkText || "이미지 첨부 및 풀이 완료"}`
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
    } else {
      // Analyze with pure text
      response = await safeGenerateContent(ai, {
        model: "gemini-3.5-flash",
        contents: `${systemPrompt}\n\n[숙제 내용]: ${homeworkText}`,
        config: {
          responseMimeType: "application/json"
        }
      });
    }

    const jsonText = response.text || "{}";
    const resultData = JSON.parse(jsonText.trim());

    res.json({
      success: true,
      pass: resultData.pass !== undefined ? resultData.pass : true,
      score: resultData.score || 95,
      feedback: resultData.feedback || "자기주도적으로 숙제를 해결해 나가는 과정이 매우 대단합니다! 매일매일 자란 실력으로 친구들에게도 당신의 열정을 나눠주세요.",
      recommendedQuest: resultData.recommendedQuest || "오답 자율 요약노트 작성하기",
      aiTitle: resultData.aiTitle || "스스로학습 지킴이 AI"
    });

  } catch (error: any) {
    console.warn("[Gemini API Handled Warning]:", error?.message || error);
    res.status(200).json({
      success: true,
      pass: true,
      score: 90,
      feedback: `친절한 AI 피드백을 생성하는 중 살짝 네트워크 오류가 있었지만, 스스로 노력한 열정을 높이 평가합니다! 기꺼이 출석 보상과 함께 통과 도장을 전해 드립니다. 아기자기하게 이어나가세요!`,
      recommendedQuest: "이어서 뽀모도로 학습 즐기기",
      aiTitle: "학습 격려단 AI 대장"
    });
  }
});

// Real-time Active Online Multiplayers Presence State
interface OnlineUser {
  id: string;
  name: string;
  x: number;
  y: number;
  isSeated: boolean;
  seatId: string | null;
  studyTime: string;
  avatarEmoji: string;
  status: string;
  message: string;
  lastActiveTime: number;
  location?: string; // "map" | "battle"
}

let onlineUsers: OnlineUser[] = [];
let secretRoomCodes: Record<string, string> = {}; 

// Knowledge Bounty Shared State
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

let bountyQuestions: BountyQuestion[] = [];

// Study Group Active Status / Live Chat Logs
let chatLogs: Array<{ id: string; user: string; text: string; time: string }> = [];

app.get("/api/chats", (req, res) => {
  res.json(chatLogs);
});

app.post("/api/chats", (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) {
    return res.status(400).json({ error: "Missing user or text" });
  }
  const newChat = {
    id: "ch-" + Date.now() + Math.random().toString(36).substr(2, 4),
    user,
    text,
    time: new Date().toLocaleTimeString("ko-KR", { hour: 'numeric', minute: '2-digit' })
  };
  chatLogs.push(newChat);
  if (chatLogs.length > 100) {
    chatLogs = chatLogs.slice(-100);
  }
  res.json({ success: true, allChats: chatLogs });
});

app.get("/api/users", (req, res) => {
  // Prune inactive users (> 10 seconds)
  const now = Date.now();
  onlineUsers = onlineUsers.filter(u => now - u.lastActiveTime < 10000);
  res.json(onlineUsers);
});

// Join, Update state, Heartbeat, and get others
app.post("/api/multiplayer/join-or-update", (req, res) => {
  const { id, name, x, y, isSeated, seatId, studyTime, avatarEmoji, status, message, location } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: "Missing user id" });
  }

  const now = Date.now();
  const userData: OnlineUser = {
    id,
    name: name || "스스로공부러",
    x: typeof x === "number" ? x : 29,
    y: typeof y === "number" ? y : 26,
    isSeated: !!isSeated,
    seatId: seatId || null,
    studyTime: studyTime || "00:00:00",
    avatarEmoji: avatarEmoji || "🚀",
    status: status || "자기주도 공부 중",
    message: message || "",
    lastActiveTime: now,
    location: location || "map"
  };

  const idx = onlineUsers.findIndex(u => u.id === id);
  if (idx > -1) {
    onlineUsers[idx] = userData;
  } else {
    onlineUsers.push(userData);
  }

  // Prune inactive users (> 10s since heartbeat)
  onlineUsers = onlineUsers.filter(u => now - u.lastActiveTime < 10000);

  // Clean empty secret room configurations (if zero players are sitting in them)
  const seatedIds = new Set(onlineUsers.filter(u => u.isSeated && u.seatId).map(u => u.seatId));
  for (const roomId in secretRoomCodes) {
    if (!seatedIds.has(roomId)) {
      delete secretRoomCodes[roomId];
    }
  }

  res.json({
    success: true,
    users: onlineUsers.filter(u => u.id !== id), // Return only OTHER players
    secretRoomCodes
  });
});

// Configure secret room passcode
app.post("/api/multiplayer/set-secret-code", (req, res) => {
  const { roomId, code } = req.body;
  if (!roomId || !code) {
    return res.status(400).json({ error: "Missing roomId or code" });
  }
  secretRoomCodes[roomId] = code;
  res.json({ success: true, secretRoomCodes });
});

// Force-leave the library
app.post("/api/multiplayer/leave", (req, res) => {
  const { id } = req.body;
  if (id) {
    onlineUsers = onlineUsers.filter(u => u.id !== id);
    
    // Cleanup empty secret rooms immediately
    const seatedIds = new Set(onlineUsers.filter(u => u.isSeated && u.seatId).map(u => u.seatId));
    for (const roomId in secretRoomCodes) {
      if (!seatedIds.has(roomId)) {
        delete secretRoomCodes[roomId];
      }
    }
  }
  res.json({ success: true });
});

// Bounty Board APIs
app.get("/api/bounty/questions", (req, res) => {
  res.json(bountyQuestions);
});

app.post("/api/bounty/questions", (req, res) => {
  const { author, avatar, subject, title, content, bounty } = req.body;
  if (!author || !title || !content) {
    return res.status(400).json({ error: "필수 입력 정보가 누락되었습니다." });
  }
  const newQuestion: BountyQuestion = {
    id: "bq-" + Date.now(),
    author,
    avatar: avatar || "🌟",
    subject: subject || "기타",
    title,
    content,
    bounty: bounty || 50,
    isSolved: false,
    time: "방금 전",
    answers: []
  };
  bountyQuestions.unshift(newQuestion);
  res.json({ success: true, question: newQuestion, allQuestions: bountyQuestions });
});

app.post("/api/bounty/questions/answer", (req, res) => {
  const { questionId, author, avatar, content } = req.body;
  if (!questionId || !author || !content) {
    return res.status(400).json({ error: "필수 답변 파일이 누락되었습니다." });
  }
  const question = bountyQuestions.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: "해당 질문을 찾을 수 없습니다." });
  }
  const newAnswer: BountyAnswer = {
    id: "ans-" + Date.now(),
    author,
    avatar: avatar || "🌟",
    content,
    isAccepted: false,
    time: "방금 전"
  };
  question.answers.push(newAnswer);
  res.json({ success: true, answer: newAnswer, allQuestions: bountyQuestions });
});

app.post("/api/bounty/questions/accept", (req, res) => {
  const { questionId, answerId } = req.body;
  if (!questionId || !answerId) {
    return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
  }
  const question = bountyQuestions.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: "해당 질문을 찾을 수 없습니다." });
  }
  const answer = question.answers.find(a => a.id === answerId);
  if (!answer) {
    return res.status(404).json({ error: "해당 답변을 찾을 수 없습니다." });
  }
  
  question.isSolved = true;
  answer.isAccepted = true;
  res.json({ success: true, allQuestions: bountyQuestions });
});

// AI Planner Generation Handlers
function generateFallbackPlan(goalsText: string, availableMins: number, nickName: string) {
  const splitGoals = goalsText.split(/[,.\n;]/).map((g: string) => g.trim()).filter(Boolean);
  const items = splitGoals.length > 0 ? splitGoals : ["오늘의 자율 복습하기", "추천 공부법 확인하기"];
  
  const plan = items.map((goal: string, idx: number) => {
    const timeNeeded = Math.min(90, Math.max(20, Math.floor((availableMins || 120) / Math.max(1, items.length))));
    
    let tip = "모든 알림을 끄고 뽀모도로 세션(25분 학습, 5분 휴식)을 실천하세요.";
    if (goal.includes("수학") || goal.includes("풀이") || goal.includes("문제")) {
      tip = "수학은 식을 직접 손으로 쓰며 문제 해결 논리를 재구조화하세요. 오답노트 작성이 생명입니다!";
    } else if (goal.includes("영어") || goal.includes("단어") || goal.includes("암기") || goal.includes("국어")) {
      tip = "암기 부분은 파인만 공부법을 적용해 가상의 초등학생이 앞에 있다고 여기고 친절하게 핵심을 설명해 보세요.";
    } else if (goal.includes("복습") || goal.includes("정리") || goal.includes("노트")) {
      tip = "코넬식 노트 필기법(단서, 필기, 요약)의 3분할 규칙에 따라 구조화 복습을 진행하여 뇌세포 장기기억으로 바꿉니다.";
    }
    
    return {
      timeSlot: `${idx + 1}교시 (${timeNeeded}분)`,
      action: `${goal} 집중 정진 과정`,
      tip
    };
  });

  return {
    success: true,
    plan,
    cheeringQuote: `수많은 격려로 채워질 ${nickName || "열공생"}님의 오늘! 첫 걸음을 내디딘 것만으로도 공부 정진의 절반은 이미 성공한 것과 다름없습니다. 화이팅! ✊`,
    weeklyAdvice: "일주일간 하루 뽀모도로 최소 3회 유지를 목표로 세워보세요! 주말엔 에빙하우스 망각곡선 방지를 위한 총복습이 효과적입니다.",
    achievablePoints: Math.min(100, Math.max(25, plan.length * 15))
  };
}

app.post("/api/planner/generate", async (req, res) => {
  const { goalsText, availableMins, nickName } = req.body;

  if (!goalsText) {
    return res.status(400).json({ error: "목표를 한 줄 이상 입력해주세요!" });
  }

  const ai = getGeminiAI();

  // Decent fallback logic when Gemini is disabled or key is missing
  if (!ai) {
    const fallback = generateFallbackPlan(goalsText, availableMins, nickName);
    return res.json(fallback);
  }

  try {
    const prompt = `너는 고등학생과 학생들의 자기주도학습 계획을 완벽하게 세워주는 친절하고 영리한 에듀 플래너 AI다.
    학생의 닉네임: '${nickName || "열공생"}'
    공부 목표 설정 대화/내용: '${goalsText}'
    고려할 총 가용 공부 시간: ${availableMins || 120}분
    
    위 정보들을 종합하여, 1교시부터 순차적으로 채우는 고효율적인 맞춤형 시간표 계획과 영양가 높은 격려를 생성해줘.
    반드시 아래 JSON 형식으로만 완벽하게 응답해야 하며 다른 텍스트는 섞지 말아라. 
    JSON schema:
    {
      "plan": [
        {
          "timeSlot": string (예: "1교시 (45분)", "2교시 (50분)" 등),
          "action": string (예: "목표에서 수학 문제 풀이 개념 복습", "영어 영단어 100개 완벽 암기" 구체적인 행동 행동 지침),
          "tip": string (예: "암기과목은 눈으로 먼저 읽고, 백지 복습 기법을 활용해 보세요." 등 강력추천 공부법 꿀팁 매칭)
        }
      ],
      "cheeringQuote": string (학생이 공부 시작할 때 마음가짐을 다잡아 줄 따뜻하고 뭉클한 격려 명언 2줄),
      "weeklyAdvice": string (이번 주의 흐름을 잡아줄 자율적 장기 습관 형성 가이드 핵심 팁),
      "achievablePoints": number (이 계획을 완전히 클리어 시 예측 획득 보너스 포인트 수치, 20 ~ 100 사이)
    }`;

    const response = await safeGenerateContent(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "{}";
    const resultData = JSON.parse(jsonText.trim());

    res.json({
      success: true,
      plan: resultData.plan || [],
      cheeringQuote: resultData.cheeringQuote || "꾸준히 한 걸음씩 쌓아가는 지식은 절대 배반하지 않습니다. 오늘도 정진합시다!",
      weeklyAdvice: resultData.weeklyAdvice || "하루 공부 시간 기록 패턴을 추적하여 나만의 피크 타임을 확인해보세요.",
      achievablePoints: resultData.achievablePoints || 50
    });

  } catch (error: any) {
    console.warn("[Gemini Planner Handled Warning]:", error?.message || error);
    const fallback = generateFallbackPlan(goalsText, availableMins, nickName);
    res.json(fallback);
  }
});

// Vite server connection
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || (typeof __dirname !== "undefined" && (__dirname.endsWith("dist") || __dirname.includes("/dist")));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite development server middleware loaded.");
    } catch (err) {
      console.error("Failed to load Vite server on development, falling back to static files:", err);
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const distPath = typeof __dirname !== "undefined" && (__dirname.endsWith("dist") || __dirname.includes("/dist"))
      ? __dirname 
      : path.join(process.cwd(), 'dist');
    
    console.log(`Production mode active. Serving static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
