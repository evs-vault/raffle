import React, { useState } from 'react';
import './App.css';

interface Game {
  id: string;
  name: string;
  description: string;
  grid_size: number;
  max_players: number;
  player_count: number;
  status: string;
}

interface Player {
  id: string;
  player_code: string;
  username: string;
  name: string;
}

function App() {
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://raffle-backend.onrender.com';

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/players/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_code: gameCode })
      });

      const data = await response.json();

      if (response.ok) {
        setGame(data.game);
        setPlayer(data.player);
      } else {
        setError(data.error || 'Failed to join game');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (game && player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Welcome to {game.name}!</h1>
              <p className="text-white/80 text-lg">You've successfully joined the game</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Your Player Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-white/60 mb-1">Name</div>
                  <div className="text-white font-medium">{player.name}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Username</div>
                  <div className="text-white font-medium">@{player.username}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Player Code</div>
                  <div className="text-blue-300 font-mono text-lg">{player.player_code}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Status</div>
                  <div className="text-green-300 font-medium">Ready to Play</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{game.grid_size}x{game.grid_size}</div>
                <div className="text-white/60 text-sm">Grid Size</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{game.player_count}/{game.max_players}</div>
                <div className="text-white/60 text-sm">Players</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-500/20 text-yellow-300 px-4 py-3 rounded-lg mb-4">
                {game.status === 'waiting' ? 'Waiting for game to start...' : 
                 game.status === 'active' ? 'Game is active!' : 
                 game.status === 'completed' ? 'Game completed!' : 'Game cancelled'}
              </div>
              <p className="text-white/60 text-sm mb-6">
                {game.status === 'waiting' 
                  ? 'The game will begin when the admin starts it. Get ready for an epic memory challenge!'
                  : game.status === 'active'
                    ? 'The game has started! Good luck!'
                    : game.status === 'completed'
                      ? 'The game has ended. Check the results!'
                      : 'This game has been cancelled.'
                }
              </p>
              <button 
                onClick={() => {
                  setGame(null);
                  setPlayer(null);
                  setGameCode('');
                }}
                className="bg-red-500/20 text-red-300 py-2 px-4 rounded-lg font-medium"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">RazzWars</h1>
            <p className="text-white/80 text-lg">Memory Card Game</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm text-center mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm mb-2">Game Code</label>
              <input
                type="text"
                required
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 font-mono tracking-wider"
                placeholder="Enter 8-character game code"
                maxLength={8}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !gameCode.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining Game...' : 'Join Game'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm mb-4">Don't have a game code?</p>
            <a 
              href="https://raffle-admin.onrender.com" 
              target="_blank" 
              className="text-blue-300 hover:text-blue-200 text-sm font-medium"
            >
              Create a new game (Admin Panel)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
