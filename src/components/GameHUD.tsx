import { Heart, Droplet, Scroll, Users } from 'lucide-react';
import type { Player, Quest, Ability } from '../lib/types';

interface GameHUDProps {
  player: Player;
  currentQuest: Quest | null;
  questProgress: number;
  abilities: Ability[];
  abilityCooldowns: Map<string, number>;
  onMultiplayerClick: () => void;
  isInMultiplayer: boolean;
}

export function GameHUD({
  player,
  currentQuest,
  questProgress,
  abilities,
  abilityCooldowns,
  onMultiplayerClick,
  isInMultiplayer,
}: GameHUDProps) {
  const healthPercent = (player.health / player.max_health) * 100;
  const manaPercent = (player.mana / player.max_mana) * 100;
  const expPercent = (player.experience / (100 * player.level * 1.5)) * 100;

  const getAbilityKey = (index: number): string => {
    if (index === 0) return 'LMB';
    if (index === 1) return 'RMB';
    if (index === 2) return 'E';
    return `${index + 1}`;
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-xl">{player.name}</h2>
            <span className="text-purple-400 font-semibold">Lv. {player.level}</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-white text-sm font-semibold">Health</span>
                </div>
                <span className="text-white text-sm">
                  {player.health}/{player.max_health}
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm font-semibold">Mana</span>
                </div>
                <span className="text-white text-sm">
                  {player.mana}/{player.max_mana}
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                  style={{ width: `${manaPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-semibold">Experience</span>
                <span className="text-white text-sm">{Math.floor(expPercent)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-300"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentQuest && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700 max-w-[320px]">
            <div className="flex items-center gap-2 mb-3">
              <Scroll className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold text-lg">Current Quest</h3>
            </div>
            <h4 className="text-purple-300 font-semibold mb-2">{currentQuest.name}</h4>
            <p className="text-slate-300 text-sm mb-3 leading-relaxed">
              {currentQuest.description}
            </p>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{questProgress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-300"
                  style={{ width: `${questProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700">
          <div className="flex gap-3">
            {abilities.map((ability, index) => {
              const cooldown = abilityCooldowns.get(ability.name) || 0;
              const cooldownPercent = (cooldown / ability.cooldown) * 100;
              const canUse = cooldown === 0 && player.mana >= ability.manaCost;

              return (
                <div key={ability.name} className="relative">
                  <div
                    className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center transition border-2 ${
                      canUse
                        ? 'bg-slate-700 border-purple-500 hover:bg-slate-600'
                        : 'bg-slate-800 border-slate-600 opacity-50'
                    }`}
                  >
                    <span className="text-white text-xs font-bold">
                      {ability.type === 'attack' ? '⚔️' : ability.type === 'heal' ? '💚' : '🛡️'}
                    </span>
                    <span className="text-white text-xs mt-1">{getAbilityKey(index)}</span>
                  </div>
                  {cooldown > 0 && (
                    <div className="absolute inset-0 bg-slate-900/70 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {(cooldown / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}
                  <div className="absolute top-0 left-0 right-0 text-center -mt-6">
                    <span className="text-xs text-slate-400">{ability.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <button
          onClick={onMultiplayerClick}
          className={`px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition transform hover:scale-105 shadow-lg ${
            isInMultiplayer
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          {isInMultiplayer ? 'In Session' : 'Multiplayer'}
        </button>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-white rounded-full border-2 border-slate-900 shadow-lg pointer-events-none" />
      </div>
    </div>
  );
}
