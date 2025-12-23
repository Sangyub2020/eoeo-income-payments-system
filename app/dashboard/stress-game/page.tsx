'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Target {
  id: string;
  x: number;
  y: number;
  vx: number; // x 방향 속도
  vy: number; // y 방향 속도
  hit: boolean;
  hitTime?: number;
}

interface BloodParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

// 제공된 이미지 URL 사용
const targetImageUrl = 'https://ca.slack-edge.com/T01GAU3MU57-U01G4GDA20L-979d442d20f4-512';

export default function StressGamePage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [bloodParticles, setBloodParticles] = useState<BloodParticle[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameEnded, setGameEnded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const particleIdCounterRef = useRef<number>(0);
  const targetSize = 100;

  const createTarget = (): Target => {
    const gameAreaWidth = gameAreaRef.current?.clientWidth || 800;
    const gameAreaHeight = gameAreaRef.current?.clientHeight || 600;
    
    // 랜덤 시작 위치 (경계 내)
    const x = Math.random() * (gameAreaWidth - targetSize);
    const y = Math.random() * (gameAreaHeight - targetSize);
    
    // 랜덤 속도 (방향과 크기)
    const speed = 2 + Math.random() * 2; // 2~4 픽셀/프레임
    const angle = Math.random() * Math.PI * 2;
    
    return {
      id: `target-${Date.now()}-${Math.random()}`,
      x: Math.max(0, Math.min(x, gameAreaWidth - targetSize)),
      y: Math.max(0, Math.min(y, gameAreaHeight - targetSize)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      hit: false,
    };
  };

  const createBloodParticles = (x: number, y: number) => {
    const particles: BloodParticle[] = [];
    const centerX = x + targetSize / 2;
    const centerY = y + targetSize / 2;
    
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;
      // 고유한 id 생성 (카운터 + 랜덤값 + 인덱스)
      const uniqueId = `blood-${particleIdCounterRef.current++}-${Math.random().toString(36).substr(2, 9)}-${i}`;
      particles.push({
        id: uniqueId,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
      });
    }
    
    setBloodParticles((prev) => [...prev, ...particles]);
    
    // 1초 후 피 파티클 제거
    setTimeout(() => {
      setBloodParticles((prev) => prev.filter((p) => !particles.some((np) => np.id === p.id)));
    }, 1000);
  };

  const startGame = () => {
    const newTarget = createTarget();
    setTargets([newTarget]);
    setBloodParticles([]);
    setGameStarted(true);
    setGameEnded(false);
    setScore(0);
    setTimeLeft(10);

    // 10초 타이머 시작
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setGameEnded(true);
          setGameStarted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!gameStarted || gameEnded) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      // 타겟 애니메이션
      setTargets((prevTargets) => {
        const gameAreaWidth = gameAreaRef.current?.clientWidth || 800;
        const gameAreaHeight = gameAreaRef.current?.clientHeight || 600;
        
        return prevTargets
          .filter((target) => {
            // 맞은 타겟은 0.5초 후 제거
            if (target.hit && target.hitTime) {
              return Date.now() - target.hitTime < 500;
            }
            return !target.hit;
          })
          .map((target) => {
            if (target.hit) return target;
            
            let newX = target.x + target.vx;
            let newY = target.y + target.vy;
            let newVx = target.vx;
            let newVy = target.vy;

            // 벽에 부딪히면 반사
            if (newX <= 0 || newX >= gameAreaWidth - targetSize) {
              newVx = -newVx;
              newX = Math.max(0, Math.min(newX, gameAreaWidth - targetSize));
            }
            if (newY <= 0 || newY >= gameAreaHeight - targetSize) {
              newVy = -newVy;
              newY = Math.max(0, Math.min(newY, gameAreaHeight - targetSize));
            }

            return {
              ...target,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
            };
          });
      });

      // 피 파티클 애니메이션
      setBloodParticles((prev) => {
        return prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.3, // 중력 효과
          }))
          .filter((p) => {
            const gameAreaWidth = gameAreaRef.current?.clientWidth || 800;
            const gameAreaHeight = gameAreaRef.current?.clientHeight || 600;
            return p.x > -50 && p.x < gameAreaWidth + 50 && p.y > -50 && p.y < gameAreaHeight + 50;
          });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [gameStarted, gameEnded]);

  const handleTargetClick = (targetId: string) => {
    if (gameEnded || !gameStarted) return;

    setTargets((prevTargets) => {
      const hitTarget = prevTargets.find((t) => t.id === targetId && !t.hit);
      if (!hitTarget) return prevTargets;

      // 피 파티클 생성
      createBloodParticles(hitTarget.x, hitTarget.y);

      // 맞은 타겟 표시
      const updatedTargets = prevTargets.map((t) =>
        t.id === targetId ? { ...t, hit: true, hitTime: Date.now() } : t
      );

      // 맞은 타겟 제거하고 새 타겟 생성
      const newTarget = createTarget();
      const activeTargets = updatedTargets.filter((t) => !t.hit || (t.hitTime && Date.now() - t.hitTime < 500));
      
      // 항상 최소 1개의 타겟 유지
      return activeTargets.length === 0 ? [newTarget] : activeTargets.concat(newTarget);
    });
    
    setScore((prev) => prev + 1);
  };

  const resetGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setTargets([]);
    setBloodParticles([]);
    setGameStarted(false);
    setGameEnded(false);
    setScore(0);
    setTimeLeft(10);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        * {
          cursor: none !important;
        }
        
        body {
          cursor: none !important;
        }
        
        .game-area {
          cursor: none !important;
        }
        
        .target {
          cursor: none !important;
        }
        
        /* 총 조준경 커서 */
        .custom-cursor {
          position: fixed;
          width: 60px;
          height: 60px;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
        }
        
        .crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
        }
        
        .crosshair::before,
        .crosshair::after {
          content: '';
          position: absolute;
          background: rgba(255, 0, 0, 0.8);
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }
        
        .crosshair::before {
          width: 2px;
          height: 100%;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
        }
        
        .crosshair::after {
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
        }
        
        .scope-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border: 2px solid rgba(255, 0, 0, 0.8);
          border-radius: 50%;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.5), inset 0 0 3px rgba(0, 0, 0, 0.3);
        }
        
        .scope-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          background: rgba(255, 0, 0, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }
        
        .blood-particle {
          position: absolute;
          background: radial-gradient(circle, #22c55e 0%, #16a34a 100%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 1000;
        }
        
        @keyframes break-apart {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        .target-hit {
          animation: break-apart 0.5s ease-out forwards;
        }
      `}</style>
      
      <Cursor />
      
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">스트레스 해소 게임</h1>
          <p className="text-gray-600 mt-2">움직이는 타겟을 조준해서 클릭하세요! 10초 동안 최대한 많은 점수를 획득하세요!</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">남은 시간</div>
                <div className={`text-4xl font-bold ${timeLeft <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                  {timeLeft}초
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">점수</div>
                <div className="text-4xl font-bold text-green-600">{score}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={startGame}
                disabled={gameStarted && !gameEnded}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {gameEnded ? '다시 시작' : '게임 시작'}
              </button>
              {gameStarted && (
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors font-semibold"
                >
                  중단
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          ref={gameAreaRef}
          className="game-area bg-gray-100 rounded-lg shadow-inner min-h-[600px] relative overflow-hidden"
          style={{ position: 'relative' }}
        >
          {/* 피 파티클 */}
          {bloodParticles.map((particle) => (
            <div
              key={particle.id}
              className="blood-particle"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
            />
          ))}

          {/* 타겟 */}
          {targets.map((target) => (
            <div
              key={target.id}
              onClick={() => handleTargetClick(target.id)}
              className={`target absolute ${target.hit ? 'target-hit' : ''}`}
              style={{
                left: `${target.x}px`,
                top: `${target.y}px`,
                width: `${targetSize}px`,
                height: `${targetSize}px`,
              }}
            >
              <div className="w-full h-full bg-white border-2 border-gray-300 rounded-md shadow-lg overflow-hidden relative">
                <Image
                  src={targetImageUrl}
                  alt="Target"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          ))}

          {!gameStarted && !gameEnded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-xl mb-2">게임을 시작하려면 "게임 시작" 버튼을 클릭하세요</p>
                <p className="text-sm">움직이는 타겟을 조준해서 클릭하세요!</p>
              </div>
            </div>
          )}

          {gameEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-8 text-center shadow-xl max-w-md w-full mx-4">
                <h2 className="text-4xl font-bold text-blue-600 mb-4">게임 종료!</h2>
                <div className="mb-6">
                  <p className="text-2xl text-gray-700 mb-2">최종 점수</p>
                  <p className="text-5xl font-bold text-green-600">{score}점</p>
                </div>
                <button
                  onClick={resetGame}
                  className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold text-lg"
                >
                  다시 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 커스텀 커서 컴포넌트
function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="custom-cursor"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="crosshair">
        <div className="scope-ring"></div>
        <div className="scope-dot"></div>
      </div>
    </div>
  );
}
