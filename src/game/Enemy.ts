import * as THREE from 'three';
import type { ElementType, Enemy as EnemyData } from '../lib/types';
import { ElementalSystem } from './ElementalSystem';

export class Enemy {
  mesh: THREE.Group;
  position: THREE.Vector3;
  data: EnemyData;
  private attackCooldown: number = 0;
  private attackInterval: number = 2000;
  private attackRange: number = 8;
  private moveSpeed: number = 0.05;
  private idleAnimation: number = 0;

  constructor(data: EnemyData, mesh: THREE.Group) {
    this.data = data;
    this.mesh = mesh;
    this.position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
    this.mesh.position.copy(this.position);
  }

  update(deltaTime: number, playerPosition: THREE.Vector3): { shouldAttack: boolean; damage: number } {
    this.idleAnimation += deltaTime * 0.001;
    this.mesh.rotation.y = Math.sin(this.idleAnimation) * 0.2;
    this.mesh.position.y = this.data.position.y + Math.sin(this.idleAnimation * 2) * 0.1;

    const distanceToPlayer = this.position.distanceTo(playerPosition);

    if (distanceToPlayer > this.attackRange && distanceToPlayer < 30) {
      const direction = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .normalize();
      direction.y = 0;
      this.position.add(direction.multiplyScalar(this.moveSpeed));
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;

      this.mesh.lookAt(playerPosition.x, this.position.y, playerPosition.z);
    }

    this.attackCooldown -= deltaTime;

    if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = this.attackInterval;
      const baseDamage = 15 + this.data.level * 5;
      return { shouldAttack: true, damage: baseDamage };
    }

    return { shouldAttack: false, damage: 0 };
  }

  takeDamage(damage: number, attackerElement?: ElementType): number {
    let finalDamage = damage;

    if (attackerElement) {
      const multiplier = ElementalSystem.calculateDamageMultiplier(
        attackerElement,
        this.data.element
      );
      finalDamage = Math.floor(damage * multiplier);
    }

    this.data.health = Math.max(0, this.data.health - finalDamage);

    const flashMaterial = this.mesh.children[0] as THREE.Mesh;
    if (flashMaterial && flashMaterial.material) {
      const mat = flashMaterial.material as THREE.MeshStandardMaterial;
      const originalEmissive = mat.emissive.getHex();
      mat.emissive.setHex(0xffffff);
      setTimeout(() => {
        mat.emissive.setHex(originalEmissive);
      }, 100);
    }

    return finalDamage;
  }

  isAlive(): boolean {
    return this.data.health > 0;
  }

  getExperienceReward(): number {
    return 50 + this.data.level * 25;
  }
}
