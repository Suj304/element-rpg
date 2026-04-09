import { supabase } from '../lib/supabase';
import type { GameSession, Player as PlayerData } from '../lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PlayerUpdate {
  playerId: string;
  position: { x: number; y: number; z: number };
  health: number;
  mana: number;
}

export class MultiplayerManager {
  private session: GameSession | null = null;
  private channel: RealtimeChannel | null = null;
  private onPlayerUpdate?: (update: PlayerUpdate) => void;
  private onPlayerJoin?: (player: PlayerData) => void;
  private onPlayerLeave?: (playerId: string) => void;

  async createSession(hostPlayerId: string): Promise<string | null> {
    const sessionCode = this.generateSessionCode();

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        host_player_id: hostPlayerId,
        session_code: sessionCode,
        max_players: 4,
        current_players: 1,
        status: 'waiting',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    this.session = data;

    await supabase.from('session_players').insert({
      session_id: data.id,
      player_id: hostPlayerId,
    });

    this.subscribeToSession(data.id);

    return sessionCode;
  }

  async joinSession(sessionCode: string, playerId: string): Promise<boolean> {
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .eq('status', 'waiting')
      .maybeSingle();

    if (sessionError || !sessionData) {
      console.error('Session not found or error:', sessionError);
      return false;
    }

    if (sessionData.current_players >= sessionData.max_players) {
      console.error('Session is full');
      return false;
    }

    const { error: joinError } = await supabase
      .from('session_players')
      .insert({
        session_id: sessionData.id,
        player_id: playerId,
      });

    if (joinError) {
      console.error('Error joining session:', joinError);
      return false;
    }

    await supabase
      .from('game_sessions')
      .update({ current_players: sessionData.current_players + 1 })
      .eq('id', sessionData.id);

    this.session = sessionData;
    this.subscribeToSession(sessionData.id);

    return true;
  }

  private subscribeToSession(sessionId: string): void {
    this.channel = supabase.channel(`game_session_${sessionId}`);

    this.channel
      .on('broadcast', { event: 'player_update' }, (payload) => {
        if (this.onPlayerUpdate) {
          this.onPlayerUpdate(payload.payload as PlayerUpdate);
        }
      })
      .on('broadcast', { event: 'player_join' }, (payload) => {
        if (this.onPlayerJoin) {
          this.onPlayerJoin(payload.payload as PlayerData);
        }
      })
      .on('broadcast', { event: 'player_leave' }, (payload) => {
        if (this.onPlayerLeave) {
          this.onPlayerLeave(payload.payload.playerId);
        }
      })
      .subscribe();
  }

  broadcastPlayerUpdate(playerId: string, position: { x: number; y: number; z: number }, health: number, mana: number): void {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'player_update',
      payload: { playerId, position, health, mana },
    });
  }

  setOnPlayerUpdate(callback: (update: PlayerUpdate) => void): void {
    this.onPlayerUpdate = callback;
  }

  setOnPlayerJoin(callback: (player: PlayerData) => void): void {
    this.onPlayerJoin = callback;
  }

  setOnPlayerLeave(callback: (playerId: string) => void): void {
    this.onPlayerLeave = callback;
  }

  async getSessionPlayers(sessionId: string): Promise<PlayerData[]> {
    const { data, error } = await supabase
      .from('session_players')
      .select('player_id, players(*)')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error loading session players:', error);
      return [];
    }

    return data.map((sp: any) => sp.players).filter(Boolean);
  }

  async leaveSession(playerId: string): Promise<void> {
    if (!this.session) return;

    await supabase
      .from('session_players')
      .delete()
      .eq('session_id', this.session.id)
      .eq('player_id', playerId);

    await supabase
      .from('game_sessions')
      .update({ current_players: Math.max(0, this.session.current_players - 1) })
      .eq('id', this.session.id);

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'player_leave',
        payload: { playerId },
      });
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.session = null;
  }

  isInSession(): boolean {
    return this.session !== null;
  }

  getSession(): GameSession | null {
    return this.session;
  }

  private generateSessionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
