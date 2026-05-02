import { useState, useEffect, useRef } from 'react';
import type { GameState } from './types';
import { useGameEngine } from './hooks/useGameEngine';
import { HUD } from './components/game/HUD';
import { StartScreen } from './components/game/StartScreen';
import { GameOverScreen } from './components/game/GameOverScreen';
import { audio } from './utils/audioManager';

function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState('🤡');
  const [roastMsg, setRoastMsg] = useState('');
  const [shake, setShake] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Khởi tạo Game Engine
  const { jump, resetGame } = useGameEngine({
    canvasRef, 
    gameState, 
    setGameState, 
    setScore, 
    setHighScore, 
    setRoastMsg, 
    setShake, 
    selectedEmoji
  });

  // 1. Tải Highscore từ LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('cyberfly_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // 2. Logic lách luật Autoplay: Phát nhạc menu ngay khi có tương tác đầu tiên
  useEffect(() => {
    const initAudioOnInteraction = () => {
      if (gameState === 'START') {
        audio.playMenuMusic();
      }
      // Gỡ bỏ sự kiện sau khi đã kích hoạt thành công
      window.removeEventListener('click', initAudioOnInteraction);
      window.removeEventListener('touchstart', initAudioOnInteraction);
    };

    window.addEventListener('click', initAudioOnInteraction);
    window.addEventListener('touchstart', initAudioOnInteraction);

    return () => {
      window.removeEventListener('click', initAudioOnInteraction);
      window.removeEventListener('touchstart', initAudioOnInteraction);
    };
  }, [gameState]);

  // 3. Xử lý phím tắt (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'PLAYING') jump();
        else if (gameState === 'START' || gameState === 'GAMEOVER') resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump, resetGame]);

  return (
    <div className="w-screen h-screen bg-[#050505] flex items-center justify-center overflow-hidden">
      
      {/* Khung chứa Game */}
      <div className={`relative w-full h-full overflow-hidden font-mono transition-all duration-75 
        ${shake ? 'translate-y-1 bg-red-900/10' : 'bg-[#0d1117]'}`}>
        
        {/* HUD: Hiển thị điểm số */}
        {gameState !== 'START' && <HUD score={score} highScore={highScore} />}
        
        {/* Màn hình Bắt đầu */}
        {gameState === 'START' && (
          <StartScreen 
            selectedEmoji={selectedEmoji} 
            setSelectedEmoji={setSelectedEmoji} 
            onStart={resetGame} 
          />
        )}
        
        {/* Màn hình Game Over */}
        {gameState === 'GAMEOVER' && (
          <GameOverScreen 
            score={score} 
            highScore={highScore} 
            roastMsg={roastMsg} 
            onRetry={resetGame} 
            onMenu={() => { 
              setGameState('START'); 
              setScore(0); 
              audio.playMenuMusic(); // Quay lại menu thì phát lại nhạc xổ số
            }} 
          />
        )}

        {/* Canvas vẽ Game */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full cursor-pointer touch-none z-10"
          onMouseDown={() => {
            if (gameState === 'PLAYING') jump();
            else if (gameState === 'START') resetGame();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (gameState === 'PLAYING') jump();
            else if (gameState === 'START') resetGame();
          }}
        />

        {/* Hiệu ứng Overlay CRT/Cyberpunk */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] z-20"></div>
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[size:100%_4px] opacity-20 z-20"></div>
      </div>
    </div>
  );
}

export default App;