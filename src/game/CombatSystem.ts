import * as THREE from 'three';
import { Player } from './Player';
import { Enemy } from './Enemy';
import type { Ability } from '../lib/types';
import { ElementalSystem } from './ElementalSystem';

interface Projectile {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
  progress: number;
  damage: number;
  element: string;
  isPlayerProjectile: boolean;
}

export class CombatSystem {
  private projectiles: Projectile[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  castAbility(
    player: Player,
    ability: Ability,
    targetPosition: THREE.Vector3
  ): boolean {
    if (!player.canUseAbility(ability)) {
      return false;
    }

    player.useAbility(ability);

    if (ability.type === 'attack' && ability.damage) {
      this.createProjectile(
        player.position.clone(),
        targetPosition,
        ability.damage,
        ability.element,
        true
      );
    }

    return true;
  }

  createProjectile(
    start: THREE.Vector3,
    end: THREE.Vector3,
    damage: number,
    element: string,
    isPlayerProjectile: boolean
  ): void {
    const color = ElementalSystem.getElementColor(element as any);
    const geometry = new THREE.SphereGeometry(0.3);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start);
    this.scene.add(mesh);

    const glowGeometry = new THREE.SphereGeometry(0.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    this.projectiles.push({
      mesh,
      start: start.clone(),
      end: end.clone(),
      progress: 0,
      damage,
      element,
      isPlayerProjectile,
    });
  }

  update(player: Player, enemies: Enemy[]): void {
    const projectilesToRemove: number[] = [];

    this.projectiles.forEach((projectile, index) => {
      projectile.progress += 0.05;

      if (projectile.progress >= 1) {
        projectilesToRemove.push(index);
        return;
      }

      projectile.mesh.position.lerpVectors(
        projectile.start,
        projectile.end,
        projectile.progress
      );

      if (projectile.isPlayerProjectile) {
        enemies.forEach((enemy) => {
          if (!enemy.isAlive()) return;

          const distance = projectile.mesh.position.distanceTo(enemy.position);
          if (distance < 1) {
            const finalDamage = enemy.takeDamage(
              projectile.damage,
              projectile.element as any
            );
            this.createHitEffect(enemy.position, projectile.element, finalDamage);
            projectilesToRemove.push(index);
          }
        });
      } else {
        const distance = projectile.mesh.position.distanceTo(player.position);
        if (distance < 1) {
          const finalDamage = player.takeDamage(
            projectile.damage,
            projectile.element as any
          );
          this.createHitEffect(player.position, projectile.element, finalDamage);
          projectilesToRemove.push(index);
        }
      }
    });

    projectilesToRemove.reverse().forEach((index) => {
      const projectile = this.projectiles[index];
      this.scene.remove(projectile.mesh);
      this.projectiles.splice(index, 1);
    });
  }

  private createHitEffect(position: THREE.Vector3, element: string, damage: number): void {
    const color = ElementalSystem.getElementColor(element as any);
    const particleCount = 10;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1);
      const material = new THREE.MeshBasicMaterial({ color });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      this.scene.add(particle);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.2
      );

      const animate = () => {
        particle.position.add(velocity);
        velocity.y -= 0.01;
        material.opacity -= 0.05;

        if (material.opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
        }
      };
      animate();
    }

    const damageText = this.createDamageText(damage, position);
    this.scene.add(damageText);

    let yOffset = 0;
    const animateDamage = () => {
      yOffset += 0.05;
      damageText.position.y = position.y + yOffset;
      const sprite = damageText as THREE.Sprite;
      sprite.material.opacity -= 0.02;

      if (sprite.material.opacity > 0) {
        requestAnimationFrame(animateDamage);
      } else {
        this.scene.remove(damageText);
      }
    };
    animateDamage();
  }

  private createDamageText(damage: number, position: THREE.Vector3): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;

    context.font = 'Bold 40px Arial';
    context.fillStyle = damage > 50 ? '#ff0000' : '#ffaa00';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(damage.toString(), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 1, 1);
    sprite.position.copy(position);

    return sprite;
  }

  enemyAttack(enemy: Enemy, playerPosition: THREE.Vector3, damage: number): void {
    this.createProjectile(
      enemy.position.clone(),
      playerPosition.clone(),
      damage,
      enemy.data.element,
      false
    );
  }

  clear(): void {
    this.projectiles.forEach((projectile) => {
      this.scene.remove(projectile.mesh);
    });
    this.projectiles = [];
  }
}
