import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateGameData } from '../types';
import { gamesAPI } from '../services/api';

const CreateGame: React.FC = () => {
  const [formData, setFormData] = useState<CreateGameData>({
    name: '',
    description: '',
    gridSize: 4,
    maxPlayers: 4,
    prizes: [{ type: 'word', content: { text: 'Prize 1' } }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'gridSize' || name === 'maxPlayers' ? parseInt(value) : value,
    }));
  };

  const handlePrizeChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      prizes: prev.prizes.map((prize, i) => 
        i === index ? { ...prize, [field]: value } : prize
      ),
    }));
  };

  const addPrize = () => {
    setFormData(prev => ({
      ...prev,
      prizes: [...prev.prizes, { type: 'word', content: { text: `Prize ${prev.prizes.length + 1}` } }],
    }));
  };

  const removePrize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Transform data to match API expectations
      const apiData = {
        name: formData.name,
        description: formData.description,
        grid_size: formData.gridSize,
        max_players: formData.maxPlayers,
        prizes: formData.prizes
      };

      const response = await gamesAPI.create(apiData);
      navigate(`/games/${response.data.game.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const maxPrizes = formData.gridSize * formData.gridSize;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold gradient-text mb-2">Create New Game</h2>
          <p className="text-gray-400 text-lg">Set up a new memory card game with prizes</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="modern-card p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Game Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Game Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                  placeholder="Enter game name"
                />
              </div>

              <div>
                <label htmlFor="gridSize" className="block text-sm font-medium text-gray-300 mb-2">
                  Grid Size *
                </label>
                <select
                  name="gridSize"
                  id="gridSize"
                  value={formData.gridSize}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                >
                  <option value={2}>2x2 (4 cards)</option>
                  <option value={3}>3x3 (9 cards)</option>
                  <option value={4}>4x4 (16 cards)</option>
                  <option value={5}>5x5 (25 cards)</option>
                  <option value={6}>6x6 (36 cards)</option>
                </select>
              </div>

              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players *
                </label>
                <input
                  type="number"
                  name="maxPlayers"
                  id="maxPlayers"
                  min="2"
                  max="20"
                  required
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3 resize-none"
                  placeholder="Enter game description (optional)"
                />
              </div>
            </div>
          </div>

          <div className="modern-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Prizes</h3>
              <button
                type="button"
                onClick={addPrize}
                disabled={formData.prizes.length >= maxPrizes}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Prize ({formData.prizes.length}/{maxPrizes})
              </button>
            </div>

            <div className="space-y-6">
              {formData.prizes.map((prize, index) => (
                <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-medium text-white">Prize {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removePrize(index)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prize Type *
                      </label>
                      <select
                        value={prize.type}
                        onChange={(e) => handlePrizeChange(index, 'type', e.target.value)}
                        className="modern-input w-full px-4 py-3"
                      >
                        <option value="word">Word/Text</option>
                        <option value="image">Image</option>
                        <option value="nft">NFT Collection</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Content *
                      </label>
                      {prize.type === 'word' && (
                        <input
                          type="text"
                          value={prize.content.text || ''}
                          onChange={(e) => handlePrizeChange(index, 'content', { text: e.target.value })}
                          className="modern-input w-full px-4 py-3"
                          placeholder="Enter prize text"
                        />
                      )}
                      {prize.type === 'image' && (
                        <input
                          type="url"
                          value={prize.content.url || ''}
                          onChange={(e) => handlePrizeChange(index, 'content', { url: e.target.value })}
                          className="modern-input w-full px-4 py-3"
                          placeholder="Enter image URL"
                        />
                      )}
                      {prize.type === 'nft' && (
                        <input
                          type="text"
                          value={prize.content.collection || ''}
                          onChange={(e) => handlePrizeChange(index, 'content', { collection: e.target.value })}
                          className="modern-input w-full px-4 py-3"
                          placeholder="Enter NFT collection name"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary px-6 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGame;

