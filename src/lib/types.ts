export type ElementType = 'wood' | 'fire' | 'earth' | 'metal' | 'water' | 'dark';

export type AbilityType = 'attack' | 'heal' | 'support';

export type QuestType = 'main' | 'side' | 'mini_boss';

export type QuestStatus = 'active' | 'completed' | 'failed';

export interface Player {
  id: string;
  user_id: string;
  name: string;
  element_type: ElementType;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  position_x: number;
  position_y: number;
  position_z: number;
  current_quest_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  quest_type: QuestType;
  required_level: number;
  reward_experience: number;
  boss_element: ElementType | null;
  boss_health: number | null;
  sequence_order: number;
  prerequisite_quest_id: string | null;
  created_at: string;
}

export interface PlayerQuest {
  id: string;
  player_id: string;
  quest_id: string;
  status: QuestStatus;
  progress: number;
  completed_at: string | null;
  started_at: string;
}

export interface GameSession {
  id: string;
  host_player_id: string;
  session_code: string;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'active' | 'completed';
  created_at: string;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_id: string;
  joined_at: string;
}

export interface Ability {
  name: string;
  type: AbilityType;
  element: ElementType;
  damage?: number;
  healing?: number;
  manaCost: number;
  cooldown: number;
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  element: ElementType;
  health: number;
  maxHealth: number;
  level: number;
  position: { x: number; y: number; z: number };
}

export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Player, 'id' | 'created_at'>>;
      };
      quests: {
        Row: Quest;
        Insert: Omit<Quest, 'id' | 'created_at'>;
        Update: Partial<Omit<Quest, 'id' | 'created_at'>>;
      };
      player_quests: {
        Row: PlayerQuest;
        Insert: Omit<PlayerQuest, 'id' | 'started_at'>;
        Update: Partial<Omit<PlayerQuest, 'id' | 'started_at'>>;
      };
      game_sessions: {
        Row: GameSession;
        Insert: Omit<GameSession, 'id' | 'created_at'>;
        Update: Partial<Omit<GameSession, 'id' | 'created_at'>>;
      };
      session_players: {
        Row: SessionPlayer;
        Insert: Omit<SessionPlayer, 'id' | 'joined_at'>;
        Update: Partial<Omit<SessionPlayer, 'id' | 'joined_at'>>;
      };
    };
  };
}
