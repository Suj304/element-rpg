/*
  # RPG Adventure Game Database Schema

  ## Overview
  This migration creates the complete database schema for a 3D multiplayer RPG game
  with elemental magic system (Wood, Fire, Earth, Metal, Water).

  ## New Tables

  ### `players`
  Stores player character information and stats
  - `id` (uuid, primary key) - Unique player identifier
  - `user_id` (uuid, references auth.users) - Link to authenticated user
  - `name` (text) - Character name
  - `element_type` (text) - Primary element: wood, fire, earth, metal, or water
  - `level` (integer) - Character level
  - `experience` (integer) - Current experience points
  - `health` (integer) - Current health points
  - `max_health` (integer) - Maximum health points
  - `mana` (integer) - Current mana points
  - `max_mana` (integer) - Maximum mana points
  - `position_x` (float) - X coordinate in game world
  - `position_y` (float) - Y coordinate in game world
  - `position_z` (float) - Z coordinate in game world
  - `current_quest_id` (uuid) - Current active quest
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `quests`
  Defines all available quests in the game
  - `id` (uuid, primary key) - Quest identifier
  - `name` (text) - Quest name
  - `description` (text) - Quest description and lore
  - `quest_type` (text) - Type: main, side, mini_boss
  - `required_level` (integer) - Minimum level to accept quest
  - `reward_experience` (integer) - XP reward
  - `boss_element` (text) - Element type of boss enemy
  - `boss_health` (integer) - Boss HP
  - `sequence_order` (integer) - Order in story progression
  - `prerequisite_quest_id` (uuid) - Required previous quest

  ### `player_quests`
  Tracks quest completion progress for each player
  - `id` (uuid, primary key)
  - `player_id` (uuid, references players)
  - `quest_id` (uuid, references quests)
  - `status` (text) - Status: active, completed, failed
  - `progress` (integer) - Progress percentage (0-100)
  - `completed_at` (timestamptz) - Completion timestamp
  - `started_at` (timestamptz) - Start timestamp

  ### `game_sessions`
  Manages multiplayer game sessions
  - `id` (uuid, primary key) - Session identifier
  - `host_player_id` (uuid, references players) - Session host
  - `session_code` (text) - Join code for other players
  - `max_players` (integer) - Maximum players allowed
  - `current_players` (integer) - Current player count
  - `status` (text) - Status: waiting, active, completed
  - `created_at` (timestamptz)

  ### `session_players`
  Tracks which players are in which sessions
  - `id` (uuid, primary key)
  - `session_id` (uuid, references game_sessions)
  - `player_id` (uuid, references players)
  - `joined_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Players can only read/update their own data
  - Quest data is read-only for all authenticated users
  - Session data is accessible to session participants
*/

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  element_type text NOT NULL CHECK (element_type IN ('wood', 'fire', 'earth', 'metal', 'water')),
  level integer DEFAULT 1 NOT NULL,
  experience integer DEFAULT 0 NOT NULL,
  health integer DEFAULT 100 NOT NULL,
  max_health integer DEFAULT 100 NOT NULL,
  mana integer DEFAULT 100 NOT NULL,
  max_mana integer DEFAULT 100 NOT NULL,
  position_x float DEFAULT 0 NOT NULL,
  position_y float DEFAULT 0 NOT NULL,
  position_z float DEFAULT 0 NOT NULL,
  current_quest_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  quest_type text NOT NULL CHECK (quest_type IN ('main', 'side', 'mini_boss')),
  required_level integer DEFAULT 1 NOT NULL,
  reward_experience integer DEFAULT 100 NOT NULL,
  boss_element text CHECK (boss_element IN ('wood', 'fire', 'earth', 'metal', 'water', 'dark')),
  boss_health integer DEFAULT 100,
  sequence_order integer DEFAULT 0 NOT NULL,
  prerequisite_quest_id uuid REFERENCES quests(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create player_quests table
CREATE TABLE IF NOT EXISTS player_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  quest_id uuid REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  progress integer DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),
  completed_at timestamptz,
  started_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(player_id, quest_id)
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  session_code text NOT NULL UNIQUE,
  max_players integer DEFAULT 4 NOT NULL,
  current_players integer DEFAULT 1 NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create session_players table
CREATE TABLE IF NOT EXISTS session_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;

-- Players policies
CREATE POLICY "Players can view own profile"
  ON players FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Players can create own profile"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update own profile"
  ON players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can view other players in same session"
  ON players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_players sp1
      JOIN session_players sp2 ON sp1.session_id = sp2.session_id
      WHERE sp1.player_id = players.id
      AND sp2.player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
      )
    )
  );

-- Quests policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view quests"
  ON quests FOR SELECT
  TO authenticated
  USING (true);

-- Player_quests policies
CREATE POLICY "Players can view own quest progress"
  ON player_quests FOR SELECT
  TO authenticated
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "Players can create own quest progress"
  ON player_quests FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "Players can update own quest progress"
  ON player_quests FOR UPDATE
  TO authenticated
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  )
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Game_sessions policies
CREATE POLICY "Authenticated users can view active sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (status IN ('waiting', 'active'));

CREATE POLICY "Players can create sessions"
  ON game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    host_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "Host can update own sessions"
  ON game_sessions FOR UPDATE
  TO authenticated
  USING (
    host_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  )
  WITH CHECK (
    host_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Session_players policies
CREATE POLICY "Players can view session participants"
  ON session_players FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM session_players
      WHERE player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Players can join sessions"
  ON session_players FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Insert initial quest data
INSERT INTO quests (name, description, quest_type, required_level, reward_experience, boss_element, boss_health, sequence_order) VALUES
  (
    'The Gathering Storm',
    'The Adventurers Guild has detected unusual dark energy emanating from the Whispering Woods. Investigate the disturbance and report your findings. This is your first step towards becoming a legendary hero.',
    'main',
    1,
    150,
    'dark',
    200,
    1
  ),
  (
    'Flames of the Forge',
    'The village blacksmith reports that fire elementals have been stealing precious metals from the Sacred Forge. Defeat the Fire Elemental Guardian to restore peace and earn the trust of the craftsmen.',
    'mini_boss',
    3,
    300,
    'fire',
    400,
    2
  ),
  (
    'Roots of Corruption',
    'Ancient wood spirits in the Elder Grove have been corrupted by dark magic. Purify the grove by defeating the Corrupted Treant and discover the source of this evil.',
    'mini_boss',
    5,
    450,
    'wood',
    600,
    3
  ),
  (
    'The Earthen Depths',
    'Deep beneath the mountains, earth elementals guard a ancient artifact. Venture into the Crystal Caverns and defeat the Stone Golem to claim the Earthen Amulet, said to protect against dark magic.',
    'side',
    7,
    500,
    'earth',
    700,
    4
  ),
  (
    'Tides of Darkness',
    'The coastal village is under siege by corrupted water spirits. Journey to the Abyssal Depths and confront the Leviathan to free the seas from darkness.',
    'mini_boss',
    10,
    650,
    'water',
    900,
    5
  ),
  (
    'The Iron Fortress',
    'A fortress of living metal has appeared in the Rust Wastes. The Metal Colossus within holds a key to the Demon King''s weakness. Breach the fortress and defeat this mighty guardian.',
    'mini_boss',
    13,
    800,
    'metal',
    1100,
    6
  ),
  (
    'Shadows Before Dawn',
    'All signs point to the Dark Citadel as the Demon King''s lair. Gather your party and prepare for the ultimate battle. The fate of the realm rests on your shoulders.',
    'main',
    15,
    1000,
    'dark',
    1500,
    7
  ),
  (
    'The Demon King Rises',
    'Face the Demon King in an epic final battle. Use everything you''ve learned about elemental magic and the power of friendship to save the world from eternal darkness. Your legend will be written in the stars.',
    'main',
    18,
    2000,
    'dark',
    3000,
    8
  )
ON CONFLICT DO NOTHING;
