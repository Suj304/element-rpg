import * as THREE from 'three';
import type { ElementType, Ability, Player as PlayerData } from '../lib/types';
import { ElementalSystem } from './ElementalSystem';

export class Player {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  data: PlayerData;
  abilities: Ability[];
  private moveSpeed: number = 0.15;
  private jumpPower: number = 0.3;
  private gravity: number = 0.02;
  private isGrounded: boolean = true;
  private keys: Set<string> = new Set();
  private abilityCooldowns: Map<string, number> = new Map();

  constructor(data: PlayerData, mesh: THREE.Group) {
    this.data = data;
    this.mesh = mesh;
    this.position = new THREE.Vector3(data.position_x, data.position_y, data.position_z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.abilities = ElementalSystem.getAbilities(data.element_type);
    this.mesh.position.copy(this.position);

    this.setupInputListeners();
  }

  private setupInputListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  update(deltaTime: number): void {
    const movement = new THREE.Vector3();

    if (this.keys.has('w')) movement.z -= 1;
    if (this.keys.has('s')) movement.z += 1;
    if (this.keys.has('a')) movement.x -= 1;
    if (this.keys.has('d')) movement.x += 1;

    if (movement.length() > 0) {
      movement.normalize();
      movement.multiplyScalar(this.moveSpeed);
    }

    if (this.keys.has(' ') && this.isGrounded) {
      this.velocity.y = this.jumpPower;
      this.isGrounded = false;
    }

    this.velocity.add(movement);
    this.velocity.y -= this.gravity;

    this.position.add(this.velocity);

    if (this.position.y <= 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.velocity.multiplyScalar(0.85);

    this.mesh.position.copy(this.position);

    this.updateCooldowns(deltaTime);
  }

  private updateCooldowns(deltaTime: number): void {
    this.abilityCooldowns.forEach((time, abilityName) => {
      const newTime = time - deltaTime;
      if (newTime <= 0) {
        this.abilityCooldowns.delete(abilityName);
      } else {
        this.abilityCooldowns.set(abilityName, newTime);
      }
    });
  }

  canUseAbility(ability: Ability): boolean {
    if (this.abilityCooldowns.has(ability.name)) {
      return false;
    }
    if (this.data.mana < ability.manaCost) {
      return false;
    }
    return true;
  }

  useAbility(ability: Ability): void {
    if (!this.canUseAbility(ability)) {
      return;
    }

    this.data.mana -= ability.manaCost;
    this.abilityCooldowns.set(ability.name, ability.cooldown);

    if (ability.type === 'heal' && ability.healing) {
      this.heal(ability.healing);
    }
  }

  takeDamage(damage: number, attackerElement?: ElementType): number {
    let finalDamage = damage;

    if (attackerElement) {
      const multiplier = ElementalSystem.calculateDamageMultiplier(
        attackerElement,
        this.data.element_type
      );
      finalDamage = Math.floor(damage * multiplier);
    }

    this.data.health = Math.max(0, this.data.health - finalDamage);
    return finalDamage;
  }

  heal(amount: number): void {
    this.data.health = Math.min(this.data.max_health, this.data.health + amount);
  }

  regenerateMana(amount: number): void {
    this.data.mana = Math.min(this.data.max_mana, this.data.mana + amount);
  }

  gainExperience(amount: number): boolean {
    this.data.experience += amount;
    const experienceNeeded = this.getExperienceForNextLevel();

    if (this.data.experience >= experienceNeeded) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private getExperienceForNextLevel(): number {
    return 100 * this.data.level * 1.5;
  }

  private levelUp(): void {
    this.data.level += 1;
    this.data.experience = 0;
    this.data.max_health += 20;
    this.data.max_mana += 10;
    this.data.health = this.data.max_health;
    this.data.mana = this.data.max_mana;
  }

  getAbilityCooldown(abilityName: string): number {
    return this.abilityCooldowns.get(abilityName) || 0;
  }

  isAlive(): boolean {
    return this.data.health > 0;
  }

  getDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3();
    if (this.velocity.length() > 0.01) {
      direction.copy(this.velocity).normalize();
      direction.y = 0;
    } else {
      direction.set(0, 0, -1);
    }
    return direction;
  }
}
