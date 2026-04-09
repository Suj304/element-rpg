import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ElementType } from '../lib/types';
import { Wand2 } from 'lucide-react';

interface CharacterCreationProps {
  userId: string;
  onCharacterCreated: () => void;
}

const elements: { type: ElementType; name: string; color: string; description: string }[] = [
  {
    type: 'wood',
    name: 'Wood',
    color: 'bg-green-600',
    description: 'Masters of nature and healing. Strong against Earth, weak to Metal.',
  },
  {
    type: 'fire',
    name: 'Fire',
    color: 'bg-red-600',
    description: 'Fierce warriors with devastating attacks. Strong against Metal, weak to Water.',
  },
  {
    type: 'earth',
    name: 'Earth',
    color: 'bg-amber-700',
    description: 'Resilient defenders with strong barriers. Strong against Water, weak to Wood.',
  },
  {
    type: 'metal',
    name: 'Metal',
    color: 'bg-gray-500',
    description: 'Swift and precise fighters. Strong against Wood, weak to Fire.',
  },
  {
    type: 'water',
    name: 'Water',
    color: 'bg-blue-600',
    description: 'Adaptable healers with flowing power. Strong against Fire, weak to Earth.',
  },
];

export function CharacterCreation({ userId, onCharacterCreated }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementType>('wood');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a character name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existingPlayer, error: checkError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        setError('Failed to check existing character');
        return;
      }

      if (existingPlayer) {
        setError('You already have a character. Please log out and log in again.');
        return;
      }

      const { error: createError } = await supabase.from('players').insert({
        user_id: userId,
        name: name.trim(),
        element_type: selectedElement,
        level: 1,
        experience: 0,
        health: 100,
        max_health: 100,
        mana: 100,
        max_mana: 100,
        position_x: 0,
        position_y: 1,
        position_z: 0,
        current_quest_id: null,
      });

      if (createError) {
        setError(createError.message);
      } else {
        onCharacterCreated();
      }
    } catch (err) {
      setError('Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wand2 className="w-12 h-12 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Create Your Hero</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Begin your journey to defeat the Demon King
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2 text-lg">
              Character Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your hero's name"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-lg"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-4 text-lg">
              Choose Your Element
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elements.map((element) => (
                <button
                  key={element.type}
                  onClick={() => setSelectedElement(element.type)}
                  className={`p-4 rounded-xl border-2 transition transform hover:scale-105 ${
                    selectedElement === element.type
                      ? 'border-purple-400 bg-slate-700 shadow-lg shadow-purple-500/50'
                      : 'border-slate-600 bg-slate-750 hover:border-slate-500'
                  }`}
                >
                  <div
                    className={`w-12 h-12 ${element.color} rounded-full mx-auto mb-3 shadow-lg`}
                  />
                  <h3 className="text-white font-bold text-xl mb-2">{element.name}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {element.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 shadow-lg"
          >
            {loading ? 'Creating Hero...' : 'Begin Your Adventure'}
          </button>
        </div>
      </div>
    </div>
  );
}
