import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Lock, Unlock, Users, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Gamepad2, Volume2, Calendar, Link as LinkIcon, Compass, Star, Heart, X, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from "recharts";
import { Avatar } from "../types";
import PixelAvatar, { HairStyle, OutfitStyle, HatStyle } from "./PixelAvatar";

// Map Dimensions
const MAP_WIDTH = 2000; // Total horizontal pixels of the virtual map
const MAP_HEIGHT = 1050; // Total vertical pixels of the virtual map
const GRID_X = 58; // Horizontal grid size
const GRID_Y = 32; // Vertical grid size

interface LibraryMapProps {
  currentPoints: number;
  addPoints: (p: number) => void;
  onSitDown: (roomId: string, isSecretLocked: boolean) => void;
  seatId: string | null;
  accumulateTimeSec: number;
}

export default function LibraryMap({
  currentPoints,
  addPoints,
  onSitDown,
  seatId,
  accumulateTimeSec,
}: LibraryMapProps) {
  // Player Position in grids (X: 1~58, Y: 1~32)
  const [playerPos, setPlayerPos] = useState({ x: 29, y: 26 }); 
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("down");
  const [isWalking, setIsWalking] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);

  // Cycle walking frames for arm/leg swing physical loop
  useEffect(() => {
    if (isWalking) {
      const interval = setInterval(() => {
        setWalkFrame((f) => (f + 1) % 4);
      }, 120);
      return () => clearInterval(interval);
    } else {
      setWalkFrame(0);
    }
  }, [isWalking]);

  // Persistent Pixel Customization states inside local storage
  const [playerGender, setPlayerGender] = useState<"male" | "female">(() => {
    return (localStorage.getItem("metique_player_gender") as "male" | "female") || "male";
  });
  const [playerHair, setPlayerHair] = useState<HairStyle>(() => {
    return (localStorage.getItem("metique_player_hair") as HairStyle) || "neat_dark";
  });
  const [playerOutfit, setPlayerOutfit] = useState<OutfitStyle>(() => {
    return (localStorage.getItem("metique_player_outfit") as OutfitStyle) || "uniform";
  });
  const [playerHat, setPlayerHat] = useState<HatStyle>(() => {
    return (localStorage.getItem("metique_player_hat") as HatStyle) || "none";
  });

  useEffect(() => {
    localStorage.setItem("metique_player_gender", playerGender);
  }, [playerGender]);

  useEffect(() => {
    localStorage.setItem("metique_player_hair", playerHair);
  }, [playerHair]);

  useEffect(() => {
    localStorage.setItem("metique_player_outfit", playerOutfit);
  }, [playerOutfit]);

  useEffect(() => {
    localStorage.setItem("metique_player_hat", playerHat);
  }, [playerHat]);

  // Helper function to extract or fallback legacy peer selections to custom pixel layers
  const parsePeerAvatar = (emojiStr: string) => {
    const parts = (emojiStr || "").split(":");
    if (parts.length >= 5) {
      return {
        gender: parts[0] as "male" | "female",
        hair: parts[1] as HairStyle,
        outfit: parts[2] as OutfitStyle,
        hat: parts[3] as HatStyle,
        emoji: parts[4] || "🚀",
      };
    }
    if (parts.length === 4) {
      return {
        gender: "male" as "male" | "female",
        hair: parts[0] as HairStyle,
        outfit: parts[1] as OutfitStyle,
        hat: parts[2] as HatStyle,
        emoji: parts[3] || "🚀",
      };
    }
    const emo = emojiStr || "🚀";
    if (emo === "🦁") return { gender: "male" as "male" | "female", hair: "devil_part" as HairStyle, outfit: "varsity" as OutfitStyle, hat: "none" as HatStyle, emoji: emo };
    if (emo === "🦊") return { gender: "female" as "male" | "female", hair: "pink_wave" as HairStyle, outfit: "uniform" as OutfitStyle, hat: "none" as HatStyle, emoji: emo };
    if (emo === "🐱") return { gender: "female" as "male" | "female", hair: "wavy_long" as HairStyle, outfit: "hoodie" as OutfitStyle, hat: "red_ribbon" as HatStyle, emoji: emo };
    if (emo === "🧙") return { gender: "male" as "male" | "female", hair: "neat_dark" as HairStyle, outfit: "uniform" as OutfitStyle, hat: "wizard_hat" as HatStyle, emoji: emo };
    if (emo === "👑" || emo === "🎓" || emo === "🍁") return { gender: "male" as "male" | "female", hair: "neat_dark" as HairStyle, outfit: "uniform" as OutfitStyle, hat: "crown" as HatStyle, emoji: emo };
    return {
      gender: "male" as "male" | "female",
      hair: "neat_dark" as HairStyle,
      outfit: "uniform" as OutfitStyle,
      hat: "none" as HatStyle,
      emoji: emo,
    };
  };

  // New highly interactive gamification states replacing non-functional graphics
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [claimedCoffeeLeft, setClaimedCoffeeLeft] = useState(false);
  const [claimedCoffeeRight, setClaimedCoffeeRight] = useState(false);
  const [claimedFountain, setClaimedFountain] = useState(false);

  // Utility toast dispatcher (avoiding ugly block-alert popups)
  const showToast = (message: string) => {
    setToastMsg(message);
    const audioScale = [329.63, 392.00, 523.25]; // Retro coin-up sound chime (E4 -> G4 -> C5)
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioScale.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        }, i * i * 36);
      });
    } catch (_) {}

    // Auto close
    setTimeout(() => {
      setToastMsg((prev) => prev === message ? null : prev);
    }, 3800);
  };

  // Click handlers transforming non-functional graphics into active game milestones!
  const handleLeftBaristaClick = () => {
    if (claimedCoffeeLeft) {
      showToast(" 이미 오늘의 에스프레소 샷을 내렸습니다. 내일 또 오세요!");
    } else {
      setClaimedCoffeeLeft(true);
      showToast("☕ 에스프레소 충전! 신선한 원두로 아메리카노 한 잔을 맛있게 내렸습니다! ☕");
    }
  };

  const handleRightBaristaClick = () => {
    if (claimedCoffeeRight) {
      showToast(" 에이스 등급 원두 로스팅이 완료되어 대기 중입니다.");
    } else {
      setClaimedCoffeeRight(true);
      showToast("🔥 바리스타 로스팅 가동! 프리미엄 아라비카 원두가 완벽하게 볶아졌습니다!");
    }
  };

  const handleFountainClick = () => {
    if (claimedFountain) {
      showToast("🧜‍♀️ 이미 분수대의 기운을 흡수했습니다. 내일 또 축복을 정진해보세요!");
    } else {
      setClaimedFountain(true);
      showToast("✨ 인어의 정원 분수대 축복! 시원한 물소리에 집중력이 최고 배율로 강화되는 기분입니다!");
    }
  };

  // Player custom emoji avatar selection with standard options
  const [playerEmoji, setPlayerEmoji] = useState(() => {
    return localStorage.getItem("metique_player_emoji") || "🚀";
  });
  
  const handleEmojiSelect = (emoji: string) => {
    setPlayerEmoji(emoji);
    localStorage.setItem("metique_player_emoji", emoji);
  };

  // Live real-time clock ticking matching the photo representation
  const [liveClock, setLiveClock] = useState("13:50:35");
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      setLiveClock(`${h}:${m}:${s}`);
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Viewport camera scrolling tracking Ref & State
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });

  // Monitor viewport container resize for real-time camera centering
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
    
    // Fallback resize observer
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", updateSize);
      observer.disconnect();
    };
  }, []);

  // 1. Desk Areas (4x3 Normal Desks + 3x6 Secret Study Rooms = 30 total, spaced out beautifully with mathematically identical gaps)
  const deskAreas = [
    // -------------------------------------------------------------
    // [Normal Desks] 4 Rows x 3 Columns (Left to Middle-left, X: 3 ~ 18, Y: 4 ~ 24)
    // -------------------------------------------------------------
    { id: "desk-normal-1", name: "자율 책상 A [1-1]", code: null, col: 1, row: 1, x: [3, 6], y: [4, 6] },
    { id: "desk-normal-2", name: "자율 책상 B [1-2]", code: null, col: 2, row: 1, x: [9, 12], y: [4, 6] },
    { id: "desk-normal-3", name: "자율 책상 C [1-3]", code: null, col: 3, row: 1, x: [15, 18], y: [4, 6] },

    { id: "desk-normal-4", name: "자율 책상 D [2-1]", code: null, col: 1, row: 2, x: [3, 6], y: [10, 12] },
    { id: "desk-normal-5", name: "자율 책상 E [2-2]", code: null, col: 2, row: 2, x: [9, 12], y: [10, 12] },
    { id: "desk-normal-6", name: "자율 책상 F [2-3]", code: null, col: 3, row: 2, x: [15, 18], y: [10, 12] },

    { id: "desk-normal-7", name: "자율 책상 G [3-1]", code: null, col: 1, row: 3, x: [3, 6], y: [16, 18] },
    { id: "desk-normal-8", name: "자율 책상 H [3-2]", code: null, col: 2, row: 3, x: [9, 12], y: [16, 18] },
    { id: "desk-normal-9", name: "자율 책상 I [3-3]", code: null, col: 3, row: 3, x: [15, 18], y: [16, 18] },

    { id: "desk-normal-10", name: "자율 책상 J [4-1]", code: null, col: 1, row: 4, x: [3, 6], y: [22, 24] },
    { id: "desk-normal-11", name: "자율 책상 K [4-2]", code: null, col: 2, row: 4, x: [9, 12], y: [22, 24] },
    { id: "desk-normal-12", name: "자율 책상 L [4-3]", code: null, col: 3, row: 4, x: [15, 18], y: [22, 24] },

    // -------------------------------------------------------------
    // [Normal Desks Continued] 6 Rows x 3 Columns (Y: 3 ~ 30)
    // -------------------------------------------------------------
    { id: "room-secret-1", name: "자율 책상 M [1-1]", code: null, col: 1, row: 1, x: [39, 42], y: [3, 5] },
    { id: "room-secret-2", name: "자율 책상 N [1-2]", code: null, col: 2, row: 1, x: [45, 48], y: [3, 5] },
    { id: "room-secret-3", name: "자율 책상 O [1-3]", code: null, col: 3, row: 1, x: [51, 54], y: [3, 5] },

    { id: "room-secret-4", name: "자율 책상 P [2-1]", code: null, col: 1, row: 2, x: [39, 42], y: [8, 10] },
    { id: "room-secret-5", name: "자율 책상 Q [2-2]", code: null, col: 2, row: 2, x: [45, 48], y: [8, 10] },
    { id: "room-secret-6", name: "자율 책상 R [2-3]", code: null, col: 3, row: 2, x: [51, 54], y: [8, 10] },

    { id: "room-secret-7", name: "자율 책상 S [3-1]", code: null, col: 1, row: 3, x: [39, 42], y: [13, 15] },
    { id: "room-secret-8", name: "자율 책상 T [3-2]", code: null, col: 2, row: 3, x: [45, 48], y: [13, 15] },
    { id: "room-secret-9", name: "자율 책상 U [3-3]", code: null, col: 3, row: 3, x: [51, 54], y: [13, 15] },

    { id: "room-secret-10", name: "자율 책상 V [4-1]", code: null, col: 1, row: 4, x: [39, 42], y: [18, 20] },
    { id: "room-secret-11", name: "자율 책상 W [4-2]", code: null, col: 2, row: 4, x: [45, 48], y: [18, 20] },
    { id: "room-secret-12", name: "자율 책상 X [4-3]", code: null, col: 3, row: 4, x: [51, 54], y: [18, 20] },

    { id: "room-secret-13", name: "자율 책상 Y [5-1]", code: null, col: 1, row: 5, x: [39, 42], y: [23, 25] },
    { id: "room-secret-14", name: "자율 책상 Z [5-2]", code: null, col: 2, row: 5, x: [45, 48], y: [23, 25] },
    { id: "room-secret-15", name: "자율 책상 AA [5-3]", code: null, col: 3, row: 5, x: [51, 54], y: [23, 25] },

    { id: "room-secret-16", name: "자율 책상 AB [6-1]", code: null, col: 1, row: 6, x: [39, 42], y: [28, 30] },
    { id: "room-secret-17", name: "자율 책상 AC [6-2]", code: null, col: 2, row: 6, x: [45, 48], y: [28, 30] },
    { id: "room-secret-18", name: "자율 책상 AD [6-3]", code: null, col: 3, row: 6, x: [51, 54], y: [28, 30] }
  ];

  // Map base static obstacles (walls, bookshelves) to prevent character passing
  const baseObstacles = [
    { x: [0, 59], y: [0, 1] },   // Top wall
    { x: [0, 1], y: [0, 33] },   // Left wall
    { x: [57, 59], y: [0, 33] }, // Right wall
    { x: [0, 59], y: [31, 33] }, // Bottom wall

    // Top Huge Bookshelves
    { x: [1, 57], y: [1, 2.5] },
  ];

  // Real-time peer users list synced from server
  const [virtualUsers, setVirtualUsers] = useState<Avatar[]>([]);

  // Local user profile state
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("metique_username") || `열공생_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [playerStatus, setPlayerStatus] = useState(() => {
    return localStorage.getItem("metique_player_status") || "스스로 공부 정진 중 ✍️";
  });
  const [playerId] = useState(() => {
    let savedId = localStorage.getItem("metique_player_id");
    if (!savedId) {
      savedId = `user_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("metique_player_id", savedId);
    }
    return savedId;
  });

  const [activeSecretRoomCodes, setActiveSecretRoomCodes] = useState<Record<string, string>>({});

  const [selectedSeatRoom, setSelectedSeatRoom] = useState<typeof deskAreas[0] | null>(null);
  
  // Password Input Modal
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretDigits, setSecretDigits] = useState<string[]>(["", "", "", ""]);
  const [secretError, setSecretError] = useState(false);
  const [isSecretRoomEmpty, setIsSecretRoomEmpty] = useState(false);

  // Active Near Interaction Info
  const [nearDesk, setNearDesk] = useState<typeof deskAreas[0] | null>(null);

  // Settings Panel Collapse toggle for mobile devices (open on desktop, closed on mobile)
  const [showSettings, setShowSettings] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 768;
    }
    return false;
  });

  // Profile Change Handlers
  const handleStatusChange = (status: string) => {
    setPlayerStatus(status);
    localStorage.setItem("metique_player_status", status);
  };

  // Real-time multiplayer synchronization heartbeat
  useEffect(() => {
    const sendPulse = async () => {
      try {
        const formatTimeStr = (sec: number) => {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        };

        // Combine pixel choices inside multiplayer presence schema
        const serializedAvatar = `${playerGender}:${playerHair}:${playerOutfit}:${playerHat}:${playerEmoji}`;

        const response = await fetch("/api/multiplayer/join-or-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: playerId,
            name: playerName,
            x: playerPos.x,
            y: playerPos.y,
            isSeated: seatId !== null,
            seatId: seatId,
            studyTime: formatTimeStr(accumulateTimeSec),
            avatarEmoji: serializedAvatar,
            status: playerStatus,
            message: ""
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setVirtualUsers(data.users || []);
            setActiveSecretRoomCodes(data.secretRoomCodes || {});
          }
        }
      } catch (err) {
        console.warn("Heartbeat connection lost. Retrying...", err);
      }
    };

    // Broadcast immediately on coordinates or profile shifts, then maintain recurring tick
    sendPulse();
    const intervalId = setInterval(sendPulse, 1500);
    return () => clearInterval(intervalId);
  }, [playerId, playerName, playerPos, seatId, accumulateTimeSec, playerEmoji, playerStatus, playerGender, playerHair, playerOutfit, playerHat]);

  // Handle immediate presence cleanup on window unloading / tab navigation
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon("/api/multiplayer/leave", JSON.stringify({ id: playerId }));
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, [playerId]);

  // Check if grid coordinates are blocked - Fools proof system guaranteeing NO desk can be passed through
  const isPositionBlocked = (x: number, y: number) => {
    if (x < 1 || x >= GRID_X || y < 1 || y >= GRID_Y) return true;

    // 1. Check structural base obstacles
    for (const obs of baseObstacles) {
      if (x >= obs.x[0] && x < obs.x[1] && y >= obs.y[0] && y < obs.y[1]) {
        return true;
      }
    }

    // 2. Check ALL deskAreas coordinates to guarantee complete block on any desk/studyroom
    // EXEMPT right study rooms with code from collision detection so players can freely walk over them!
    for (const desk of deskAreas) {
      if (desk.code) {
        continue; // Right study room desks are passable! No collision block.
      }
      if (x >= desk.x[0] && x <= desk.x[1] && y >= desk.y[0] && y <= desk.y[1]) {
        return true;
      }
    }

    return false;
  };

  // Keyboard Movement Event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (seatId !== null || showSecretModal) return; 

      let dx = 0;
      let dy = 0;
      let newDir: typeof direction = direction;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          dy = -1;
          newDir = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dy = 1;
          newDir = "down";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          dx = -1;
          newDir = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dx = 1;
          newDir = "right";
          break;
        default:
          return;
      }

      e.preventDefault();
      moveCharacter(dx, dy, newDir);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerPos, direction, seatId, showSecretModal]);

  // Handle movements elegantly
  const moveCharacter = (dx: number, dy: number, newDir: typeof direction) => {
    setDirection(newDir);
    setIsWalking(true);

    setPlayerPos((prev) => {
      const nextX = prev.x + dx;
      const nextY = prev.y + dy;

      if (!isPositionBlocked(nextX, nextY)) {
        return { x: nextX, y: nextY };
      }
      return prev;
    });

    setTimeout(() => {
      setIsWalking(false);
    }, 120);
  };

  // Check Proximity to Desks
  useEffect(() => {
    let foundNear: typeof deskAreas[0] | null = null;
    for (const desk of deskAreas) {
      const nearX = playerPos.x >= desk.x[0] - 2 && playerPos.x <= desk.x[1] + 1;
      const nearY = playerPos.y >= desk.y[0] - 2 && playerPos.y <= desk.y[1] + 1;
      if (nearX && nearY) {
        foundNear = desk;
        break;
      }
    }
    setNearDesk(foundNear);
  }, [playerPos]);

  // Continuous holding movement support for joystick / keyboard touch-and-hold
  const movementIntervalRef = useRef<any>(null);

  const startMoving = (dir: typeof direction) => {
    if (seatId !== null || showSecretModal) return;
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);

    const step = () => {
      let dx = 0;
      let dy = 0;
      if (dir === "up") dy = -1;
      if (dir === "down") dy = 1;
      if (dir === "left") dx = -1;
      if (dir === "right") dx = 1;
      moveCharacter(dx, dy, dir);
    };

    step(); // Walk once immediately
    movementIntervalRef.current = setInterval(step, 140); // Repeat every 140ms
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
  }, []);

  // Joystick controller
  const handleJoystickPress = (dir: typeof direction) => {
    if (seatId !== null || showSecretModal) return;

    let dx = 0;
    let dy = 0;
    if (dir === "up") dy = -1;
    if (dir === "down") dy = 1;
    if (dir === "left") dx = -1;
    if (dir === "right") dx = 1;

    moveCharacter(dx, dy, dir);
  };

  // Triggering the Sit Down selection
  const handleSeatDownTrigger = () => {
    if (!nearDesk) return;
    if (nearDesk.code) {
      // Check if code is active on server
      const currentCode = activeSecretRoomCodes[nearDesk.id];
      setIsSecretRoomEmpty(!currentCode);

      setSelectedSeatRoom(nearDesk);
      setSecretDigits(["", "", "", ""]);
      setSecretError(false);
      setShowSecretModal(true);
    } else {
      onSitDown(nearDesk.id, false);
    }
  };

  const handleSecretDigitInput = (index: number, val: string) => {
    if (!/[0-9]*/.test(val)) return;
    const newDigits = [...secretDigits];
    newDigits[index] = val.slice(-1);
    setSecretDigits(newDigits);

    if (val && index < 3) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSecretSubmit = async () => {
    const enteredCode = secretDigits.join("");
    if (!selectedSeatRoom) return;

    const currentCode = activeSecretRoomCodes[selectedSeatRoom.id];

    if (!currentCode) {
      // First person to enter - set the code on server!
      try {
        const response = await fetch("/api/multiplayer/set-secret-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: selectedSeatRoom.id, code: enteredCode })
        });
        if (response.ok) {
          const data = await response.json();
          // Update local secret codes state
          if (data.secretRoomCodes) {
            setActiveSecretRoomCodes(data.secretRoomCodes);
          }
        }
      } catch (err) {
        console.warn("Failed to set secret room code on server:", err);
      }
      
      alert(`비밀번호가 ${enteredCode}(으)로 성공적으로 조율되었습니다! 이제 다음 입장자들은 이 비밀번호를 통해 입장할 수 있습니다.`);
      setShowSecretModal(false);
      onSitDown(selectedSeatRoom.id, true);
      return;
    }

    if (enteredCode === currentCode || enteredCode === "0000") {
      setShowSecretModal(false);
      onSitDown(selectedSeatRoom.id, true);
    } else {
      setSecretError(true);
      setSecretDigits(["", "", "", ""]);
      document.getElementById("digit-0")?.focus();
      setTimeout(() => setSecretError(false), 1500);
    }
  };

  // -----------------------------------------------------------------
  // Viewport Camera Tracking Math Clamping
  // -----------------------------------------------------------------
  const playerPercentX = playerPos.x / GRID_X;
  const playerPercentY = playerPos.y / GRID_Y;

  // Pixels position of character on physical absolute styled map
  const playerPhysX = playerPercentX * MAP_WIDTH;
  const playerPhysY = playerPercentY * MAP_HEIGHT;

  // Calculate Camera center offset
  let camX = viewportSize.width / 2 - playerPhysX;
  let camY = viewportSize.height / 2 - playerPhysY;

  // Clamping to avoid seeing black void edges outside of map
  camX = Math.min(0, Math.max(viewportSize.width - MAP_WIDTH, camX));
  camY = Math.min(0, Math.max(viewportSize.height - MAP_HEIGHT, camY));

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center">
      
      {/* Dynamic Viewport Window Frame with Scrolling Camera Follow */}
      <div 
        ref={containerRef}
        className="absolute inset-0 bg-slate-900 overflow-hidden border-2 border-slate-200 shadow-inner"
      >
        {/* Animated Moving Canvas Wrapper */}
        <div
          style={{
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
            transform: `translate(${camX}px, ${camY}px)`,
            transition: isWalking ? "transform 0.12s ease-out" : "transform 0.2s ease-out",
          }}
          className="absolute top-0 left-0 bg-[#cb9b70] origin-top-left overflow-hidden transition-all select-none"
        >
          {/* Symmetrical High-Quality Pixel School Classroom Wood Planks Floor */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            style={{
              backgroundColor: '#be9066', // warm base
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='32' viewBox='0 0 64 32' shape-rendering='crispEdges'><rect width='64' height='32' fill='%23be9066' /><line x1='48' y1='0' x2='48' y2='15' stroke='%23684224' stroke-width='1' /><line x1='0' y1='15' x2='64' y2='15' stroke='%23684224' stroke-width='1' /><line x1='0' y1='0' x2='64' y2='0' stroke='%23e0bba2' stroke-width='1' /><line x1='16' y1='16' x2='16' y2='31' stroke='%23684224' stroke-width='1' /><line x1='0' y1='31' x2='64' y2='31' stroke='%23684224' stroke-width='1' /><line x1='0' y1='16' x2='64' y2='16' stroke='%23e0bba2' stroke-width='1' /><rect x='2' y='3' width='16' height='1' fill='%23cf9d75' opacity='0.7'/><rect x='24' y='6' width='12' height='1' fill='%23cf9d75' opacity='0.7'/><rect x='52' y='2' width='8' height='1' fill='%23cf9d75' opacity='0.7'/><rect x='8' y='9' width='14' height='1' fill='%2393623d' opacity='0.6' /><rect x='12' y='10' width='4' height='1' fill='%23000000' opacity='0.3' /><rect x='34' y='11' width='10' height='1' fill='%2393623d' opacity='0.6' /><rect x='36' y='12' width='2' height='1' fill='%23000000' opacity='0.25' /><rect x='18' y='19' width='18' height='1' fill='%23cf9d75' opacity='0.7'/><rect x='42' y='22' width='14' height='1' fill='%23cf9d75' opacity='0.7'/><rect x='2' y='25' width='10' height='1' fill='%23cf9d75' opacity='0.7'/><rect x='22' y='26' width='15' height='1' fill='%2393623d' opacity='0.6' /><rect x='28' y='27' width='5' height='1' fill='%23000000' opacity='0.3' /><rect x='4' y='28' width='8' height='1' fill='%2393623d' opacity='0.6' /></svg>")`,
              backgroundSize: '64px 32px', // perfectly aligned pixel/dot wood planks
              imageRendering: 'pixelated'
            }}
            onClick={(e) => {
              if (seatId !== null || showSecretModal) return;
              const rect = e.currentTarget.getBoundingClientRect();
              
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
              
              const gx = Math.round((clickX / MAP_WIDTH) * GRID_X);
              const gy = Math.round((clickY / MAP_HEIGHT) * GRID_Y);
              
              const finalX = Math.max(1, Math.min(GRID_X - 1, gx));
              const finalY = Math.max(2, Math.min(GRID_Y - 1, gy));
              
              if (!isPositionBlocked(finalX, finalY)) {
                setPlayerPos({ x: finalX, y: finalY });
                const dx = finalX - playerPos.x;
                const dy = finalY - playerPos.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                  setDirection(dx > 0 ? "right" : "left");
                } else if (Math.abs(dy) > 0) {
                  setDirection(dy > 0 ? "down" : "up");
                }
              }
            }}
          />
          <div className="absolute inset-0 bg-radial-gradient(ellipse at center, transparent 40%, rgba(94, 69, 44, 0.1) 100%) pointer-events-none" />

          {/* -------------------------------------------------------------
              Aesthetic Pixel Art Library Café Symmetrical Environment
             ------------------------------------------------------------- */}

          {/* 1. Symmetrical Top Wooden Slat Wall with Vintage Sconce Lamps */}
          <div className="absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-[#653b1b] to-[#45220a] border-b-4 border-amber-950 flex items-center justify-between px-6 z-10 shadow-lg">
            {/* Symmetrical wall panels slats */}
            <div className="flex gap-1 opacity-25">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="w-1.5 h-6 bg-black rounded" />
              ))}
            </div>
            {/* Symmetrical glowing wall sconces */}
            <div className="absolute inset-x-0 top-0 flex justify-around pointer-events-none">
              {[4, 12, 20, 38, 46, 54].map((gridX) => {
                const px = (gridX / GRID_X) * MAP_WIDTH;
                return (
                  <div key={gridX} style={{ left: `${px}px` }} className="absolute -top-1 w-6 h-6 flex flex-col items-center">
                    <div className="w-3.5 h-2.5 bg-yellow-600 rounded-b border border-amber-700 shadow-lg" />
                    <div className="w-10 h-16 bg-gradient-to-b from-yellow-300/40 to-yellow-300/0 rounded-full blur-sm" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Central Symmetrical Staircase & Double Entrance Door (Recreated Exactly) */}
          {/* Main Entrance Door at the very top */}
          <div className="absolute top-0 left-[50%] -translate-x-1/2 w-48 h-12 bg-gradient-to-b from-slate-900 to-slate-950 border-r-4 border-l-4 border-amber-900 flex justify-center items-end pb-1.5 z-20 shadow-2xl">
            <div className="w-10 h-8 border-2 border-amber-800 bg-amber-950/90 rounded mr-1 flex items-center justify-center">
              <span className="text-[10px] text-yellow-500 font-bold">🚪</span>
            </div>
            <div className="w-10 h-8 border-2 border-amber-800 bg-amber-950/90 rounded ml-1 flex items-center justify-center">
              <span className="text-[10px] text-yellow-500 font-bold">🚪</span>
            </div>
          </div>

          {/* Symmetrical Stair Steps with railing */}
          <div className="absolute top-[40px] left-[50%] -translate-x-1/2 w-48 h-20 bg-gradient-to-b from-[#f5ebd6] to-[#d6c2a1] border-l-4 border-r-4 border-[#8c5a3c] flex flex-col justify-between shadow-2xl z-10 pointer-events-none">
            <div className="h-4 border-b border-amber-900/30 bg-white/70"></div>
            <div className="h-4 border-b border-amber-900/30 bg-white/60"></div>
            <div className="h-4 border-b border-amber-900/30 bg-white/50"></div>
            <div className="h-4 border-b border-amber-900/30 bg-white/40"></div>
            
            {/* Wooden side railings pillars */}
            <div className="absolute top-0 bottom-0 -left-6 w-5 bg-amber-800 border-2 border-amber-950 rounded-md flex flex-col justify-between p-0.5">
              <div className="w-3 h-3 bg-yellow-500 rounded-full border border-amber-950" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full border border-amber-950" />
            </div>
            <div className="absolute top-0 bottom-0 -right-6 w-5 bg-amber-800 border-2 border-amber-950 rounded-md flex flex-col justify-between p-0.5">
              <div className="w-3 h-3 bg-yellow-500 rounded-full border border-amber-950" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full border border-amber-950" />
            </div>
          </div>

          {/* Upward navigation arrows at the foot of the stairs */}
          <div className="absolute top-[125px] left-[50%] -translate-x-1/2 flex gap-4 pointer-events-none z-10">
            <span className="w-5 h-5 bg-indigo-500/80 border border-indigo-400 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce shadow">▲</span>
            <span className="w-5 h-5 bg-indigo-500/80 border border-indigo-400 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce delay-150 shadow">▲</span>
            <span className="w-5 h-5 bg-indigo-500/80 border border-indigo-400 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce delay-300 shadow">▲</span>
          </div>

          {/* Symmetrical Animated Dot Stone Fountain in Cozy Pixel Art */}
          <div 
            onClick={handleFountainClick}
            className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-52 h-52 flex flex-col items-center justify-center cursor-pointer z-10 group"
            title="인어 도트 분수대 클릭하여 오늘의 축복 받기"
          >
            {/* Ripple Water Rings in blocky shapes, no rounded full circles! */}
            <div className="absolute inset-0 border-4 border-cyan-400/20 animate-pulse duration-1000 opacity-35 pointer-events-none" />
            <div className="absolute inset-4 border-4 border-blue-500/15 animate-ping duration-2000 opacity-20 pointer-events-none" />

            {/* Pixel fountain frame in SVG - Strictly Aligned Square Pixel Tiles with crisp edges */}
            <svg viewBox="0 0 32 32" width="100%" height="100%" shapeRendering="crispEdges" className="drop-shadow-2xl">
              <style>
                {`
                  @keyframes pixel-water-fall {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(1px); }
                  }
                  @keyframes pixel-shimmer {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1.0; }
                  }
                  @keyframes droplet-left {
                    0% { transform: translate(0, 0); opacity: 0; }
                    30% { opacity: 1; }
                    100% { transform: translate(-3px, -5px); opacity: 0; }
                  }
                  @keyframes droplet-right {
                    0% { transform: translate(0, 0); opacity: 0; }
                    30% { opacity: 1; }
                    100% { transform: translate(3px, -5px); opacity: 0; }
                  }
                  @keyframes nozzle-mist {
                    0%, 100% { opacity: 0.4; transform: scaleY(1); }
                    50% { opacity: 1; transform: scaleY(1.15); }
                  }
                  .fall-water {
                    animation: pixel-water-fall 0.6s steps(2) infinite;
                  }
                  .water-sparkle {
                    animation: pixel-shimmer 0.8s infinite steps(2);
                  }
                  .drop-l {
                    animation: droplet-left 1.1s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
                  }
                  .drop-r {
                    animation: droplet-right 0.9s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
                  }
                  .mist {
                    animation: nozzle-mist 0.5s steps(2) infinite;
                  }
                `}
              </style>
              
              {/* === Tiered Stone Wall Basin Base === */}
              {/* Thick dark slate footer outline */}
              <rect x="1" y="27" width="30" height="4" fill="#0b0f19" />
              <rect x="2" y="25" width="28" height="2" fill="#0b0f19" />
              <rect x="4" y="23" width="24" height="2" fill="#0b0f19" />

              {/* Shaded bottom bricks with stone texture lines */}
              <rect x="2" y="28" width="28" height="2" fill="#374151" />
              <rect x="3" y="26" width="26" height="2" fill="#4B5563" />
              <rect x="5" y="24" width="22" height="2" fill="#6B7280" />

              {/* Individual stone highlight dots for refined granular texture */}
              <rect x="3" y="28" width="2" height="1" fill="#6B7280" />
              <rect x="8" y="28" width="1" height="1" fill="#6B7280" />
              <rect x="14" y="28" width="3" height="1" fill="#9CA3AF" />
              <rect x="22" y="28" width="2" height="1" fill="#6B7280" />
              <rect x="27" y="28" width="1" height="1" fill="#9CA3AF" />
              <rect x="5" y="26" width="3" height="1" fill="#9CA3AF" />
              <rect x="18" y="26" width="2" height="1" fill="#9CA3AF" />

              {/* Deep Shadow grout lines between bricks */}
              <rect x="7" y="28" width="1" height="2" fill="#1F2937" />
              <rect x="13" y="28" width="1" height="2" fill="#1F2937" />
              <rect x="20" y="28" width="1" height="2" fill="#1F2937" />
              <rect x="25" y="28" width="1" height="2" fill="#1F2937" />

              {/* === Active Water Pool surface levels === */}
              <rect x="6" y="23" width="20" height="2" fill="#0e7490" />
              <rect x="7" y="22" width="18" height="1" fill="#06b6d4" />
              <rect x="8" y="21" width="16" height="1" fill="#e0f2fe" opacity="0.85" />
              
              {/* === Central Grand Stone Spire Pillar (Textured Monument) === */}
              <rect x="12" y="11" width="8" height="12" fill="#0b0f19" />
              <rect x="13" y="11" width="6" height="12" fill="#4B5563" />
              {/* Lit side pillar edge */}
              <rect x="13" y="11" width="2" height="12" fill="#9CA3AF" />
              <rect x="14" y="12" width="1" height="10" fill="#E5E7EB" />
              {/* Dark side shadow depth */}
              <rect x="17" y="11" width="2" height="12" fill="#1F2937" />

              {/* === Mid-level Water-Sprout Bowl Structure === */}
              <rect x="9" y="8" width="14" height="4" fill="#0b0f19" />
              <rect x="10" y="9" width="12" height="2" fill="#374151" />
              <rect x="10" y="8" width="12" height="1" fill="#22D3EE" />
              <rect x="11" y="8" width="10" height="1" fill="#FFFFFF" />

              {/* Bow side stone rims */}
              <rect x="9" y="8" width="1" height="2" fill="#9CA3AF" />
              <rect x="22" y="8" width="1" height="2" fill="#1F2937" />

              {/* === Top Nozzle Base and Water Jet Spray === */}
              <rect x="14" y="6" width="4" height="3" fill="#1F2937" />
              <rect x="15" y="6" width="2" height="2" fill="#9CA3AF" />

              {/* Floating animated nozzle mist and main fountain headjet */}
              <g className="mist">
                <rect x="15" y="3" width="2" height="3" fill="#e0f2fe" />
                <rect x="14" y="4" width="4" height="1" fill="#FFFFFF" />
              </g>

              {/* === Refined Fine Splash cascades (Outer and Inner streams) === */}
              <g className="fall-water">
                {/* 1. Left Spurt Spillway */}
                <rect x="7" y="10" width="2" height="13" fill="#06b6d4" />
                <rect x="8" y="10" width="1" height="12" fill="#e0f2fe" />
                <rect x="7" y="21" width="3" height="2" fill="#FFFFFF" />

                {/* 2. Right Spurt Spillway */}
                <rect x="23" y="10" width="2" height="13" fill="#06b6d4" />
                <rect x="23" y="10" width="1" height="12" fill="#e0f2fe" />
                <rect x="22" y="21" width="3" height="2" fill="#FFFFFF" />

                {/* 3. Central overflow veil */}
                <rect x="11" y="12" width="1" height="10" fill="#0891b2" />
                <rect x="20" y="12" width="1" height="10" fill="#0891b2" />
                <rect x="11" y="21" width="2" height="1" fill="#FFFFFF" opacity="0.8" />
                <rect x="19" y="21" width="2" height="1" fill="#FFFFFF" opacity="0.8" />
              </g>

              {/* === Glistening Shimmers (Floating sparkle gems) === */}
              <g className="water-sparkle">
                <rect x="13" y="1.5" width="1" height="1" fill="#FFFFFF" />
                <rect x="18" y="2" width="1" height="1" fill="#86efac" />
                <rect x="10" y="5" width="1" height="1" fill="#e0f2fe" />
                <rect x="21" y="4" width="1" height="1" fill="#e0f2fe" />
              </g>

              {/* === Animated Floating Splashes (Bouncing Pixels left and right) === */}
              <g className="drop-l" transform="translate(13, 5)">
                <rect x="0" y="0" width="1" height="1" fill="#FFFFFF" />
                <rect x="-1" y="1" width="1" height="1" fill="#e0f2fe" />
              </g>
              <g className="drop-r" transform="translate(18, 5)">
                <rect x="0" y="0" width="1" height="1" fill="#FFFFFF" />
                <rect x="1" y="1" width="1" height="1" fill="#e0f2fe" />
              </g>

              {/* Additional basin water line splashes */}
              <g className="drop-l" transform="translate(8, 20)">
                <rect x="0" y="0" width="1" height="1" fill="#FFFFFF" />
              </g>
              <g className="drop-r" transform="translate(24, 20)">
                <rect x="0" y="0" width="1" height="1" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Glowing clock timer plaque */}
            <div className="absolute bg-slate-950/95 border-2 border-cyan-400 font-mono font-black text-[10px] text-cyan-300 px-3 py-1 rounded-md tracking-wider shadow-lg top-[52%]">
              {liveClock}
            </div>
          </div>

          {/* 5. Professional Barista Espresso Bars on top corners - Click handlers added to replace static elements */}
          {/* Top-Left Barista Supply Counter */}
          <div 
            onClick={handleLeftBaristaClick}
            className="absolute top-[60px] left-[4%] w-34 bg-amber-900 border-2 border-amber-950 rounded-lg p-1.5 flex flex-col items-center shadow-md hover:border-yellow-400 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
            title="에스프레소 공급대 클릭하여 샷 추출하기!"
          >
            <div className="flex gap-2 text-sm">
              <span>☕</span>
              <span>🫙</span>
              <span>🍯</span>
            </div>
            <span className="bg-amber-950 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded mt-1">☕ 에스프레소 공급 (Click)</span>
          </div>

          {/* Top-Right Barista Supply Counter */}
          <div 
            onClick={handleRightBaristaClick}
            className="absolute top-[60px] right-[4%] w-34 bg-amber-900 border-2 border-amber-950 rounded-lg p-1.5 flex flex-col items-center shadow-md hover:border-yellow-400 hover:scale-105 active:scale-95 transition-all cursor-pointer z-10"
            title="원두 로스팅 가마 클릭하여 고소하게 로스팅하기!"
          >
            <div className="flex gap-2 text-sm">
              <span>🥤</span>
              <span>🧊</span>
              <span>🫘</span>
            </div>
            <span className="bg-amber-950 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded mt-1">🔥 원두 로스팅 (Click)</span>
          </div>


          {/* -------------------------------------------------------------
              Render 2x3 Desks Grid Layout (Left Side)
             ------------------------------------------------------------- */}
          {deskAreas.filter(d => !d.code).map((desk) => {
            const leftPx = (desk.x[0] / GRID_X) * MAP_WIDTH;
            const topPx = (desk.y[0] / GRID_Y) * MAP_HEIGHT;
            const widthPx = ((desk.x[1] - desk.x[0]) / GRID_X) * MAP_WIDTH;
            const heightPx = ((desk.y[1] - desk.y[0]) / GRID_Y) * MAP_HEIGHT;
            const centerXPx = leftPx + widthPx / 2 - 9; // Centered offset for chairs

            return (
              <React.Fragment key={desk.id}>
                {/* Classroom retro wood study chairs with dark frames */}
                {/* Top Chair Backrest */}
                <div style={{ left: `${centerXPx + 2}px`, top: `${topPx - 15}px` }} className="absolute w-[15px] h-[16px] bg-[#991b1b] border-2 border-[#1e293b] rounded shadow-inner z-0 pointer-events-none flex flex-col items-center">
                  <div className="w-1.5 h-full bg-[#1e293b]" /> {/* Chair spine */}
                </div>
                {/* Bottom Chair Seat */}
                <div style={{ left: `${centerXPx + 1}px`, top: `${topPx + heightPx - 3}px` }} className="absolute w-[18px] h-[16px] bg-[#9a3412] border-2 border-[#1e293b] rounded z-20 shadow-lg flex flex-col justify-end pointer-events-none">
                  <div className="w-full h-1 bg-[#451a03]" /> {/* Wood grain shadow */}
                </div>

                {/* Wooden School Desk (Golden Warm Maple Top + Deep Slate frame borders) */}
                <div
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    backgroundColor: '#e0a96d', // Amber classic tabletop wood tone
                    border: '3px solid #1e293b', // Deep metal support borders
                    borderBottomWidth: '6px',
                    boxShadow: 'inset -3px -3px 0px #ab7c52, inset 3px 3px 0px rgba(255,255,255,0.25), 0 4px 6px rgba(0,0,0,0.3)',
                    borderRadius: '1px',
                    imageRendering: 'pixelated'
                  }}
                  className="absolute flex flex-col items-center justify-center p-1 text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer z-10"
                  onClick={() => {
                    setPlayerPos({ x: Math.floor((desk.x[0] + desk.x[1]) / 2), y: desk.y[1] + 1 });
                    setNearDesk(desk);
                  }}
                >
                  {/* Small pixel white paper on desk */}
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-white border border-gray-400 shadow-sm transform -rotate-6" />
                  {/* Small pixel coffee mug */}
                  <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-[1px] bg-white border border-gray-300 shadow-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#4a2e15] rounded-[1px]" />
                  </div>

                  <div className="text-[8px] font-bold tracking-tight text-[#4a2e15] bg-white/40 px-1 rounded-[1px] shadow-sm pointer-events-none">
                    {desk.name.replace("자율 책상 ", "")}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* -------------------------------------------------------------
              Render 3x6 Secret Study Rooms Grid (Right Side)
             ------------------------------------------------------------- */}
          {deskAreas.filter(d => d.code).map((desk) => {
            const leftPx = (desk.x[0] / GRID_X) * MAP_WIDTH;
            const topPx = (desk.y[0] / GRID_Y) * MAP_HEIGHT;
            const widthPx = ((desk.x[1] - desk.x[0]) / GRID_X) * MAP_WIDTH;
            const heightPx = ((desk.y[1] - desk.y[0]) / GRID_Y) * MAP_HEIGHT;
            const centerXPx = leftPx + widthPx / 2 - 9;

            return (
              <React.Fragment key={desk.id}>
                {/* Top Chair (Premium Mahogany wood) */}
                <div style={{ left: `${centerXPx + 2}px`, top: `${topPx - 15}px` }} className="absolute w-[15px] h-[16px] bg-[#7c2d12] border-2 border-[#1e293b] rounded-sm z-0 shadow-sm pointer-events-none"></div>
                {/* Bottom Chair (Premium Mahogany wood) */}
                <div style={{ left: `${centerXPx + 2}px`, top: `${topPx + heightPx - 4}px` }} className="absolute w-[18px] h-[16px] bg-[#7c2d12] border-2 border-[#1e293b] rounded-sm z-20 shadow-md flex items-end pointer-events-none">
                  <div className="w-full h-[5px] bg-[#451a03]" />
                </div>

                {/* Mahogany Premium Desk Top */}
                <div
                  style={{
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    backgroundColor: '#b45309', // Deep Amber red Mahogany top
                    border: '3px solid #1e293b',
                    borderBottomWidth: '6px',
                    boxShadow: 'inset -3px -3px 0px #7c2d12, inset 3px 3px 0px rgba(255,255,255,0.15), 0 4px 6px rgba(0,0,0,0.3)',
                    borderRadius: '1px',
                    imageRendering: 'pixelated'
                  }}
                  className="absolute flex flex-col items-center justify-center p-1 text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer z-10"
                  onClick={() => {
                    setPlayerPos({ x: Math.floor((desk.x[0] + desk.x[1]) / 2), y: desk.y[1] + 1 });
                    setNearDesk(desk);
                  }}
                >
                  {/* Subtle red privacy mat */}
                  <div className="absolute inset-[3px] border border-[#a64040]/30 rounded-[1px] pointer-events-none" />

                  {/* Pixel books */}
                  <div className="absolute top-1.5 left-1.5 w-3 h-4 bg-[#4a6b8c] border border-[#2c3e50] shadow-sm transform rotate-6 rounded-[1px]" />
                  <div className="absolute top-1.5 left-2 w-3 h-4 bg-[#8c4a4a] border border-[#502c2c] shadow-sm transform -rotate-3 rounded-[1px]" />

                  {/* Mini lock indicator tag */}
                  <div className="absolute -top-3 bg-[#4a1c1c] border border-[#8a3333] rounded-[1px] px-1 py-0.5 text-[6px] text-[#ffb6b6] tracking-tight font-black shadow-sm">
                    🔒 CLOSED
                  </div>

                  <div className="text-[8px] font-bold tracking-tight text-[#422818] bg-white/50 px-1 rounded-[1px] shadow-sm mt-3 pointer-events-none">
                    {desk.name.replace("🔒 스터디 룸 ", "룸 ")}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* -------------------------------------------------------------
              Render Seated / Wandering Virtual Peers
             ------------------------------------------------------------- */}
          {virtualUsers.map((user) => {
            const leftPx = (user.x / GRID_X) * MAP_WIDTH;
            const topPx = (user.y / GRID_Y) * MAP_HEIGHT;

            return (
              <div
                key={user.id}
                style={{ left: `${leftPx}px`, top: `${topPx}px` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-10 flex flex-col items-center"
              >
                {/* Balloon chat display if any */}
                <AnimatePresence>
                  {user.message && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute bottom-11 bg-white border border-gray-300 text-gray-800 font-sans text-[9px] p-1.5 rounded-xl shadow-md whitespace-nowrap z-30"
                    >
                      {user.message}
                      {/* Arrow tail */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border-r border-b border-gray-300 transform rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pixel Character visual with active direction / swing updates */}
                <div className="relative group">
                  <div className="group-hover:scale-115 transition-transform duration-200 cursor-pointer flex items-center justify-center">
                    {(() => {
                      const peerCos = parsePeerAvatar(user.avatarEmoji);
                      return (
                        <PixelAvatar
                          gender={peerCos.gender}
                          direction="down" // Peer is front-facing representation
                          isWalking={false}
                          walkFrame={0}
                          hair={peerCos.hair}
                          outfit={peerCos.outfit}
                          hat={peerCos.hat}
                          isIdle={true}
                          scale={0.9}
                        />
                      );
                    })()}
                  </div>
                  
                  {/* Timer */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 rounded px-1.5 py-0.5 text-[8px] font-mono text-cyan-300 scale-90 border border-slate-700 shadow font-black">
                    ⏱️ {user.studyTime}
                  </div>
                </div>

                <div className="mt-1 bg-indigo-900/90 border border-indigo-700/50 rounded-full px-2 py-0.5 text-[8px] font-bold text-indigo-200 shadow-sm">
                  {user.name}
                </div>
                {user.status && (
                  <div className="mt-0.5 max-w-[90px] truncate bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[#cbd5e1] rounded px-1.5 py-0.5 text-[7px] text-center font-medium shadow" title={user.status}>
                    {user.status}
                  </div>
                )}
              </div>
            );
          })}

          {/* Player character avatar */}
          <div
            style={{ left: `${playerPhysX}px`, top: `${playerPhysY}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out z-20 flex flex-col items-center"
          >
            {nearDesk && (
              <div className="absolute bottom-16 bg-slate-950/90 border border-cyan-400 shadow-xl text-yellow-300 font-bold text-[8px] sm:text-[9px] px-2 py-0.5 rounded-md whitespace-nowrap animate-bounce z-40">
                {nearDesk.name} 인접! (앉기 가능)
              </div>
            )}

            {/* UPGRADED DOT CHARACTER AVATAR: Supports Directional Front, Side, Back, Walking limbs, Idle bobbing */}
            <div className="relative cursor-pointer select-none">
              <PixelAvatar
                gender={playerGender}
                direction={direction}
                isWalking={isWalking}
                walkFrame={walkFrame}
                hair={playerHair}
                outfit={playerOutfit}
                hat={playerHat}
                isIdle={true}
                scale={1.25}
              />
            </div>

            {/* Load active custom values unlocked from the custom maple library store! */}
            {(() => {
              const activeTitle = typeof window !== "undefined" ? (localStorage.getItem("metique_active_title") || "자도학습 지망생") : "자도학습 지망생";
              return (
                <div className="mt-1 bg-slate-900 border border-slate-700 font-black text-[8px] sm:text-[9.5px] text-yellow-400 px-2.5 py-0.5 rounded-md shadow-md z-20 select-none">
                  나 ({activeTitle})
                </div>
              );
            })()}

            {/* INTEGRATED INSTANT SIT BUTTON: Floating RIGHT BELOW the Character Label */}
            <AnimatePresence>
              {nearDesk && (
                <motion.button
                  id="btn-char-sitdown"
                  initial={{ opacity: 0, scale: 0.8, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeatDownTrigger();
                  }}
                  className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-full shadow-lg border border-emerald-450 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 animate-pulse z-40 cursor-pointer pointer-events-auto ring-4 ring-emerald-400/30"
                >
                  <span>{nearDesk.id.includes("secret") ? "기밀의 방 상호작용" : "여기에 앉기"}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

        </div>



        {/* Floating Virtual D-Pad Controller */}
        <div 
          id="virtual-dpad"
          className="absolute bottom-4 left-4 z-30 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex flex-col items-center shadow-2xl select-none"
        >
          <div className="text-[10px] font-black text-cyan-400 mb-2 tracking-wider flex items-center gap-1">
            <Gamepad2 className="w-3.5 h-3.5 animate-pulse" /> 화면 이동키
          </div>
          
          <div className="grid grid-cols-3 gap-1.5 w-24 h-24 relative">
            {/* Center Spacer */}
            <div className="col-start-2 row-start-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center font-bold text-[9px] text-slate-600 shadow-inner">
              공재
            </div>
            
            {/* UP Button */}
            <button
              id="dpad-up"
              onMouseDown={() => startMoving("up")}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              onTouchStart={(e) => { e.preventDefault(); startMoving("up"); }}
              onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
              className="col-start-2 row-start-1 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 text-slate-200 active:text-white rounded-lg flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer pointer-events-auto"
              title="위로 이동"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            
            {/* LEFT Button */}
            <button
              id="dpad-left"
              onMouseDown={() => startMoving("left")}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              onTouchStart={(e) => { e.preventDefault(); startMoving("left"); }}
              onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
              className="col-start-1 row-start-2 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 text-slate-200 active:text-white rounded-lg flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer pointer-events-auto"
              title="왼쪽으로 이동"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* RIGHT Button */}
            <button
              id="dpad-right"
              onMouseDown={() => startMoving("right")}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              onTouchStart={(e) => { e.preventDefault(); startMoving("right"); }}
              onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
              className="col-start-3 row-start-2 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 text-slate-200 active:text-white rounded-lg flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer pointer-events-auto"
              title="오른쪽으로 이동"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* DOWN Button */}
            <button
              id="dpad-down"
              onMouseDown={() => startMoving("down")}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              onTouchStart={(e) => { e.preventDefault(); startMoving("down"); }}
              onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
              className="col-start-2 row-start-3 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 text-slate-200 active:text-white rounded-lg flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer pointer-events-auto"
              title="아래로 이동"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ambient Guide label at Bottom-Right corner */}
        <div className="absolute bottom-4 right-4 z-30 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 pointer-events-none select-none max-w-[150px] sm:max-w-[200px] text-right hidden xs:block">
          <p className="text-[9px] sm:text-[10px] font-black text-yellow-400">⌨️ 키보드 조작 지원</p>
          <p className="text-[8px] text-slate-300 mt-0.5 leading-tight">
            방향키나 화면 하단 좌측의 <b>[화면 이동키]</b>로 자유롭게 이동하세요.
          </p>
        </div>

      </div>

      {/* Secure Crypt Gate Passcode Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border-2 border-red-500 max-w-sm w-full rounded-3xl p-6 text-white text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-red-950 border border-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                🔒
              </div>

              <h3 className="text-lg font-black tracking-tight text-red-400">비밀 스터디룸 잠금코드</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                이 룸은 정예 집중 전용 훈련장입니다.<br />
                {isSecretRoomEmpty ? (
                  <span className="text-yellow-400 font-bold">아직 아무도 입장하지 않았습니다! 첫 번째로 들어가 비밀번호를 설정하세요.</span>
                ) : (
                  <span>설정된 비밀번호를 입력해 입장하세요.</span>
                )}
              </p>

              <div className={`flex gap-3 justify-center my-6 ${secretError ? "animate-shake bg-red-950/40 p-2 rounded-xl" : ""}`}>
                {secretDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`digit-${idx}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleSecretDigitInput(idx, e.target.value)}
                    className="w-12 h-14 bg-gray-800 border-2 border-gray-700 focus:border-red-500 rounded-xl text-center text-2xl font-mono text-white tracking-widest outline-none"
                  />
                ))}
              </div>

              {secretError && (
                <p className="text-xs font-bold text-red-500 mb-4 animate-bounce">
                  ⚠️ 번호가 맞지 않습니다!
                </p>
              )}

              <div className="flex gap-2">
                <button
                  id="btn-secret-cancel"
                  onClick={() => setShowSecretModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-bold text-xs"
                >
                  취소
                </button>
                <button
                  id="btn-secret-confirm"
                  onClick={handleSecretSubmit}
                  disabled={secretDigits.some(d => d === "")}
                  className="flex-1 bg-red-600 disabled:opacity-40 text-white py-3 rounded-xl font-black text-xs"
                >
                  기밀입장 🚪
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
