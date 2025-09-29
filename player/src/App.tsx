import React, { useState } from 'react';
import GameBoard from './GameBoard';

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
  email?: string;
  phone?: string;
}

function App() {
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/players/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_code: gameCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Successfully joined the game!');
        setGame(data.game);
        setPlayer(data.player);
        console.log('Joined game:', data);
      } else {
        setError(data.error || 'Failed to join game');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Join game error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (game && player) {
    // Show game board if game is active
    if (game.status === 'active') {
      return (
        <div className="min-h-screen bg-gray-900 p-4">
          <div className="max-w-6xl mx-auto">
            <GameBoard 
              gameId={game.id} 
              playerId={player.id}
              onGameEnd={() => {
                // Game ended, could show results or redirect
                console.log('Game ended!');
              }}
            />
          </div>
        </div>
      );
    }

    // Show waiting screen for non-active games
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full animate-fade-in-up">
          <div className="modern-card p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Welcome to {game.name}!
              </h1>
              <p className="text-gray-400 text-lg">
                You've successfully joined the game
              </p>
            </div>

            {/* Player Info */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Your Player Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Name</div>
                  <div className="text-white font-medium">{player.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Username</div>
                  <div className="text-white font-medium">@{player.username}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Player Code</div>
                  <div className="text-blue-400 font-mono text-lg">{player.player_code}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Status</div>
                  <div className="text-green-400 font-medium">Ready to Play</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{game.grid_size}x{game.grid_size}</div>
                <div className="text-gray-400 text-sm">Grid Size</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{game.player_count}/{game.max_players}</div>
                <div className="text-gray-400 text-sm">Players</div>
              </div>
            </div>

            <div className="text-center">
              <div className="status-waiting inline-block mb-4">
                {game.status === 'waiting' ? 'Waiting for game to start...' : 
                 game.status === 'completed' ? 'Game completed!' : 'Game cancelled'}
              </div>
              <p className="text-gray-400 text-sm">
                {game.status === 'waiting' 
                  ? 'The game will begin when the admin starts it. Get ready for an epic memory challenge!'
                  : game.status === 'completed'
                    ? 'The game has ended. Check the results!'
                    : 'This game has been cancelled.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in-up">
        <div className="modern-card p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              RazzWars
            </h1>
            <p className="text-gray-400 text-lg">
              Memory Card Game
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm text-center mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="gameCode" className="block text-sm font-medium text-gray-300 mb-2">
                Game Code *
              </label>
              <input
                id="gameCode"
                type="text"
                required
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="modern-input w-full px-4 py-3 font-mono tracking-wider"
                placeholder="Enter 8-character player code"
                maxLength={8}
                disabled={loading}
              />
              <p className="text-gray-500 text-xs mt-1">Enter the 8-character player code provided by the game admin</p>
            </div>

            <button
              type="submit"
              disabled={loading || !gameCode.trim()}
              className="btn-primary w-full py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner h-5 w-5 mr-2"></div>
                  Joining Game...
                </div>
              ) : (
                'Join Game'
              )}
            </button>
          </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm mb-4">Don't have a game code?</p>
              <button 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                onClick={() => window.open(process.env.REACT_APP_ADMIN_URL || 'http://localhost:3000', '_blank')}
              >
                Create a new game (Admin Panel)
              </button>
            </div>
        </div>

        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Real-time Multiplayer</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Amazing Prizes</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Memory Challenge</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
