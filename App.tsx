
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Star, ArrowLeft, Trophy, ShieldAlert, Sparkles, 
  Award, ChevronRight, PartyPopper, Volume2, VolumeX,
  Gamepad2, Info, Lightbulb
} from 'lucide-react';
import { INITIAL_MISSIONS, ACHIEVEMENTS } from './constants';
import { Mission, MissionStatus, ChatMessage, AIResponse, Achievement } from './types';
import { DigitalCitizenAssistant } from './geminiService';

const App: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistant, setAssistant] = useState<DigitalCitizenAssistant | null>(null);
  const [totalStars, setTotalStars] = useState(0);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement>(ACHIEVEMENTS[0]);
  const [showUnlockModal, setShowUnlockModal] = useState<Achievement | null>(null);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background music
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.2;

    sfxRef.current = new Audio();

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isMusicEnabled) {
      audioRef.current?.play().catch(e => console.log("Audio play blocked by browser"));
    } else {
      audioRef.current?.pause();
    }
  }, [isMusicEnabled]);

  const playSFX = (type: 'pop' | 'star' | 'win') => {
    if (!sfxRef.current) return;
    const urls = {
      pop: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      star: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
    };
    sfxRef.current.src = urls[type];
    sfxRef.current.play().catch(() => {});
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  useEffect(() => {
    const newAchievement = [...ACHIEVEMENTS].reverse().find(a => totalStars >= a.minStars) || ACHIEVEMENTS[0];
    if (newAchievement.label !== currentAchievement.label) {
      setCurrentAchievement(newAchievement);
      if (totalStars > 0) {
        setShowUnlockModal(newAchievement);
        playSFX('win');
      }
    }
  }, [totalStars, currentAchievement.label]);

  const exitMission = () => {
    setActiveMission(null);
    setMessages([]);
    setAssistant(null);
    playSFX('pop');
  };

  const handleStartMission = async (mission: Mission) => {
    setIsLoading(true);
    playSFX('pop');
    setActiveMission({ ...mission, status: MissionStatus.IN_PROGRESS });
    const newAssistant = new DigitalCitizenAssistant(mission.title);
    setAssistant(newAssistant);

    try {
      const data: AIResponse = await newAssistant.startMission(mission.title);
      setMessages([{
        role: 'model',
        text: `${data.narrative}\n\n${data.nextQuestion}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      alert("Có lỗi xảy ra. Hãy thử lại em nhé!");
      setActiveMission(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !assistant || isLoading) return;

    const userText = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userText, timestamp: new Date() }]);
    setIsLoading(true);
    playSFX('pop');

    try {
      const data: AIResponse = await assistant.processResponse(userText);
      
      if (data.evaluation?.stars > 0) {
        setTimeout(() => playSFX('star'), 500);
        setTotalStars(prev => prev + data.evaluation.stars);
        setActiveMission(prev => prev ? { ...prev, starsEarned: prev.starsEarned + data.evaluation.stars } : null);
      }

      let messageContent = "";
      if (data.evaluation) {
        messageContent += `🌟 **Trợ lý nhận xét:** ${data.evaluation.comment}\n`;
        messageContent += `📝 ${data.evaluation.explanation}\n`;
        if (data.evaluation.suggestion) messageContent += `💡 *Lời khuyên:* ${data.evaluation.suggestion}\n`;
        messageContent += `\n---\n\n`;
      }

      messageContent += data.narrative;
      if (data.nextQuestion) messageContent += `\n\n${data.nextQuestion}`;

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: messageContent, 
        timestamp: new Date(),
        starsAwarded: data.evaluation?.stars
      }]);

      if (data.isMissionEnd) {
        setMissions(prev => prev.map(m => 
          m.id === activeMission?.id ? { ...m, status: MissionStatus.COMPLETED } : m
        ));
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Hệ thống đang bận một chút, em nhấn gửi lại nhé!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextAchievement = ACHIEVEMENTS.find(a => a.minStars > totalStars);
  const progressPercent = nextAchievement 
    ? ((totalStars - currentAchievement.minStars) / (nextAchievement.minStars - currentAchievement.minStars)) * 100
    : 100;

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex flex-col p-4 md:p-6 select-none">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-4 mb-6 flex justify-between items-center border-b-4 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-2xl shadow-lg">
            <Gamepad2 className="text-white w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">{currentAchievement.badge}</span>
              <h1 className="text-lg sm:text-2xl font-black text-blue-900 leading-none">CÔNG DÂN SỐ NHÍ</h1>
            </div>
            <p className={`text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-widest ${currentAchievement.color}`}>
              {currentAchievement.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => setIsMusicEnabled(!isMusicEnabled)}
            className={`p-2 rounded-full transition-all ${isMusicEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
            title="Bật/Tắt nhạc nền"
          >
            {isMusicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 bg-yellow-100 px-3 sm:px-5 py-2.5 rounded-full border-b-4 border-yellow-400 shadow-sm">
            <Star className="text-yellow-500 fill-yellow-500 w-5 h-5 animate-pulse" />
            <span className="font-black text-yellow-800 text-base sm:text-lg">{totalStars}</span>
          </div>
        </div>
      </header>

      {/* Unlock Achievement Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl border-b-[8px] border-yellow-400 animate-in zoom-in-95 duration-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-yellow-200 blur-2xl rounded-full opacity-50 scale-150 animate-pulse"></div>
              <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto relative border-4 border-white shadow-xl">
                <span className="text-6xl">{showUnlockModal.badge}</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-blue-900 mb-2">XUẤT SẮC!</h2>
            <p className="text-gray-500 font-bold mb-4 uppercase tracking-tighter">Em đã đạt danh hiệu</p>
            <div className={`text-2xl font-black p-3 rounded-2xl bg-gray-50 mb-4 ${showUnlockModal.color}`}>
              {showUnlockModal.label}
            </div>
            <p className="text-sm text-gray-600 italic mb-8 px-4">"{showUnlockModal.description}"</p>
            <button 
              onClick={() => setShowUnlockModal(null)}
              className="btn-bouncy w-full py-4 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-[0_5px_0_rgb(37,99,235)] hover:shadow-none hover:translate-y-[5px] transition-all"
            >
              TIẾP TỤC KHÁM PHÁ
            </button>
          </div>
        </div>
      )}

      {!activeMission ? (
        <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Progress Card */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl border-b-4 border-gray-100 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform">
                  {currentAchievement.badge}
                </div>
                <div>
                  <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Cấp độ hiện tại</h3>
                  <p className={`text-xl font-black ${currentAchievement.color}`}>{currentAchievement.label}</p>
                </div>
              </div>
              <div className="w-full sm:w-64">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Tiến trình lên cấp</span>
                  <span className="text-sm font-black text-blue-600">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full p-1 border border-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 font-bold mt-2 text-center">
                  {nextAchievement ? `Cần thêm ${nextAchievement.minStars - totalStars} sao nữa` : 'Em đã là Anh Hùng Số!'}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-black text-blue-900 mb-6 flex items-center gap-2">
            <Lightbulb className="text-yellow-500 w-6 h-6" />
            CHỌN NHIỆM VỤ CỦA EM
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {missions.map((mission) => (
              <button 
                key={mission.id}
                onClick={() => handleStartMission(mission)}
                disabled={isLoading}
                className={`btn-bouncy relative text-left group bg-white rounded-[32px] p-6 border-b-[6px] transition-all overflow-hidden ${
                  mission.status === MissionStatus.COMPLETED 
                  ? 'border-green-400 hover:border-green-500' 
                  : 'border-blue-200 hover:border-blue-400'
                }`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-150 transition-transform ${
                   mission.status === MissionStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                
                <div className="flex items-start gap-5 relative z-10">
                  <div className={`text-4xl p-4 rounded-2xl shadow-sm ${
                    mission.status === MissionStatus.COMPLETED ? 'bg-green-50' : 'bg-blue-50'
                  }`}>
                    {mission.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-blue-900 text-lg mb-1">{mission.title}</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed mb-4">
                      {mission.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                        mission.status === MissionStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {mission.status === MissionStatus.COMPLETED ? 'Đã hoàn thành' : 'Sẵn sàng'}
                      </span>
                      {mission.status === MissionStatus.COMPLETED && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-orange-100/50 border-2 border-dashed border-orange-300 rounded-[28px] p-6 flex items-start gap-4 mb-8">
            <div className="bg-orange-400 p-2 rounded-xl text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-orange-900 text-sm">EM CẦN NHỚ:</h4>
              <p className="text-sm text-orange-800 font-medium leading-relaxed">
                An toàn là trên hết! Nếu gặp chuyện gì lạ trên mạng, hãy hỏi ba mẹ ngay nhé. 
                Em có thể dùng Nhiệm vụ 4 để hỏi Trợ lý bất cứ lúc nào!
              </p>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col bg-white rounded-[40px] shadow-2xl border-4 border-white overflow-hidden relative animate-in zoom-in-95 duration-500">
          <div className="bg-blue-50/50 backdrop-blur-sm p-4 border-b-2 border-blue-100 flex items-center justify-between">
            <button 
              onClick={exitMission}
              className="p-3 hover:bg-white rounded-2xl transition-all text-blue-600 btn-bouncy"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center px-4">
              <span className="font-black text-blue-900 uppercase tracking-tight line-clamp-1">{activeMission?.title}</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border-b-2 border-yellow-300">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-black text-yellow-700">{activeMission?.starsEarned}</span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] relative group ${
                  msg.role === 'user' ? 'order-1' : 'order-2'
                }`}>
                  <div className={`rounded-[28px] p-5 shadow-sm transition-all ${
                    msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none shadow-blue-200' 
                    : 'bg-white text-gray-800 rounded-tl-none border-2 border-gray-50 shadow-gray-100'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('🌟') || line.startsWith('📝') || line.startsWith('💡') ? 'mb-2 p-3 bg-blue-50/10 rounded-xl font-bold' : 'mb-3 last:mb-0'}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {msg.starsAwarded && msg.starsAwarded > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-yellow-300 font-black text-sm">
                        <div className="p-1 bg-yellow-400 rounded-full"><Star className="w-4 h-4 text-white fill-white" /></div>
                        CHÚC MỪNG! EM NHẬN ĐƯỢC {msg.starsAwarded} SAO!
                      </div>
                    )}
                  </div>
                  {/* Avatar icons */}
                  <div className={`absolute -bottom-2 ${msg.role === 'user' ? '-right-2' : '-left-2'} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm ${
                    msg.role === 'user' ? 'bg-blue-400' : 'bg-green-400'
                  }`}>
                    {msg.role === 'user' ? '👶' : '🤖'}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-[28px] p-5 rounded-tl-none border-2 border-gray-50 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t-2 border-blue-50 bg-white/80 backdrop-blur-md">
            <div className="flex gap-3 bg-gray-50 p-2 rounded-[28px] border-2 border-gray-100 focus-within:border-blue-300 transition-colors shadow-inner">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu trả lời của em tại đây..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-4 py-3 focus:outline-none font-bold text-blue-900 placeholder:text-gray-300 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className="btn-bouncy bg-blue-500 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-widest">Gửi tin nhắn cho Trợ lý để nhận thêm sao nhé!</p>
          </div>
        </main>
      )}

      <footer className="mt-8 text-center text-gray-400 text-[10px] pb-6 uppercase font-black tracking-widest">
        <div className="flex justify-center gap-4 mb-2">
          <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> AN TOÀN</span>
          <span className="flex items-center gap-1"><Award className="w-3 h-3" /> VĂN MINH</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> TRÁCH NHIỆM</span>
        </div>
        <p>© 2024 TRỢ LÝ CÔNG DÂN SỐ NHÍ - LỚP 5</p>
      </footer>
    </div>
  );
};

export default App;
