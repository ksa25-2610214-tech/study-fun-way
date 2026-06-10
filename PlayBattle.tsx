import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, X, Coins, Sword, Users, Trophy } from "lucide-react";
import { BattleSport } from "../types";
import { BATTLE_SPORTS } from "../data/mockData";

interface PlayBattleProps {
  currentPoints: number;
  addPoints: (p: number) => void;
  deductPoints: (p: number) => void;
  onBack: () => void;
}

// Map Dimensions matching LibraryMap for absolute parity
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 1050;
const GRID_X = 58;
const GRID_Y = 32;

// No bots, players only
const botOpponents: any[] = [];

export default function PlayBattle({
  currentPoints,
  addPoints,
  deductPoints,
  onBack,
}: PlayBattleProps) {
  const [sports] = useState<BattleSport[]>(BATTLE_SPORTS);
  const [stage, setStage] = useState<"idle" | "setup" | "playing" | "result">("idle");

  // Map states for player position (initialized near center)
  const [playerPos, setPlayerPos] = useState({ x: 29, y: 16 });
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("down");
  const [isWalking, setIsWalking] = useState(false);

  // Selected battle setup constraints
  const [selectedSport, setSelectedSport] = useState<BattleSport>(BATTLE_SPORTS[0]);
  const [betPoints, setBetPoints] = useState<number>(10);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);

  // Gauge mini-game states
  const [gaugeValue, setGaugeValue] = useState(50);
  const [gaugeGoingUp, setGaugeGoingUp] = useState(true);
  const [rollResult, setRollResult] = useState<{ playerVal: number; opponentVal: number; verdict: "win" | "lose" } | null>(null);

  // Peer multiplayers active position state synced from server
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Local identifiers from localStorage for parity with map profile
  const [playerId] = useState(() => {
    let savedId = localStorage.getItem("metique_player_id");
    if (!savedId) {
      savedId = `user_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("metique_player_id", savedId);
    }
    return savedId;
  });

  const [playerName] = useState(() => {
    return localStorage.getItem("metique_player_name") || `열공생_${Math.floor(100 + Math.random() * 900)}`;
  });

  const [playerEmoji] = useState(() => {
    return localStorage.getItem("metique_player_emoji") || "🚀";
  });

  const [playerStatus] = useState(() => {
    return localStorage.getItem("metique_player_status") || "승부욕이 타오르는 중 🔥";
  });

  // Touch/Hold direction interval management
  const movementIntervalRef = useRef<any>(null);

  const startMoving = (dx: number, dy: number, dir: typeof direction) => {
    if (stage !== "idle") return;
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);

    const step = () => {
      handleMove(dx, dy, dir);
    };

    step(); 
    movementIntervalRef.current = setInterval(step, 140);
  };

  const stopMoving = () => {
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    };
  }, [stage]);

  // Real-time multiplayer synchronization heartbeat (using "location: battle")
  useEffect(() => {
    const sendPulse = async () => {
      try {
        const response = await fetch("/api/multiplayer/join-or-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: playerId,
            name: playerName,
            x: playerPos.x,
            y: playerPos.y,
            isSeated: false,
            seatId: null,
            studyTime: "00:00",
            avatarEmoji: playerEmoji,
            status: playerStatus,
            message: "",
            location: "battle" // Distinct position indicator
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Filter players who are explicitly at the Battle plaza
            const battleUsers = (data.users || []).filter((u: any) => u.location === "battle");
            setOnlineUsers(battleUsers);
          }
        }
      } catch (err) {
        console.warn("Heartbeat lost in battle space.", err);
      }
    };

    sendPulse();
    const intervalMsg = setInterval(sendPulse, 1500);
    return () => clearInterval(intervalMsg);
  }, [playerId, playerName, playerPos, playerEmoji, playerStatus]);

  // Viewport camera tracking auto resize
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 500
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMove = (dx: number, dy: number, newDir: "up" | "down" | "left" | "right") => {
    if (stage !== "idle") return;

    setDirection(newDir);
    setIsWalking(true);

    setPlayerPos((prev) => {
      let nextX = prev.x + dx;
      let nextY = prev.y + dy;
      nextX = Math.max(1, Math.min(GRID_X - 1, nextX));
      nextY = Math.max(2, Math.min(GRID_Y - 1, nextY));
      return { x: nextX, y: nextY };
    });

    setTimeout(() => {
      setIsWalking(false);
    }, 120);
  };

  // Keyboard Movement Event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== "idle") return; 

      let dx = 0;
      let dy = 0;
      let newDir: typeof direction = direction;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          dy = -1; newDir = "up"; break;
        case "ArrowDown":
        case "s":
        case "S":
          dy = 1; newDir = "down"; break;
        case "ArrowLeft":
        case "a":
        case "A":
          dx = -1; newDir = "left"; break;
        case "ArrowRight":
        case "d":
        case "D":
          dx = 1; newDir = "right"; break;
        default:
          return;
      }

      e.preventDefault();
      handleMove(dx, dy, newDir);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, direction]);

  // Run dynamic gauge loop during playing stage
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (stage === "playing") {
      interval = setInterval(() => {
        setGaugeValue((prev) => {
          if (prev >= 100) {
            setGaugeGoingUp(false);
            return 98;
          }
          if (prev <= 0) {
            setGaugeGoingUp(true);
            return 2;
          }
          return gaugeGoingUp ? prev + 5 : prev - 5;
        });
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, gaugeGoingUp]);

  const handleStartBattle = () => {
    setGaugeValue(50);
    setStage("playing");
  };

  const handleStopGauge = () => {
    const sweetSpotDiff = Math.abs(gaugeValue - 50);
    let playerQualityMultiplier = 1.0;

    if (sweetSpotDiff < 5) playerQualityMultiplier = 1.5;
    else if (sweetSpotDiff < 15) playerQualityMultiplier = 1.1;
    else if (sweetSpotDiff > 35) playerQualityMultiplier = 0.6;

    // Slight base deviation for opponents
    const opponentRandomScore = Math.floor(Math.random() * 41) + 50; 
    const playerCalculatedScore = Math.min(
      Math.floor((Math.random() * 31 + 60) * playerQualityMultiplier),
      100
    );

    const isWinner = playerCalculatedScore >= opponentRandomScore;

    setRollResult({
      playerVal: playerCalculatedScore,
      opponentVal: opponentRandomScore,
      verdict: isWinner ? "win" : "lose"
    });

    setStage("result");
  };

  const handleCenterClick = () => {
    if (stage !== "idle") return;
    if (onlineUsers.length === 0) {
      alert("현재 배틀 광장에 접속한 온라인 유저가 없습니다.");
      return;
    }
    // Challenge center matches with a random online user
    const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
    setSelectedOpponent(randomUser);
    setStage("setup");
  };

  // Viewport camera tracking coordinate offset calculation
  const playerPercentX = playerPos.x / GRID_X;
  const playerPercentY = playerPos.y / GRID_Y;
  const playerPhysX = playerPercentX * MAP_WIDTH;
  const playerPhysY = playerPercentY * MAP_HEIGHT;

  let camX = viewportSize.width / 2 - playerPhysX;
  let camY = viewportSize.height / 2 - playerPhysY;
  camX = Math.min(0, Math.max(viewportSize.width - MAP_WIDTH, camX));
  camY = Math.min(0, Math.max(viewportSize.height - MAP_HEIGHT, camY));

  return (
    <div className="relative w-full flex flex-col items-center">
      
      {/* Upper info panel */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-950 bg-[#0f172a] text-white p-4.5 rounded-t-3xl border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg animate-pulse">
            🥊
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>배팅 스포츠 배틀 광장</span>
              <span className="bg-red-950 text-red-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                PvP & Bot Arena
              </span>
            </h2>
            <p className="text-[11px] text-amber-400 font-medium">
              광장을 가볍게 클릭하여 이동하고, 승부를 겨룰 몬스터나 다른 유저를 클릭하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
          <div className="bg-slate-800/80 border border-slate-700 rounded-full px-3.5 py-1.5 text-xs font-mono font-bold text-yellow-300 flex items-center gap-1">
            <span>나의 잔액:</span>
            <span className="text-white">{currentPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Dynamic Viewport Window Frame */}
      <div 
        ref={containerRef}
        className="relative w-full h-[520px] sm:h-[620px] bg-slate-900 overflow-hidden border-2 border-slate-200 rounded-b-3xl shadow-inner"
      >
        <div
          style={{
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
            transform: `translate(${camX}px, ${camY}px)`,
            transition: isWalking ? "transform 0.12s ease-out" : "transform 0.2s ease-out",
          }}
          className="absolute top-0 left-0 bg-[#fbf5e6] origin-top-left overflow-hidden transition-all select-none"
        >
          {/* Tiles with robust touch and click to teleport floor */}
          <div 
            className="absolute inset-0 bg-[#ebe2cd] cursor-pointer" 
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(141, 115, 85, 0.16) 1.5px, transparent 1.5px),
                linear-gradient(to bottom, rgba(141, 115, 85, 0.16) 1.5px, transparent 1.5px)
              `,
              backgroundSize: '34.48px 32.81px'
            }}
            onClick={(e) => {
              if (stage !== "idle") return;
              const rect = e.currentTarget.getBoundingClientRect();
              
              // Mobile-safe click mapping coordinates
              let clientX = e.clientX;
              let clientY = e.clientY;
              
              if (!clientX && (e as any).nativeEvent) {
                const native = (e as any).nativeEvent;
                if (native.touches && native.touches[0]) {
                  clientX = native.touches[0].clientX;
                  clientY = native.touches[0].clientY;
                } else if (native.changedTouches && native.changedTouches[0]) {
                  clientX = native.changedTouches[0].clientX;
                  clientY = native.changedTouches[0].clientY;
                }
              }
              
              if (!clientX) {
                clientX = (e.nativeEvent as any).offsetX + rect.left;
                clientY = (e.nativeEvent as any).offsetY + rect.top;
              }

              const clickX = clientX - rect.left;
              const clickY = clientY - rect.top;

              const gridX = Math.round((clickX / MAP_WIDTH) * GRID_X);
              const gridY = Math.round((clickY / MAP_HEIGHT) * GRID_Y);

              const clampedX = Math.max(1, Math.min(GRID_X - 1, gridX));
              const clampedY = Math.max(2, Math.min(GRID_Y - 1, gridY));

              setPlayerPos({ x: clampedX, y: clampedY });
              
              const dx = clampedX - playerPos.x;
              const dy = clampedY - playerPos.y;
              if (Math.abs(dx) > Math.abs(dy)) {
                setDirection(dx > 0 ? "right" : "left");
              } else if (Math.abs(dy) > 0) {
                setDirection(dy > 0 ? "down" : "up");
              }
            }}
          />

          {/* Symmetrical environment boundaries */}
          <div className="absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-[#653b1b] to-[#45220a] border-b-4 border-amber-950 flex items-center justify-between px-6 z-10 shadow-lg" />

          {/* Centre Staircase */}
          <div className="absolute top-[40px] left-[50%] -translate-x-1/2 w-48 h-20 bg-gradient-to-b from-[#f5ebd6] to-[#d6c2a1] border-l-4 border-r-4 border-[#8c5a3c] flex flex-col justify-between shadow-2xl z-10 pointer-events-none">
            <div className="h-4 border-b border-amber-900/30 bg-white/70"></div>
            <div className="h-4 border-b border-amber-900/30 bg-white/60"></div>
            <div className="h-4 border-b border-amber-900/30 bg-white/50"></div>
            <div className="h-4 border-b border-amber-900/30 bg-white/40"></div>
          </div>

          {/* Central Arena Emblem */}
          <div 
            onClick={handleCenterClick}
            className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-rose-800 to-red-600 rounded-full border-8 border-dotted border-white shadow-2xl flex items-center justify-center p-3 z-10 cursor-pointer opacity-90 hover:scale-105 transition-transform"
          >
            <div className="w-full h-full bg-slate-900 rounded-full border-4 border-red-500 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
               <span className="text-5xl font-black text-rose-500 tracking-wider">VS</span>
               <span className="text-white font-mono text-[9px] font-bold mt-2">CLICK FOR QUICK MATCH</span>
            </div>
          </div>

          {/* Render Bot Opponents (Mushrooms, slimes, pigs etc.) */}
          {botOpponents.map((bot) => {
            const percentX = bot.x / GRID_X;
            const percentY = bot.y / GRID_Y;
            const physX = percentX * MAP_WIDTH;
            const physY = percentY * MAP_HEIGHT;

            return (
              <div
                key={bot.id}
                style={{ left: `${physX}px`, top: `${physY}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOpponent(bot);
                  setStage("setup");
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <div className="relative animate-bounce" style={{ animationDuration: "1.8s" }}>
                  <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-full flex items-center justify-center border-4 border-amber-600 shadow-xl">
                    <span className="text-xl">{bot.emoji}</span>
                  </div>
                </div>
                <div className="mt-1 bg-amber-950 border border-amber-600 font-extrabold text-[8px] text-yellow-300 px-2 py-0.5 rounded shadow-lg flex flex-col items-center">
                  <span>{bot.name}</span>
                  <span className="text-[7px] text-white/80 font-normal">{bot.status}</span>
                </div>
              </div>
            );
          })}

          {/* Render Multiplayer Peers currently online in battle area */}
          {onlineUsers.map((user) => {
            const percentX = user.x / GRID_X;
            const percentY = user.y / GRID_Y;
            const physX = percentX * MAP_WIDTH;
            const physY = percentY * MAP_HEIGHT;

            return (
              <div
                key={user.id}
                style={{ left: `${physX}px`, top: `${physY}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOpponent(user);
                  setStage("setup");
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              >
                <div className="relative animate-bounce" style={{ animationDuration: "2s" }}>
                  <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-pink-400 rounded-full flex items-center justify-center border-4 border-rose-600 shadow-xl">
                    <span className="text-xl">{user.avatarEmoji || "🐹"}</span>
                  </div>
                </div>
                <div className="mt-1 bg-rose-950 border border-rose-600 font-extrabold text-[8px] text-white px-2 py-0.5 rounded shadow-lg flex flex-col items-center">
                  <span>{user.name}</span>
                  <span className="text-[7.5px] text-rose-300 font-mono font-black">● ONLINE</span>
                </div>
              </div>
            );
          })}

          {/* Player avatar */}
          <div
            style={{ left: `${playerPhysX}px`, top: `${playerPhysY}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out z-40 flex flex-col items-center pointer-events-none"
          >
            <div className={`relative ${isWalking ? "animate-bounce" : "scale-100"} transition-all duration-100`}>
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-full flex items-center justify-center border-4 border-indigo-700 shadow-xl">
                <span className="text-xl">{playerEmoji}</span>
              </div>
            </div>
            <div className="mt-1.5 bg-indigo-600 font-black text-[9px] text-white px-2 py-0.5 rounded-full shadow-md z-20">
              {playerName} (나)
            </div>
          </div>
        </div>

        {/* D-PAD for mobile devices with holding triggers */}
        {stage === "idle" && (
          <div className="absolute bottom-6 left-6 md:hidden z-40">
            <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-full border border-slate-700/50 shadow-2xl relative w-32 h-32 flex items-center justify-center">
              <button 
                onMouseDown={() => startMoving(0, -1, "up")}
                onMouseUp={stopMoving}
                onMouseLeave={stopMoving}
                onTouchStart={(e) => { e.preventDefault(); startMoving(0, -1, "up"); }}
                onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
                className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer select-none"
              >
                ▲
              </button>
              <button 
                onMouseDown={() => startMoving(0, 1, "down")}
                onMouseUp={stopMoving}
                onMouseLeave={stopMoving}
                onTouchStart={(e) => { e.preventDefault(); startMoving(0, 1, "down"); }}
                onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer select-none"
              >
                ▼
              </button>
              <button 
                onMouseDown={() => startMoving(-1, 0, "left")}
                onMouseUp={stopMoving}
                onMouseLeave={stopMoving}
                onTouchStart={(e) => { e.preventDefault(); startMoving(-1, 0, "left"); }}
                onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer select-none"
              >
                ◀
              </button>
              <button 
                onMouseDown={() => startMoving(1, 0, "right")}
                onMouseUp={stopMoving}
                onMouseLeave={stopMoving}
                onTouchStart={(e) => { e.preventDefault(); startMoving(1, 0, "right"); }}
                onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 active:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors cursor-pointer select-none"
              >
                ▶
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAYS */}
        <AnimatePresence>
          {(stage === "setup" || stage === "playing" || stage === "result") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative"
              >
                {stage === "setup" && (
                  <button 
                    onClick={() => setStage("idle")}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-all z-20 cursor-pointer animate-pulse"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Setup View */}
                {stage === "setup" && (
                   <div className="p-6 md:p-8 text-gray-800 max-h-[85vh] overflow-y-auto text-left">
                     <div className="text-center mb-6">
                       <h2 className="text-2xl font-black text-gray-900 flex justify-center items-center gap-2">
                         <Sword className="w-6 h-6 text-red-500" />
                         스포츠 1v1 지목 배틀!
                       </h2>
                       <p className="text-sm font-medium text-gray-500 mt-2">스포츠 종목과 베팅할 공부 포인트를 지정해서 한판승을 벌이세요.</p>
                       
                       {selectedOpponent && (
                         <div className="mt-4 px-4 py-2 border-2 border-orange-200 bg-orange-50 inline-flex items-center gap-2.5 rounded-2xl">
                           <span className="text-2xl">{selectedOpponent.emoji || selectedOpponent.avatarEmoji || "🐹"}</span>
                           <div className="text-left">
                             <span className="text-[10px] block font-black text-orange-600 uppercase">Opponent</span>
                             <span className="text-sm font-black text-slate-800">{selectedOpponent.name}</span>
                           </div>
                         </div>
                       )}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Box A: Choose Sport */}
                       <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                         <h3 className="text-xs font-black text-gray-700 uppercase mb-3 text-left">1. 스포츠 종목</h3>
                         <div className="grid grid-cols-2 gap-2">
                           {sports.map((sport) => {
                             const isSel = selectedSport.id === sport.id;
                             return (
                               <button
                                 key={sport.id}
                                 onClick={() => setSelectedSport(sport)}
                                 className={`p-3 rounded-xl border text-left transition-all flex items-center justify-center flex-col cursor-pointer
                                   ${isSel 
                                     ? "bg-indigo-600 border-indigo-500 text-white shadow font-bold" 
                                     : "bg-white border-gray-200 hover:bg-gray-100 text-gray-700"}`}
                               >
                                 <span className="text-2xl mb-1">{sport.emoji}</span>
                                 <span className="text-[11px] leading-tight text-center">{sport.name}</span>
                               </button>
                             );
                           })}
                         </div>
                       </div>

                       {/* Box B: Betting */}
                       <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between">
                         <div>
                           <h3 className="text-xs font-black text-gray-700 uppercase mb-3 text-left">2. 우정 배틀 난이도</h3>
                           <p className="text-[11px] text-gray-500 mb-4 bg-white p-2.5 border rounded-lg">
                             우정 배틀의 AI 도발 난이도를 지정해 보세요!
                           </p>
                           
                           <div className="grid grid-cols-2 gap-2">
                             {[
                               { pts: 10, label: "쉬움" },
                               { pts: 20, label: "보통" },
                               { pts: 50, label: "어려움" },
                               { pts: 100, label: "극한" }
                             ].map((option) => (
                               <button
                                 key={option.pts}
                                 onClick={() => setBetPoints(option.pts)}
                                 className={`py-2 px-3 border rounded-xl font-mono text-xs font-extrabold text-center transition-all cursor-pointer
                                   ${betPoints === option.pts 
                                     ? "bg-red-500 border-red-400 text-white shadow-md animate-pulse" 
                                     : "bg-white border-gray-200 hover:border-gray-300 text-gray-600"}`}
                               >
                                 {option.label}
                               </button>
                             ))}
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="mt-8 flex justify-center">
                        <button
                          onClick={handleStartBattle}
                          className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl active:scale-95 transition-all outline-none cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Sword className="w-5 h-5 animate-spin" style={{ animationDuration: "3s" }} /> 
                          배틀 매치 시작하기 (우정 대결)
                        </button>
                     </div>
                   </div>
                )}

                {/* Playing View */}
                {stage === "playing" && (
                   <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                     <span className="text-6xl animate-bounce my-4 shadow-xl rounded-full border bg-white p-4">
                       {selectedSport.emoji}
                     </span>
                     <h3 className="text-2xl font-black text-gray-900 mt-4">게이지 스트라이크 존 집중 조준!</h3>
                     <p className="text-sm text-gray-500 mt-2">최최최 중앙 스트라이크 존에 정확히 게이지 바를 세워 승리 확률을 높이세요!</p>

                     <div className="w-full max-w-sm bg-gray-100 border-2 border-gray-300 rounded-3xl p-5 my-8 relative">
                       <div className="flex justify-between text-xs font-mono font-bold text-gray-400 mb-2">
                         <span>0</span>
                         <span className="text-emerald-500 text-lg">🎯 50</span>
                         <span>100</span>
                       </div>
                       
                       <div className="h-10 w-full bg-gradient-to-r from-rose-400 via-emerald-400 to-rose-400 rounded-full relative overflow-hidden shadow-inner border-2 border-slate-200">
                         {/* Sweet spot mark */}
                         <div className="absolute top-0 bottom-0 left-[45%] right-[45%] bg-emerald-250 border-x-4 border-emerald-600 shadow-xl"></div>

                         <div
                           className="absolute top-0 bottom-0 w-2.5 bg-gray-950 z-10 shadow-xl border border-white/50"
                           style={{ left: `${gaugeValue}%` }}
                         ></div>
                       </div>
                     </div>

                     <button
                       onClick={handleStopGauge}
                       className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-xl shadow-xl active:scale-95 transition-all cursor-pointer"
                     >
                       🛑 수구 타격 멈추기!
                     </button>
                   </div>
                )}

                {/* Result View */}
                {stage === "result" && rollResult && (
                   <div className="p-8 flex flex-col items-center text-center">
                     {rollResult.verdict === "win" ? (
                       <>
                         <div className="w-24 h-24 bg-emerald-100 border-4 border-emerald-400 rounded-full flex items-center justify-center text-6xl shadow-xl animate-bounce mb-4">🏆</div>
                         <h3 className="text-3xl font-black text-emerald-600 tracking-tight">배틀 경기 완벽 승리!</h3>
                         <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 my-6 text-center w-full max-w-sm shadow-md">
                           <span className="text-emerald-800 font-bold block mb-2">승리 기념 전적 및 명예</span>
                           <span className="text-2xl font-black text-emerald-600">명예로운 승리 획득! 🎉</span>
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="w-24 h-24 bg-rose-100 border-4 border-rose-400 rounded-full flex items-center justify-center text-6xl shadow-xl mb-4">😢</div>
                         <h3 className="text-3xl font-black text-rose-600 tracking-tight">아쉬운 판정 패배!</h3>
                         <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 my-6 text-center w-full max-w-sm shadow-md">
                           <span className="text-rose-800 font-bold block mb-2">친선전 경험치 축적</span>
                           <span className="text-2xl font-black text-rose-600">성장 완료! 다음엔 이겨봐요!</span>
                         </div>
                       </>
                     )}

                     <div className="flex justify-center items-center gap-8 bg-gray-100 px-6 py-4 rounded-2xl w-full max-w-sm mb-8 font-mono border-2 border-gray-200">
                       <div className="text-center">
                         <span className="text-xs text-slate-500 block mb-1">내 솜씨 ({playerName})</span>
                         <span className="text-2xl font-black text-indigo-600">{rollResult.playerVal}</span>
                       </div>
                       <div className="text-gray-300 font-black text-xl">VS</div>
                       <div className="text-center">
                         <span className="text-xs text-slate-500 block mb-1">{selectedOpponent ? selectedOpponent.name : "시스템"}</span>
                         <span className="text-2xl font-black text-rose-600">{rollResult.opponentVal}</span>
                       </div>
                     </div>

                     <button
                       onClick={() => setStage("idle")}
                       className="w-full max-w-sm bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-2xl text-lg shadow-xl active:scale-95 transition-all cursor-pointer"
                     >
                       광장 맵으로 돌아가기
                     </button>
                   </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
