
import React, { useState, useRef, useEffect } from 'react';
import { MISSIONS } from './constants';
import { GameState, MissionStatus, AIResponse, Situation } from './types';
import { evaluateAnswer, generateSituation, askAssistant } from './gemini';

const QUESTIONS_PER_SESSION = 5;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentMissionIndex: null,
    currentSituationIndex: 0,
    totalStars: 0,
    missions: MISSIONS,
    view: 'DASHBOARD'
  });

  const [currentSituation, setCurrentSituation] = useState<Situation | null>(null);
  const [situationHistory, setSituationHistory] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [feedback, setFeedback] = useState<AIResponse | null>(null);
  const [qaHistory, setQaHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getLevelInfo = (stars: number) => {
    if (stars < 5) return { name: "Người mới bắt đầu", icon: "🌱", next: 5 };
    if (stars < 15) return { name: "Người học việc", icon: "🌿", next: 15 };
    if (stars < 30) return { name: "Hiệp sĩ tập sự", icon: "⚔️", next: 30 };
    return { name: "Hiệp sĩ số", icon: "👑", next: 50 };
  };

  const levelInfo = getLevelInfo(gameState.totalStars);
  const progressPercent = Math.min(100, (gameState.totalStars / levelInfo.next) * 100);

  const loadNewSituation = async (missionIdx: number) => {
    setGenLoading(true);
    try {
      const mission = gameState.missions[missionIdx];
      const newSit = await generateSituation(mission.title, situationHistory);
      setCurrentSituation(newSit);
      setSituationHistory(prev => [...prev, newSit.description]);
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const startMission = async (index: number) => {
    if (gameState.missions[index].id === 4) {
      setGameState(prev => ({ ...prev, view: 'QA', currentMissionIndex: index }));
    } else {
      setGameState(prev => ({ 
        ...prev, 
        view: 'PLAYING', 
        currentMissionIndex: index, 
        currentSituationIndex: 0 
      }));
      setSituationHistory([]);
      await loadNewSituation(index);
    }
  };

  const handleBackToDashboard = () => {
    setGameState(prev => ({ ...prev, view: 'DASHBOARD', currentMissionIndex: null }));
    setCurrentSituation(null);
    setFeedback(null);
    setAnswer('');
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || gameState.currentMissionIndex === null || !currentSituation) return;
    setLoading(true);
    try {
      const mission = gameState.missions[gameState.currentMissionIndex];
      const result = await evaluateAnswer(mission.title, currentSituation.description, answer);
      setFeedback(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (keepScore: boolean) => {
    const scoreToAdd = keepScore ? (feedback?.score || 0) : 0;
    const missionIndex = gameState.currentMissionIndex!;

    setGameState(prev => ({
      ...prev,
      totalStars: prev.totalStars + scoreToAdd,
      currentSituationIndex: prev.currentSituationIndex + 1
    }));

    setAnswer('');
    setFeedback(null);

    if (gameState.currentSituationIndex + 1 >= QUESTIONS_PER_SESSION) {
      setGameState(prev => ({ ...prev, view: 'SUMMARY' }));
    } else {
      await loadNewSituation(missionIndex);
    }
  };

  const handleAskAI = async () => {
    if (!answer.trim()) return;
    const userMsg = answer;
    setAnswer('');
    setQaHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const responseText = await askAssistant(userMsg);
      setQaHistory(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (e) {
      setQaHistory(prev => [...prev, { role: 'ai', text: "Lỗi kết nối rồi, em thử lại nhé!" }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [qaHistory]);

  const Header = () => (
    <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b rounded-b-[2rem] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md cursor-pointer transition-transform active:scale-90" onClick={handleBackToDashboard}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </div>
        <div>
          <h1 className="text-blue-900 font-black text-xl tracking-tight uppercase">CÔNG DÂN SỐ NHÍ</h1>
          <p className="text-green-500 font-bold text-xs uppercase tracking-widest">{levelInfo.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-yellow-100 border-2 border-yellow-400 px-4 py-1 rounded-full flex items-center gap-2 shadow-sm">
          <span className="text-xl">⭐</span>
          <span className="font-black text-yellow-700 text-lg">{gameState.totalStars.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );

  if (gameState.view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-blue-50 pb-10">
        <Header />
        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border-l-[10px] border-blue-500 flex flex-col md:flex-row items-center gap-6 mb-10 card-shadow">
            <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-green-100">
              {levelInfo.icon}
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Danh hiệu</p>
                  <h3 className="text-2xl font-black text-green-600">{levelInfo.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">Tiến trình</p>
                  <span className="text-blue-900 font-black">{progressPercent.toFixed(0)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-black text-blue-900 mb-6 flex items-center gap-2">
            <span className="text-yellow-500 text-2xl">⚡</span> CHỌN THỬ THÁCH
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gameState.missions.map((mission, idx) => (
              <div key={mission.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-blue-50 flex gap-5 relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer" onClick={() => startMission(idx)}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                  mission.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                  mission.color === 'purple' ? 'bg-purple-50 text-purple-500' :
                  mission.color === 'orange' ? 'bg-orange-50 text-orange-500' : 'bg-yellow-50 text-yellow-500'
                }`}>
                  {mission.icon}
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-blue-900 text-lg leading-tight mb-2">{mission.title}</h4>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed mb-4">{mission.description}</p>
                  </div>
                  <span className="self-start px-6 py-1.5 bg-blue-100 text-blue-600 font-black text-xs uppercase tracking-widest rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    {mission.id === 4 ? "TRÒ CHUYỆN" : "BẮT ĐẦU"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (gameState.view === 'QA') {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full p-4 flex flex-col overflow-hidden">
          <button onClick={handleBackToDashboard} className="self-start text-blue-600 font-black text-sm mb-4 flex items-center gap-1 hover:underline">
            ← Quay lại
          </button>
          <div className="bg-white flex-1 rounded-[2.5rem] shadow-xl border border-blue-100 flex flex-col overflow-hidden">
            <div className="bg-yellow-400 p-4 text-white text-center font-black uppercase tracking-widest">Hỏi Hiệp Sĩ Số</div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {qaHistory.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <p className="text-4xl mb-2">🤖</p>
                  <p className="font-bold">Chào em! Em có thắc mắc gì về mạng Internet không?</p>
                </div>
              )}
              {qaHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl font-medium shadow-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-blue-400 font-bold italic animate-pulse px-2 text-sm">Hiệp sĩ đang trả lời...</div>}
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-2">
              <input className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none font-medium" placeholder="Nhập câu hỏi của em..." value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAskAI()} />
              <button onClick={handleAskAI} disabled={loading || !answer.trim()} className="bg-blue-600 text-white p-3 rounded-full shadow-lg transition-transform active:scale-90"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentMission = gameState.currentMissionIndex !== null ? gameState.missions[gameState.currentMissionIndex] : null;

  if (gameState.view === 'PLAYING' && currentMission) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col">
        <Header />
        <main className="max-w-3xl mx-auto w-full p-6 flex-1">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handleBackToDashboard} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">
              ← Thoát
            </button>
            <div className="text-right">
               <span className="text-blue-900 font-black text-sm uppercase">Tình huống {gameState.currentSituationIndex + 1} / {QUESTIONS_PER_SESSION}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-blue-900 mb-2">{currentMission.title}</h2>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
              <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${((gameState.currentSituationIndex + 1) / QUESTIONS_PER_SESSION) * 100}%` }}></div>
            </div>
          </div>

          {(genLoading || !currentSituation) ? (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl text-center flex flex-col items-center">
               <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
               <p className="text-blue-900 font-black text-xl uppercase tracking-widest">Đang tải thử thách...</p>
            </div>
          ) : !feedback ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl card-shadow border border-blue-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50 p-6 rounded-3xl mb-8 border-l-[12px] border-blue-400 italic font-bold text-blue-900 text-xl leading-relaxed">
                "{currentSituation.description}"
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-2xl">❓</span> {currentSituation.question}
              </h3>
              <textarea 
                className="w-full h-32 p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-blue-400 text-lg font-medium mb-6 shadow-inner transition-all"
                placeholder="Câu trả lời của em là..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
              <button 
                onClick={handleSubmitAnswer}
                disabled={loading || !answer.trim()}
                className="w-full py-5 bg-green-500 text-white font-black text-xl rounded-[1.5rem] shadow-xl hover:bg-green-600 active:scale-95 transition-all uppercase tracking-widest"
              >
                {loading ? "ĐANG PHÂN TÍCH..." : "GỬI TRẢ LỜI ➔"}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-t-[12px] border-yellow-400 animate-in zoom-in duration-300">
               <div className="flex items-center gap-5 mb-8">
                  <div className="text-6xl p-4 bg-yellow-50 rounded-3xl shadow-sm">⭐</div>
                  <div>
                    <h3 className="text-3xl font-black text-blue-900">+{feedback.score} SAO</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest">Tuyệt vời!</p>
                  </div>
               </div>
               <div className="space-y-4 mb-8">
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                    <p className="text-blue-900 font-medium leading-relaxed"><span className="font-black text-blue-600 block mb-1">💡 Nhận xét:</span> {feedback.feedback}</p>
                  </div>
                  <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                    <p className="text-orange-900 font-medium leading-relaxed"><span className="font-black text-orange-600 block mb-1">🛡️ Lời khuyên:</span> {feedback.suggestion}</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => {setFeedback(null); setAnswer('')}} className="flex-1 py-4 border-4 border-yellow-400 text-yellow-600 font-black rounded-2xl text-lg hover:bg-yellow-50 transition-colors">LÀM LẠI</button>
                  <button onClick={() => handleNext(true)} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl text-lg hover:bg-blue-700 transition-colors shadow-lg">TIẾP TỤC ➔</button>
               </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (gameState.view === 'SUMMARY') {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full border-b-[16px] border-yellow-400 animate-in bounce-in duration-1000">
          <div className="text-8xl mb-6">🏆</div>
          <h2 className="text-4xl font-black text-blue-900 mb-2">XỊN SÒ!</h2>
          <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest leading-tight">Em đã hoàn thành xuất sắc khóa huấn luyện!</p>
          <div className="bg-blue-50 py-6 rounded-3xl mb-8 border border-blue-100 shadow-inner">
            <p className="text-xs text-blue-500 font-black uppercase mb-2">Thành tích hiện tại</p>
            <p className="text-2xl font-black text-blue-900 flex items-center justify-center gap-2">{levelInfo.name} {levelInfo.icon}</p>
          </div>
          <button onClick={handleBackToDashboard} className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] text-xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
            VỀ TRANG CHỦ 🏠
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
