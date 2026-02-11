import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, TurnPhase, GameData, UserProfile, Role, PlayerState, P2PMessage } from './types';
import { STATIC_TOPICS, ZODIAC_AVATARS } from './constants';
import { encodeGameData, getRolesForGame, getRandomWord } from './utils/gameCrypto';
import { generateAiWord } from './services/geminiService';
import { peerService } from './services/peerService';
import { Button } from './components/Button';

// --- Icons ---
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"></path></svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const TimerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

interface HostConfig {
  totalPlayers: number;
  customTopic: string;
  liarCount: number;
  whiteHatCount: number;
}

const App = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PROFILE);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Profile Setup State
  const [inputName, setInputName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(ZODIAC_AVATARS[0]);

  // Host Config State
  const [hostConfig, setHostConfig] = useState<HostConfig>({
    totalPlayers: 5, 
    customTopic: '',
    liarCount: 1,
    whiteHatCount: 0
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Gameplay State
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.LOBBY);
  const [roundNumber, setRoundNumber] = useState(1);
  const [mySeatIndex, setMySeatIndex] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // New State for Timer and Role Review
  const [timeLeft, setTimeLeft] = useState(45);
  const [isReviewingRole, setIsReviewingRole] = useState(false);

  // Turn Logic
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [turnOrder, setTurnOrder] = useState<number[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [eliminatedData, setEliminatedData] = useState<{seat: number, role: Role} | null>(null);
  const [winner, setWinner] = useState<'CIVILIAN' | 'BAD_GUYS' | 'WHITE_HAT' | null>(null);
  const [selectedVoteCandidate, setSelectedVoteCandidate] = useState<number | null>(null);
  
  // White Hat Logic
  const [isWhiteHatGuessing, setIsWhiteHatGuessing] = useState(false);
  const [whiteHatGuess, setWhiteHatGuess] = useState('');

  // Refs for checking state inside callbacks
  const gameStateRef = useRef({ players, turnPhase, currentGame });
  useEffect(() => {
    gameStateRef.current = { players, turnPhase, currentGame };
  }, [players, turnPhase, currentGame]);

  // Load profile from local storage
  useEffect(() => {
    const savedProfile = localStorage.getItem('liar_game_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setPhase(GamePhase.WELCOME);
    }
  }, []);

  // Initialize players when game loads
  useEffect(() => {
    if (currentGame && players.length === 0) {
      const initialPlayers: PlayerState[] = Array.from({ length: currentGame.totalPlayers }, (_, i) => ({
        seatIndex: i,
        status: 'ALIVE'
      }));
      setPlayers(initialPlayers);
    }
  }, [currentGame]);

  // --- Networking & Sync Logic ---

  useEffect(() => {
    // Setup message handler for PeerJS
    peerService.setOnMessage((msg) => {
        handleP2PMessage(msg);
    });
    return () => {
        peerService.destroy();
    };
  }, []); // Run once on mount

  const syncStateToGuests = (overridePlayers?: PlayerState[], overridePhase?: TurnPhase) => {
      if (!isHost) return;
      const payload = {
          players: overridePlayers || gameStateRef.current.players,
          turnPhase: overridePhase || gameStateRef.current.turnPhase,
          currentGame: gameStateRef.current.currentGame,
          turnOrder: turnOrder,
          currentTurnIndex: currentTurnIndex,
          roundNumber: roundNumber,
          timeLeft: timeLeft
      };
      peerService.broadcast({ type: 'SYNC_STATE', payload });
  };

  const handleP2PMessage = (msg: P2PMessage) => {
      // Logic for Guest receiving data
      if (msg.type === 'SYNC_STATE') {
          // console.log("Received Sync:", msg.payload);
          setPlayers(msg.payload.players);
          setTurnPhase(msg.payload.turnPhase);
          setCurrentGame(msg.payload.currentGame);
          setTurnOrder(msg.payload.turnOrder);
          setCurrentTurnIndex(msg.payload.currentTurnIndex);
          setRoundNumber(msg.payload.roundNumber);
          // Sync timer only if strictly needed, usually local countdown is smoother 
          // but we sync it on phase change.
      } else if (msg.type === 'HOST_PHASE_CHANGE') {
          setTurnPhase(msg.payload.phase);
          if (msg.payload.phase === TurnPhase.DESCRIBING) {
              setTimeLeft(45); // Reset timer synced
          }
      }

      // Logic for Host receiving data
      if (isHost) {
          if (msg.type === 'SIT_REQUEST') {
              const { seatIndex, profile } = msg.payload;
              const currentPlayers = [...gameStateRef.current.players];
              // Check if seat is taken
              if (currentPlayers[seatIndex].profile && currentPlayers[seatIndex].profile?.name !== profile.name) {
                  // Seat taken by someone else, ignore
                  return; 
              }
              // Assign seat
              currentPlayers[seatIndex] = { ...currentPlayers[seatIndex], profile };
              setPlayers(currentPlayers);
              syncStateToGuests(currentPlayers);
          } else if (msg.type === 'PLAYER_READY') {
              const { seatIndex } = msg.payload;
              const currentPlayers = [...gameStateRef.current.players];
              currentPlayers[seatIndex] = { ...currentPlayers[seatIndex], isReady: true };
              setPlayers(currentPlayers);
              
              // Check if everyone is ready
              const allReady = currentPlayers.every(p => p.isReady);
              if (allReady) {
                  finishRevealing(currentPlayers); // Auto move to describing
              } else {
                  syncStateToGuests(currentPlayers);
              }
          }
      }
  };


  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (turnPhase === TurnPhase.DESCRIBING && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1 && isHost) {
                // Host handles timeout logic if needed, or just let it sit at 0
                // For now, let's keep it simple: just visual
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [turnPhase, timeLeft, isHost]);

  // --- Helper: Get Player Display Info ---
  const getPlayerDisplay = (seatIdx: number) => {
    const player = players.find(p => p.seatIndex === seatIdx);
    
    // 1. Check if it is "Me" locally
    if (seatIdx === mySeatIndex && userProfile) {
        return { 
            name: `${userProfile.name} (Tôi)`, 
            avatar: userProfile.avatar,
            isMe: true,
            isReady: player?.isReady 
        };
    }

    // 2. Check if there is synced data from Host
    if (player && player.profile) {
        return {
            name: player.profile.name,
            avatar: player.profile.avatar,
            isMe: false,
            isReady: player?.isReady
        };
    }

    // 3. Fallback placeholder
    return { 
        name: `Ghế ${seatIdx + 1}`, 
        avatar: '🪑',
        isMe: false,
        isReady: false
    };
  };

  // --- Actions ---

  const handleCreateProfile = () => {
    if (!inputName.trim()) return;
    const profile = { name: inputName, avatar: selectedAvatar };
    setUserProfile(profile);
    localStorage.setItem('liar_game_profile', JSON.stringify(profile));
    setPhase(GamePhase.WELCOME);
  };

  const handleCreateRoom = async () => {
    if (hostConfig.liarCount + hostConfig.whiteHatCount >= hostConfig.totalPlayers) {
        alert("Tổng số Kẻ nói dối và Mũ trắng phải nhỏ hơn tổng số người chơi!");
        return;
    }

    setIsGenerating(true);
    let word = '';
    let category = '';

    // Logic generated word...
    if (hostConfig.customTopic.trim()) {
       const aiResult = await generateAiWord(hostConfig.customTopic);
       if (aiResult) {
         word = aiResult.word;
         category = aiResult.category;
       } else {
         const randomCat = STATIC_TOPICS[Math.floor(Math.random() * STATIC_TOPICS.length)];
         word = getRandomWord(randomCat.words);
         category = randomCat.name;
       }
    } else {
       const randomCat = STATIC_TOPICS[Math.floor(Math.random() * STATIC_TOPICS.length)];
       word = getRandomWord(randomCat.words);
       category = randomCat.name;
    }

    const data: GameData = {
      topic: category,
      word: word,
      totalPlayers: hostConfig.totalPlayers,
      liarCount: hostConfig.liarCount,
      whiteHatCount: hostConfig.whiteHatCount,
      timestamp: Date.now()
    };

    try {
        const code = await peerService.createRoom();
        setGeneratedRoomCode(code);
        setCurrentGame(data);
        setIsHost(true);
        setPhase(GamePhase.HOST_SETUP);
        setRoundNumber(1);
    } catch (e) {
        alert("Lỗi tạo phòng kết nối mạng. Thử lại sau.");
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    setIsConnecting(true);
    
    try {
        await peerService.joinRoom(joinCode);
        setGeneratedRoomCode(joinCode);
        setIsHost(false);
        setPhase(GamePhase.PLAYING);
        setTurnPhase(TurnPhase.LOBBY);
        setRoundNumber(1);
        // Note: Actual game data will arrive via SYNC_STATE message shortly
    } catch (e) {
        alert("Không tìm thấy phòng hoặc lỗi kết nối!");
        console.error(e);
    } finally {
        setIsConnecting(false);
    }
  };

  const handleSelectSeat = (seatIndex: number) => {
    if (mySeatIndex !== null && mySeatIndex !== seatIndex) {
        // Changing seat logic if needed
    }
    setMySeatIndex(seatIndex);
    
    // Online Sync: Tell host I took this seat
    if (userProfile) {
        if (isHost) {
            // I am host, update directly
            const newPlayers = [...players];
            newPlayers[seatIndex] = { ...newPlayers[seatIndex], profile: userProfile };
            setPlayers(newPlayers);
            syncStateToGuests(newPlayers);
        } else {
            // Guest, send request
            peerService.sendToHost({ 
                type: 'SIT_REQUEST', 
                payload: { seatIndex, profile: userProfile } 
            });
        }
    }
  };

  const startGameRound = () => {
    // Only host can start
    if (!isHost) return;
    
    // Check if enough players (optional, for now just check if host picked seat)
    if (mySeatIndex === null) {
        alert("Bạn chưa chọn ghế!");
        return;
    }
    
    // Initialize roles based on Game Data + Seed (Code)
    // IMPORTANT: Roles are deterministic based on RoomCode + Round, so everyone calcs same roles
    const roles = getRolesForGame(currentGame!, generatedRoomCode, roundNumber);
    setMyRole(roles[mySeatIndex]);
    
    // Reset Ready status
    const resetPlayers = players.map(p => ({ ...p, isReady: false, status: 'ALIVE' as const }));
    setPlayers(resetPlayers);

    setTurnPhase(TurnPhase.REVEAL);
    setWinner(null);
    setEliminatedData(null);
    setShowIdentity(false);
    setIsWhiteHatGuessing(false);
    setWhiteHatGuess('');
    setSelectedVoteCandidate(null);

    // Sync to guests
    syncStateToGuests(resetPlayers, TurnPhase.REVEAL);
  };
  
  // React to TurnPhase changes to set local role (for guests)
  useEffect(() => {
      if (turnPhase === TurnPhase.REVEAL && currentGame && mySeatIndex !== null) {
          const roles = getRolesForGame(currentGame, generatedRoomCode, roundNumber);
          setMyRole(roles[mySeatIndex]);
          setShowIdentity(false);
      }
  }, [turnPhase, currentGame, mySeatIndex, roundNumber, generatedRoomCode]);

  const handleMarkReady = () => {
      if (mySeatIndex === null) return;
      
      // Local UI update (optional, usually wait for sync)
      // Send Ready to Host
      if (isHost) {
          const currentPlayers = [...players];
          currentPlayers[mySeatIndex] = { ...currentPlayers[mySeatIndex], isReady: true };
          setPlayers(currentPlayers);
           // Check all ready
          if (currentPlayers.every(p => p.isReady)) {
             finishRevealing(currentPlayers);
          } else {
             syncStateToGuests(currentPlayers);
          }
      } else {
          peerService.sendToHost({ type: 'PLAYER_READY', payload: { seatIndex: mySeatIndex } });
      }
  };

  const finishRevealing = (currentPlayers: PlayerState[]) => {
    // Determine Turn Order
    const aliveSeats = currentPlayers.filter(p => p.status === 'ALIVE').map(p => p.seatIndex);
    const startIdx = (roundNumber * 7) % aliveSeats.length; 
    
    const ordered = [
        ...aliveSeats.slice(startIdx),
        ...aliveSeats.slice(0, startIdx)
    ];
    setTurnOrder(ordered);
    setCurrentTurnIndex(0);
    setTurnPhase(TurnPhase.DESCRIBING);
    setTimeLeft(45); 

    // Sync Everything
    // We pass the new state explicitly because setStates are async
    if (isHost) {
        const payload = {
            players: currentPlayers,
            turnPhase: TurnPhase.DESCRIBING,
            currentGame: currentGame!,
            turnOrder: ordered,
            currentTurnIndex: 0,
            roundNumber: roundNumber,
            timeLeft: 45
        };
        peerService.broadcast({ type: 'SYNC_STATE', payload });
        // Also fire explicit phase change to ensure timer reset
        peerService.broadcast({ type: 'HOST_PHASE_CHANGE', payload: { phase: TurnPhase.DESCRIBING } });
    }
  };

  const nextTurn = () => {
    if (!isHost) return; // Only host controls flow for simplicity in P2P

    if (currentTurnIndex < turnOrder.length - 1) {
        setCurrentTurnIndex(prev => prev + 1);
        setTimeLeft(45); // Reset timer
        syncStateToGuests(); // Full sync
        peerService.broadcast({ type: 'HOST_PHASE_CHANGE', payload: { phase: TurnPhase.DESCRIBING } });
    } else {
        setTurnPhase(TurnPhase.VOTING);
        setSelectedVoteCandidate(null);
        syncStateToGuests(undefined, TurnPhase.VOTING);
    }
  };

  const handleEliminate = (targetSeatIndex: number) => {
    if (!isHost) return;
    if (!currentGame) return;
    
    const roles = getRolesForGame(currentGame, generatedRoomCode, roundNumber);
    const targetRole = roles[targetSeatIndex];

    setEliminatedData({ seat: targetSeatIndex, role: targetRole });
    
    const newPlayers = players.map(p => 
        p.seatIndex === targetSeatIndex ? { ...p, status: 'ELIMINATED' as const, role: targetRole } : p
    );
    setPlayers(newPlayers);
    setTurnPhase(TurnPhase.ELIMINATION);
    
    checkWinCondition(newPlayers, roles);
    
    // Sync
    // We need to sync eliminated data too, but for now simple sync works
    syncStateToGuests(newPlayers, TurnPhase.ELIMINATION);
  };

  const checkWinCondition = (currentPlayers: PlayerState[], allRoles: Role[]) => {
      if (!currentGame) return;
      
      const alivePlayers = currentPlayers.filter(p => p.status === 'ALIVE');
      const aliveRoles = alivePlayers.map(p => allRoles[p.seatIndex]);
      
      const badGuysCount = aliveRoles.filter(r => r === Role.LIAR || r === Role.WHITE_HAT).length;
      const civiliansCount = aliveRoles.filter(r => r === Role.CIVILIAN).length;

      let newWinner: any = null;
      if (badGuysCount === 0) {
          newWinner = 'CIVILIAN';
      } else if (badGuysCount >= civiliansCount) {
          newWinner = 'BAD_GUYS';
      }
      setWinner(newWinner);
  };

  const handleWhiteHatGuess = () => {
      // Logic for white hat guessing... 
      // Simplified: If correct, Host sets winner manually or Whitehat triggers special message
      // For P2P simplicity, we handle strictly locally or implement special message later.
      // Keeping original local logic for now, but adding Host verification would be better.
      if (!currentGame) return;
      if (whiteHatGuess.toLowerCase().trim() === currentGame.word.toLowerCase().trim()) {
          setWinner('WHITE_HAT'); // Local only? Ideally should tell host.
          alert("Bạn đoán đúng! Hãy báo cho chủ phòng.");
      } else {
          alert("Sai rồi! Bạn đã bị loại.");
          if (mySeatIndex !== null) {
              // Tell host I died
              // Not implemented fully in this P2P snippet, user self-reports
              if (isHost) handleEliminate(mySeatIndex);
          }
          setIsWhiteHatGuessing(false);
      }
  };

  const playAgain = () => {
      if (!isHost) return;
      setRoundNumber(prev => prev + 1);
      setTurnPhase(TurnPhase.LOBBY);
      setMyRole(null);
      // Reset ready
      const resetPlayers = players.map(p => ({ ...p, isReady: false }));
      setPlayers(resetPlayers);
      syncStateToGuests(resetPlayers, TurnPhase.LOBBY);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedRoomCode);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const resetGame = () => {
    peerService.destroy();
    setPhase(GamePhase.WELCOME);
    setGeneratedRoomCode('');
    setJoinCode('');
    setCurrentGame(null);
    setMySeatIndex(null);
    setMyRole(null);
    setShowIdentity(false);
    setIsHost(false);
    setHostConfig(prev => ({ ...prev, customTopic: '', liarCount: 1, whiteHatCount: 0 }));
  };

  const logout = () => {
    localStorage.removeItem('liar_game_profile');
    setUserProfile(null);
    setPhase(GamePhase.PROFILE);
    setInputName('');
  };

  // --- Components ---

  const Header = () => (
    <header className="w-full bg-red-950/90 border-b border-yellow-700/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => phase !== GamePhase.PLAYING && resetGame()}>
          <span className="text-3xl">🧧</span>
          <div>
            <h1 className="text-xl font-bold font-serif text-yellow-400 leading-none">Kẻ Nói Dối</h1>
            <span className="text-xs text-yellow-200/60 uppercase tracking-widest">Binhluu</span>
          </div>
        </div>
        
        {userProfile && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-sm font-bold text-yellow-100">{userProfile.name}</span>
               <span className="text-xs text-yellow-500">Đang hoạt động</span>
            </div>
            <div className="h-10 w-10 bg-red-900 rounded-full border border-yellow-500 flex items-center justify-center text-2xl shadow-lg">
              {userProfile.avatar}
            </div>
            <button 
              onClick={logout}
              className="p-2 text-yellow-700 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="w-full bg-red-950 text-yellow-800/60 py-6 mt-auto border-t border-yellow-900/30">
      <div className="container mx-auto px-4 text-center">
        <p className="font-serif italic mb-2">"Vui xuân sang - Rộn ràng tiếng cười"</p>
        <p className="text-xs">© 2025 Kẻ Nói Dối - Trò chơi tương tác trực tuyến.</p>
      </div>
    </footer>
  );

  const renderGameCard = (children: React.ReactNode, fullWidth = false) => (
    <div className={`${fullWidth ? 'max-w-4xl' : 'max-w-2xl'} w-full mx-auto bg-red-950/80 p-8 rounded-3xl border-2 border-yellow-600/30 backdrop-blur-md shadow-2xl relative animate-fade-in transition-all`}>
        <div className="absolute -top-3 -left-3 text-4xl transform -rotate-12">🌸</div>
        <div className="absolute -bottom-3 -right-3 text-4xl transform rotate-12">🌸</div>
        {children}
    </div>
  );

  const FloatingRoleButton = () => {
    if (turnPhase === TurnPhase.LOBBY || turnPhase === TurnPhase.GAME_OVER || turnPhase === TurnPhase.REVEAL) return null;
    return (
        <button
            onClick={() => setIsReviewingRole(true)}
            className="fixed bottom-24 right-6 w-14 h-14 bg-red-900 border-2 border-yellow-500 rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-110 transition-transform"
            title="Xem lại vai trò"
        >
            <span className="text-yellow-400"><EyeIcon /></span>
        </button>
    );
  };

  // --- Screens ---

  const renderProfileSetup = () => (
    <div className="max-w-md w-full mx-auto bg-red-900/40 p-8 rounded-3xl border border-yellow-600/30 backdrop-blur-sm shadow-2xl animate-fade-in">
       <div className="text-center mb-6">
        <h1 className="text-5xl font-hand font-bold text-yellow-400 mb-2 drop-shadow-md">
          Xin Chào
        </h1>
        <p className="text-yellow-100/80">Tạo danh tính để tham gia hội xuân</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-yellow-200 mb-2">Biệt danh của bạn</label>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="VD: Tí, Tèo, ..."
            className="w-full bg-red-950/80 border border-yellow-700/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-yellow-100 placeholder-red-800/60 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-yellow-200 mb-2">Chọn Linh Vật Năm Mới</label>
          <div className="grid grid-cols-6 gap-2">
            {ZODIAC_AVATARS.map(avatar => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`aspect-square text-2xl rounded-lg flex items-center justify-center transition-all ${
                  selectedAvatar === avatar 
                  ? 'bg-yellow-500 ring-2 ring-yellow-200 scale-110 shadow-lg z-10' 
                  : 'bg-red-950/50 hover:bg-red-800 grayscale hover:grayscale-0'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleCreateProfile} disabled={!inputName.trim()}>
          Vào Trang Web
        </Button>
      </div>
    </div>
  );

  const renderWelcomeDashboard = () => (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in">
      <div className="text-center lg:text-left space-y-6">
        <div className="inline-block px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-sm font-bold tracking-widest uppercase">
          Happy Lunar New Year
        </div>
        <div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-sm font-serif leading-normal py-2">
            KẺ NÓI DỐI
          </h1>
          <p className="text-4xl md:text-5xl text-red-400 font-hand">
            Phiên bản Tết 2025
          </p>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto bg-red-950/60 p-8 rounded-3xl border border-yellow-600/30 backdrop-blur-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-yellow-300 border-b border-yellow-800/50 pb-4">Thiết lập phòng</h2>
        
        <div className="space-y-6">
          <div>
             <div className="flex justify-between items-center mb-2">
               <label className="text-sm font-bold text-yellow-500 uppercase">Số người chơi</label>
               <span className="text-xl font-bold text-yellow-200">{hostConfig.totalPlayers}</span>
             </div>
             <input 
               type="range" min="5" max="12" step="1" 
               value={hostConfig.totalPlayers} 
               onChange={(e) => setHostConfig({...hostConfig, totalPlayers: parseInt(e.target.value)})}
               className="w-full accent-yellow-500 cursor-pointer"
             />
             <div className="flex justify-between text-xs text-yellow-500/50 mt-1"><span>5</span><span>12</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-red-900/40 p-3 rounded-xl border border-red-800">
               <label className="text-xs font-bold text-red-400 uppercase block mb-1">Kẻ Nói Dối</label>
               <div className="flex items-center justify-between">
                 <button className="w-8 h-8 rounded-full bg-red-800 hover:bg-red-700 text-yellow-200 font-bold"
                    onClick={() => setHostConfig(p => ({...p, liarCount: Math.max(1, p.liarCount - 1)}))}
                 >-</button>
                 <span className="text-xl font-bold">{hostConfig.liarCount}</span>
                 <button className="w-8 h-8 rounded-full bg-red-800 hover:bg-red-700 text-yellow-200 font-bold"
                    onClick={() => setHostConfig(p => ({...p, liarCount: Math.min(4, p.liarCount + 1)}))}
                 >+</button>
               </div>
             </div>
             
             <div className="bg-white/5 p-3 rounded-xl border border-white/10">
               <label className="text-xs font-bold text-gray-300 uppercase block mb-1">Mũ Trắng</label>
               <div className="flex items-center justify-between">
                 <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold"
                    onClick={() => setHostConfig(p => ({...p, whiteHatCount: Math.max(0, p.whiteHatCount - 1)}))}
                 >-</button>
                 <span className="text-xl font-bold">{hostConfig.whiteHatCount}</span>
                 <button className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold"
                    onClick={() => setHostConfig(p => ({...p, whiteHatCount: Math.min(2, p.whiteHatCount + 1)}))}
                 >+</button>
               </div>
             </div>
          </div>
            
          <div className="relative group">
            <input
              type="text"
              value={hostConfig.customTopic}
              onChange={(e) => setHostConfig(prev => ({ ...prev, customTopic: e.target.value }))}
              placeholder="Chủ đề (Để trống = Mã 5 số)"
              className="w-full bg-red-900/30 border border-yellow-700/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-yellow-100 placeholder-yellow-800/50 transition-colors"
            />
            <div className="absolute right-3 top-3 text-yellow-600 group-focus-within:text-yellow-400 transition-colors">
              <MagicIcon />
            </div>
          </div>

          <Button onClick={handleCreateRoom} isLoading={isGenerating}>
            Tạo Mã Phòng & Kết Nối
          </Button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-yellow-800/30"></div>
            <span className="flex-shrink-0 mx-4 text-yellow-800 text-xs uppercase font-bold">Hoặc</span>
            <div className="flex-grow border-t border-yellow-800/30"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Nhập mã..."
              className="flex-1 bg-red-900/30 border border-yellow-700/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-yellow-100 font-mono text-center uppercase tracking-wider text-lg"
            />
            <Button variant="secondary" onClick={handleJoinRoom} disabled={!joinCode} isLoading={isConnecting} className="w-auto px-6">
              Vào
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHostSetup = () => renderGameCard(
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <div className="text-7xl mb-4 drop-shadow-xl">🧧</div>
        <h2 className="text-4xl font-serif font-bold text-yellow-400 mb-2">Mã Phòng Của Bạn</h2>
        <p className="text-yellow-200/70">Chia sẻ mã này cho bạn bè để cùng chơi</p>
      </div>

      <div className="w-full bg-black/20 p-6 rounded-2xl border-2 border-yellow-500/40 flex flex-col gap-2 relative group hover:border-yellow-400 transition-colors">
        <p className="font-mono text-5xl md:text-6xl text-yellow-300 font-bold text-center leading-relaxed select-all tracking-widest drop-shadow-lg">
          {generatedRoomCode}
        </p>
        <button 
          onClick={copyToClipboard}
          className="absolute right-3 top-3 p-2 bg-yellow-500/10 hover:bg-yellow-500 rounded-lg text-yellow-500 hover:text-red-900 transition-all"
        >
          {copyFeedback ? <span className="font-bold text-xs">OK</span> : <CopyIcon />}
        </button>
      </div>

      <div className="text-sm text-yellow-200/50 space-y-1 text-center">
         <p>Người chơi: {hostConfig.totalPlayers} | Kẻ nói dối: {hostConfig.liarCount} | Mũ trắng: {hostConfig.whiteHatCount}</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-4">
        <Button variant="secondary" onClick={resetGame}>Huỷ phòng</Button>
        <Button onClick={() => {
            setJoinCode(generatedRoomCode);
            handleJoinRoom();
        }}>
          Vào phòng chờ
        </Button>
      </div>
    </div>
  );

  const renderLobby = () => (
    renderGameCard(
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 font-serif">Phòng Chờ (Vòng {roundNumber})</h2>
            
            <div className="bg-black/20 px-6 py-3 rounded-xl border border-yellow-500/30 mb-4 inline-block">
                <p className="text-yellow-100 uppercase tracking-widest text-xs mb-1">Tổng số người chơi</p>
                <p className="text-4xl font-bold text-yellow-400">{currentGame?.totalPlayers}</p>
            </div>
            
            <p className="text-yellow-200/60 mb-2">Mọi người hãy chọn ghế và chờ đủ người.</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
            {Array.from({ length: currentGame?.totalPlayers || 0 }).map((_, idx) => {
              const displayInfo = getPlayerDisplay(idx);
              const isSelected = mySeatIndex === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectSeat(idx)}
                  className={`aspect-square border-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group ${
                      isSelected 
                      ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                      : 'bg-red-900/40 border-yellow-800 hover:border-yellow-400 hover:bg-red-800/60'
                  }`}
                >
                   <span className="text-2xl">{displayInfo.avatar}</span>
                   <span className={`font-bold text-sm ${isSelected ? 'text-yellow-300' : 'text-yellow-200/70 group-hover:text-yellow-200'}`}>
                       {displayInfo.name}
                   </span>
                </button>
              );
            })}
          </div>
          
          {mySeatIndex !== null && (
            <div className="animate-fade-in mt-2">
                <Button 
                    onClick={startGameRound} 
                    className="text-lg uppercase tracking-wide"
                    variant={isHost ? 'primary' : 'secondary'}
                >
                    {isHost ? "👑 BẮT ĐẦU GAME" : "VÀO GAME"}
                </Button>
                <p className="text-center text-xs text-yellow-500/70 mt-2 italic">
                    {isHost 
                     ? "*Bạn là chủ phòng. Hãy hô 'Bắt đầu' để mọi người cùng vào!" 
                     : "*Chờ chủ phòng hiệu lệnh rồi bấm nút này"}
                </p>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t border-yellow-900/50 pt-4">
             <div className="text-xs text-yellow-500">Mã: {generatedRoomCode}</div>
             <Button variant="ghost" onClick={resetGame} className="w-auto px-4 py-2 text-sm">Thoát</Button>
          </div>
        </div>
    )
  );

  const renderReveal = () => {
    let roleTitle = "";
    let roleDescription = "";
    let cardColor = "";
    let icon = "";

    if (myRole === Role.LIAR) {
        roleTitle = "Kẻ Nói Dối";
        roleDescription = "Bạn không biết từ khoá. Hãy lắng nghe và diễn sâu!";
        cardColor = "bg-gradient-to-br from-gray-900 to-black border-red-600";
        icon = "👺";
    } else if (myRole === Role.WHITE_HAT) {
        roleTitle = "Mũ Trắng";
        roleDescription = "Bạn không biết gì cả. Bạn cũng không bị nghi ngờ.";
        cardColor = "bg-gradient-to-br from-gray-200 to-gray-400 border-white text-gray-900";
        icon = "👻";
    } else {
        roleTitle = "Dân Thường";
        roleDescription = "Từ khoá bí mật là:";
        cardColor = "bg-gradient-to-br from-yellow-800 to-yellow-950 border-yellow-400";
        icon = "📜";
    }

    return renderGameCard(
      <div className="flex flex-col items-center min-h-[500px] justify-between py-4">
        <div className="text-center w-full">
            <h2 className="text-3xl font-bold text-yellow-200 mb-2 font-serif">{currentGame?.topic}</h2>
            <p className="text-yellow-500/60 text-sm">Chạm vào thẻ để xem vai trò</p>
        </div>

        <div 
          className="w-72 h-96 cursor-pointer perspective-1000 my-4 group"
          onClick={() => setShowIdentity(!showIdentity)}
        >
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${showIdentity ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: showIdentity ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            {/* Front */}
            <div 
              className="absolute w-full h-full bg-gradient-to-b from-red-800 to-red-950 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-[6px] border-yellow-600/50"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
               <div className="absolute inset-2 border border-yellow-500/20 rounded-2xl"></div>
               <div className="text-8xl mb-6 drop-shadow-lg opacity-80">🏮</div>
               <p className="text-yellow-200 font-serif font-bold text-2xl tracking-[0.2em] uppercase">Mật Thư</p>
            </div>

            {/* Back */}
            <div 
              className={`absolute w-full h-full rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 p-8 text-center ${cardColor}`}
              style={{ 
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <div className="animate-fade-in">
                <div className="text-6xl mb-6">{icon}</div>
                
                {myRole === Role.CIVILIAN ? (
                    <>
                        <h3 className="text-lg font-bold text-yellow-400/80 mb-2 uppercase tracking-wide">Từ khoá</h3>
                        <p className="text-4xl font-extrabold text-white uppercase break-words leading-tight drop-shadow-md">{currentGame?.word}</p>
                    </>
                ) : (
                    <>
                        <h3 className={`text-3xl font-extrabold mb-4 uppercase tracking-widest ${myRole === Role.WHITE_HAT ? 'text-gray-800' : 'text-red-500'}`}>{roleTitle}</h3>
                        <p className={`${myRole === Role.WHITE_HAT ? 'text-gray-700' : 'text-gray-400'} font-light`}>{roleDescription}</p>
                    </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {getPlayerDisplay(mySeatIndex || 0).isReady ? (
            <div className="text-center animate-pulse">
                <p className="text-lg font-bold text-yellow-400">Đang đợi người chơi khác...</p>
                <p className="text-sm text-yellow-200/60">Game sẽ tự động bắt đầu khi tất cả đã xem xong</p>
            </div>
        ) : (
            <Button onClick={handleMarkReady} className="max-w-xs">Đã Xem Xong (Chờ Vào Game)</Button>
        )}
      </div>
    );
  };

  const renderDescribing = () => {
      const currentSeat = turnOrder[currentTurnIndex];
      const isMyTurn = mySeatIndex === currentSeat;
      const displayInfo = getPlayerDisplay(currentSeat);

      return renderGameCard(
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 relative">
              <div className="absolute top-0 right-0">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${timeLeft <= 10 ? 'bg-red-900 border-red-500 animate-pulse' : 'bg-black/30 border-yellow-500/30'}`}>
                      <span className="text-yellow-400"><TimerIcon /></span>
                      <span className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-red-400' : 'text-yellow-100'}`}>{timeLeft}s</span>
                  </div>
              </div>

              <div className="text-center w-full mt-4">
                  <div className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-6">Vòng Miêu Tả</div>
                  
                  {/* Avatar Big Display */}
                  <div className={`
                    w-32 h-32 mx-auto rounded-full flex items-center justify-center text-7xl shadow-2xl mb-4 transition-all duration-500
                    ${isMyTurn 
                        ? 'bg-yellow-500/20 border-4 border-yellow-400 scale-110 shadow-[0_0_30px_rgba(234,179,8,0.4)]' 
                        : 'bg-black/30 border-4 border-yellow-800/50'
                    }
                  `}>
                      <div className="animate-bounce-slow">{displayInfo.avatar}</div>
                  </div>

                  {/* Turn Info */}
                  <p className="text-yellow-200/60 text-sm mb-1 uppercase tracking-wider">Lượt của</p>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 to-yellow-500 drop-shadow-sm font-serif">
                      {displayInfo.name}
                  </h2>
                  
                  {isMyTurn ? (
                      <p className="text-green-400 font-bold mt-2 animate-pulse text-lg">👉 Đến lượt bạn!</p>
                  ) : (
                      <p className="text-yellow-500/50 mt-2 text-sm italic">Hãy lắng nghe...</p>
                  )}
              </div>

              <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                  {isHost && (
                     <Button onClick={nextTurn}>
                        {isMyTurn ? "Tôi đã xong" : "Qua lượt (Chủ phòng)"}
                     </Button>
                  )}
                  {!isHost && isMyTurn && (
                      <p className="text-center text-yellow-300 text-sm">Hãy miêu tả! Chủ phòng sẽ bấm qua lượt giúp bạn.</p>
                  )}
                  
                  {myRole === Role.WHITE_HAT && !isWhiteHatGuessing && (
                      <Button variant="secondary" onClick={() => setIsWhiteHatGuessing(true)}>
                          🕵️ Tôi là Mũ Trắng (Đoán từ)
                      </Button>
                  )}
              </div>
          </div>
      )
  };

  const renderRoleReviewModal = () => {
      if (!isReviewingRole) return null;
      
      let roleName = "Dân Thường";
      let roleDesc = `Từ khoá: ${currentGame?.word}`;
      if (myRole === Role.LIAR) { roleName = "Kẻ Nói Dối"; roleDesc = "Bạn không biết từ khoá"; }
      if (myRole === Role.WHITE_HAT) { roleName = "Mũ Trắng"; roleDesc = "Bạn không biết gì cả"; }

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-red-950 border-2 border-yellow-500 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center relative">
                  <button 
                      onClick={() => setIsReviewingRole(false)}
                      className="absolute top-2 right-2 text-yellow-500 hover:text-white p-2"
                  >
                      ✕
                  </button>
                  <h3 className="text-sm uppercase tracking-widest text-yellow-500 mb-2">Vai trò của bạn</h3>
                  <h2 className="text-3xl font-extrabold text-white mb-2">{roleName}</h2>
                  <p className="text-yellow-200/80 text-lg font-bold">{roleDesc}</p>
              </div>
          </div>
      );
  };

  const renderVoting = () => (
      renderGameCard(
          <div className="flex flex-col h-full gap-4">
              <div className="text-center">
                  <h2 className="text-3xl font-bold text-red-400 mb-1 uppercase">Biểu Quyết</h2>
                  <p className="text-yellow-200/60 text-sm mb-4">
                      Thống nhất và chọn người bị loại (nhiều phiếu nhất)
                  </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[400px] px-2">
                  {players.map((p) => {
                      const isAlive = p.status === 'ALIVE';
                      const displayInfo = getPlayerDisplay(p.seatIndex);
                      const isSelected = selectedVoteCandidate === p.seatIndex;

                      return (
                          <button
                            key={p.seatIndex}
                            disabled={!isAlive}
                            onClick={() => isAlive && setSelectedVoteCandidate(p.seatIndex)}
                            className={`
                                relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 h-32
                                ${!isAlive ? 'bg-black/40 border-gray-800 opacity-40 grayscale cursor-not-allowed' : ''}
                                ${isAlive && !isSelected ? 'bg-red-900/40 border-yellow-800/50 hover:bg-red-800/60 hover:border-yellow-600' : ''}
                                ${isAlive && isSelected ? 'bg-red-800 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105 z-10' : ''}
                            `}
                          >
                              <div className="text-4xl mb-1">{isAlive ? displayInfo.avatar : '💀'}</div>
                              <span className={`font-bold text-sm ${isSelected ? 'text-yellow-200' : 'text-yellow-100/80'}`}>
                                  {displayInfo.name}
                              </span>
                          </button>
                      )
                  })}
              </div>

             <div className="mt-4 flex flex-col gap-3">
                 {isHost && selectedVoteCandidate !== null ? (
                     <div className="animate-fade-in flex flex-col gap-2">
                        <p className="text-center text-sm text-yellow-500 font-bold">
                            Xác nhận loại {getPlayerDisplay(selectedVoteCandidate).name}?
                        </p>
                        <Button 
                            variant="danger" 
                            onClick={() => handleEliminate(selectedVoteCandidate)}
                        >
                            ☠️ Loại Ngay Lập Tức (Chủ phòng)
                        </Button>
                     </div>
                 ) : (
                     <p className="text-center text-xs text-yellow-500/50 italic py-2">
                         {isHost 
                             ? "(Bấm vào một người chơi để chọn loại)" 
                             : "(Chờ chủ phòng quyết định loại ai)"}
                     </p>
                 )}

                 {myRole === Role.WHITE_HAT && !isWhiteHatGuessing && (
                    <Button variant="secondary" onClick={() => setIsWhiteHatGuessing(true)}>
                        🕵️ Đoán từ (Mũ Trắng)
                    </Button>
                 )}
             </div>
          </div>,
          true // Full width for grid
      )
  );

  const renderElimination = () => {
      if (!eliminatedData) return null;
      
      const displayInfo = getPlayerDisplay(eliminatedData.seat);
      let roleName = "Dân Thường";
      let icon = "😭";
      let colorClass = "text-yellow-200";

      if (eliminatedData.role === Role.LIAR) { 
          roleName = "Kẻ Nói Dối"; 
          icon = "👺";
          colorClass = "text-red-500";
      }
      if (eliminatedData.role === Role.WHITE_HAT) { 
          roleName = "Mũ Trắng"; 
          icon = "👻";
          colorClass = "text-gray-300";
      }

      return renderGameCard(
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center animate-fade-in">
              <div className="bg-black/30 p-6 rounded-full border-4 border-yellow-600/30">
                 <div className="text-8xl animate-bounce">{icon}</div>
              </div>
              
              <div className="space-y-2">
                  <h2 className="text-xl font-bold text-yellow-100/80 uppercase tracking-widest">
                      {displayInfo.name} chính là
                  </h2>
                  <h1 className={`text-5xl font-extrabold uppercase mt-2 drop-shadow-lg ${colorClass}`}>
                      {roleName}
                  </h1>
              </div>

              <div className="mt-6 w-full max-w-xs">
                  {isHost ? (
                    <Button onClick={() => {
                        if (winner) {
                            setTurnPhase(TurnPhase.GAME_OVER);
                            syncStateToGuests(undefined, TurnPhase.GAME_OVER);
                        } else {
                            // Recalculate turn order removing dead
                            const aliveSeats = players.filter(p => p.status === 'ALIVE').map(p => p.seatIndex);
                            setTurnOrder(aliveSeats);
                            setCurrentTurnIndex(0);
                            setTurnPhase(TurnPhase.DESCRIBING);
                            setTimeLeft(45); 
                            syncStateToGuests();
                            peerService.broadcast({ type: 'HOST_PHASE_CHANGE', payload: { phase: TurnPhase.DESCRIBING } });
                        }
                    }}>
                        {winner ? "Xem Kết Quả Chung Cuộc" : "Tiếp Tục Vòng Sau"}
                    </Button>
                  ) : (
                      <p className="text-yellow-500/50">Chờ chủ phòng tiếp tục...</p>
                  )}
              </div>
          </div>
      )
  };

  const renderGameOver = () => {
      let title = "";
      let desc = "";
      
      if (winner === 'CIVILIAN') {
          title = "Dân Thường Thắng";
          desc = "Mọi kẻ gian đã bị loại bỏ!";
      } else if (winner === 'BAD_GUYS') {
          title = "Phe Nói Dối Thắng";
          desc = "Kẻ nói dối đã áp đảo dân thường!";
      } else if (winner === 'WHITE_HAT') {
          title = "Mũ Trắng Thắng";
          desc = "Mũ trắng đã đoán đúng từ khóa!";
      }

      return renderGameCard(
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
              <div className="text-8xl">🏆</div>
              <div>
                  <h1 className="text-4xl font-extrabold text-yellow-400 uppercase mb-2">{title}</h1>
                  <p className="text-yellow-100/80">{desc}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-yellow-900/50 w-full">
                  <p className="text-sm text-yellow-500 uppercase font-bold mb-2">Từ khoá là</p>
                  <p className="text-2xl font-bold text-white">{currentGame?.word}</p>
              </div>
              <div className="flex gap-4 w-full">
                  <Button variant="secondary" onClick={resetGame}>Thoát</Button>
                  {isHost && <Button onClick={playAgain}>Chơi Lại (Vòng Mới)</Button>}
              </div>
          </div>
      )
  };

  const renderWhiteHatModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-red-950 border-2 border-yellow-500 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">🕵️ Đoán từ khoá</h3>
              <input 
                  type="text" 
                  value={whiteHatGuess}
                  onChange={(e) => setWhiteHatGuess(e.target.value)}
                  placeholder="Nhập từ khoá..."
                  className="w-full bg-black/30 border border-yellow-700 rounded-lg p-3 text-white mb-4 focus:outline-none focus:border-yellow-400"
              />
              <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setIsWhiteHatGuessing(false)}>Huỷ</Button>
                  <Button onClick={handleWhiteHatGuess}>Chốt đáp án</Button>
              </div>
              <p className="text-xs text-red-400 mt-2 italic">*Nếu sai bạn sẽ bị loại ngay lập tức!</p>
          </div>
      </div>
  );

  const renderPlaying = () => {
    if (!currentGame) return null;

    return (
        <>
            {turnPhase === TurnPhase.LOBBY && renderLobby()}
            {turnPhase === TurnPhase.REVEAL && renderReveal()}
            {turnPhase === TurnPhase.DESCRIBING && renderDescribing()}
            {turnPhase === TurnPhase.VOTING && renderVoting()}
            {turnPhase === TurnPhase.ELIMINATION && renderElimination()}
            {turnPhase === TurnPhase.GAME_OVER && renderGameOver()}
            
            {isWhiteHatGuessing && renderWhiteHatModal()}
            {renderRoleReviewModal()}
            <FloatingRoleButton />
        </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-yellow-100 overflow-x-hidden">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        <div className="fixed top-20 left-10 text-9xl opacity-5 pointer-events-none select-none">🐉</div>
        <div className="fixed bottom-10 right-10 text-9xl opacity-5 pointer-events-none select-none">🌸</div>

        <div className="container mx-auto z-10 w-full">
          {phase === GamePhase.PROFILE && renderProfileSetup()}
          {phase === GamePhase.WELCOME && renderWelcomeDashboard()}
          {phase === GamePhase.HOST_SETUP && renderHostSetup()}
          {phase === GamePhase.PLAYING && renderPlaying()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;