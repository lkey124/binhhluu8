import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, TurnPhase, GameData, PlayerState, Role, P2PMessage } from './types';
import { STATIC_TOPICS, ZODIAC_AVATARS } from './constants';
import { getRolesForGame, getRandomWord } from './utils/gameCrypto';
import { generateAiWord } from './services/geminiService';
import { Button } from './components/Button';
import { peerService } from './services/peerService';

// --- Icons ---
const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"></path></svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const TimerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
);
const NextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

interface GameCardProps {
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const GameCard = ({ children, fullWidth = false }: GameCardProps) => (
  <div className={`${fullWidth ? 'max-w-4xl' : 'max-w-md'} w-full mx-auto bg-red-950/80 p-6 md:p-8 rounded-3xl border-2 border-yellow-600/30 backdrop-blur-md shadow-2xl relative animate-fade-in transition-all`}>
      <div className="absolute -top-3 -left-3 text-4xl transform -rotate-12">🌸</div>
      <div className="absolute -bottom-3 -right-3 text-4xl transform rotate-12">🌸</div>
      {children}
  </div>
);

interface HostConfig {
  totalPlayers: number;
  customTopic: string;
  liarCount: number;
  whiteHatCount: number;
}

// Extend PlayerState to track peer ID
interface OnlinePlayerState extends PlayerState {
  peerId?: string;
  isHost?: boolean;
}

const App = () => {
  // Global Phases
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  
  // Setup State
  const [hostConfig, setHostConfig] = useState<HostConfig>({
    totalPlayers: 5, 
    customTopic: '',
    liarCount: 1,
    whiteHatCount: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  
  // Game Data
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<OnlinePlayerState[]>([]);
  
  // Turn Logic
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.REVEAL);
  const [revealIndex, setRevealIndex] = useState(0); // Who is currently looking at the phone (Offline)
  const [isRevealed, setIsRevealed] = useState(false); // Has the current person flipped the card?
  
  const [turnOrder, setTurnOrder] = useState<number[]>([]); // Array of seatIndexs
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);

  // Review / Checking Mode
  const [isReviewingAll, setIsReviewingAll] = useState(false); // To toggle the "Check Identity" dashboard
  const [reviewTarget, setReviewTarget] = useState<PlayerState | null>(null); // Specific player being reviewed
  
  // Voting
  const [voteTarget, setVoteTarget] = useState<number | null>(null);

  // Elimination & Win
  const [eliminatedData, setEliminatedData] = useState<{seat: number, role: Role} | null>(null);
  const [winner, setWinner] = useState<'CIVILIAN' | 'BAD_GUYS' | 'WHITE_HAT' | null>(null);
  
  // White Hat Guess
  const [isWhiteHatGuessing, setIsWhiteHatGuessing] = useState(false);
  const [whiteHatGuess, setWhiteHatGuess] = useState('');
  const [whiteHatGuesserSeat, setWhiteHatGuesserSeat] = useState<number | null>(null);
  const [isLastStand, setIsLastStand] = useState(false);

  // --- Online Mode State ---
  const [gameMode, setGameMode] = useState<'OFFLINE' | 'ONLINE_HOST' | 'ONLINE_GUEST'>('OFFLINE');
  const [isModeSelected, setIsModeSelected] = useState(false); // Tracks if user has picked Offline/Online to show Config
  const [roomId, setRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // CONNECTING, CONNECTED

  // --- Effects ---

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      peerService.destroy();
    };
  }, []);

  // Timer Logic (Run on Host or Offline only)
  useEffect(() => {
    let interval: any;
    const shouldRunTimer = (gameMode === 'OFFLINE' || gameMode === 'ONLINE_HOST') && 
                           turnPhase === TurnPhase.DESCRIBING && 
                           timeLeft > 0 && 
                           !isReviewingAll && 
                           !isWhiteHatGuessing;

    if (shouldRunTimer) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
           const newVal = prev - 1;
           return newVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [turnPhase, timeLeft, isReviewingAll, isWhiteHatGuessing, gameMode]);

  // Sync Timer/State for Host
  useEffect(() => {
     if (gameMode === 'ONLINE_HOST') {
         broadcastGameState();
     }
  }, [timeLeft, turnPhase, currentTurnIndex, players, winner, eliminatedData, phase]);

  // Handle Peer Messages
  useEffect(() => {
      peerService.setOnMessage((msg) => {
          if (gameMode === 'ONLINE_GUEST') {
             handleGuestMessage(msg);
          } else if (gameMode === 'ONLINE_HOST') {
             handleHostMessage(msg);
          }
      });
  }, [gameMode, players, phase]);

  const broadcastGameState = () => {
      if (gameMode !== 'ONLINE_HOST') return;
      const state = {
          phase,
          currentGame,
          players,
          turnPhase,
          turnOrder,
          currentTurnIndex,
          roundNumber,
          timeLeft,
          winner,
          eliminatedData,
          isWhiteHatGuessing // Sync modal state?
      };
      peerService.broadcast({ type: 'GAME_STATE', payload: state });
  };

  const handleGuestMessage = (msg: P2PMessage) => {
      if (msg.type === 'GAME_STATE') {
          const s = msg.payload;
          setPhase(s.phase);
          setCurrentGame(s.currentGame);
          setPlayers(s.players);
          setTurnPhase(s.turnPhase);
          setTurnOrder(s.turnOrder);
          setCurrentTurnIndex(s.currentTurnIndex);
          setRoundNumber(s.roundNumber);
          setTimeLeft(s.timeLeft);
          setWinner(s.winner);
          setEliminatedData(s.eliminatedData);
          setIsWhiteHatGuessing(s.isWhiteHatGuessing);
      }
  };

  const handleHostMessage = (msg: P2PMessage) => {
      if (msg.type === 'JOIN_REQUEST') {
          // Guest wants to join
          const { name, peerId } = msg.payload;
          const newPlayer: OnlinePlayerState = {
              seatIndex: players.length,
              name: name,
              avatar: ZODIAC_AVATARS[players.length % ZODIAC_AVATARS.length],
              status: 'ALIVE',
              role: Role.CIVILIAN, // Temporary
              peerId: peerId
          };
          setPlayers(prev => [...prev, newPlayer]);
      }
  };

  // --- Actions ---

  const initHost = async () => {
      try {
          const code = await peerService.createRoom();
          setRoomId(code);
          setGameMode('ONLINE_HOST');
          setPhase(GamePhase.SETUP); // Stay in SETUP so we can configure the game
          setIsModeSelected(true); // Move to configuration screen
          setPlayers([{
              seatIndex: 0,
              name: "Chủ Phòng",
              avatar: ZODIAC_AVATARS[0],
              status: 'ALIVE',
              role: Role.CIVILIAN,
              isHost: true
          }]);
      } catch (e) {
          alert("Lỗi tạo phòng: " + e);
      }
  };

  const initGuest = async () => {
      if (!roomId || !guestName) return alert("Vui lòng nhập ID phòng và tên");
      setConnectionStatus('CONNECTING');
      try {
          await peerService.joinRoom(roomId);
          setGameMode('ONLINE_GUEST');
          setConnectionStatus('CONNECTED');
          // Send join request
          peerService.sendToHost({
              type: 'JOIN_REQUEST',
              payload: { name: guestName, peerId: peerService['peer']?.id }
          });
          setPhase(GamePhase.SETUP); // Waiting in Lobby (handled by renderSetup)
      } catch (e) {
          alert("Không thể vào phòng: " + e);
          setConnectionStatus('DISCONNECTED');
      }
  };

  const handleSetupContinue = () => {
    if (gameMode === 'OFFLINE') {
        if (hostConfig.liarCount + hostConfig.whiteHatCount >= hostConfig.totalPlayers) {
            alert("Số lượng kẻ nói dối + mũ trắng phải nhỏ hơn tổng số người chơi!");
            return;
        }
        const names = Array.from({ length: hostConfig.totalPlayers }, (_, i) => `Người chơi ${i + 1}`);
        setPlayerNames(names);
        setPhase(GamePhase.NAME_SETUP);
    } else if (gameMode === 'ONLINE_HOST') {
        // Just verify counts
        if (hostConfig.liarCount + hostConfig.whiteHatCount >= players.length) {
            alert("Số lượng kẻ nói dối + mũ trắng phải nhỏ hơn tổng số người chơi hiện tại!");
            return;
        }
        handleStartGame();
    }
  };

  const handleStartGame = async () => {
    setIsGenerating(true);
    let word = '';
    let category = '';

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

    // Determine Players array based on Mode
    let finalPlayers: OnlinePlayerState[] = [];
    if (gameMode === 'OFFLINE') {
        const dataForRoles: GameData = {
            topic: category, word, totalPlayers: hostConfig.totalPlayers,
            liarCount: hostConfig.liarCount, whiteHatCount: hostConfig.whiteHatCount, timestamp: Date.now()
        };
        const roles = getRolesForGame(dataForRoles, Date.now().toString(), 1);
        finalPlayers = playerNames.map((name, idx) => ({
            seatIndex: idx,
            name: name,
            avatar: ZODIAC_AVATARS[idx % ZODIAC_AVATARS.length],
            status: 'ALIVE',
            role: roles[idx]
        }));
    } else {
        // Online Host: Use existing players from lobby
        const dataForRoles: GameData = {
            topic: category, word, totalPlayers: players.length,
            liarCount: hostConfig.liarCount, whiteHatCount: hostConfig.whiteHatCount, timestamp: Date.now()
        };
        const roles = getRolesForGame(dataForRoles, Date.now().toString(), 1);
        finalPlayers = players.map((p, idx) => ({
            ...p,
            seatIndex: idx,
            role: roles[idx],
            avatar: ZODIAC_AVATARS[idx % ZODIAC_AVATARS.length]
        }));
    }

    const data: GameData = {
      topic: category,
      word: word,
      totalPlayers: finalPlayers.length,
      liarCount: hostConfig.liarCount,
      whiteHatCount: hostConfig.whiteHatCount,
      timestamp: Date.now()
    };

    setCurrentGame(data);
    setPlayers(finalPlayers);
    setPhase(GamePhase.PLAYING);
    setTurnPhase(TurnPhase.REVEAL);
    setRevealIndex(0);
    setIsRevealed(false);
    setIsGenerating(false);
    setRoundNumber(1);
    setWinner(null);
    setIsLastStand(false);
  };

  const handleRevealNext = () => {
      // Offline: Iterate
      // Online: Host controls phase change
      
      if (gameMode === 'OFFLINE') {
          if (revealIndex < players.length - 1) {
              setRevealIndex(prev => prev + 1);
              setIsRevealed(false);
          } else {
              startDescribingPhase();
          }
      } else {
          // Online: Host controls phase change
          if (gameMode === 'ONLINE_HOST') {
              startDescribingPhase();
          }
      }
  };

  const startDescribingPhase = () => {
      const aliveSeats = players.filter(p => p.status === 'ALIVE').map(p => p.seatIndex);
      const startIdx = (roundNumber - 1) % aliveSeats.length;
      const ordered = [
        ...aliveSeats.slice(startIdx),
        ...aliveSeats.slice(0, startIdx)
      ];
      setTurnOrder(ordered);
      setCurrentTurnIndex(0);
      setTurnPhase(TurnPhase.DESCRIBING);
      setTimeLeft(45);
  };

  const nextTurn = () => {
      // Only Host or Offline can trigger
      if (gameMode === 'ONLINE_GUEST') return; 

      if (currentTurnIndex < turnOrder.length - 1) {
          setCurrentTurnIndex(prev => prev + 1);
          setTimeLeft(45);
      } else {
          setVoteTarget(null);
          setTurnPhase(TurnPhase.VOTING);
      }
  };

  const handleConfirmElimination = () => {
      if (voteTarget === null) return;
      const p = players[voteTarget];
      
      if (p.role === Role.WHITE_HAT) {
          alert(`${p.name} là Mũ Trắng! Họ có cơ hội đoán từ.`);
          setWhiteHatGuesserSeat(voteTarget);
          setIsLastStand(true);
          setIsWhiteHatGuessing(true);
      } else {
          performElimination(voteTarget);
      }
      setVoteTarget(null);
  };

  const performElimination = (seatIndex: number) => {
      const p = players[seatIndex];
      setEliminatedData({ seat: seatIndex, role: p.role });
      
      const updatedPlayers = players.map(pl => 
          pl.seatIndex === seatIndex ? { ...pl, status: 'ELIMINATED' as const } : pl
      );
      setPlayers(updatedPlayers);
      setTurnPhase(TurnPhase.ELIMINATION);
      checkWinCondition(updatedPlayers);
  };

  const checkWinCondition = (currentPlayers: PlayerState[]) => {
      const alivePlayers = currentPlayers.filter(p => p.status === 'ALIVE');
      const badGuysCount = alivePlayers.filter(p => p.role === Role.LIAR || p.role === Role.WHITE_HAT).length;
      const civiliansCount = alivePlayers.filter(p => p.role === Role.CIVILIAN).length;

      if (badGuysCount === 0) {
          setWinner('CIVILIAN');
      } else if (badGuysCount >= civiliansCount) {
          setWinner('BAD_GUYS');
      }
  };

  const handleWhiteHatGuess = () => {
      // Host handles logic
      if (!currentGame) return;
      const isCorrect = whiteHatGuess.toLowerCase().trim() === currentGame.word.toLowerCase().trim();

      if (isCorrect) {
          setWinner('WHITE_HAT');
          setTurnPhase(TurnPhase.GAME_OVER);
          setIsWhiteHatGuessing(false);
      } else {
          // If Online Guest, sending alert might be tricky, but state sync shows result
          if (gameMode !== 'ONLINE_GUEST') alert("Sai rồi!");
          
          setIsWhiteHatGuessing(false);
          setWhiteHatGuess('');
          
          if (isLastStand && whiteHatGuesserSeat !== null) {
             performElimination(whiteHatGuesserSeat);
          } else if (whiteHatGuesserSeat !== null) {
              performElimination(whiteHatGuesserSeat);
          }
      }
      setIsLastStand(false);
      setWhiteHatGuesserSeat(null);
  };

  const nextRoundOrResult = () => {
      if (gameMode === 'ONLINE_GUEST') return;
      if (winner) {
          setTurnPhase(TurnPhase.GAME_OVER);
      } else {
          setRoundNumber(prev => prev + 1);
          startDescribingPhase();
      }
  };

  const resetGame = () => {
      setPhase(GamePhase.SETUP);
      setCurrentGame(null);
      setPlayers([]);
      setWinner(null);
      setEliminatedData(null);
      setIsModeSelected(false);
      // Keep Online connection if online? No, reset to menu
      if (gameMode !== 'OFFLINE') {
          peerService.destroy();
          setGameMode('OFFLINE');
          setRoomId('');
          setConnectionStatus('DISCONNECTED');
      }
  };

  // --- UI Components ---

  const Header = () => (
    <header className="w-full bg-red-950/90 border-b border-yellow-700/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => phase !== GamePhase.SETUP && confirm("Thoát game?") && resetGame()}>
          <span className="text-3xl">🧧</span>
          <div>
            <h1 className="text-xl font-bold font-serif text-yellow-400 leading-none">Kẻ Nói Dối</h1>
            <span className="text-[10px] text-yellow-200/60 uppercase tracking-widest">
                {gameMode === 'OFFLINE' ? 'facebook.com/binhluuuu' : `ROOM: ${roomId}`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );

  // --- Screens ---

  const renderSetup = () => {
    if (gameMode === 'ONLINE_GUEST') {
        // Guest Lobby
        return (
            <GameCard>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-4">Phòng Chờ</h2>
                    <p className="text-yellow-100">Đang chờ chủ phòng bắt đầu...</p>
                    <div className="mt-4 p-4 bg-black/30 rounded-xl">
                        <p className="text-xs text-yellow-500 uppercase">Người chơi</p>
                        <ul className="mt-2">
                           {players.map((p, i) => <li key={i}>{p.name}</li>)}
                        </ul>
                    </div>
                </div>
            </GameCard>
        );
    }
    
    // Host or Offline Setup
    return (
    <div className="w-full max-w-md mx-auto bg-red-950/60 p-8 rounded-3xl border border-yellow-600/30 backdrop-blur-xl shadow-2xl relative">
        {!isModeSelected ? (
             // Initial Choice
             <div className="space-y-4">
                 <h2 className="text-3xl font-bold mb-6 text-yellow-300 text-center font-hand">Chọn Chế Độ</h2>
                 <Button onClick={() => { setGameMode('OFFLINE'); setIsModeSelected(true); }}>Chơi Offline (Chuyền tay)</Button>
                 <Button onClick={initHost} variant="secondary">Tạo Phòng Online</Button>
                 <div className="pt-4 border-t border-yellow-700/30">
                     <input 
                        className="w-full bg-black/30 border border-yellow-700/50 rounded-lg p-3 mb-2 text-white"
                        placeholder="ID Phòng"
                        value={roomId}
                        onChange={e => setRoomId(e.target.value)}
                     />
                     <input 
                        className="w-full bg-black/30 border border-yellow-700/50 rounded-lg p-3 mb-2 text-white"
                        placeholder="Tên bạn"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                     />
                     <Button onClick={initGuest} disabled={connectionStatus === 'CONNECTING'}>
                         {connectionStatus === 'CONNECTING' ? 'Đang vào...' : 'Vào Phòng'}
                     </Button>
                 </div>
             </div>
        ) : (
            // Config Screen (Host/Offline)
            <div className="space-y-6">
              <button 
                  onClick={() => { setIsModeSelected(false); if (gameMode === 'ONLINE_HOST') resetGame(); }} 
                  className="absolute top-4 right-4 text-yellow-500 hover:text-white"
              >
                  <XIcon />
              </button>
              
              <h2 className="text-3xl font-bold text-yellow-300 text-center font-hand">
                  {gameMode === 'OFFLINE' ? 'Thiết Lập' : `Phòng: ${roomId}`}
              </h2>
              
              {gameMode === 'OFFLINE' ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-yellow-500 uppercase">Số người chơi</label>
                      <span className="text-xl font-bold text-yellow-200">{hostConfig.totalPlayers}</span>
                    </div>
                    <input 
                      type="range" min="3" max="20" step="1" 
                      value={hostConfig.totalPlayers} 
                      onChange={(e) => setHostConfig({...hostConfig, totalPlayers: parseInt(e.target.value)})}
                      className="w-full accent-yellow-500 cursor-pointer"
                    />
                  </div>
              ) : (
                  <div className="bg-black/30 p-4 rounded-xl">
                      <p className="text-center mb-2">Đã có {players.length} người tham gia</p>
                      <ul className="text-xs text-center text-yellow-200/60 flex flex-wrap justify-center gap-2">
                          {players.map((p, i) => <li key={i} className="bg-red-900/50 px-2 py-1 rounded">{p.name}</li>)}
                      </ul>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-red-900/40 p-3 rounded-xl border border-red-800">
                   <label className="text-xs font-bold text-red-400 uppercase block mb-1">Kẻ Nói Dối</label>
                   <div className="flex items-center justify-between">
                     <button className="w-8 h-8 rounded-full bg-red-800 hover:bg-red-700 text-yellow-200 font-bold"
                        onClick={() => setHostConfig(p => ({...p, liarCount: Math.max(1, p.liarCount - 1)}))}
                     >-</button>
                     <span className="text-xl font-bold">{hostConfig.liarCount}</span>
                     <button className="w-8 h-8 rounded-full bg-red-800 hover:bg-red-700 text-yellow-200 font-bold"
                        onClick={() => setHostConfig(p => ({...p, liarCount: Math.min(10, p.liarCount + 1)}))}
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
                        onClick={() => setHostConfig(p => ({...p, whiteHatCount: Math.min(5, p.whiteHatCount + 1)}))}
                     >+</button>
                   </div>
                 </div>
              </div>
                
              <div className="relative group">
                <input
                  type="text"
                  value={hostConfig.customTopic}
                  onChange={(e) => setHostConfig(prev => ({ ...prev, customTopic: e.target.value }))}
                  placeholder="Chủ đề (Để trống = Ngẫu nhiên)"
                  className="w-full bg-red-900/30 border border-yellow-700/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-yellow-100 placeholder-yellow-800/50 transition-colors"
                />
                <div className="absolute right-3 top-3 text-yellow-600">
                  <MagicIcon />
                </div>
              </div>

              <Button onClick={handleSetupContinue}>
                {gameMode === 'OFFLINE' ? 'Tiếp Tục' : 'Bắt Đầu Game'}
              </Button>
            </div>
        )}
    </div>
    );
  };

  const renderNameSetup = () => {
    if (gameMode !== 'OFFLINE') return null; // Online skips name setup phase for host, mapped directly to lobby
    return (
    <GameCard>
        <div className="text-center mb-4">
             <h2 className="text-2xl font-bold text-yellow-300">Nhập Tên Người Chơi</h2>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {playerNames.map((name, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <span className="text-2xl w-10">{ZODIAC_AVATARS[idx % ZODIAC_AVATARS.length]}</span>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => {
                            const newNames = [...playerNames];
                            newNames[idx] = e.target.value;
                            setPlayerNames(newNames);
                        }}
                        className="flex-1 bg-red-900/30 border border-yellow-700/30 rounded-lg px-3 py-2 text-yellow-100 focus:ring-1 focus:ring-yellow-500"
                    />
                </div>
            ))}
        </div>
        <div className="mt-6">
            <Button onClick={handleStartGame} isLoading={isGenerating}>Bắt Đầu Chia Bài</Button>
        </div>
    </GameCard>
    );
  };

  const renderReveal = () => {
      // Logic for Offline vs Online
      let currentPlayer: PlayerState;
      let isMyTurnToView = false;

      if (gameMode === 'OFFLINE') {
          currentPlayer = players[revealIndex];
          isMyTurnToView = true;
      } else {
          // Online: I only see myself
          // Determine who I am based on PeerID (guest) or isHost flag
          let myIndex = -1;
          if (gameMode === 'ONLINE_HOST') {
              myIndex = players.findIndex(p => p.isHost);
          } else {
              const myPid = peerService['peer']?.id;
              myIndex = players.findIndex(p => p.peerId === myPid);
          }
          
          if (myIndex === -1) return <GameCard><div>Lỗi không tìm thấy người chơi</div></GameCard>;
          currentPlayer = players[myIndex];
          isMyTurnToView = true;
      }

      const roleTitle = currentPlayer.role === Role.LIAR ? "Kẻ Nói Dối" : (currentPlayer.role === Role.WHITE_HAT ? "Mũ Trắng" : "Dân Thường");
      const roleDesc = currentPlayer.role === Role.LIAR 
        ? "Bạn không biết từ khoá. Hãy diễn sâu!" 
        : (currentPlayer.role === Role.WHITE_HAT ? "Bạn không biết gì cả." : "Từ khoá bí mật là:");
      
      const cardColor = currentPlayer.role === Role.LIAR 
        ? "bg-gradient-to-br from-gray-900 to-black border-red-600" 
        : (currentPlayer.role === Role.WHITE_HAT 
            ? "bg-gradient-to-br from-gray-200 to-gray-400 border-white text-gray-900" 
            : "bg-gradient-to-br from-yellow-800 to-yellow-950 border-yellow-400");
      
      const icon = currentPlayer.role === Role.LIAR ? "👺" : (currentPlayer.role === Role.WHITE_HAT ? "👻" : "📜");

      return (
        <GameCard>
           {!isRevealed ? (
               <div className="flex flex-col items-center justify-center py-10 gap-6">
                   <div className="text-6xl animate-bounce">{currentPlayer.avatar}</div>
                   <div className="text-center">
                       {gameMode === 'OFFLINE' && <p className="text-yellow-500/80 uppercase tracking-widest text-sm mb-2">Chuyền máy cho</p>}
                       <h2 className="text-4xl font-bold text-yellow-100">{currentPlayer.name}</h2>
                   </div>
                   <Button onClick={() => setIsRevealed(true)} className="mt-4">
                       Xem bài của bạn
                   </Button>
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
                   <div className={`w-full rounded-2xl p-8 border-4 text-center shadow-inner ${cardColor}`}>
                        <div className="text-5xl mb-4">{icon}</div>
                        
                        {currentPlayer.role === Role.CIVILIAN ? (
                            <>
                                <h3 className="text-lg font-bold text-yellow-400/80 mb-2 uppercase">Từ khoá</h3>
                                <p className="text-4xl font-extrabold text-white uppercase">{currentGame?.word}</p>
                            </>
                        ) : (
                            <>
                                <h3 className={`text-3xl font-extrabold mb-4 uppercase ${currentPlayer.role === Role.WHITE_HAT ? 'text-gray-800' : 'text-red-500'}`}>{roleTitle}</h3>
                                <p className={currentPlayer.role === Role.WHITE_HAT ? 'text-gray-700' : 'text-gray-400'}>{roleDesc}</p>
                            </>
                        )}

                   </div>
                   <p className="text-xs text-yellow-500/60 mt-2">
                       {gameMode === 'OFFLINE' ? 'Ghi nhớ rồi bấm nút bên dưới' : 'Chờ chủ phòng bắt đầu vòng chơi'}
                   </p>
                   {gameMode !== 'ONLINE_GUEST' && (
                       <Button onClick={handleRevealNext}>
                           {gameMode === 'OFFLINE' ? 'Đã Xem Xong (Qua người khác)' : 'Bắt Đầu Vòng 1'}
                       </Button>
                   )}
               </div>
           )}
        </GameCard>
      );
  };

  const renderDescribing = () => {
      const currentSeat = turnOrder[currentTurnIndex];
      const currentPlayer = players[currentSeat];

      return (
          <GameCard>
             <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-yellow-500/30">
                 <span className="text-yellow-400"><TimerIcon /></span>
                 <span className={`font-mono font-bold text-xl ${timeLeft <= 10 ? 'text-red-400' : 'text-yellow-100'}`}>{timeLeft}s</span>
             </div>

             <div className="flex flex-col items-center gap-6 mt-6">
                 <div className="text-center">
                     <p className="text-yellow-500 uppercase text-xs tracking-widest mb-2">Đang miêu tả</p>
                     <div className="w-24 h-24 mx-auto rounded-full bg-yellow-900/50 border-2 border-yellow-500 flex items-center justify-center text-5xl mb-2">
                         {currentPlayer.avatar}
                     </div>
                     <h2 className="text-3xl font-bold text-yellow-100">{currentPlayer.name}</h2>
                 </div>

                 {gameMode !== 'ONLINE_GUEST' && (
                    <div className="flex flex-col gap-3 w-full">
                        <Button onClick={nextTurn}>Xong lượt</Button>
                        <Button variant="secondary" onClick={() => setIsReviewingAll(true)}>
                            <EyeIcon /> Kiểm tra thân phận
                        </Button>
                    </div>
                 )}
                 {gameMode === 'ONLINE_GUEST' && (
                     <div className="text-sm text-yellow-500/60 animate-pulse">
                         Hãy lắng nghe thật kỹ...
                     </div>
                 )}
             </div>
          </GameCard>
      );
  };

  const renderVoting = () => (
      <GameCard fullWidth>
          <h2 className="text-2xl font-bold text-red-400 text-center mb-2 uppercase">Biểu Quyết</h2>
          <p className="text-center text-yellow-200/60 text-sm mb-6">
              {gameMode === 'ONLINE_GUEST' ? 'Chủ phòng đang thực hiện biểu quyết' : 'Chạm vào người chơi để chọn'}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {players.map(p => {
                  const isSelected = voteTarget === p.seatIndex;
                  return (
                  <button 
                    key={p.seatIndex}
                    disabled={p.status === 'ELIMINATED' || gameMode === 'ONLINE_GUEST'}
                    onClick={() => setVoteTarget(p.seatIndex)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${
                        p.status === 'ELIMINATED' 
                        ? 'bg-black/50 border-gray-800 opacity-50 grayscale cursor-not-allowed' 
                        : isSelected
                            ? 'bg-red-800 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105 z-10'
                            : (gameMode !== 'ONLINE_GUEST' ? 'bg-red-900/40 border-yellow-800/50 hover:bg-red-800/80 hover:border-yellow-600' : 'bg-red-900/40 border-yellow-800/50')
                    }`}
                  >
                      {isSelected && <div className="absolute top-2 right-2 text-yellow-400"><MagicIcon/></div>}
                      <span className="text-4xl">{p.status === 'ELIMINATED' ? '💀' : p.avatar}</span>
                      <span className={`font-bold ${isSelected ? 'text-yellow-300' : 'text-yellow-100'}`}>{p.name}</span>
                  </button>
                  );
              })}
          </div>

          {gameMode !== 'ONLINE_GUEST' && (
              <div className="flex flex-col gap-3 items-center">
                   {voteTarget !== null ? (
                       <Button 
                         variant="danger" 
                         className="animate-bounce-short"
                         onClick={handleConfirmElimination}
                       >
                           💀 Loại bỏ {players[voteTarget].name}
                       </Button>
                   ) : (
                       <div className="h-12"></div> // Spacer
                   )}
                   
                   <Button variant="secondary" onClick={() => {
                       setRoundNumber(prev => prev + 1);
                       startDescribingPhase();
                       setVoteTarget(null);
                   }}>
                       <NextIcon /> Không ai bị loại (Vòng tiếp theo)
                   </Button>
              </div>
          )}
      </GameCard>
  );

  const renderElimination = () => {
      if (!eliminatedData) return null;
      const p = players[eliminatedData.seat];
      
      let roleText = "Dân Thường";
      let roleColor = "text-yellow-200";
      if (eliminatedData.role === Role.LIAR) { roleText = "Kẻ Nói Dối"; roleColor = "text-red-500"; }
      if (eliminatedData.role === Role.WHITE_HAT) { roleText = "Mũ Trắng"; roleColor = "text-gray-300"; }

      return (
          <GameCard>
              <div className="text-center space-y-4">
                  <div className="text-6xl animate-bounce">😭</div>
                  <div>
                      <h2 className="text-xl font-bold text-yellow-100">{p.name} chính là</h2>
                      <h1 className={`text-4xl font-extrabold uppercase mt-2 ${roleColor}`}>{roleText}</h1>
                  </div>
                  {gameMode !== 'ONLINE_GUEST' && (
                      <Button onClick={nextRoundOrResult} className="mt-4">
                          {winner ? "Xem Kết Quả" : "Tiếp Tục Chơi"}
                      </Button>
                  )}
              </div>
          </GameCard>
      );
  };

  const renderGameOver = () => {
      let title = "";
      if (winner === 'CIVILIAN') title = "Dân Thường Thắng 🏆";
      else if (winner === 'BAD_GUYS') title = "Phe Nói Dối Thắng 👺";
      else if (winner === 'WHITE_HAT') title = "Mũ Trắng Thắng 👻";

      return (
          <GameCard>
              <div className="text-center space-y-6">
                  <h1 className="text-4xl font-extrabold text-yellow-400">{title}</h1>
                  <div className="bg-black/30 p-4 rounded-xl">
                      <p className="text-sm text-yellow-500 uppercase">Từ khoá</p>
                      <p className="text-3xl font-bold text-white">{currentGame?.word}</p>
                  </div>
                  {gameMode !== 'ONLINE_GUEST' && (
                      <div className="flex gap-4">
                          <Button variant="secondary" onClick={resetGame}>Về Menu</Button>
                      </div>
                  )}
              </div>
          </GameCard>
      );
  };

  const renderReviewList = () => {
      if (!isReviewingAll) return null;

      if (reviewTarget) {
          const roleTitle = reviewTarget.role === Role.LIAR ? "Kẻ Nói Dối" : (reviewTarget.role === Role.WHITE_HAT ? "Mũ Trắng" : "Dân Thường");
          const cardColor = reviewTarget.role === Role.LIAR 
            ? "bg-gradient-to-br from-gray-900 to-black border-red-600" 
            : (reviewTarget.role === Role.WHITE_HAT 
                ? "bg-gradient-to-br from-gray-200 to-gray-400 border-white text-gray-900" 
                : "bg-gradient-to-br from-yellow-800 to-yellow-950 border-yellow-400");
          const icon = reviewTarget.role === Role.LIAR ? "👺" : (reviewTarget.role === Role.WHITE_HAT ? "👻" : "📜");

          return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
                  <div className={`relative w-full max-w-sm rounded-2xl p-8 border-4 text-center shadow-2xl ${cardColor}`}>
                      <button 
                        onClick={() => setReviewTarget(null)}
                        className="absolute top-2 right-2 text-white/50 hover:text-white"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      
                      <div className="text-5xl mb-4">{icon}</div>
                      <h3 className="text-xl font-bold mb-2 uppercase text-white">{reviewTarget.name}</h3>
                      <h2 className={`text-3xl font-extrabold uppercase mb-4 ${reviewTarget.role === Role.WHITE_HAT ? 'text-gray-800' : 'text-red-500'}`}>{roleTitle}</h2>
                      
                      {reviewTarget.role === Role.CIVILIAN && (
                          <div className="mt-4 p-2 bg-black/20 rounded">
                              <p className="text-xs uppercase text-yellow-500">Từ khoá</p>
                              <p className="text-xl font-bold text-white">{currentGame?.word}</p>
                          </div>
                      )}
                  </div>
              </div>
          );
      }

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
              <div className="bg-red-950 w-full max-w-md p-6 rounded-2xl border border-yellow-600/50 shadow-2xl relative">
                  <button 
                    onClick={() => setIsReviewingAll(false)}
                    className="absolute top-4 right-4 text-yellow-500 hover:text-white"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <h2 className="text-2xl font-bold text-yellow-300 mb-6 text-center">Kiểm Tra Thân Phận</h2>
                  
                  <div className="grid grid-cols-3 gap-3">
                      {players.map(p => (
                          <button 
                            key={p.seatIndex}
                            onClick={() => setReviewTarget(p)}
                            className="flex flex-col items-center p-3 rounded-lg bg-red-900/30 border border-yellow-800/30 hover:bg-red-800/50 transition-colors"
                          >
                              <span className="text-2xl mb-1">{p.avatar}</span>
                              <span className="text-xs font-bold text-yellow-100 truncate w-full text-center">{p.name}</span>
                          </button>
                      ))}
                  </div>
                  
                  <div className="mt-6 text-center">
                      <p className="text-xs text-yellow-500/50">Chỉ chủ phòng hoặc người quản trò nên xem màn hình này</p>
                  </div>
              </div>
          </div>
      );
  };

  const renderWhiteHatModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-red-950 p-6 rounded-2xl border-2 border-yellow-500 w-full max-w-sm animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-2">Mũ Trắng Bị Lộ!</h3>
              <p className="text-yellow-200/80 text-sm mb-4">
                  {gameMode === 'ONLINE_GUEST' ? 'Chủ phòng đang nhập đáp án đoán từ...' : 'Cơ hội cuối cùng: Đoán đúng từ khoá để thắng ngay lập tức.'}
              </p>
              {gameMode !== 'ONLINE_GUEST' && (
                  <>
                    <input 
                        type="text" 
                        value={whiteHatGuess}
                        onChange={(e) => setWhiteHatGuess(e.target.value)}
                        placeholder="Nhập từ khoá..."
                        className="w-full bg-black/30 border border-yellow-700 p-3 rounded-lg text-white mb-4"
                    />
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => {
                            setIsWhiteHatGuessing(false);
                            if (whiteHatGuesserSeat !== null) performElimination(whiteHatGuesserSeat);
                        }}>Chịu thua (Chết)</Button>
                        <Button onClick={handleWhiteHatGuess}>Chốt Đáp Án</Button>
                    </div>
                  </>
              )}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-yellow-100 overflow-x-hidden">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {phase === GamePhase.SETUP && renderSetup()}
        {phase === GamePhase.NAME_SETUP && renderNameSetup()}
        {phase === GamePhase.PLAYING && (
            <>
                {turnPhase === TurnPhase.REVEAL && renderReveal()}
                {turnPhase === TurnPhase.DESCRIBING && renderDescribing()}
                {turnPhase === TurnPhase.VOTING && renderVoting()}
                {turnPhase === TurnPhase.ELIMINATION && renderElimination()}
                {turnPhase === TurnPhase.GAME_OVER && renderGameOver()}
            </>
        )}
        
        {renderReviewList()}
        {isWhiteHatGuessing && renderWhiteHatModal()}
      </main>
    </div>
  );
};

export default App;