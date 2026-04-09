import * as THREE from 'three';
import { GameScene } from './Scene';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { CombatSystem } from './CombatSystem';
import { QuestSystem } from './QuestSystem';
import { MultiplayerManager } from './MultiplayerManager';
import type { Player as PlayerData, Ability } from '../lib/types';
import { supabase } from '../lib/supabase';

export class GameEngine {
  private scene: GameScene;
  private player: Player | null = null;
  private enemies: Enemy[] = [];
  private combatSystem: CombatSystem;
  private questSystem: QuestSystem;
  private multiplayerManager: MultiplayerManager;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private mousePosition: THREE.Vector2 = new THREE.Vector2();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private currentTarget: THREE.Vector3 = new THREE.Vector3();
  private manaRegenTimer: number = 0;
  private manaRegenRate: number = 1000;
  private autoSaveTimer: number = 0;
  private autoSaveInterval: number = 5000;
  private updateInterval: number = 100;
  private lastBroadcastTime: number = 0;

  onPlayerUpdate?: () => void;
  onEnemyDefeated?: () => void;
  onQuestComplete?: (reward: number) => void;
  onGameOver?: () => void;

  constructor(container: HTMLElement) {
    this.scene = new GameScene(container);
    this.combatSystem = new CombatSystem(this.scene.scene);
    this.questSystem = new QuestSystem();
    this.multiplayerManager = new MultiplayerManager();

    this.setupInputHandlers(container);
  }

  private setupInputHandlers(container: HTMLElement): void {
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      this.mousePosition.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePosition.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    window.addEventListener('click', () => {
      if (!this.player) return;
      const ability = this.player.abilities.find(a => a.type === 'attack');
      if (ability) {
        this.updateTargetPosition();
        this.combatSystem.castAbility(this.player, ability, this.currentTarget);
        this.onPlayerUpdate?.();
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!this.player) return;
      const ability = this.player.abilities.find(a => a.type === 'heal');
      if (ability) {
        this.combatSystem.castAbility(this.player, ability, this.player.position);
        this.onPlayerUpdate?.();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.player) return;

      if (e.key === 'e' || e.key === 'E') {
        const ability = this.player.abilities.find(a => a.type === 'support');
        if (ability) {
          this.updateTargetPosition();
          this.combatSystem.castAbility(this.player, ability, this.currentTarget);
          this.onPlayerUpdate?.();
        }
      }

      if (e.key >= '1' && e.key <= '3') {
        const index = parseInt(e.key) - 1;
        if (this.player.abilities[index]) {
          this.updateTargetPosition();
          this.combatSystem.castAbility(
            this.player,
            this.player.abilities[index],
            this.currentTarget
          );
          this.onPlayerUpdate?.();
        }
      }
    });
  }

  private updateTargetPosition(): void {
    this.raycaster.setFromCamera(this.mousePosition, this.scene.camera);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(groundPlane, intersectPoint);

    if (intersectPoint) {
      this.currentTarget.copy(intersectPoint);
    }
  }

  async initializePlayer(playerData: PlayerData): Promise<void> {
    const color = this.getElementColor(playerData.element_type);
    const mesh = this.scene.createCharacterMesh(color, playerData.name);
    this.scene.scene.add(mesh);

    this.player = new Player(playerData, mesh);

    await this.questSystem.loadQuests();
    await this.questSystem.loadPlayerQuest(playerData.id);

    const currentQuest = this.questSystem.getCurrentQuest();
    if (!currentQuest) {
      await this.startNextQuest();
    } else {
      this.spawnQuestEnemy();
    }
  }

  private getElementColor(element: string): number {
    const colors: Record<string, number> = {
      wood: 0x2ecc71,
      fire: 0xe74c3c,
      earth: 0x8b4513,
      metal: 0x95a5a6,
      water: 0x3498db,
    };
    return colors[element] || 0xffffff;
  }

  private async startNextQuest(): Promise<void> {
    if (!this.player) return;

    const quest = await this.questSystem.startNextQuest(
      this.player.data.id,
      this.player.data.level
    );

    if (quest) {
      this.spawnQuestEnemy();
    }
  }

  private spawnQuestEnemy(): void {
    const enemy = this.questSystem.spawnQuestEnemy(
      this.scene.scene,
      (color, scale) => this.scene.createEnemyMesh(color, scale)
    );

    if (enemy) {
      this.enemies.push(enemy);
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.scene.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (!this.player) return;

    this.player.update(deltaTime);
    this.scene.updateCamera(this.player.position);

    this.manaRegenTimer += deltaTime;
    if (this.manaRegenTimer >= this.manaRegenRate) {
      this.player.regenerateMana(5);
      this.manaRegenTimer = 0;
      this.onPlayerUpdate?.();
    }

    this.enemies.forEach((enemy) => {
      const { shouldAttack, damage } = enemy.update(deltaTime, this.player!.position);
      if (shouldAttack) {
        this.combatSystem.enemyAttack(enemy, this.player!.position, damage);
      }
    });

    this.combatSystem.update(this.player, this.enemies);

    const deadEnemies = this.enemies.filter(e => !e.isAlive());
    deadEnemies.forEach(enemy => {
      const exp = enemy.getExperienceReward();
      const leveledUp = this.player!.gainExperience(exp);

      this.scene.scene.remove(enemy.mesh);
      this.enemies = this.enemies.filter(e => e !== enemy);

      this.onEnemyDefeated?.();

      if (this.questSystem.isQuestEnemyDefeated()) {
        (async () => {
          const reward = await this.questSystem.completeQuest(this.player!.data.id);
          this.onQuestComplete?.(reward);

          setTimeout(async () => {
            await this.startNextQuest();
          }, 2000);
        })();
      }
    });

    if (!this.player.isAlive()) {
      this.gameOver();
    }

    this.autoSaveTimer += deltaTime;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.savePlayerState();
      this.autoSaveTimer = 0;
    }

    if (this.multiplayerManager.isInSession()) {
      this.lastBroadcastTime += deltaTime;
      if (this.lastBroadcastTime >= this.updateInterval) {
        this.multiplayerManager.broadcastPlayerUpdate(
          this.player.data.id,
          {
            x: this.player.position.x,
            y: this.player.position.y,
            z: this.player.position.z,
          },
          this.player.data.health,
          this.player.data.mana
        );
        this.lastBroadcastTime = 0;
      }
    }
  }

  private async savePlayerState(): Promise<void> {
    if (!this.player) return;

    await supabase
      .from('players')
      .update({
        position_x: this.player.position.x,
        position_y: this.player.position.y,
        position_z: this.player.position.z,
        health: this.player.data.health,
        mana: this.player.data.mana,
        level: this.player.data.level,
        experience: this.player.data.experience,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.player.data.id);
  }

  private gameOver(): void {
    this.isRunning = false;
    this.onGameOver?.();
  }

  stop(): void {
    this.isRunning = false;
    this.savePlayerState();
  }

  getPlayer(): Player | null {
    return this.player;
  }

  getQuestSystem(): QuestSystem {
    return this.questSystem;
  }

  getMultiplayerManager(): MultiplayerManager {
    return this.multiplayerManager;
  }

  dispose(): void {
    this.stop();
    this.scene.dispose();
    this.combatSystem.clear();
  }
}
