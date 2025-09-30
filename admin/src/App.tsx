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
  game_code: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'https://raffle-backend.onrender.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        loadGames();
      } else {
        alert('Login failed. Use admin/admin123');
      }
    } catch (error) {
      alert('Login failed. Check if backend is running.');
    }
  };

  const loadGames = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games`);
      const gamesData = await response.json();
      setGames(gamesData);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const createGame = async () => {
    const name = prompt('Game Name:') || 'Memory Challenge';
    const description = prompt('Description:') || 'Test your memory!';
    const gridSize = parseInt(prompt('Grid Size (4, 6, or 8):') || '4');
    const maxPlayers = parseInt(prompt('Max Players:') || '4');

    try {
      const response = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, description, grid_size: gridSize, max_players: maxPlayers })
      });

      if (response.ok) {
        const game = await response.json();
        setGames([...games, game]);
        alert(`Game created! Code: ${game.game_code}`);
      } else {
        alert('Failed to create game');
      }
    } catch (error) {
      alert('Failed to create game');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-white text-center mb-8">RazzWars Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"
                placeholder="admin123"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Game Management</h1>
            <button
              onClick={createGame}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium"
            >
              Create New Game
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div key={game.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{game.name}</h3>
                <p className="text-white/60 text-sm mb-4">{game.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Code:</span>
                    <span className="text-white font-mono">{game.game_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span className="text-white">{game.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Players:</span>
                    <span className="text-white">{game.player_count}/{game.max_players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Grid:</span>
                    <span className="text-white">{game.grid_size}x{game.grid_size}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {games.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60 text-lg">No games created yet</p>
              <p className="text-white/40 text-sm">Click "Create New Game" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
