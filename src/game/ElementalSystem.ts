import type { ElementType, Ability } from '../lib/types';

export class ElementalSystem {
  private static elementWeaknesses: Record<ElementType, ElementType> = {
    wood: 'metal',
    metal: 'fire',
    fire: 'water',
    water: 'earth',
    earth: 'wood',
    dark: 'wood',
  };

  private static elementStrengths: Record<ElementType, ElementType> = {
    wood: 'earth',
    earth: 'water',
    water: 'fire',
    fire: 'metal',
    metal: 'wood',
    dark: 'dark',
  };

  static getElementColor(element: ElementType): number {
    const colors: Record<ElementType, number> = {
      wood: 0x2ecc71,
      fire: 0xe74c3c,
      earth: 0x8b4513,
      metal: 0x95a5a6,
      water: 0x3498db,
      dark: 0x34495e,
    };
    return colors[element];
  }

  static calculateDamageMultiplier(attackerElement: ElementType, defenderElement: ElementType): number {
    if (this.elementStrengths[attackerElement] === defenderElement) {
      return 1.5;
    }
    if (this.elementWeaknesses[attackerElement] === defenderElement) {
      return 0.75;
    }
    return 1.0;
  }

  static getAbilities(element: ElementType): Ability[] {
    const abilities: Record<ElementType, Ability[]> = {
      wood: [
        {
          name: 'Nature\'s Wrath',
          type: 'attack',
          element: 'wood',
          damage: 50,
          manaCost: 20,
          cooldown: 2000,
          description: 'Summon vines to strike your enemy',
        },
        {
          name: 'Healing Bloom',
          type: 'heal',
          element: 'wood',
          healing: 40,
          manaCost: 25,
          cooldown: 3000,
          description: 'Restore health with natural energy',
        },
        {
          name: 'Bark Shield',
          type: 'support',
          element: 'wood',
          manaCost: 15,
          cooldown: 5000,
          description: 'Create a protective barrier that reduces damage',
        },
      ],
      fire: [
        {
          name: 'Flame Strike',
          type: 'attack',
          element: 'fire',
          damage: 60,
          manaCost: 25,
          cooldown: 2000,
          description: 'Launch a devastating fireball',
        },
        {
          name: 'Phoenix Rising',
          type: 'heal',
          element: 'fire',
          healing: 35,
          manaCost: 30,
          cooldown: 3000,
          description: 'Harness phoenix flames to mend wounds',
        },
        {
          name: 'Flame Aura',
          type: 'support',
          element: 'fire',
          manaCost: 20,
          cooldown: 5000,
          description: 'Surround yourself with flames that damage nearby enemies',
        },
      ],
      earth: [
        {
          name: 'Stone Spike',
          type: 'attack',
          element: 'earth',
          damage: 55,
          manaCost: 22,
          cooldown: 2000,
          description: 'Raise sharp rocks from the ground',
        },
        {
          name: 'Terra\'s Embrace',
          type: 'heal',
          element: 'earth',
          healing: 45,
          manaCost: 28,
          cooldown: 3000,
          description: 'Draw healing energy from the earth',
        },
        {
          name: 'Earthen Wall',
          type: 'support',
          element: 'earth',
          manaCost: 18,
          cooldown: 5000,
          description: 'Raise a wall that blocks incoming attacks',
        },
      ],
      metal: [
        {
          name: 'Iron Blade',
          type: 'attack',
          element: 'metal',
          damage: 65,
          manaCost: 28,
          cooldown: 2000,
          description: 'Conjure razor-sharp metal projectiles',
        },
        {
          name: 'Steel Regeneration',
          type: 'heal',
          element: 'metal',
          healing: 38,
          manaCost: 32,
          cooldown: 3000,
          description: 'Fortify your body with metallic energy',
        },
        {
          name: 'Mercury Cloak',
          type: 'support',
          element: 'metal',
          manaCost: 25,
          cooldown: 5000,
          description: 'Increase movement speed and evasion',
        },
      ],
      water: [
        {
          name: 'Tidal Wave',
          type: 'attack',
          element: 'water',
          damage: 52,
          manaCost: 23,
          cooldown: 2000,
          description: 'Crash a powerful wave into your enemy',
        },
        {
          name: 'Aqua Regeneration',
          type: 'heal',
          element: 'water',
          healing: 50,
          manaCost: 26,
          cooldown: 3000,
          description: 'Channel water\'s restorative properties',
        },
        {
          name: 'Mist Veil',
          type: 'support',
          element: 'water',
          manaCost: 16,
          cooldown: 5000,
          description: 'Create a mist that confuses enemies',
        },
      ],
      dark: [
        {
          name: 'Shadow Bolt',
          type: 'attack',
          element: 'dark',
          damage: 70,
          manaCost: 30,
          cooldown: 2000,
          description: 'Unleash dark energy at your foes',
        },
        {
          name: 'Drain Life',
          type: 'heal',
          element: 'dark',
          healing: 30,
          manaCost: 35,
          cooldown: 3000,
          description: 'Steal life force from your enemy',
        },
        {
          name: 'Dark Shield',
          type: 'support',
          element: 'dark',
          manaCost: 22,
          cooldown: 5000,
          description: 'Wrap yourself in protective darkness',
        },
      ],
    };

    return abilities[element];
  }

  static getElementName(element: ElementType): string {
    const names: Record<ElementType, string> = {
      wood: 'Wood',
      fire: 'Fire',
      earth: 'Earth',
      metal: 'Metal',
      water: 'Water',
      dark: 'Dark',
    };
    return names[element];
  }
}
