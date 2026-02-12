import React, { useState, useEffect } from 'react';
import { GamePhase, TurnPhase, GameData, PlayerState, Role } from './types';
import { STATIC_TOPICS, ZODIAC_AVATARS } from './constants';
import { getRolesForGame, getRandomWord, shuffle } from './utils/gameCrypto';
import { generateAiWord } from './services/geminiService';
import { Button } from './components/Button';

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
const NextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);
const HatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M20 22v-5a3 3 0 0 0-3-3h-2.17A7 7 0 0 0 2 12.33V22"/><path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
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
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  
  // Turn Logic
  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.REVEAL);
  const [revealIndex, setRevealIndex] = useState(0); 
  const [isRevealed, setIsRevealed] = useState(false); 
  
  const [turnOrder, setTurnOrder] = useState<number[]>([]); 
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);

  // Review / Checking Mode
  const [isReviewingAll, setIsReviewingAll] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<PlayerState | null>(null);
  
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

  // --- Effects ---

  // Timer Logic
  useEffect(() => {
    let interval: any;
    const shouldRunTimer = turnPhase === TurnPhase.DESCRIBING && 
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
  }, [turnPhase, timeLeft, isReviewingAll, isWhiteHatGuessing]);

  // --- Actions ---

  const handleSetupContinue = () => {
    if (hostConfig.liarCount + hostConfig.whiteHatCount >= hostConfig.totalPlayers) {
        alert("Số lượng kẻ nói dối + mũ trắng phải nhỏ hơn tổng số người chơi!");
        return;
    }
    const names = Array.from({ length: hostConfig.totalPlayers }, (_, i) => `Người chơi ${i + 1}`);
    setPlayerNames(names);
    setPhase(GamePhase.NAME_SETUP);
  };

  const handleStartGame = async () => {
    setIsGenerating(true);
    let word = '';
    let category = '';
    let whiteHatWord = '';

    // Determine words based on config
    if (hostConfig.customTopic.trim()) {
       const aiResult = await generateAiWord(hostConfig.customTopic);
       if (aiResult) {
         word = aiResult.word;
         category = aiResult.category;
         whiteHatWord = aiResult.whiteHatWord;
       } else {
         const randomCat = STATIC_TOPICS[Math.floor(Math.random() * STATIC_TOPICS.length)];
         word = getRandomWord(randomCat.words);
         category = randomCat.name;
         let pool = randomCat.words.filter(w => w !== word);
         if (pool.length === 0) pool = [word];
         whiteHatWord = getRandomWord(pool);
       }
    } else {
       const randomCat = STATIC_TOPICS[Math.floor(Math.random() * STATIC_TOPICS.length)];
       let availableWords = randomCat.words.filter(w => !usedWords.has(w));
       
       if (availableWords.length === 0) {
           availableWords = randomCat.words;
           setUsedWords(new Set());
       }

       word = getRandomWord(availableWords);
       category = randomCat.name;
       setUsedWords(prev => new Set(prev).add(word));

       let pool = randomCat.words.filter(w => w !== word);
       if (pool.length === 0) pool = [word];
       whiteHatWord = getRandomWord(pool);
    }

    const dataForRoles: GameData = {
        topic: category, word, whiteHatWord, totalPlayers: hostConfig.totalPlayers,
        liarCount: hostConfig.liarCount, whiteHatCount: hostConfig.whiteHatCount, timestamp: Date.now()
    };
    
    // Updated call to getRolesForGame without unnecessary arguments
    const roles = getRolesForGame(dataForRoles);

    const finalPlayers: PlayerState[] = playerNames.map((name, idx) => ({
        seatIndex: idx,
        name: name,
        avatar: ZODIAC_AVATARS[idx % ZODIAC_AVATARS.length],
        status: 'ALIVE',
        role: roles[idx]
    }));

    const data: GameData = {
      topic: category,
      word: word,
      whiteHatWord: whiteHatWord,
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
    setEliminatedData(null);
  };

  const handlePlayAgain = () => {
    setWinner(null);
    setEliminatedData(null);
    setTurnPhase(TurnPhase.REVEAL);
    setVoteTarget(null);
    setIsReviewingAll(false);
    handleStartGame();
  };

  const handleRevealNext = () => {
    if (revealIndex < players.length - 1) {
        setRevealIndex(prev => prev + 1);
        setIsRevealed(false);
    } else {
        startDescribingPhase();
    }
  };

  const startDescribingPhase = () => {
      const aliveSeats = players.filter(p => p.status === 'ALIVE').map(p => p.seatIndex);
      
      // SHUFFLE TURN ORDER for randomness every round
      const ordered = shuffle(aliveSeats);
      
      setTurnOrder(ordered);
      setCurrentTurnIndex(0);
      setTurnPhase(TurnPhase.DESCRIBING);
      setTimeLeft(45);
  };

  const nextTurn = () => {
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
      
      // If it's a White Hat, they get a "Last Stand" chance ONLY if they were voted out
      if (p.role === Role.WHITE_HAT) {
          if (window.confirm(`${p.name} là Mũ Trắng! Họ có muốn đoán từ để lật ngược tình thế không?`)) {
              setWhiteHatGuesserSeat(voteTarget);
              setIsLastStand(true);
              setIsWhiteHatGuessing(true);
              return;
          }
      }
      
      performElimination(voteTarget);
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
      
      // Delay check slightly to let state update or just pass updatedPlayers
      checkWinCondition(updatedPlayers);
  };

  const checkWinCondition = (currentPlayers: PlayerState[]) => {
      const alivePlayers = currentPlayers.filter(p => p.status === 'ALIVE');
      const liarsCount = alivePlayers.filter(p => p.role === Role.LIAR).length;
      const whiteHatsCount = alivePlayers.filter(p => p.role === Role.WHITE_HAT).length;
      const civiliansCount = alivePlayers.filter(p => p.role === Role.CIVILIAN).length;
      
      const badGuysCount = liarsCount + whiteHatsCount;

      // 1. Civilians Win: No bad guys left
      if (badGuysCount === 0) {
          setWinner('CIVILIAN');
          return;
      } 
      
      // 2. Bad Guys Win: Bad guys >= Civilians
      if (badGuysCount >= civiliansCount) {
          setWinner('BAD_GUYS');
          return;
      }
      
      // If neither, game continues (even if 1 Liar vs 2 Civilians)
  };

  const handleWhiteHatClaim = () => {
      const currentSeat = turnOrder[currentTurnIndex];
      setWhiteHatGuesserSeat(currentSeat);
      setIsWhiteHatGuessing(true);
      setIsLastStand(false); // Proactive guess, not a last stand
  };

  const handleWhiteHatGuess = () => {
      if (!currentGame) return;
      const isCorrect = whiteHatGuess.toLowerCase().trim() === currentGame.word.toLowerCase().trim();

      if (isCorrect) {
          setWinner('WHITE_HAT');
          setTurnPhase(TurnPhase.GAME_OVER);
          setIsWhiteHatGuessing(false);
      } else {
          alert("Sai rồi! Bạn sẽ bị loại.");
          setIsWhiteHatGuessing(false);
          setWhiteHatGuess('');
          
          if (whiteHatGuesserSeat !== null) {
              performElimination(whiteHatGuesserSeat);
          }
      }
      setIsLastStand(false);
      setWhiteHatGuesserSeat(null);
  };

  const nextRoundOrResult = () => {
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
      setUsedWords(new Set());
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
                facebook.com/binhluuuu
            </span>
          </div>
        </div>
      </div>
    </header>
  );

  // --- Screens ---

  const renderSetup = () => (
    <div className="w-full max-w-md mx-auto bg-red-950/60 p-8 rounded-3xl border border-yellow-600/30 backdrop-blur-xl shadow-2xl relative">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-yellow-300 text-center font-hand">
              Thiết Lập Game
          </h2>
          
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
            Tiếp Tục
          </Button>
        </div>
    </div>
  );

  const renderNameSetup = () => (
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

  const renderReveal = () => {
      const currentPlayer = players[revealIndex];
      const roleTitle = currentPlayer.role === Role.LIAR ? "Kẻ Nói Dối" : (currentPlayer.role === Role.WHITE_HAT ? "Mũ Trắng" : "Dân Thường");
      let roleDesc = "";
      let cardColor = "";
      let icon = "";
      let wordDisplay = "";

      if (currentPlayer.role === Role.LIAR) {
          roleDesc = "";
          cardColor = "bg-gradient-to-br from-gray-900 to-black border-red-600";
          icon = "👺";
          wordDisplay = "HÃY DIỄN NHƯ 1 DIỄN VIÊN ĐI";
      } else if (currentPlayer.role === Role.WHITE_HAT) {
          roleDesc = "Từ khóa của bạn KHÁC mọi người. Hãy cẩn thận!";
          cardColor = "bg-gradient-to-br from-gray-200 to-gray-400 border-white text-gray-900";
          icon = "👻";
          wordDisplay = currentGame?.whiteHatWord || "Lỗi";
      } else {
          roleDesc = "Từ khoá bí mật là:";
          cardColor = "bg-gradient-to-br from-yellow-800 to-yellow-950 border-yellow-400";
          icon = "📜";
          wordDisplay = currentGame?.word || "Lỗi";
      }

      return (
        <GameCard>
           {!isRevealed ? (
               <div className="flex flex-col items-center justify-center py-10 gap-6">
                   <div className="text-6xl animate-bounce">{currentPlayer.avatar}</div>
                   <div className="text-center">
                       <p className="text-yellow-500/80 uppercase tracking-widest text-sm mb-2">Chuyền máy cho</p>
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
                        
                        <h3 className={`text-xl font-extrabold uppercase ${currentPlayer.role === Role.WHITE_HAT ? 'text-gray-800' : (currentPlayer.role === Role.LIAR ? 'text-red-500' : 'text-yellow-400')}`}>{roleTitle}</h3>
                        
                        <p className="text-sm font-bold text-yellow-500/80 mb-2 uppercase tracking-wide">Chủ đề: {currentGame?.topic}</p>

                        {currentPlayer.role === Role.LIAR ? (
                            <p className="text-2xl font-bold text-red-500 uppercase mt-2 mb-4">{wordDisplay}</p>
                        ) : (
                            <p className={`text-4xl font-extrabold uppercase mt-2 mb-2 ${currentPlayer.role === Role.WHITE_HAT ? 'text-gray-900' : 'text-white'}`}>{wordDisplay}</p>
                        )}
                        
                        {roleDesc && <p className={`text-sm ${currentPlayer.role === Role.WHITE_HAT ? 'text-gray-700' : 'text-gray-400'}`}>{roleDesc}</p>}

                   </div>
                   <p className="text-xs text-yellow-500/60 mt-2">
                       Ghi nhớ rồi bấm nút bên dưới
                   </p>
                   <Button onClick={handleRevealNext}>
                       Đã Xem Xong (Qua người khác)
                   </Button>
               </div>
           )}
        </GameCard>
      );
  };

  const renderDescribing = () => {
      const currentSeat = turnOrder[currentTurnIndex];
      const currentPlayer = players[currentSeat];
      const hasWhiteHat = currentGame && currentGame.whiteHatCount > 0;

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

                 <div className="flex flex-col gap-3 w-full">
                    <Button onClick={nextTurn}>Xong lượt</Button>
                    
                    {hasWhiteHat && (
                        <Button variant="ghost" className="border border-white/20 text-white" onClick={handleWhiteHatClaim}>
                            <HatIcon /> Tôi là Mũ Trắng (Đoán từ)
                        </Button>
                    )}

                    <Button variant="secondary" onClick={() => setIsReviewingAll(true)}>
                        <EyeIcon /> Kiểm tra thân phận
                    </Button>
                 </div>
             </div>
          </GameCard>
      );
  };

  const renderVoting = () => (
      <GameCard fullWidth>
          <h2 className="text-2xl font-bold text-red-400 text-center mb-2 uppercase">Biểu Quyết</h2>
          <p className="text-center text-yellow-200/60 text-sm mb-6">
              Chạm vào người chơi để chọn
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {players.map(p => {
                  const isSelected = voteTarget === p.seatIndex;
                  return (
                  <button 
                    key={p.seatIndex}
                    disabled={p.status === 'ELIMINATED'}
                    onClick={() => setVoteTarget(p.seatIndex)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${
                        p.status === 'ELIMINATED' 
                        ? 'bg-black/50 border-gray-800 opacity-50 grayscale cursor-not-allowed' 
                        : isSelected
                            ? 'bg-red-800 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105 z-10'
                            : 'bg-red-900/40 border-yellow-800/50 hover:bg-red-800/80 hover:border-yellow-600'
                    }`}
                  >
                      {isSelected && <div className="absolute top-2 right-2 text-yellow-400"><MagicIcon/></div>}
                      <span className="text-4xl">{p.status === 'ELIMINATED' ? '💀' : p.avatar}</span>
                      <span className={`font-bold ${isSelected ? 'text-yellow-300' : 'text-yellow-100'}`}>{p.name}</span>
                  </button>
                  );
              })}
          </div>

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
                   <div className="h-12"></div>
               )}
               
               <Button variant="secondary" onClick={() => {
                   setRoundNumber(prev => prev + 1);
                   startDescribingPhase();
                   setVoteTarget(null);
               }}>
                   <NextIcon /> Không ai bị loại (Vòng tiếp theo)
               </Button>
          </div>
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
                  <Button onClick={nextRoundOrResult} className="mt-4">
                      {winner ? "Xem Kết Quả" : "Vòng Tiếp Theo"}
                  </Button>
              </div>
          </GameCard>
      );
  };

  const renderGameOver = () => {
      let title = "";
      if (winner === 'CIVILIAN') title = "Dân Thường Thắng 🏆";
      else if (winner === 'BAD_GUYS') title = "Phe Nói Dối Thắng 👺";
      else if (winner === 'WHITE_HAT') title = "Mũ Trắng Thắng 👻";

      const showWhiteHat = currentGame && currentGame.whiteHatCount > 0;

      return (
          <GameCard>
              <div className="text-center space-y-6">
                  <h1 className="text-4xl font-extrabold text-yellow-400">{title}</h1>
                  <div className="bg-black/30 p-4 rounded-xl">
                      <p className="text-sm text-yellow-500 uppercase">Từ khoá Dân Thường</p>
                      <p className="text-3xl font-bold text-white mb-4">{currentGame?.word}</p>
                      
                      {showWhiteHat && (
                          <>
                             <div className="border-t border-white/10 my-2"></div>
                             <p className="text-sm text-gray-400 uppercase">Từ khoá Mũ Trắng</p>
                             <p className="text-2xl font-bold text-gray-300">{currentGame?.whiteHatWord}</p>
                          </>
                      )}
                  </div>
                  <div className="flex flex-col gap-4">
                      <Button onClick={handlePlayAgain} isLoading={isGenerating}>
                         <RefreshIcon /> Chơi Lại (Giữ tên)
                      </Button>
                      <Button variant="secondary" onClick={resetGame}>Về Menu</Button>
                  </div>
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
                              <p className="text-xl font-bold text-white">{currentGame?.word || "Lỗi dữ liệu"}</p>
                          </div>
                      )}

                      {reviewTarget.role === Role.WHITE_HAT && (
                          <div className="mt-4 p-2 bg-black/20 rounded">
                              <p className="text-xs uppercase text-gray-600">Từ khoá Mũ Trắng</p>
                              <p className="text-xl font-bold text-gray-800">{currentGame?.whiteHatWord || "Lỗi dữ liệu"}</p>
                          </div>
                      )}

                       {reviewTarget.role === Role.LIAR && (
                          <div className="mt-4 p-2 bg-black/20 rounded">
                              <p className="text-lg font-bold text-red-500">HÃY DIỄN NHƯ 1 DIỄN VIÊN ĐI</p>
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
              <h3 className="text-xl font-bold text-white mb-2">Mũ Trắng Đoán Từ</h3>
              <p className="text-yellow-200/80 text-sm mb-4">
                  {isLastStand 
                    ? "Cơ hội cuối cùng! Đoán đúng từ khoá để thắng ngay lập tức." 
                    : "Nếu bạn đoán đúng, Mũ Trắng thắng NGAY LẬP TỨC. Nếu sai, bạn sẽ bị LOẠI khỏi cuộc chơi."}
              </p>
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
                      if (isLastStand && whiteHatGuesserSeat !== null) performElimination(whiteHatGuesserSeat);
                  }}>Huỷ (Không đoán)</Button>
                  <Button onClick={handleWhiteHatGuess}>Chốt Đáp Án</Button>
              </div>
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