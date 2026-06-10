import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, CameraOff, Mic, MicOff, MessageSquare, Send, LogOut, CheckCircle2, Play, Pause, RotateCcw, Award, User } from "lucide-react";
import { LiveChat } from "../types";

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(e => console.warn("Remote play blocked:", e));
    }
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover z-0"
    />
  );
};

interface DeskStudyRoomProps {
  roomId: string; // "desk-1" or "desk-2"
  isSecret: boolean;
  onExit: () => void;
  addPoints: (p: number) => void;
  deductPoints: (p: number) => void;
  accumulateTimeSec: number;
  setAccumulateTimeSec: React.Dispatch<React.SetStateAction<number>>;
  currentPoints: number;
  studyTimes: Record<string, number>;
  setStudyTimes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function DeskStudyRoom({
  roomId,
  isSecret,
  onExit,
  addPoints,
  deductPoints,
  accumulateTimeSec,
  setAccumulateTimeSec,
  currentPoints,
  studyTimes,
  setStudyTimes,
}: DeskStudyRoomProps) {
  // Subject-wise active study state
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const isStudying = activeSubject !== null;
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [studyMode, setStudyMode] = useState<"free" | "pomodoro">("free");

  // Pomodoro local state
  const [pomoWorkMins, setPomoWorkMins] = useState(25);
  const [pomoRestMins, setPomoRestMins] = useState(5);
  const [pomoTimeLeft, setPomoTimeLeft] = useState(1500); // 25 min default
  const [isPomoRest, setIsPomoRest] = useState(false);

  // Focus sound state and notepad state
  const [whiteNoise, setWhiteNoise] = useState<"none" | "rain" | "cafe">("none");
  const [rightTab, setRightTab] = useState<"chat" | "note" | "planner">("chat");
  const [studyNote, setStudyNote] = useState(() => localStorage.getItem("metique_room_notes") || "");

  // Load active planner tasks
  const [roomPlannerTasks, setRoomPlannerTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem("metique_active_planner_tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [roomPlannerType, setRoomPlannerType] = useState<string>(() => {
    return localStorage.getItem("metique_active_planner_type") || "self";
  });

  const toggleRoomTask = (id: string) => {
    const updated = roomPlannerTasks.map(task => {
      if (task.id === id) {
        const targetStatus = !task.completed;
        if (targetStatus) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(587.33, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
              osc.connect(gain); gain.connect(ctx.destination);
              osc.start(); osc.stop(ctx.currentTime + 0.1);
            }
          } catch (_) {}
        }
        return { ...task, completed: targetStatus };
      }
      return task;
    });
    setRoomPlannerTasks(updated);
    localStorage.setItem("metique_active_planner_tasks", JSON.stringify(updated));
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem(`metique_active_planner_tasks_${todayStr}`, JSON.stringify(updated));
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setStudyNote(val);
    localStorage.setItem("metique_room_notes", val);
  };

  // Chat message
  const [chats, setChats] = useState<LiveChat[]>([]);
  const [inputMsg, setInputMsg] = useState("");

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Real-time active study buddies synced from the server (sharing this desk)
  const [buddies, setBuddies] = useState<any[]>([]);
  const [likedBuddies, setLikedBuddies] = useState<string[]>([]);

  // Load chats & poll to keep them synchronised across active study buddies
  useEffect(() => {
    const fetchChats = () => {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => setChats(data))
        .catch((_) => {
          // Fallback - no-op to maintain existing chats during transient networks
        });
    };

    fetchChats();
    const intervalId = setInterval(fetchChats, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch and keep active study buddies synced with other real-time users in same room
  useEffect(() => {
    const syncRoomBuddies = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const users = await response.json();
          const myId = localStorage.getItem("metique_player_id") || "";
          // Filter other users sitting at this exact room desk
          const activePeers = users.filter((u: any) => 
            u.id !== myId && u.isSeated && u.seatId === roomId
          );
          setBuddies(activePeers);
        }
      } catch (err) {
        console.warn("Error syncing study room buddies:", err);
      }
    };

    syncRoomBuddies();
    const intervalId = setInterval(syncRoomBuddies, 1500);
    return () => clearInterval(intervalId);
  }, [roomId]);

  const [peerInstance, setPeerInstance] = useState<any>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const callsRef = useRef<Record<string, any>>({});
  const peerRef = useRef<any>(null);
  const [streamReady, setStreamReady] = useState(false);

  // WebCam setup
  useEffect(() => {
    // To support seamless peer-to-peer audio and video, acquire permissions upfront and mute/disable tracks.
    let mounted = true;
    
    // Function to generate a dummy stream if hardware fails or denied
    const createDummyStream = () => {
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const canvas = document.createElement("canvas");
      canvas.width = 1; canvas.height = 1;
      const videoStream = canvas.captureStream(1);
      return new MediaStream([...dest.stream.getAudioTracks(), ...videoStream.getVideoTracks()]);
    };

    const acquireStream = async () => {
      try {
        // Try both webcam and microphone first
        return await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (err1) {
        console.warn("Failed to acquire both video and audio. Retrying with video only...", err1);
        try {
          return await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user"
            }, 
            audio: false 
          });
        } catch (err2) {
          console.warn("Failed to acquire video. Retrying with audio only...", err2);
          try {
            return await navigator.mediaDevices.getUserMedia({ 
              video: false, 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              } 
            });
          } catch (err3) {
            console.error("All getUserMedia attempts failed", err3);
            throw err3;
          }
        }
      }
    };

    acquireStream()
      .then((stream) => {
        if (!mounted) {
           stream.getTracks().forEach(t => t.stop());
           return;
        }
        // Initially disable all tracks (respecting cameraOn and micOn states)
        stream.getVideoTracks().forEach(t => t.enabled = cameraOn);
        stream.getAudioTracks().forEach(t => t.enabled = micOn);
        
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamReady(true);
      })
      .catch((err) => {
        console.warn("웹캠/마이크 권한 획득 실패. 음성 채팅이 제한됩니다. 더미 스트림으로 대체합니다.", err);
        if (mounted) {
           try {
             localStreamRef.current = createDummyStream();
           } catch(e) {}
           setStreamReady(true);
        }
      });

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        setStreamReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync track enabled states and local video element source when cameraOn or micOn changes
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = cameraOn);
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = micOn);
    }
    if (cameraOn && videoRef.current && localStreamRef.current) {
      if (videoRef.current.srcObject !== localStreamRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [cameraOn, micOn, streamReady]);

  // PeerJS setup and connection mesh
  useEffect(() => {
    let active = true;
    import("peerjs").then(({ default: Peer }) => {
      if (!active) return;
      const myId = localStorage.getItem("metique_player_id") || "p-" + Math.random().toString(36).substr(2, 6);
      const basePeerId = `${myId}-room-${roomId}`; // Unique peer id per room session
      
      const setupPeer = (idToTry: string, isRetry: boolean = false) => {
        if (!active) return;
        const peer = new Peer(idToTry, { 
          debug: 1,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" }
            ]
          }
        });
        peerRef.current = peer;
        
        peer.on("open", (id) => {
          console.log("PeerJS Connected:", id);
          if (active) setPeerInstance(peer);
        });

        peer.on("error", (err: any) => {
          console.warn("PeerJS Error:", err);
          if (err.type === "unavailable-id" && !isRetry) {
             console.log("ID taken, retrying with random suffix...");
             setupPeer(`${basePeerId}-${Math.random().toString(36).substr(2,4)}`, true);
          }
        });

        peer.on("call", (call) => {
          console.log("Incoming call from:", call.peer);
          // Answer automatically with our current stream
          call.answer(localStreamRef.current || undefined);
          call.on("stream", (remoteStream) => {
            console.log("Received remote stream from:", call.peer);
            const callerBaseId = call.peer.split("-room-")[0];
            setRemoteStreams((prev) => ({ ...prev, [callerBaseId]: remoteStream }));
          });
          callsRef.current[call.peer] = call;
        });
      };

      setupPeer(basePeerId);
    });

    return () => {
      active = false;
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      Object.values(callsRef.current).forEach((call: any) => call.close());
      callsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // When buddies update, initiate calls and prune departed buddy sessions
  useEffect(() => {
    if (!peerInstance || !streamReady) return;
    
    const currentBuddyPeerIds = buddies.map(b => `${b.id}-room-${roomId}`);
    const myId = localStorage.getItem("metique_player_id") || "";
    
    // 1. Close and clean up calls to buddies who have left the room
    Object.keys(callsRef.current).forEach((pId) => {
      if (!currentBuddyPeerIds.includes(pId)) {
        console.log("Closing call to departed peer:", pId);
        try {
          if (callsRef.current[pId]) {
            callsRef.current[pId].close();
          }
        } catch (e) {
          console.warn("Error closing call:", e);
        }
        delete callsRef.current[pId];
        
        const baseId = pId.split("-room-")[0];
        setRemoteStreams((prev) => {
          const updated = { ...prev };
          delete updated[baseId];
          return updated;
        });
      }
    });

    // 2. Connect to new incoming buddies in this room
    buddies.forEach((b) => {
      const targetPeerId = `${b.id}-room-${roomId}`;
      
      // Politely prevent duplicate mutual calling by using lexical player ID comparison:
      // Only the peer with the lexicographically smaller ID initiates the call.
      const isInitiator = myId < b.id;

      if (isInitiator && !callsRef.current[targetPeerId]) {
        console.log("Initiating call to:", targetPeerId);
        const call = peerInstance.call(targetPeerId, localStreamRef.current || undefined);
        if (call) {
          call.on("stream", (remoteStream) => {
            console.log("Received remote stream on outgoing call from:", b.id);
            setRemoteStreams((prev) => ({ ...prev, [b.id]: remoteStream }));
          });
          call.on("close", () => {
            setRemoteStreams((prev) => {
              const updated = { ...prev };
              delete updated[b.id];
              return updated;
            });
          });
          callsRef.current[targetPeerId] = call;
        }
      }
    });
  }, [buddies, peerInstance, roomId, streamReady]); // Re-run when new buddies arrive or stream is ready


  // White noise (ASMR Synth sounds - sine waves mimicking cafe/rain hum)
  useEffect(() => {
    if (whiteNoise !== "none") {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Simple low hum noise creation using oscillator
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        if (whiteNoise === "rain") {
          // Rain pinkish rumbling
          osc.type = "triangle";
          osc.frequency.setValueAtTime(80, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        } else {
          // Cafe warm chatter vibration
          osc.type = "sine";
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        }

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        oscillatorRef.current = osc;
      } catch (err) {
        console.warn("Audio Context init blocked or not supported yet.", err);
      }
    } else {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }

    return () => {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch(_) {}
      }
    };
  }, [whiteNoise]);

  // Cooperative Study Raid (Boss)
  const [bossMaxHp, setBossMaxHp] = useState(1000);
  const [bossHp, setBossHp] = useState(1000);
  const bossName = "🔥 기말고사 마왕";

  // Study timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (activeSubject !== null) {
      timerId = setInterval(() => {
        // Increment global study session timer
        setAccumulateTimeSec(prev => prev + 1);

        // Increment subject study time in sync!
        setStudyTimes(prev => ({
          ...prev,
          [activeSubject]: (prev[activeSubject] || 0) + 1
        }));

        // Raid Boss logic
        setBossHp(prev => {
          if (prev <= 0) return 0;
          return Math.max(0, prev - 1); // Group deals 1 dmg per sec
        });

        // Pomodoro count down if applicable
        if (studyMode === "pomodoro") {
          setPomoTimeLeft(prev => {
            if (prev <= 1) {
              setTimeout(() => {
                if (!isPomoRest) {
                  // Time to rest!
                  setIsPomoRest(true);
                  alert(`🎉 ${pomoWorkMins}분 집중 완료! 기특합니다! ${pomoRestMins}분 휴식을 취해보세요.`);
                } else {
                  // Rest done
                  setIsPomoRest(false);
                  alert(`💪 휴식 끝! 새로운 ${pomoWorkMins}분 공부 스포트라이트 시작!`);
                }
              }, 0);
              return !isPomoRest ? pomoRestMins * 60 : pomoWorkMins * 60;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [activeSubject, studyMode, isPomoRest, pomoWorkMins, pomoRestMins, setStudyTimes, setAccumulateTimeSec, addPoints]);

  // Chat submitting
  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const myNickname = localStorage.getItem("metique_player_name") || "열공생";

    fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: myNickname, text: inputMsg })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setChats(data.allChats);
          setInputMsg("");
        }
      })
      .catch(_ => {
        // Client fallback chat insertion
        const localNewChat = {
          id: String(chats.length + 1),
          user: myNickname,
          text: inputMsg,
          time: new Date().toLocaleTimeString("ko-KR", { hour: 'numeric', minute: '2-digit' })
        };
        setChats(prev => [...prev, localNewChat]);
        setInputMsg("");
      });
  };

  // Give virtual cheer/heart/like to buddy
  const handleLikeBuddy = (buddyId: string) => {
    if (!likedBuddies.includes(buddyId)) {
      setLikedBuddies(prev => [...prev, buddyId]);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="w-full flex flex-col bg-gray-950 text-white p-4 md:p-6 rounded-2xl border-2 border-indigo-500 shadow-2xl relative overflow-hidden">
      
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-900 text-indigo-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">
              {isSecret ? "🔒 비밀의 방 스터디그룹" : "🌐 공용 대형테이블"}
            </span>
            <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
              ● Live 4인 집단소통 가동
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            🧑‍🎓 책상 소통 화상 스터디방 <span className="text-indigo-400 text-sm font-mono">[f-Screen]</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-study-exit"
            onClick={onExit}
            className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-100 rounded-xl px-4 py-2 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> 일어서서 광장 가기
          </button>
        </div>
      </div>

      {/* Raid Boss Banner */}
      {bossHp > 0 ? (
        <div className="bg-slate-900 border border-rose-900 p-3 rounded-xl mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-rose-950/40 pointer-events-none"></div>
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-950 rounded-full border-2 border-rose-600 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(225,29,72,0.5)] animate-pulse">
                👿
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-300">{bossName} 토벌전 진행 중!</h3>
                <p className="text-[10px] text-rose-200/70">스터디룸 멤버들이 함께 타이머를 돌려 데미지를 주세요.</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs flex flex-col gap-1 items-end">
              <span className="text-xs font-bold text-rose-400">{bossHp} / {bossMaxHp} HP</span>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-rose-900 shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-900 border border-emerald-600 p-3 rounded-xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="text-sm font-black text-emerald-300">토벌 완료! {bossName} 퇴치!</h3>
              <p className="text-[10px] text-emerald-200">한정판 스터디룸 가구를 획득했습니다.</p>
            </div>
          </div>
          <div className="text-xs font-bold bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-500 shadow-sm">
            보상 수령 완료
          </div>
        </div>
      )}

      {/* Main split grid panel: Upper part divided screen, Lower controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: 4-split 화상 스튜디오 그리드 (f 이미지 완벽 재현) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Box 1: My Camera Stream / My Avatar representation */}
            <div className="relative aspect-[4/3] bg-gray-900/90 rounded-2xl border-2 border-indigo-600 overflow-hidden shadow-lg flex flex-col items-center justify-center">
              
              {cameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover rounded-xl flip-x"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
                    ⭐
                  </div>
                  <span className="text-xs text-gray-400 font-bold mt-2 font-mono">가상 아바타 송출 중</span>
                </div>
              )}

              {/* Bottom Label card */}
              <div className="absolute bottom-2 left-2 right-2 bg-gray-950/80 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] border border-white/5 z-10">
                <span className="font-bold text-yellow-300">나 (독학공부러)</span>
                <span className="font-mono bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300">
                  {formatTime(accumulateTimeSec)}
                </span>
              </div>

              {/* MIC/CAM Overlays */}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${micOn ? "bg-emerald-500/80" : "bg-red-500/80"}`}>
                  {micOn ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
                </span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${cameraOn ? "bg-emerald-500/80" : "bg-red-500/80"}`}>
                  {cameraOn ? <Camera className="w-3 h-3 text-white" /> : <CameraOff className="w-3 h-3 text-white" />}
                </span>
              </div>
            </div>

            {/* Box 2 ~ 4: Real-time Peer Buddies situated in this exact desk room */}
            {(() => {
              const maxPeers = 3;
              const renderedPeers = buddies.slice(0, maxPeers);
              const blankCount = maxPeers - renderedPeers.length;

              return (
                <>
                  {/* Real online peers */}
                  {renderedPeers.map((b) => (
                    <div
                      key={b.id}
                      className="relative aspect-[4/3] bg-gray-900/40 rounded-2xl border border-indigo-950 overflow-hidden shadow-md flex flex-col items-center justify-center hover:border-indigo-800/60 transition-colors"
                    >
                      {remoteStreams[b.id] ? (
                        <RemoteVideo stream={remoteStreams[b.id]} />
                      ) : (
                        <div className="flex flex-col items-center relative z-10">
                          <div className="w-14 h-14 bg-gray-800 rounded-full border border-gray-700 flex items-center justify-center text-3xl shadow-inner">
                            {b.avatarEmoji || b.emoji || "🎓"}
                          </div>
                          <span className="text-[10px] font-sans font-medium text-emerald-400 mt-2 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-900/30 max-w-[120px] truncate" title={b.status || b.state}>
                            {b.status || b.state || "열공 정진 중 ✍️"}
                          </span>
                        </div>
                      )}

                      {/* Bottom Label card */}
                      <div className="absolute bottom-2 left-2 right-2 bg-gray-950/80 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] border border-white/5 z-10">
                        <span className="font-bold text-indigo-200 truncate max-w-[70px]">{b.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-400 text-[10px]">
                            {b.studyTime || formatTime(b.time || 0)}
                          </span>
                          {likedBuddies.includes(b.id) ? (
                            <span className="text-[9px] text-rose-400 font-extrabold animate-pulse">❤️</span>
                          ) : (
                            <button
                              onClick={() => handleLikeBuddy(b.id)}
                              className="p-1 hover:bg-gray-800 text-rose-400 rounded-md transition-colors font-bold text-[10px] scale-90"
                              title="응원 하트 보내기"
                            >
                              ❤️
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Status dot */}
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse z-10"></span>
                    </div>
                  ))}

                  {/* Empty filler slots */}
                  {Array.from({ length: blankCount }).map((_, i) => (
                    <div
                      key={`empty-peer-${i}`}
                      className="relative aspect-[4/3] bg-gray-900/10 rounded-2xl border border-gray-800 border-dashed flex flex-col items-center justify-center text-gray-700"
                    >
                      <User className="w-8 h-8 mb-2 opacity-10" />
                      <span className="text-[10px] font-bold opacity-30">대기 중...</span>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          {/* Bottom Video/Audio toggler deck */}
          <div className="flex flex-wrap items-center justify-center gap-3 bg-gray-900 p-3.5 rounded-2xl border border-gray-800">
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all
                ${cameraOn ? "bg-indigo-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
            >
              {cameraOn ? (
                <>
                  <Camera className="w-4 h-4" /> 카메라 송출 켜짐
                </>
              ) : (
                <>
                  <CameraOff className="w-4 h-4" /> 카메라 켜기
                </>
              )}
            </button>

            <button
              onClick={() => setMicOn(!micOn)}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all
                ${micOn ? "bg-indigo-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
            >
              {micOn ? (
                <>
                  <Mic className="w-4 h-4" /> 마이크 통신 중
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" /> 마이크 켜기
                </>
              )}
            </button>

            {/* ASMR select box */}
            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-1">
              <span className="text-[10px] text-slate-400 font-bold">집중용 ASMR:</span>
              <select
                value={whiteNoise}
                onChange={(e) => setWhiteNoise(e.target.value as any)}
                className="bg-transparent text-xs text-indigo-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="none" className="bg-gray-900">끄기 (음소거)</option>
                <option value="rain" className="bg-gray-900">조용한 소나기 🌧️</option>
                <option value="cafe" className="bg-gray-900">재즈 카페 소음 ☕</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Tab panel: Timer and Study logs */}
        <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-4 flex flex-col gap-4">
          
          {/* Main Active Timer Card */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 text-center">
            
            <div className="flex justify-center gap-2 mb-2">
              <button
                onClick={() => { setStudyMode("free"); }}
                className={`text-[10px] font-bold px-2 py-1 rounded ${studyMode === "free" ? "bg-indigo-700 text-white" : "bg-gray-800 text-gray-400"}`}
              >
                자율 누적타이머
              </button>
              <button
                onClick={() => { 
                  setStudyMode("pomodoro"); 
                  if (!isPomoRest && !isStudying) {
                    setPomoTimeLeft(pomoWorkMins * 60);
                  }
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded ${studyMode === "pomodoro" ? "bg-indigo-700 text-white" : "bg-gray-800 text-gray-400"}`}
              >
                맞춤 타이머
              </button>
            </div>

            {studyMode === "free" ? (
              <div>
                <span className="text-xs text-slate-400 font-mono tracking-widest block uppercase">나의 누적 자율 공부시간</span>
                <span className="text-3xl font-extrabold font-mono text-yellow-300 tracking-tight block my-2 select-none animate-pulse">
                  {formatTime(accumulateTimeSec)}
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 mb-0.5 font-bold">공부 시간(분)</span>
                    <input 
                      type="number" 
                      value={pomoWorkMins} 
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 25);
                        setPomoWorkMins(val);
                        if (!isStudying && !isPomoRest) setPomoTimeLeft(val * 60);
                      }}
                      className="bg-gray-950 border border-gray-700 rounded text-white text-xs w-16 text-center py-1 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                      min="1"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 mb-0.5 font-bold">휴식 시간(분)</span>
                    <input 
                      type="number" 
                      value={pomoRestMins} 
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 5);
                        setPomoRestMins(val);
                        if (!isStudying && isPomoRest) setPomoTimeLeft(val * 60);
                      }}
                      className="bg-gray-950 border border-gray-700 rounded text-white text-xs w-16 text-center py-1 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                      min="1"
                    />
                  </div>
                </div>
                <span className="text-xs text-rose-400 font-bold block mb-1">
                  {isPomoRest ? "🍏 달콤한 휴식 시간" : "🔴 극치 집중 스포트라이트"}
                </span>
                <span className="text-3xl font-extrabold font-mono text-white block my-2 tracking-tight">
                  {Math.floor(pomoTimeLeft / 60).toString().padStart(2, '0')}:{(pomoTimeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Pulsing breathing coach when in rest interval of pomodoro */}
            {studyMode === "pomodoro" && isPomoRest && (
              <div className="my-3 flex flex-col items-center justify-center p-2.5 bg-indigo-950/45 border border-indigo-550/20 rounded-2xl">
                <motion.div
                  className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center border-2 border-indigo-400"
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-5 h-5 bg-indigo-400 rounded-full blur-[1px]"></div>
                </motion.div>
                <p className="text-[10px] font-bold text-indigo-300 mt-2.5 animate-pulse">천천히 깊게 휴식 호흡 (5초 주기)</p>
                <p className="text-[8px] text-gray-400 mt-0.5">기지개를 켜며 신선한 뇌 산소를 보충하세요.</p>
              </div>
            )}

            {/* Subject-specific active study buttons */}
            <div className="space-y-3 bg-slate-900/40 p-4 border border-indigo-500/20 rounded-2xl">
              <span className="text-[10px] text-indigo-300 font-extrabold tracking-widest block uppercase text-center">
                📚 과목개별 정진 스터디 타이머
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "math", name: "수학", emoji: "📐", color: "bg-orange-500 hover:bg-orange-600 border-orange-400/50" },
                  { id: "english", name: "영어", emoji: "🗣️", color: "bg-blue-500 hover:bg-blue-600 border-blue-400/50" },
                  { id: "korean", name: "국어", emoji: "📖", color: "bg-emerald-500 hover:bg-emerald-600 border-emerald-400/50" },
                  { id: "social", name: "사회", emoji: "🗺️", color: "bg-violet-500 hover:bg-violet-600 border-violet-400/50" },
                  { id: "science", name: "과학", emoji: "🔬", color: "bg-pink-500 hover:bg-pink-600 border-pink-400/50" },
                  { id: "general", name: "자습", emoji: "🚀", color: "bg-slate-500 hover:bg-slate-600 border-slate-400/50" },
                ].map((sub) => {
                  const isActive = activeSubject === sub.id;
                  const seconds = studyTimes[sub.id] || 0;
                  const hrs = Math.floor(seconds / 3600);
                  const mins = Math.floor((seconds % 3600) / 60);
                  const secs = seconds % 60;
                  const timeFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}분 ${secs}초`;

                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        if (isActive) {
                          setActiveSubject(null);
                        } else {
                          setActiveSubject(sub.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 text-center relative overflow-hidden
                        ${isActive 
                          ? `${sub.color} border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]` 
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200"}`}
                    >
                      {isActive && (
                        <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                      )}
                      <span className="text-sm">{sub.emoji}</span>
                      <span className="text-[10px] font-black">{sub.name} 공부</span>
                      <span className="text-[10.5px] font-bold font-mono tracking-wider text-slate-300 opacity-95">
                        {timeFormatted}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeSubject !== null && (
                <div className="mt-2.5 p-2 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center justify-between animate-pulse">
                  <span className="text-[10px] font-bold">
                    ⚡ {activeSubject === "math" ? "수학" : activeSubject === "english" ? "영어" : activeSubject === "korean" ? "국어" : activeSubject === "social" ? "사회" : activeSubject === "science" ? "과학" : "자습"} 정진 시간 누적 중...
                  </span>
                  <button
                    onClick={() => setActiveSubject(null)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2 py-0.5 text-[9px] font-bold active:scale-95 transition-all"
                  >
                    일시정지
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tabs Selection */}
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setRightTab("chat")}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${rightTab === "chat" ? "bg-indigo-600 text-white animate-pulse" : "text-gray-400 hover:text-white"}`}
            >
              💬 실시간 대화
            </button>
            <button
              onClick={() => setRightTab("note")}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${rightTab === "note" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              📝 요약 메모장
            </button>
            <button
              onClick={() => {
                setRightTab("planner");
                // Refresh room planner tasks in case user edited them in another view
                const saved = localStorage.getItem("metique_active_planner_tasks");
                if (saved) setRoomPlannerTasks(JSON.parse(saved));
                const type = localStorage.getItem("metique_active_planner_type") || "self";
                setRoomPlannerType(type);
              }}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${rightTab === "planner" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              📅 플래너 연동
            </button>
          </div>

          {rightTab === "chat" && (
            /* Social Messenger Chatting inside room */
            <div className="flex flex-col flex-1 min-h-[240px]">
              <span className="text-xs text-gray-400 font-bold tracking-wider mb-2 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> 실시간 공부 나눔 소통
              </span>

              {/* Chat list viewport */}
              <div className="flex-1 bg-gray-950/80 border border-gray-800 rounded-xl p-3 overflow-y-auto max-h-[220px] flex flex-col gap-2.5 font-mono text-[11px]">
                {chats.map((c) => (
                  <div key={c.id} className="relative bg-gray-900/60 p-2 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-sans font-extrabold text-indigo-300">{c.user}</span>
                      <span className="text-[9px] text-gray-500">{c.time}</span>
                    </div>
                    <p className="text-gray-200 leading-relaxed font-sans">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Input submission box */}
              <form onSubmit={handleChatSend} className="flex gap-1.5 mt-2">
                <input
                  id="msg-input"
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="공부 질문이나 격려 수다 나누기..."
                  className="flex-1 bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  id="btn-msg-submit"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white p-2 rounded-lg transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {rightTab === "note" && (
            /* Study Note Box for self storage */
            <div className="flex flex-col flex-1 min-h-[240px] gap-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold">오답 복습 및 공식 요약 (영구 보관)</span>
                <span className="text-emerald-400 font-mono animate-pulse">● 실시간 기입중</span>
              </div>
              
              <textarea
                value={studyNote}
                onChange={handleNoteChange}
                placeholder="• 수학 4단원 유도 공식: (a+b)^2 ...&#10;• 오늘 정리: evaluate (평가하다), substantial (상당한)&#10;• 독학 질문: 물리 3번 문항 가속도 구하는 원리 체크하기!"
                className="flex-1 min-h-[200px] bg-slate-950/90 text-yellow-100 font-mono text-[11px] leading-relaxed p-3.5 rounded-xl border border-gray-800 focus:border-indigo-500 focus:outline-none resize-none shadow-inner"
              />
            </div>
          )}

          {rightTab === "planner" && (
            /* Dynamic active study planner view synced in real-time */
            <div className="flex flex-col flex-1 min-h-[240px] gap-3">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="bg-indigo-900 border border-indigo-700 text-indigo-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                  {roomPlannerType === "ai" ? "🤖 AI 맞춤 처방 플래너" : "✍️ 셀프 스프링 플래너"}
                </span>
                
                {roomPlannerTasks.length > 0 && (
                  <span className="text-emerald-400 font-mono font-bold animate-pulse text-[11px]">
                    {Math.round((roomPlannerTasks.filter(t => t.completed).length / roomPlannerTasks.length) * 100)}% 완료
                  </span>
                )}
              </div>

              {/* Study room integration checklist container */}
              <div className="flex-1 bg-slate-950/80 border border-gray-800 rounded-xl p-3 max-h-[210px] overflow-y-auto flex flex-col gap-2.5">
                {roomPlannerTasks.length === 0 ? (
                  <div className="text-center py-8 flex flex-col items-center gap-2">
                    <span className="text-xl">📅</span>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-bold">등록된 플래너 일정이 없습니다.</p>
                    <p className="text-[9.5px] text-gray-500 px-3">광장 메뉴의 'AI 플래너'를 열어 나만의 계획이나 AI 자동 시간표를 생성하면 이곳에 실시간 노출됩니다!</p>
                  </div>
                ) : (
                  roomPlannerTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleRoomTask(task.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer select-none text-left flex items-start gap-2.5
                        ${task.completed 
                          ? "bg-slate-900/40 border-slate-800 text-gray-500" 
                          : "bg-gray-900 hover:bg-slate-800 border-indigo-950 hover:border-indigo-900"}`}
                    >
                      <button
                        type="button"
                        className={`w-4 h-4 rounded flex items-center justify-center font-extrabold text-[9px] border transition-all shrink-0 mt-0.5
                          ${task.completed 
                            ? "bg-emerald-500 border-emerald-600 text-white" 
                            : "bg-slate-950 border-slate-700 text-transparent hover:border-slate-500"}`}
                      >
                        ✓
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8.5px] font-mono font-bold ${task.completed ? "text-gray-600" : "text-yellow-400"}`}>
                            {task.timeSlot}
                          </span>
                        </div>
                        <h6 className={`font-bold text-[10.5px] leading-snug mt-0.5 truncate ${task.completed ? "line-through text-gray-600" : "text-gray-150"}`}>
                          {task.action}
                        </h6>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Claim completion bonus right inside studying room */}
              {roomPlannerTasks.length > 0 && roomPlannerTasks.every(t => t.completed) && (
                <div className="bg-indigo-950/60 border border-indigo-500/30 p-2.5 rounded-xl text-center flex flex-col gap-1 items-center">
                  <span className="text-yellow-400 font-black text-[11px] animate-bounce">🏆 플래너 완주 대박 성공!</span>
                  <p className="text-[9px] text-slate-300">오늘 약속한 모든 정진 목표들을 완벽하게 정복했습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>

      {/* 1:1 라이벌 배틀 오버레이 모달 제거됨 */}

    </div>
  );
}
