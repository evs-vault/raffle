import React, { useState, useEffect } from 'react';
import { Game } from '../types';
import { gamesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const GameList: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      console.log('Fetching games...');
      const response = await gamesAPI.getAll();
      console.log('Games response:', response);
      console.log('Games data:', response.data);
      console.log('Games array:', response.data.games);
      setGames(response.data.games);
    } catch (err: any) {
      console.error('Error fetching games:', err);
      setError(err.response?.data?.error || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      await gamesAPI.start(gameId);
      fetchGames();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start game');
    }
  };

  const handleEndGame = async (gameId: string) => {
    try {
      await gamesAPI.end(gameId);
      fetchGames();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to end game');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        const response = await gamesAPI.delete(gameId);
        console.log('Delete response:', response.data);
        fetchGames();
      } catch (err: any) {
        console.error('Delete game error:', err);
        setError(err.response?.data?.error || 'Failed to delete game');
      }
    }
  };

  const handleDeleteAllGames = async () => {
    if (window.confirm('Are you sure you want to delete ALL games? This action cannot be undone!')) {
      try {
        const gameIds = games.map(game => game.id);
        const response = await gamesAPI.deleteBulk(gameIds);
        console.log('Bulk delete response:', response.data);
        fetchGames();
      } catch (err: any) {
        console.error('Bulk delete error:', err);
        setError(err.response?.data?.error || 'Failed to delete some games');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'status-waiting';
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'bg-gray-500/20 text-gray-200 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4"></div>
          <div className="text-white text-lg font-medium">Loading games...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Game Dashboard</h2>
          <p className="text-gray-400">Manage your memory card games</p>
        </div>
        <div className="flex space-x-3">
          {games.length > 0 && (
            <button
              onClick={handleDeleteAllGames}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete All Games</span>
            </button>
          )}
          <button
            onClick={() => navigate('/games/new')}
            className="btn-primary px-6 py-3 flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Game</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-lg text-center">
          {error}
        </div>
      )}

      {games.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No games yet</h3>
          <p className="text-gray-400 mb-6">Create your first memory card game to get started</p>
          <button
            onClick={() => navigate('/games/new')}
            className="btn-primary px-6 py-3"
          >
            Create your first game
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="modern-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white truncate">
                  {game.name}
                </h3>
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(game.status)}`}>
                  {game.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {game.description || 'No description provided'}
              </p>
              {/* Game Code */}
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-blue-400 text-xs uppercase tracking-wide mb-1">Game Code</div>
                <div className="text-white font-mono font-bold text-lg tracking-wider">
                  {game.game_code}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Grid Size</div>
                  <div className="text-white font-semibold">{game.grid_size}x{game.grid_size}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Players</div>
                  <div className="text-white font-semibold">{game.player_count || 0}/{game.max_players}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Created</div>
                  <div className="text-white font-semibold text-xs">
                    {new Date(game.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Winners</div>
                  <div className="text-white font-semibold">{game.winner_count || 0}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/games/${game.id}`)}
                  className="btn-secondary flex-1 px-3 py-2 text-sm"
                >
                  View Details
                </button>
                {game.status === 'waiting' && (
                  <button
                    onClick={() => handleStartGame(game.id)}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Start Game
                  </button>
                )}
                {game.status === 'active' && (
                  <button
                    onClick={() => handleEndGame(game.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    End Game
                  </button>
                )}
                <button
                  onClick={() => handleDeleteGame(game.id)}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameList;

