import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/Engine';
import { GameHUD } from './GameHUD';
import { MultiplayerLobby } from './MultiplayerLobby';
import type { Player } from '../lib/types';
import { Trophy, Skull } from 'lucide-react';

interface GameProps {
  player: Player;
}

export function Game({ player }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gamePlayer, setGamePlayer] = useState(player);
  const [currentQuest, setCurrentQuest] = useState<any>(null);
  const [questProgress, setQuestProgress] = useState(0);
  const [abilityCooldowns, setAbilityCooldowns] = useState<Map<string, number>>(new Map());
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    engine.onPlayerUpdate = () => {
      const p = engine.getPlayer();
      if (p) {
        setGamePlayer({ ...p.data });
        const cooldowns = new Map<string, number>();
        p.abilities.forEach((ability) => {
          const cd = p.getAbilityCooldown(ability.name);
          if (cd > 0) {
            cooldowns.set(ability.name, cd);
          }
        });
        setAbilityCooldowns(cooldowns);
      }
    };

    engine.onEnemyDefeated = () => {
      const quest = engine.getQuestSystem().getCurrentQuest();
      if (quest) {
        setQuestProgress(100);
      }
      showNotification('Enemy Defeated!');
    };

    engine.onQuestComplete = (reward) => {
      showNotification(`Quest Complete! +${reward} XP`);
      setTimeout(() => {
        const nextQuest = engine.getQuestSystem().getCurrentQuest();
        if (nextQuest) {
          setCurrentQuest(nextQuest);
          setQuestProgress(0);
        } else {
          setVictory(true);
        }
      }, 2000);
    };

    engine.onGameOver = () => {
      setGameOver(true);
    };

    (async () => {
      await engine.initializePlayer(player);
      const quest = engine.getQuestSystem().getCurrentQuest();
      setCurrentQuest(quest);
      setQuestProgress(engine.getQuestSystem().getQuestProgress());
      engine.start();
    })();

    const cooldownInterval = setInterval(() => {
      engine.onPlayerUpdate?.();
    }, 100);

    return () => {
      clearInterval(cooldownInterval);
      engine.dispose();
    };
  }, [player]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateSession = async (): Promise<string | null> => {
    if (!engineRef.current) return null;
    const code = await engineRef.current.getMultiplayerManager().createSession(player.id);
    if (code) {
      setSessionCode(code);
    }
    return code;
  };

  const handleJoinSession = async (code: string): Promise<boolean> => {
    if (!engineRef.current) return false;
    const success = await engineRef.current.getMultiplayerManager().joinSession(code, player.id);
    if (success) {
      setSessionCode(code);
      setShowMultiplayer(false);
    }
    return success;
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {!gameOver && !victory && (
        <GameHUD
          player={gamePlayer}
          currentQuest={currentQuest}
          questProgress={questProgress}
          abilities={engineRef.current?.getPlayer()?.abilities || []}
          abilityCooldowns={abilityCooldowns}
          onMultiplayerClick={() => setShowMultiplayer(true)}
          isInMultiplayer={sessionCode !== null}
        />
      )}

      {showMultiplayer && (
        <MultiplayerLobby
          onClose={() => setShowMultiplayer(false)}
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
          sessionCode={sessionCode}
        />
      )}

      {notification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-sm px-8 py-4 rounded-xl border border-purple-500 shadow-2xl animate-bounce">
            <p className="text-white font-bold text-2xl">{notification}</p>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-700">
            <Skull className="w-24 h-24 text-red-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Defeated</h2>
            <p className="text-slate-300 mb-6 text-lg">
              Your journey ends here, but heroes never truly die. Rise again and continue the fight!
            </p>
            <button
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold text-lg transition transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {victory && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-yellow-500">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Victory!</h2>
            <p className="text-slate-300 mb-6 text-lg">
              Congratulations! You have defeated the Demon King and saved the realm. Your legend will be told for generations!
            </p>
            <div className="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-700">
              <p className="text-white text-lg">
                <span className="text-purple-400 font-bold">Final Level:</span> {gamePlayer.level}
              </p>
            </div>
            <button
              onClick={handleRestart}
              className="w-full bg-gradient-to-r from-yellow-600 to-purple-600 hover:from-yellow-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold text-lg transition transform hover:scale-105"
            >
              New Adventure
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm border border-slate-700">
        <p className="font-semibold mb-1">Controls:</p>
        <p>WASD - Move | Space - Jump</p>
        <p>Left Click - Attack | Right Click - Heal</p>
        <p>E - Support Ability</p>
      </div>
    </div>
  );
}
