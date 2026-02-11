import React, { useState, useEffect } from 'react';
import { GamePhase, GameData, UserProfile } from './types';
import { STATIC_TOPICS, ZODIAC_AVATARS } from './constants';
import { encodeGameData, decodeGameData, generateRandomLiar, getRandomWord } from './utils/gameCrypto';
import { generateAiWord } from './services/geminiService';
import { Button } from './components/Button';

// --- Icons ---
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"></path></svg>
);

const App = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.PROFILE);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Profile Setup State
  const [inputName, setInputName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(ZODIAC_AVATARS[0]);

  const [hostConfig, setHostConfig] = useState<{ totalPlayers: number; customTopic: string }>({
    totalPlayers: 5, // Default to 5 players
    customTopic: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [mySeatIndex, setMySeatIndex] = useState<number | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load profile from local storage if exists
  useEffect(() => {
    const savedProfile = localStorage.getItem('liar_game_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setPhase(GamePhase.WELCOME);
    }
  }, []);

  // --- Actions ---

  const handleCreateProfile = () => {
    if (!inputName.trim()) return;
    const profile = { name: inputName, avatar: selectedAvatar };
    setUserProfile(profile);
    localStorage.setItem('liar_game_profile', JSON.stringify(profile));
    setPhase(GamePhase.WELCOME);
  };

  const handleCreateRoom = async () => {
    setIsGenerating(true);
    let word = '';
    let category = '';

    // 1. Determine Word & Category
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
      liarIndex: generateRandomLiar(hostConfig.totalPlayers),
      totalPlayers: hostConfig.totalPlayers,
      timestamp: Date.now()
    };

    const code = encodeGameData(data);
    setGeneratedRoomCode(code);
    setCurrentGame(data);
    setIsGenerating(false);
    setPhase(GamePhase.HOST_SETUP);
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    const data = decodeGameData(joinCode);
    if (data) {
      setCurrentGame(data);
      setPhase(GamePhase.PLAYING);
    } else {
      alert("Mã phòng không hợp lệ! Vui lòng kiểm tra lại.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedRoomCode);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const resetGame = () => {
    setPhase(GamePhase.WELCOME);
    setGeneratedRoomCode('');
    setJoinCode('');
    setCurrentGame(null);
    setMySeatIndex(null);
    setShowIdentity(false);
    setHostConfig({ totalPlayers: 5, customTopic: '' });
  };

  const logout = () => {
    localStorage.removeItem('liar_game_profile');
    setUserProfile(null);
    setPhase(GamePhase.PROFILE);
    setInputName('');
  };

  // --- Components for Layout ---

  const Header = () => (
    <header className="w-full bg-red-950/90 border-b border-yellow-700/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => phase !== GamePhase.PLAYING && resetGame()}>
          <span className="text-3xl">🧧</span>
          <div>
            <h1 className="text-xl font-bold font-serif text-yellow-400 leading-none">Kẻ Nói Dối</h1>
            <span className="text-xs text-yellow-200/60 uppercase tracking-widest">Tet Edition</span>
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

  // --- Content Renders ---

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
      
      {/* Left Column: Introduction / Hero */}
      <div className="text-center lg:text-left space-y-6">
        <div className="inline-block px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 text-sm font-bold tracking-widest uppercase">
          Happy Lunar New Year
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-sm font-serif leading-tight">
          KẺ NÓI DỐI <br/>
          <span className="text-4xl md:text-5xl text-red-400 font-hand">Phiên bản Tết 2025</span>
        </h1>
        <p className="text-xl text-yellow-100/70 max-w-lg mx-auto lg:mx-0 font-light">
          Một trò chơi suy luận xã hội thú vị. Tìm ra kẻ ngoại đạo trong nhóm bạn hoặc gia đình trong những ngày đầu năm mới!
        </p>
        
        <div className="hidden lg:grid grid-cols-2 gap-4 mt-8">
           <div className="bg-red-900/30 p-4 rounded-xl border border-red-800">
              <h3 className="text-yellow-400 font-bold mb-1">🎮 Cách chơi</h3>
              <p className="text-sm text-red-200">Mọi người nhận cùng 1 từ khóa, trừ 1 người. Hãy tìm ra kẻ đó!</p>
           </div>
           <div className="bg-red-900/30 p-4 rounded-xl border border-red-800">
              <h3 className="text-yellow-400 font-bold mb-1">🤖 Hỗ trợ AI</h3>
              <p className="text-sm text-red-200">AI Gemini tự tạo từ khóa (Lưu ý: Mã phòng sẽ dài hơn).</p>
           </div>
        </div>
      </div>

      {/* Right Column: Game Actions Card */}
      <div className="w-full max-w-md mx-auto bg-red-950/60 p-8 rounded-3xl border border-yellow-600/30 backdrop-blur-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-yellow-300 border-b border-yellow-800/50 pb-4">Bắt đầu ngay</h2>
        
        <div className="space-y-8">
          {/* Create Room Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wide">1. Tạo phòng mới</h3>
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                <button
                  key={num}
                  onClick={() => setHostConfig(prev => ({ ...prev, totalPlayers: num }))}
                  className={`py-2 rounded-lg font-bold font-serif transition-all ${
                    hostConfig.totalPlayers === num 
                    ? 'bg-yellow-500 text-red-950 shadow-lg transform scale-105' 
                    : 'bg-red-900/40 text-yellow-700 hover:bg-red-800 border border-red-900'
                  }`}
                >
                  {num}
                </button>
              ))}
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
              Tạo Phòng Chơi
            </Button>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-yellow-800/30"></div>
            <span className="flex-shrink-0 mx-4 text-yellow-800 text-xs uppercase font-bold">Hoặc</span>
            <div className="flex-grow border-t border-yellow-800/30"></div>
          </div>

          {/* Join Room Section */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wide">2. Tham gia phòng</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Mã phòng..."
                className="flex-1 bg-red-900/30 border border-yellow-700/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-yellow-100 font-mono text-center uppercase tracking-wider text-lg"
              />
              <Button variant="secondary" onClick={handleJoinRoom} disabled={!joinCode} className="w-auto px-6">
                Vào
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameCard = (children: React.ReactNode) => (
    <div className="max-w-2xl w-full mx-auto bg-red-950/80 p-8 rounded-3xl border-2 border-yellow-600/30 backdrop-blur-md shadow-2xl relative animate-fade-in">
        <div className="absolute -top-3 -left-3 text-4xl transform -rotate-12">🌸</div>
        <div className="absolute -bottom-3 -right-3 text-4xl transform rotate-12">🌸</div>
        {children}
    </div>
  );

  const renderHostSetup = () => renderGameCard(
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <div className="text-7xl mb-4 drop-shadow-xl">🧧</div>
        <h2 className="text-4xl font-serif font-bold text-yellow-400 mb-2">Phòng Đã Sẵn Sàng</h2>
        <p className="text-yellow-200/70">Mã phòng của bạn là:</p>
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

      <p className="text-xs text-yellow-500/60 italic text-center max-w-md">
        {/^\d{5}$/.test(generatedRoomCode) 
          ? "Bạn đang dùng mã 5 số. Hãy đảm bảo mọi người nhập đúng mã này để vào cùng phòng."
          : "Lưu ý: Bạn đang dùng chủ đề tuỳ chỉnh nên mã phòng sẽ dài hơn bình thường."}
      </p>

      <div className="w-full grid grid-cols-2 gap-4">
        <Button variant="secondary" onClick={resetGame}>Huỷ phòng</Button>
        <Button onClick={() => {
            setJoinCode(generatedRoomCode);
            handleJoinRoom();
        }}>
          Vào chơi ngay
        </Button>
      </div>
    </div>
  );

  const renderPlaying = () => {
    if (!currentGame) return null;

    if (mySeatIndex === null) {
      return renderGameCard(
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 font-serif">Chọn Vị Trí Của Bạn</h2>
            <p className="text-yellow-200/60">Hãy chọn một bao lì xì chưa có chủ!</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {Array.from({ length: currentGame.totalPlayers }).map((_, idx) => {
              const seatNum = idx + 1;
              return (
                <button
                  key={seatNum}
                  onClick={() => setMySeatIndex(seatNum)}
                  className="aspect-[3/4] bg-red-800 hover:bg-red-700 border-2 border-yellow-700 hover:border-yellow-400 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden shadow-lg hover:-translate-y-1"
                >
                   <div className="absolute -top-10 -right-10 w-20 h-20 bg-yellow-400/10 rounded-full blur-xl"></div>
                   <div className="text-4xl opacity-70 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">🧧</div>
                   <span className="font-bold text-lg group-hover:text-yellow-200 text-yellow-700 font-serif">Ghế {seatNum}</span>
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center border-t border-yellow-900/50 pt-4">
             <div className="text-sm">Chủ đề: <span className="text-yellow-300 font-bold uppercase ml-1">{currentGame.topic}</span></div>
             <Button variant="ghost" onClick={resetGame} className="w-auto px-4 py-2 text-sm">Thoát</Button>
          </div>
        </div>
      );
    }

    const isLiar = mySeatIndex === currentGame.liarIndex;

    return renderGameCard(
      <div className="flex flex-col items-center min-h-[500px] justify-between py-4">
        <div className="text-center w-full">
          <div className="flex items-center justify-center gap-3 mb-6 bg-black/20 py-2 rounded-full w-fit mx-auto px-6 border border-yellow-900/30">
            <span className="text-2xl">{userProfile?.avatar}</span>
            <span className="text-sm font-bold text-yellow-500 uppercase tracking-widest">
              {userProfile?.name} • Ghế #{mySeatIndex}
            </span>
          </div>
          
          <h2 className="text-4xl font-bold text-yellow-200 mb-2 font-serif drop-shadow-lg">{currentGame.topic}</h2>
          <p className="text-yellow-500/60 text-sm italic">Nhấn vào thẻ bên dưới để xem vai trò</p>
        </div>

        <div 
          className="w-72 h-96 cursor-pointer perspective-1000 my-4 group"
          onClick={() => setShowIdentity(!showIdentity)}
        >
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${showIdentity ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: showIdentity ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            
            {/* Front of Card */}
            <div 
              className="absolute w-full h-full bg-gradient-to-b from-red-800 to-red-950 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-[6px] border-yellow-600/50"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
               <div className="absolute inset-2 border border-yellow-500/20 rounded-2xl"></div>
               <div className="text-8xl mb-6 drop-shadow-lg opacity-80">🏮</div>
               <p className="text-yellow-200 font-serif font-bold text-2xl tracking-[0.2em] uppercase">Mật Thư</p>
            </div>

            {/* Back of Card */}
            <div 
              className={`absolute w-full h-full rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 p-8 text-center
                ${isLiar ? 'bg-gradient-to-br from-gray-900 to-black border-red-600' : 'bg-gradient-to-br from-yellow-800 to-yellow-950 border-yellow-400'}
              `}
              style={{ 
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {isLiar ? (
                <div className="animate-fade-in">
                  <div className="text-7xl mb-8 animate-pulse">👺</div>
                  <h3 className="text-3xl font-extrabold text-red-500 mb-4 uppercase tracking-widest">Kẻ Nói Dối</h3>
                  <p className="text-gray-400 font-light">Hãy lắng nghe và diễn sâu vào nhé!</p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="text-6xl mb-8">📜</div>
                  <h3 className="text-lg font-bold text-yellow-400/80 mb-2 uppercase tracking-wide">Từ khoá bí mật</h3>
                  <p className="text-4xl font-extrabold text-white uppercase break-words leading-tight drop-shadow-md">{currentGame.word}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center gap-4">
          <Button variant="danger" onClick={resetGame} className="max-w-xs">Kết thúc ván chơi</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-yellow-100 overflow-x-hidden">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        {/* Decorative Background Elements */}
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