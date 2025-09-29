import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameDetails as GameDetailsType, CreatePlayerData } from '../types';
import { gamesAPI, playersAPI } from '../services/api';

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState<CreatePlayerData>({
    name: '',
    email: '',
    phone: '',
    username: '',
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [inviteUsername, setInviteUsername] = useState('');

  const fetchGameDetails = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching game details for ID:', id);
      const response = await gamesAPI.getById(id!);
      console.log('Game details response:', response.data);
      console.log('Response structure:', response);
      console.log('Setting game state with:', response.data);
      
      // Ensure we're setting the correct data
      const gameData = response.data;
      console.log('Game data to set:', gameData);
      console.log('Game data type:', typeof gameData);
      console.log('Game data is null/undefined:', gameData === null || gameData === undefined);
      console.log('Game data keys:', gameData ? Object.keys(gameData) : 'No keys');
      console.log('Players array:', gameData?.players);
      console.log('Prizes array:', gameData?.prizes);
      console.log('Players count:', gameData?.players?.length);
      console.log('Prizes count:', gameData?.prizes?.length);
      console.log('Full game data structure:', JSON.stringify(gameData, null, 2));
      setGame(gameData);
    } catch (err: any) {
      console.error('Error fetching game details:', err);
      setError(err.response?.data?.error || 'Failed to fetch game details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchGameDetails();
    }
  }, [id, fetchGameDetails]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding player with data:', newPlayer);
    console.log('Game ID:', id);
    try {
      const response = await gamesAPI.createPlayer(id!, newPlayer);
      console.log('Player added successfully:', response);
      setNewPlayer({ name: '', email: '', phone: '', username: '' });
      setShowAddPlayer(false);
      fetchGameDetails();
    } catch (err: any) {
      console.error('Error adding player:', err);
      setError(err.response?.data?.error || 'Failed to add player');
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to remove this player?')) {
      try {
        await playersAPI.delete(id!, playerId);
        fetchGameDetails();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to remove player');
      }
    }
  };

  const handleSetWinner = async (playerId: string) => {
    try {
      await playersAPI.setWinner(id!, playerId);
      fetchGameDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set winner');
    }
  };

  const handleStartGame = async () => {
    console.log('Starting game with ID:', id);
    try {
      const response = await gamesAPI.start(id!);
      console.log('Start game response:', response);
      fetchGameDetails();
    } catch (err: any) {
      console.error('Start game error:', err);
      setError(err.response?.data?.error || 'Failed to start game');
    }
  };

  const handleEndGame = async () => {
    try {
      await gamesAPI.end(id!);
      fetchGameDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to end game');
    }
  };

  const handleInvitePlayer = async (player: any) => {
    try {
      await gamesAPI.invitePlayer(id!, player.id);
      fetchGameDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite player');
    }
  };

  const handleAssignUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    
    try {
      await gamesAPI.assignUsername(id!, selectedPlayer.id, { username: inviteUsername });
      setShowInviteModal(false);
      setSelectedPlayer(null);
      setInviteUsername('');
      fetchGameDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign username');
    }
  };

  const openInviteModal = (player: any) => {
    setSelectedPlayer(player);
    setInviteUsername(player.username || '');
    setShowInviteModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading game details...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Game not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  console.log('Component render - game state:', game);
  console.log('Component render - game type:', typeof game);
  console.log('Component render - game is null/undefined:', game === null || game === undefined);
  console.log('Component render - game truthy:', !!game);
  console.log('Component render - loading state:', loading);
  console.log('Component render - error state:', error);

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-lg">Loading game details...</div>
            <div className="text-sm text-gray-400 mt-2">Game ID: {id}</div>
            <div className="text-sm text-gray-400 mt-1">Loading: {loading ? 'true' : 'false'}</div>
            {error && <div className="text-sm text-red-400 mt-1">Error: {error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="modern-card p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-4xl font-bold gradient-text mb-2">{game.name}</h2>
              <p className="text-gray-400 text-lg mb-4">{game.description || 'No description'}</p>
              <div className="flex items-center space-x-6 text-sm">
                <span className="text-gray-300">Grid: {game.grid_size}x{game.grid_size}</span>
                <span className="text-gray-300">Players: {game.player_count || game.players?.length || 0}/{game.max_players}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  game.status === 'waiting' ? 'status-waiting' :
                  game.status === 'active' ? 'status-active' :
                  game.status === 'completed' ? 'status-completed' :
                  'status-cancelled'
                }`}>
                  {game.status}
                </span>
              </div>
              
              {/* Game Code Display */}
              <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-blue-400 mb-2">Game Code</h3>
                  <p className="text-sm text-blue-300 mb-4">Share this code with players to join the game</p>
                  <div className="text-4xl font-mono font-bold text-white tracking-wider mb-4">
                    {game.game_code}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(game.game_code);
                      alert('Game code copied to clipboard!');
                    }}
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    📋 Copy Code
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {game.status === 'waiting' && (
                <button
                  onClick={handleStartGame}
                  disabled={(game.players?.length || 0) < 2}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Game
                </button>
              )}
              {game.status === 'active' && (
                <button
                  onClick={handleEndGame}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  End Game
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players Section */}
          <div className="modern-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Players</h3>
              {game.status === 'waiting' && (
                <button
                  onClick={() => setShowAddPlayer(true)}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Add Player
                </button>
              )}
            </div>

          {showAddPlayer && (
            <form onSubmit={handleAddPlayer} className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
              <h4 className="text-lg font-medium text-white mb-4">Add New Player</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name *"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  required
                  className="modern-input w-full px-4 py-3"
                />
                <input
                  type="text"
                  placeholder="Username (optional)"
                  value={newPlayer.username}
                  onChange={(e) => setNewPlayer({ ...newPlayer, username: e.target.value })}
                  className="modern-input w-full px-4 py-3"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                  className="modern-input w-full px-4 py-3"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                  className="modern-input w-full px-4 py-3"
                />
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary px-4 py-2"
                >
                  Add Player
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

            <div className="space-y-3">
              {game.players && game.players.length > 0 ? (
                game.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium text-white">{player.name}</div>
                      <div className="text-sm text-gray-400">@{player.username}</div>
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-500/20 text-blue-300 text-xs font-mono px-2 py-1 rounded">
                          {player.player_code}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(player.player_code);
                            alert('Player code copied!');
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                          title="Copy player code"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {player.email && <span>{player.email}</span>}
                      {player.phone && <span className="ml-2">{player.phone}</span>}
                      {player.is_admin_created && (
                        <span className="ml-2 bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                          Admin Created
                        </span>
                      )}
                      {player.is_invited && (
                        <span className="ml-2 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                          Invited
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {player.is_winner && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs font-medium px-2 py-1 rounded-full">
                        Winner
                      </span>
                    )}
                    {game.status === 'waiting' && player.is_admin_created && !player.is_invited && (
                      <button
                        onClick={() => handleInvitePlayer(player)}
                        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-2 py-1 rounded text-xs"
                      >
                        Invite
                      </button>
                    )}
                    {game.status === 'waiting' && player.is_invited && (
                      <button
                        onClick={() => openInviteModal(player)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-2 py-1 rounded text-xs"
                      >
                        Assign Username
                      </button>
                    )}
                    {game.status === 'waiting' && (
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                    {(game.status === 'active' || game.status === 'completed') && (
                      <button
                        onClick={() => handleSetWinner(player.id)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 px-2 py-1 rounded text-xs"
                      >
                        Set Winner
                      </button>
                    )}
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No players yet</div>
                  <p className="text-sm text-gray-500">Add players to get started with the game</p>
                </div>
              )}
            </div>
          </div>

          {/* Prizes Section */}
          <div className="modern-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Prizes</h3>
            <div className="space-y-3">
              {game.prizes && game.prizes.length > 0 ? (
                game.prizes.map((prize, index) => (
                <div key={prize.id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div>
                    <div className="font-medium text-white">
                      Prize {index + 1} - {prize.type.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {prize.type === 'word' && prize.content.text}
                      {prize.type === 'image' && prize.content.url}
                      {prize.type === 'nft' && prize.content.collection}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {prize.is_revealed ? (
                      <span className="bg-green-500/20 text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                        Revealed
                      </span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No prizes configured</div>
                  <p className="text-sm text-gray-500">Prizes will be added when the game is created</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Activity */}
        {game.reveals && game.reveals.length > 0 && (
          <div className="modern-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Game Activity</h3>
            <div className="space-y-3">
              {game.reveals.map((reveal) => (
                <div key={reveal.id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div>
                    <span className="font-medium text-white">{reveal.player_name}</span>
                    <span className="text-gray-400 ml-2">revealed card {reveal.card_id}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(reveal.revealed_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Assign Username</h3>
              <p className="text-gray-400 mb-4">
                Assign a username for {selectedPlayer.name} to use when they join offline.
              </p>
              <form onSubmit={handleAssignUsername}>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  required
                  className="modern-input w-full px-4 py-3 mb-4"
                />
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2"
                  >
                    Assign Username
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedPlayer(null);
                      setInviteUsername('');
                    }}
                    className="btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;

