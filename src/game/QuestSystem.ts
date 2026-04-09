import { supabase } from '../lib/supabase';
import type { Quest, PlayerQuest, ElementType } from '../lib/types';
import { Enemy } from './Enemy';
import * as THREE from 'three';

export class QuestSystem {
  private currentQuest: Quest | null = null;
  private questProgress: PlayerQuest | null = null;
  private allQuests: Quest[] = [];
  private activeEnemy: Enemy | null = null;

  async loadQuests(): Promise<void> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('sequence_order');

    if (error) {
      console.error('Error loading quests:', error);
      return;
    }

    this.allQuests = data || [];
  }

  async loadPlayerQuest(playerId: string): Promise<void> {
    const { data, error } = await supabase
      .from('player_quests')
      .select('*, quests(*)')
      .eq('player_id', playerId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error loading player quest:', error);
      return;
    }

    if (data) {
      this.questProgress = data;
      this.currentQuest = (data as any).quests;
    }
  }

  async startNextQuest(playerId: string, playerLevel: number): Promise<Quest | null> {
    if (this.currentQuest) {
      return null;
    }

    const completedQuests = await this.getCompletedQuests(playerId);
    const completedIds = new Set(completedQuests.map(q => q.quest_id));

    const availableQuest = this.allQuests.find(quest => {
      if (completedIds.has(quest.id)) return false;
      if (quest.required_level > playerLevel) return false;
      if (quest.prerequisite_quest_id && !completedIds.has(quest.prerequisite_quest_id)) {
        return false;
      }
      return true;
    });

    if (!availableQuest) {
      return null;
    }

    const { data, error } = await supabase
      .from('player_quests')
      .insert({
        player_id: playerId,
        quest_id: availableQuest.id,
        status: 'active',
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting quest:', error);
      return null;
    }

    this.currentQuest = availableQuest;
    this.questProgress = data;

    return availableQuest;
  }

  private async getCompletedQuests(playerId: string): Promise<PlayerQuest[]> {
    const { data, error } = await supabase
      .from('player_quests')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'completed');

    if (error) {
      console.error('Error loading completed quests:', error);
      return [];
    }

    return data || [];
  }

  spawnQuestEnemy(scene: THREE.Scene, createEnemyMesh: (color: number, scale: number) => THREE.Group): Enemy | null {
    if (!this.currentQuest || !this.currentQuest.boss_element || !this.currentQuest.boss_health) {
      return null;
    }

    const color = this.getElementColor(this.currentQuest.boss_element);
    const scale = this.currentQuest.quest_type === 'main' ? 2 : 1.5;
    const mesh = createEnemyMesh(color, scale);

    const spawnDistance = 15;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * spawnDistance;
    const z = Math.sin(angle) * spawnDistance;

    const enemyData = {
      id: `quest_enemy_${this.currentQuest.id}`,
      name: this.currentQuest.name,
      element: this.currentQuest.boss_element,
      health: this.currentQuest.boss_health,
      maxHealth: this.currentQuest.boss_health,
      level: this.currentQuest.required_level,
      position: { x, y: 1, z },
    };

    const enemy = new Enemy(enemyData, mesh);
    mesh.position.set(x, 1, z);
    scene.add(mesh);

    this.activeEnemy = enemy;
    return enemy;
  }

  async updateQuestProgress(playerId: string, progress: number): Promise<void> {
    if (!this.questProgress) return;

    const { error } = await supabase
      .from('player_quests')
      .update({ progress })
      .eq('id', this.questProgress.id);

    if (error) {
      console.error('Error updating quest progress:', error);
      return;
    }

    if (this.questProgress) {
      this.questProgress.progress = progress;
    }
  }

  async completeQuest(playerId: string): Promise<number> {
    if (!this.questProgress || !this.currentQuest) {
      return 0;
    }

    const { error } = await supabase
      .from('player_quests')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', this.questProgress.id);

    if (error) {
      console.error('Error completing quest:', error);
      return 0;
    }

    const reward = this.currentQuest.reward_experience;
    this.currentQuest = null;
    this.questProgress = null;
    this.activeEnemy = null;

    return reward;
  }

  getCurrentQuest(): Quest | null {
    return this.currentQuest;
  }

  getQuestProgress(): number {
    return this.questProgress?.progress || 0;
  }

  isQuestEnemyDefeated(): boolean {
    return this.activeEnemy ? !this.activeEnemy.isAlive() : false;
  }

  private getElementColor(element: ElementType): number {
    const colors: Record<ElementType, number> = {
      wood: 0x2ecc71,
      fire: 0xe74c3c,
      earth: 0x8b4513,
      metal: 0x95a5a6,
      water: 0x3498db,
      dark: 0x5c3a80,
    };
    return colors[element];
  }
}
